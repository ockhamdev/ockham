import { z } from 'zod'
import { router, protectedProcedure } from './trpc'
import { createId, toId } from '@/backend/domain/shared'
import { DrizzleStoryRepository } from '@/backend/infrastructure/repositories/story.repository'
import { DrizzleTeamAiConfigRepository } from '@/backend/infrastructure/repositories/team-ai-config.repository'
import { TRPCError } from '@trpc/server'

const storyRepo = new DrizzleStoryRepository()
const aiConfigRepo = new DrizzleTeamAiConfigRepository()

const STORY_SYSTEM_PROMPT = `You are a product-focused AI assistant that helps users write clear, complete feature descriptions.

When the user provides a feature description, you MUST respond with a JSON object (no markdown fence, pure JSON) with this exact shape:
{
  "enrichedText": "<the improved, expanded, well-structured description>",
  "issues": [
    {
      "text": "<exact problematic phrase from the user's original text>",
      "reason": "<why this is unclear, incorrect or ambiguous>",
      "suggestion": "<how to fix it>"
    }
  ],
  "prompt": "<a production-ready prompt that a developer or AI can directly use to implement this feature>"
}

Rules:
- enrichedText should be a detailed, well-organized version of the user's description with proper formatting.
- issues should list every phrase in the ORIGINAL text that is unclear, grammatically incorrect, ambiguous, or logically inconsistent. Use the EXACT text from the user's input.
- prompt should be a comprehensive, actionable implementation prompt based on the enriched text.
- If the user's text is perfectly clear, issues can be an empty array.
- Always respond with valid JSON only, no extra text.`

export const storyRouter = router({
    // ── AI Chat (server-side) ──

    chat: protectedProcedure
        .input(z.object({
            teamId: z.string(),
            messages: z.array(z.object({
                role: z.string(),
                content: z.string(),
            })),
        }))
        .mutation(async ({ input }) => {
            // Load team's default AI config
            const configs = await aiConfigRepo.findByTeamId(toId(input.teamId))
            const config = configs.find((c) => c.isDefault) || configs[0]
            if (!config || !config.apiKey) {
                throw new TRPCError({
                    code: 'PRECONDITION_FAILED',
                    message: 'AI API key not configured. Please set it in Team Settings → AI Configs.',
                })
            }

            const baseUrl = (config.baseUrl || 'https://api.anthropic.com').replace(/\/+$/, '')
            const model = config.models?.[0] || 'claude-3-sonnet-20240229'

            const chatMessages = [
                { role: 'system', content: STORY_SYSTEM_PROMPT },
                ...input.messages,
            ]

            const response = await fetch(`${baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    messages: chatMessages,
                    max_tokens: 4096,
                    temperature: 0.5,
                }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: `AI API error: ${response.status} ${errorText}`,
                })
            }

            const data = await response.json() as {
                choices?: { message?: { content?: string } }[]
                usage?: { prompt_tokens?: number; completion_tokens?: number }
            }
            const content = data.choices?.[0]?.message?.content ?? ''

            // Try to parse as StoryResponse JSON
            try {
                const jsonStr = content
                    .replace(/^```json?\s*/i, '')
                    .replace(/```\s*$/i, '')
                    .trim()
                return JSON.parse(jsonStr) as {
                    enrichedText: string
                    issues: { text: string; reason: string; suggestion: string }[]
                    prompt: string
                }
            } catch {
                return {
                    enrichedText: content,
                    issues: [],
                    prompt: content,
                }
            }
        }),

    create: protectedProcedure
        .input(z.object({
            projectId: z.string(),
            title: z.string().min(1),
            enrichedText: z.string().default(''),
            prompt: z.string().default(''),
        }))
        .mutation(async ({ input, ctx }) => {
            const now = new Date()
            return storyRepo.create({
                id: createId(),
                projectId: toId(input.projectId),
                title: input.title,
                enrichedText: input.enrichedText,
                prompt: input.prompt,
                createdBy: toId(ctx.userId),
                createdAt: now,
                updatedAt: now,
            })
        }),

    list: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ input }) => {
            return storyRepo.findByProjectId(toId(input.projectId))
        }),

    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
            return storyRepo.findById(toId(input.id))
        }),

    update: protectedProcedure
        .input(z.object({
            id: z.string(),
            title: z.string().optional(),
            enrichedText: z.string().optional(),
            prompt: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
            const { id, ...data } = input
            return storyRepo.update(toId(id), data)
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            await storyRepo.delete(toId(input.id))
        }),

    // ── Message Operations ──

    addMessage: protectedProcedure
        .input(z.object({
            storyId: z.string(),
            role: z.enum(['user', 'assistant']),
            content: z.string(),
            order: z.number().int(),
        }))
        .mutation(async ({ input }) => {
            const now = new Date()
            return storyRepo.addMessage({
                id: createId(),
                storyId: toId(input.storyId),
                role: input.role,
                content: input.content,
                order: input.order,
                createdAt: now,
                updatedAt: now,
            })
        }),

    listMessages: protectedProcedure
        .input(z.object({ storyId: z.string() }))
        .query(async ({ input }) => {
            return storyRepo.findMessages(toId(input.storyId))
        }),

    // ── Story Proposals ──

    listProposals: protectedProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ input }) => {
            return storyRepo.findProposalByProjectId(toId(input.projectId))
        }),

    createProposal: protectedProcedure
        .input(z.object({
            projectId: z.string(),
            title: z.string().min(1),
            enrichedText: z.string().default(''),
            prompt: z.string().default(''),
            proposedBy: z.string(),
        }))
        .mutation(async ({ input }) => {
            const now = new Date()
            return storyRepo.createProposal({
                id: createId(),
                projectId: toId(input.projectId),
                title: input.title,
                enrichedText: input.enrichedText,
                prompt: input.prompt,
                proposedBy: input.proposedBy,
                status: 'pending',
                reviewedBy: null,
                reviewNote: '',
                createdAt: now,
                updatedAt: now,
            })
        }),

    reviewProposal: protectedProcedure
        .input(z.object({
            id: z.string(),
            action: z.enum(['approve', 'reject']),
            reviewNote: z.string().default(''),
        }))
        .mutation(async ({ input, ctx }) => {
            const entry = await storyRepo.findProposalById(toId(input.id))
            if (!entry) throw new TRPCError({ code: 'NOT_FOUND', message: 'Proposal not found' })

            if (input.action === 'approve') {
                // Create actual story from proposal
                const now = new Date()
                await storyRepo.create({
                    id: createId(),
                    projectId: entry.projectId,
                    title: entry.title,
                    enrichedText: entry.enrichedText,
                    prompt: entry.prompt,
                    createdBy: toId(ctx.userId),
                    createdAt: now,
                    updatedAt: now,
                })
            }

            return storyRepo.updateProposal(toId(input.id), {
                status: input.action === 'approve' ? 'approved' : 'rejected',
                reviewedBy: toId(ctx.userId),
                reviewNote: input.reviewNote,
            })
        }),

    deleteProposal: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            await storyRepo.deleteProposal(toId(input.id))
        }),
})

