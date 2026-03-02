import { uuidv7 } from 'uuidv7'

/**
 * UUID v7 — 时间排序的唯一标识符值对象。
 * 所有聚合根和实体的 ID 均使用此类型。
 */
export type Id = string & { readonly __brand: unique symbol }

/**
 * 创建一个新的 UUID v7 标识符。
 */
export function createId(): Id {
    return uuidv7() as Id
}

/**
 * 将普通字符串转换为 Id 类型（用于从数据库读取）。
 */
export function toId(value: string): Id {
    return value as Id
}
