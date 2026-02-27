import { ipcMain } from 'electron'
import { IPC } from '@ockham/shared'
import type { AiConfig, StoryMessage, StoryResponse } from '@ockham/shared'
import { callChat } from '@ockham/ai'
import { windowManager } from '../windowManager'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

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

/**
 * Get AI config file path — stored globally at ~/.ockham/ai.json
 */
function getAiConfigPath(): string {
    return path.join(os.homedir(), '.ockham', 'ai.json')
}

function loadAiConfig(): AiConfig {
    const configPath = getAiConfigPath()
    try {
        if (fs.existsSync(configPath)) {
            return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
        }
    } catch {
        // ignore
    }
    return { apiKey: '' }
}

function saveAiConfig(config: AiConfig): void {
    const configPath = getAiConfigPath()
    const dir = path.dirname(configPath)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf-8')
}

/**
 * Register Story + AI Config IPC handlers.
 */
export function registerStoryHandlers(): void {
    ipcMain.handle(IPC.STORY_CHAT, async (event, messages: StoryMessage[]) => {
        const ws = windowManager.getWorkspace(event.sender.id)
        if (!ws) throw new Error('No workspace selected')

        const config = loadAiConfig()
        if (!config.apiKey) {
            throw new Error('AI API key not configured. Please set it in AI Settings.')
        }

        const chatMessages = messages.map((m) => ({
            role: m.role,
            content: m.content,
        }))

        const result = await callChat(config, chatMessages, STORY_SYSTEM_PROMPT)

        // Parse JSON response
        try {
            const jsonStr = result.content
                .replace(/^```json?\s*/i, '')
                .replace(/```\s*$/i, '')
                .trim()
            const parsed: StoryResponse = JSON.parse(jsonStr)
            return parsed
        } catch {
            return {
                enrichedText: result.content,
                issues: [],
                prompt: result.content,
            } as StoryResponse
        }
    })

    ipcMain.handle(IPC.AI_GET_CONFIG, async () => {
        return loadAiConfig()
    })

    ipcMain.handle(IPC.AI_SET_CONFIG, async (_event, config: AiConfig) => {
        saveAiConfig(config)
    })

    // ── Story persistence ────────────────────────────

    ipcMain.handle(IPC.STORY_LOAD, async (event) => {
        const ws = windowManager.getWorkspace(event.sender.id)
        if (!ws) return []
        const storiesPath = path.join(ws, '.ockham', 'stories.json')
        try {
            if (fs.existsSync(storiesPath)) {
                return JSON.parse(fs.readFileSync(storiesPath, 'utf-8'))
            }
        } catch {
            // ignore
        }
        return []
    })

    ipcMain.handle(IPC.STORY_SAVE, async (event, items: unknown[]) => {
        const ws = windowManager.getWorkspace(event.sender.id)
        if (!ws) throw new Error('No workspace selected')
        const dir = path.join(ws, '.ockham')
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        fs.writeFileSync(
            path.join(dir, 'stories.json'),
            JSON.stringify(items, null, 2),
            'utf-8'
        )
    })
}
