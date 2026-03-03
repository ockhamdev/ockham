import { pgTable, uuid, text, boolean, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core'

// ── Enums ─────────────────────────────────────────────

export const memberRoleEnum = pgEnum('member_role', ['owner', 'admin', 'member'])
export const storyMessageRoleEnum = pgEnum('story_message_role', ['user', 'assistant'])

// ── Auth Tables (better-auth managed, Drizzle schema) ─

export const users = pgTable('users', {
    id: uuid('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text('image'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const sessions = pgTable('sessions', {
    id: uuid('id').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const accounts = pgTable('accounts', {
    id: uuid('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const verifications = pgTable('verifications', {
    id: uuid('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
})

// ── Team ──────────────────────────────────────────────

export const teams = pgTable('teams', {
    id: uuid('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const members = pgTable('members', {
    id: uuid('id').primaryKey(),
    teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    role: memberRoleEnum('role').notNull().default('member'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const teamAiConfigs = pgTable('team_ai_configs', {
    id: uuid('id').primaryKey(),
    teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),           // e.g. 'openai', 'anthropic', 'custom'
    apiKey: text('api_key').notNull(),
    baseUrl: text('base_url').notNull().default(''),
    models: text('models').notNull().default('[]'),  // JSON array of model names
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const knowledgeEntries = pgTable('knowledge_entries', {
    id: uuid('id').primaryKey(),
    teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content: text('content').notNull().default(''),
    createdBy: uuid('created_by').notNull().references(() => users.id),
    updatedBy: uuid('updated_by').notNull().references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Project ───────────────────────────────────────────

export const projects = pgTable('projects', {
    id: uuid('id').primaryKey(),
    teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Note ──────────────────────────────────────────────

export const notes = pgTable('notes', {
    id: uuid('id').primaryKey(),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content: text('content').notNull().default(''),
    createdBy: uuid('created_by').notNull().references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Story ─────────────────────────────────────────────

export const stories = pgTable('stories', {
    id: uuid('id').primaryKey(),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    enrichedText: text('enriched_text').notNull().default(''),
    prompt: text('prompt').notNull().default(''),
    createdBy: uuid('created_by').notNull().references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const storyMessages = pgTable('story_messages', {
    id: uuid('id').primaryKey(),
    storyId: uuid('story_id').notNull().references(() => stories.id, { onDelete: 'cascade' }),
    role: storyMessageRoleEnum('role').notNull(),
    content: text('content').notNull(),
    order: integer('order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Unit Tests ────────────────────────────────────────

export const unitTests = pgTable('unit_tests', {
    id: uuid('id').primaryKey(),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    path: text('path').notNull(),
    contentHash: text('content_hash').notNull().default(''),
    description: text('description').notNull().default(''),
    createdBy: uuid('created_by').notNull().references(() => users.id),
    linkedFilePath: text('linked_file_path'),
    linkedHash: text('linked_hash'),
    linkedAt: timestamp('linked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Spec Tests ────────────────────────────────────────

export const specGroups = pgTable('spec_groups', {
    id: uuid('id').primaryKey(),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    name: text('name').notNull(),
    parentKey: text('parent_key'),
    preconditions: text('preconditions').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const specTests = pgTable('spec_tests', {
    id: uuid('id').primaryKey(),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    groupId: uuid('group_id').references(() => specGroups.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    linkedFilePath: text('linked_file_path'),
    linkedHash: text('linked_hash'),
    linkedAt: timestamp('linked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const specTestUnits = pgTable('spec_test_units', {
    id: uuid('id').primaryKey(),
    specTestId: uuid('spec_test_id').notNull().references(() => specTests.id, { onDelete: 'cascade' }),
    path: text('path').notNull(),
    unitName: text('unit_name').notNull(),
    unitType: text('unit_type').notNull(),
    unitFilePath: text('unit_file_path').notNull(),
    contentHash: text('content_hash').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Issue ─────────────────────────────────────────────

export const issuePriorityEnum = pgEnum('issue_priority', ['low', 'medium', 'high', 'critical'])
export const issueStatusEnum = pgEnum('issue_status', ['open', 'in_progress', 'resolved', 'closed'])

export const issues = pgTable('issues', {
    id: uuid('id').primaryKey(),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    status: issueStatusEnum('status').notNull().default('open'),
    priority: issuePriorityEnum('priority').notNull().default('medium'),
    assigneeId: uuid('assignee_id').references(() => users.id, { onDelete: 'set null' }),
    createdBy: uuid('created_by').notNull().references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Project Knowledge ─────────────────────────────────

export const projectKnowledgeEntries = pgTable('project_knowledge_entries', {
    id: uuid('id').primaryKey(),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content: text('content').notNull().default(''),
    createdBy: uuid('created_by').notNull().references(() => users.id),
    updatedBy: uuid('updated_by').notNull().references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Prompt Templates ──────────────────────────────────

export const promptTemplateTypeEnum = pgEnum('prompt_template_type', ['unit_test', 'spec_test'])

export const promptTemplates = pgTable('prompt_templates', {
    id: uuid('id').primaryKey(),
    teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
    type: promptTemplateTypeEnum('type').notNull(),
    template: text('template').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Proposals (External) ───────────────────────────────

export const proposalStatusEnum = pgEnum('proposal_status', ['pending', 'approved', 'rejected'])

export const unitTestProposals = pgTable('unit_test_proposals', {
    id: uuid('id').primaryKey(),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    path: text('path').notNull(),
    contentHash: text('content_hash').notNull().default(''),
    description: text('description').notNull().default(''),
    proposedBy: text('proposed_by').notNull(),
    status: proposalStatusEnum('status').notNull().default('pending'),
    linkedFilePath: text('linked_file_path'),
    linkedHash: text('linked_hash'),
    reviewedBy: uuid('reviewed_by').references(() => users.id),
    reviewNote: text('review_note').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const specTestProposals = pgTable('spec_test_proposals', {
    id: uuid('id').primaryKey(),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    groupKey: text('group_key'),
    proposedBy: text('proposed_by').notNull(),
    status: proposalStatusEnum('status').notNull().default('pending'),
    linkedFilePath: text('linked_file_path'),
    linkedHash: text('linked_hash'),
    reviewedBy: uuid('reviewed_by').references(() => users.id),
    reviewNote: text('review_note').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const storyProposals = pgTable('story_proposals', {
    id: uuid('id').primaryKey(),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    enrichedText: text('enriched_text').notNull().default(''),
    prompt: text('prompt').notNull().default(''),
    proposedBy: text('proposed_by').notNull(),
    status: proposalStatusEnum('status').notNull().default('pending'),
    reviewedBy: uuid('reviewed_by').references(() => users.id),
    reviewNote: text('review_note').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── User Tokens (API / MCP Authorization) ─────────────

export const userTokens = pgTable('user_tokens', {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),                           // e.g. "My MCP Token"
    tokenHash: text('token_hash').notNull().unique(),       // SHA-256 of raw token
    tokenPrefix: text('token_prefix').notNull(),            // e.g. "okt_a3b8d1b6" (display only)
    scopes: text('scopes').notNull().default('[]'),         // JSON array: ["mcp:read","mcp:write"]
    expiresAt: timestamp('expires_at', { withTimezone: true }),     // NULL = never expires
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }), // updated on each use
    revokedAt: timestamp('revoked_at', { withTimezone: true }),    // NULL = active
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
