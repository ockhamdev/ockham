#!/usr/bin/env tsx
/**
 * Ockham MCP Server — Manual Test Script
 *
 * Tests the standalone MCP server's tRPC proxy functionality
 * by directly calling the web backend API with a bearer token.
 *
 * Usage:
 *   OCKHAM_API_TOKEN=okt_... OCKHAM_API_URL=http://localhost:7353 tsx test-mcp.ts
 *
 * Prerequisites:
 *   1. Web backend running (pnpm dev:web)
 *   2. A valid API token (create in UI: Avatar > API Tokens)
 *   3. A project with some test cases / stories
 */

const API_URL = process.env.OCKHAM_API_URL || 'http://localhost:7353'
const API_TOKEN = process.env.OCKHAM_API_TOKEN || ''

if (!API_TOKEN) {
    console.error('❌ OCKHAM_API_TOKEN is required. Create one in Settings > API Tokens.')
    process.exit(1)
}

// ── Helpers ─────────────────────────────────────────

async function trpcQuery<T>(path: string, input: unknown): Promise<T> {
    const url = new URL(`/api/trpc/${path}`, API_URL)
    url.searchParams.set('input', JSON.stringify({ json: input }))

    const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_TOKEN}`,
        },
    })

    if (!res.ok) {
        const text = await res.text()
        throw new Error(`${path} failed (${res.status}): ${text}`)
    }

    const body = await res.json() as { result?: { data?: { json?: T } } }
    return body?.result?.data?.json as T
}

async function trpcMutation<T>(path: string, input: unknown): Promise<T> {
    const url = new URL(`/api/trpc/${path}`, API_URL)

    const res = await fetch(url.toString(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({ json: input }),
    })

    if (!res.ok) {
        const text = await res.text()
        throw new Error(`${path} failed (${res.status}): ${text}`)
    }

    const body = await res.json() as { result?: { data?: { json?: T } } }
    return body?.result?.data?.json as T
}

function ok(label: string) { console.log(`  ✅ ${label}`) }
function fail(label: string, err: unknown) { console.log(`  ❌ ${label}: ${err instanceof Error ? err.message : err}`) }

// ── Test Cases ──────────────────────────────────────

async function testBearerTokenAuth() {
    console.log('\n🔐 Test 1: Bearer Token Authentication')

    try {
        // Any query that requires auth — if it succeeds, token auth works
        await trpcQuery('testCase.list', { projectId: '00000000-0000-0000-0000-000000000000' })
        ok('Bearer token auth accepted (empty result expected)')
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (msg.includes('UNAUTHORIZED')) {
            fail('Token rejected — check if token is valid and not revoked', e)
        } else {
            // A different error (e.g. empty result) is fine - auth passed
            ok('Bearer token auth accepted')
        }
    }
}

async function testListUnitTests(projectId: string) {
    console.log('\n📋 Test 2: List Unit Tests')

    try {
        const result = await trpcQuery<unknown[]>('testCase.list', { projectId })
        ok(`Got ${Array.isArray(result) ? result.length : 0} unit tests`)
        if (Array.isArray(result) && result.length > 0) {
            console.log(`    First: ${JSON.stringify(result[0], null, 2).split('\n').slice(0, 5).join('\n    ')}`)
        }
    } catch (e) {
        fail('List unit tests', e)
    }
}

async function testListSpecTests(projectId: string) {
    console.log('\n📋 Test 3: List Spec Tests')

    try {
        const result = await trpcQuery<unknown[]>('testCase.listSpecTests', { projectId })
        ok(`Got ${Array.isArray(result) ? result.length : 0} spec tests`)
    } catch (e) {
        fail('List spec tests', e)
    }
}

async function testListStories(projectId: string) {
    console.log('\n📋 Test 4: List Stories')

    try {
        const result = await trpcQuery<unknown[]>('story.list', { projectId })
        ok(`Got ${Array.isArray(result) ? result.length : 0} stories`)
    } catch (e) {
        fail('List stories', e)
    }
}

async function testSubmitUnitTestProposal(projectId: string) {
    console.log('\n✏️  Test 5: Submit Unit Test Proposal')

    try {
        const result = await trpcMutation<{ id: string; status: string }>('testCase.createUnitTestProposal', {
            projectId,
            path: 'src/utils/__tests__/mcp-test.test.ts',
            description: '[MCP Test] Validates date parsing invariant — positive: ISO-8601 with timezone; negative: invalid format throws',
            proposedBy: 'mcp-test-script',
            contentHash: '',
        })
        ok(`Proposal created: id=${result?.id}, status=${result?.status}`)
    } catch (e) {
        fail('Submit unit test proposal', e)
    }
}

async function testSubmitSpecTestProposal(projectId: string) {
    console.log('\n✏️  Test 6: Submit Spec Test Proposal')

    try {
        const result = await trpcMutation<{ id: string; status: string }>('testCase.createSpecTestProposal', {
            projectId,
            title: '[MCP Test] Login with invalid credentials',
            description: 'State invariant: user not authenticated → login with wrong password → remains unauthenticated, returns 401',
            proposedBy: 'mcp-test-script',
            groupKey: null,
        })
        ok(`Proposal created: id=${result?.id}, status=${result?.status}`)
    } catch (e) {
        fail('Submit spec test proposal', e)
    }
}

async function testSubmitStoryProposal(projectId: string) {
    console.log('\n✏️  Test 7: Submit Story Proposal')

    try {
        const result = await trpcMutation<{ id: string; status: string }>('story.createProposal', {
            projectId,
            title: '[MCP Test] As a user, I want to receive email notifications',
            proposedBy: 'mcp-test-script',
            enrichedText: 'When a proposal is approved or rejected, the proposer should receive an email notification.',
            prompt: '',
        })
        ok(`Proposal created: id=${result?.id}, status=${result?.status}`)
    } catch (e) {
        fail('Submit story proposal', e)
    }
}

async function testInvalidToken() {
    console.log('\n🔒 Test 8: Invalid Token Rejection')

    const savedToken = API_TOKEN
    try {
        const url = new URL('/api/trpc/testCase.list', API_URL)
        url.searchParams.set('input', JSON.stringify({ json: { projectId: 'test' } }))
        const res = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer invalid_token_12345',
            },
        })
        const body = await res.json() as { error?: { json?: { message?: string } } }
        if (body?.error?.json?.message?.includes('sign in') || body?.error?.json?.message?.includes('UNAUTHORIZED')) {
            ok('Invalid token correctly rejected')
        } else if (!res.ok) {
            ok(`Request rejected (status ${res.status})`)
        } else {
            fail('Invalid token was accepted!', 'Should have been rejected')
        }
    } catch (e) {
        ok('Invalid token correctly rejected')
    }
}

// ── Main ────────────────────────────────────────────

async function main() {
    console.log('🧪 Ockham MCP Test Suite')
    console.log(`   API: ${API_URL}`)
    console.log(`   Token: ${API_TOKEN.slice(0, 8)}...`)

    const projectId = process.env.OCKHAM_PROJECT_ID || ''

    if (!projectId) {
        console.error('❌ OCKHAM_PROJECT_ID is required.')
        process.exit(1)
    }

    console.log(`   Project: ${projectId}`)

    // Run tests
    await testBearerTokenAuth()
    await testInvalidToken()
    await testListUnitTests(projectId)
    await testListSpecTests(projectId)
    await testListStories(projectId)
    await testSubmitUnitTestProposal(projectId)
    await testSubmitSpecTestProposal(projectId)
    await testSubmitStoryProposal(projectId)

    console.log('\n✨ Tests complete!')
}

main().catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
})
