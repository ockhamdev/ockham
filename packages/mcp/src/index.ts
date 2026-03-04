#!/usr/bin/env node
/**
 * Ockham MCP Server
 *
 * Provides tools for AI agents to query unit tests, spec tests, stories
 * and submit proposals via the Ockham tRPC API.
 *
 * Auth: Bearer token via OCKHAM_API_TOKEN env var (created in Settings > API Tokens)
 * API:  OCKHAM_API_URL env var (default: http://localhost:3000)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ── Config ────────────────────────────────────────────

const API_URL = process.env.OCKHAM_API_URL || "http://localhost:3000";
const API_TOKEN = process.env.OCKHAM_API_TOKEN || "";

// ── tRPC HTTP Client ──────────────────────────────────

async function trpcQuery<T>(path: string, input: unknown): Promise<T> {
    const url = new URL(`/api/trpc/${path}`, API_URL);
    url.searchParams.set("input", JSON.stringify(input !== undefined ? { json: input } : { json: null }));

    const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_TOKEN}`,
        },
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`tRPC query ${path} failed (${res.status}): ${text}`);
    }

    const body = await res.json() as { result?: { data?: { json?: T } } };
    return body?.result?.data?.json as T;
}

async function trpcMutation<T>(path: string, input: unknown): Promise<T> {
    const url = new URL(`/api/trpc/${path}`, API_URL);

    const res = await fetch(url.toString(), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({ json: input }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`tRPC mutation ${path} failed (${res.status}): ${text}`);
    }

    const body = await res.json() as { result?: { data?: { json?: T } } };
    return body?.result?.data?.json as T;
}

// ── Types ─────────────────────────────────────────────

interface UnitTest {
    id: string;
    projectId: string;
    path: string;
    description: string;
    contentHash: string;
    linkedFilePath: string | null;
    createdAt: string;
}

interface SpecTest {
    id: string;
    projectId: string;
    groupId: string | null;
    title: string;
    description: string;
    linkedFilePath: string | null;
    createdAt: string;
}

interface Story {
    id: string;
    projectId: string;
    title: string;
    enrichedText: string;
    prompt: string;
    createdAt: string;
}

// ── MCP Server ────────────────────────────────────────

const server = new McpServer({
    name: "ockham-mcp-server",
    version: "1.0.0",
});

// ── Query Tools ───────────────────────────────────────

server.registerTool(
    "ockham_list_unit_tests",
    {
        title: "List Unit Tests",
        description: `List all unit tests for a given project.

Returns an array of unit test records including path, description, content hash, and linked file info.

Args:
  - project_id (string): The project UUID

Returns:
  Array of unit test objects with id, path, description, contentHash, linkedFilePath, createdAt.`,
        inputSchema: {
            project_id: z.string().describe("The project UUID to list unit tests for"),
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    async ({ project_id }) => {
        try {
            const tests = await trpcQuery<UnitTest[]>("testCase.list", { projectId: project_id });
            return {
                content: [{
                    type: "text" as const,
                    text: JSON.stringify(tests, null, 2),
                }],
            };
        } catch (error) {
            return {
                content: [{
                    type: "text" as const,
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                }],
            };
        }
    }
);

server.registerTool(
    "ockham_list_spec_tests",
    {
        title: "List Spec Tests",
        description: `List all spec tests (specification/acceptance tests) for a given project.

Returns an array of spec test records including title, description, group, and linked file info.

Args:
  - project_id (string): The project UUID

Returns:
  Array of spec test objects with id, title, description, groupId, linkedFilePath, createdAt.`,
        inputSchema: {
            project_id: z.string().describe("The project UUID to list spec tests for"),
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    async ({ project_id }) => {
        try {
            const tests = await trpcQuery<SpecTest[]>("testCase.listSpecTests", { projectId: project_id });
            return {
                content: [{
                    type: "text" as const,
                    text: JSON.stringify(tests, null, 2),
                }],
            };
        } catch (error) {
            return {
                content: [{
                    type: "text" as const,
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                }],
            };
        }
    }
);

server.registerTool(
    "ockham_list_stories",
    {
        title: "List Stories",
        description: `List all stories (user stories / requirements) for a given project.

Returns an array of story records including title, enriched text, and prompt.

Args:
  - project_id (string): The project UUID

Returns:
  Array of story objects with id, title, enrichedText, prompt, createdAt.`,
        inputSchema: {
            project_id: z.string().describe("The project UUID to list stories for"),
        },
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        },
    },
    async ({ project_id }) => {
        try {
            const stories = await trpcQuery<Story[]>("story.list", { projectId: project_id });
            return {
                content: [{
                    type: "text" as const,
                    text: JSON.stringify(stories, null, 2),
                }],
            };
        } catch (error) {
            return {
                content: [{
                    type: "text" as const,
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                }],
            };
        }
    }
);

// ── Proposal Submission Tools ─────────────────────────

server.registerTool(
    "ockham_submit_unit_test_proposal",
    {
        title: "Submit Unit Test Proposal",
        description: `Submit a new unit test proposal for review. The proposal will appear in the Proposals page for team members to approve or reject.

Args:
  - project_id (string): The project UUID
  - path (string): File path of the test (e.g. "src/utils/__tests__/helper.test.ts")
  - description (string): Description of what the test covers
  - proposed_by (string): Identifier of the proposer (e.g. AI agent name)
  - content_hash (string, optional): Hash of the test content for tracking changes

Returns:
  The created proposal object with id and status 'pending'.`,
        inputSchema: {
            project_id: z.string().describe("The project UUID"),
            path: z.string().describe("File path of the unit test"),
            description: z.string().describe("Description of what the test covers"),
            proposed_by: z.string().describe("Identifier of who is proposing (e.g. 'claude', 'copilot')"),
            content_hash: z.string().default("").describe("Optional hash of the test content"),
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: false,
        },
    },
    async ({ project_id, path, description, proposed_by, content_hash }) => {
        try {
            const result = await trpcMutation("testCase.createUnitTestProposal", {
                projectId: project_id,
                path,
                description,
                proposedBy: proposed_by,
                contentHash: content_hash,
            });
            return {
                content: [{
                    type: "text" as const,
                    text: `Unit test proposal submitted successfully:\n${JSON.stringify(result, null, 2)}`,
                }],
            };
        } catch (error) {
            return {
                content: [{
                    type: "text" as const,
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                }],
            };
        }
    }
);

server.registerTool(
    "ockham_submit_spec_test_proposal",
    {
        title: "Submit Spec Test Proposal",
        description: `Submit a new spec test (specification/acceptance test) proposal for review.

Args:
  - project_id (string): The project UUID
  - title (string): Title of the spec test
  - description (string): Detailed description of the test specification
  - proposed_by (string): Identifier of the proposer
  - group_key (string, optional): Key of the spec group to associate with

Returns:
  The created proposal object with id and status 'pending'.`,
        inputSchema: {
            project_id: z.string().describe("The project UUID"),
            title: z.string().min(1).describe("Title of the spec test"),
            description: z.string().default("").describe("Detailed description of the specification"),
            proposed_by: z.string().describe("Identifier of who is proposing"),
            group_key: z.string().nullable().default(null).describe("Optional group key to associate with"),
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: false,
        },
    },
    async ({ project_id, title, description, proposed_by, group_key }) => {
        try {
            const result = await trpcMutation("testCase.createSpecTestProposal", {
                projectId: project_id,
                title,
                description,
                proposedBy: proposed_by,
                groupKey: group_key,
            });
            return {
                content: [{
                    type: "text" as const,
                    text: `Spec test proposal submitted successfully:\n${JSON.stringify(result, null, 2)}`,
                }],
            };
        } catch (error) {
            return {
                content: [{
                    type: "text" as const,
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                }],
            };
        }
    }
);

server.registerTool(
    "ockham_submit_story_proposal",
    {
        title: "Submit Story Proposal",
        description: `Submit a new story (user story / requirement) proposal for review.

Args:
  - project_id (string): The project UUID
  - title (string): Title of the story
  - proposed_by (string): Identifier of the proposer
  - enriched_text (string, optional): Detailed enriched text of the story
  - prompt (string, optional): Prompt text for the story

Returns:
  The created proposal object with id and status 'pending'.`,
        inputSchema: {
            project_id: z.string().describe("The project UUID"),
            title: z.string().min(1).describe("Title of the story"),
            proposed_by: z.string().describe("Identifier of who is proposing"),
            enriched_text: z.string().default("").describe("Optional detailed enriched text"),
            prompt: z.string().default("").describe("Optional prompt text"),
        },
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: false,
        },
    },
    async ({ project_id, title, proposed_by, enriched_text, prompt }) => {
        try {
            const result = await trpcMutation("story.createProposal", {
                projectId: project_id,
                title,
                proposedBy: proposed_by,
                enrichedText: enriched_text,
                prompt,
            });
            return {
                content: [{
                    type: "text" as const,
                    text: `Story proposal submitted successfully:\n${JSON.stringify(result, null, 2)}`,
                }],
            };
        } catch (error) {
            return {
                content: [{
                    type: "text" as const,
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                }],
            };
        }
    }
);

// ── Main ──────────────────────────────────────────────

async function main() {
    if (!API_TOKEN) {
        console.error("ERROR: OCKHAM_API_TOKEN environment variable is required.");
        console.error("Create a token in Settings > API Tokens, then set:");
        console.error("  export OCKHAM_API_TOKEN=okt_...");
        process.exit(1);
    }

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`Ockham MCP server running (API: ${API_URL})`);
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
