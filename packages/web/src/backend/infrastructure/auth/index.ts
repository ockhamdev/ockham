import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { uuidv7 } from 'uuidv7'
import { db } from '../db'
import * as schema from '../db/schema'

export const auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:7353',
    trustedOrigins: [
        'http://localhost:5173',  // Electron renderer dev server (Vite)
        'http://localhost:7353',  // Same-origin API
    ],
    database: drizzleAdapter(db, {
        provider: 'pg',
        schema: {
            user: schema.users,
            session: schema.sessions,
            account: schema.accounts,
            verification: schema.verifications,
        },
    }),
    emailAndPassword: {
        enabled: true,
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
        },
    },
    advanced: {
        database: {
            generateId: () => uuidv7(),
        },
    },
})

export type Session = typeof auth.$Infer.Session
