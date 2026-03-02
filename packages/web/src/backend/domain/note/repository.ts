import type { Id } from '../shared'
import type { Note } from './note'

/**
 * 笔记仓储接口
 */
export interface NoteRepository {
    create(note: Note): Promise<Note>
    findById(id: Id): Promise<Note | null>
    findByProjectId(projectId: Id): Promise<Note[]>
    update(id: Id, data: Partial<Pick<Note, 'title' | 'content'>>): Promise<Note>
    delete(id: Id): Promise<void>
}
