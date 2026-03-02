import type { Id } from '../shared'
import type { Story, StoryMessage } from './story'

/**
 * 故事仓储接口
 */
export interface StoryRepository {
    create(story: Story): Promise<Story>
    findById(id: Id): Promise<Story | null>
    findByProjectId(projectId: Id): Promise<Story[]>
    update(id: Id, data: Partial<Pick<Story, 'title' | 'enrichedText' | 'prompt'>>): Promise<Story>
    delete(id: Id): Promise<void>

    // 消息操作
    addMessage(message: StoryMessage): Promise<StoryMessage>
    findMessages(storyId: Id): Promise<StoryMessage[]>
    deleteMessages(storyId: Id): Promise<void>
}
