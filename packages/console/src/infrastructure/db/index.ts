import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

/**
 * PostgreSQL 客户端 — 用于 Drizzle ORM
 */
const client = postgres(connectionString)

/**
 * Drizzle ORM 数据库实例
 */
export const db = drizzle(client, { schema })

export type Database = typeof db
