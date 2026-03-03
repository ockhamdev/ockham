import type { Id } from '../shared'
import type { Story, StoryMessage, StoryProposal } from './story'

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

    // Proposal 操作
    createProposal(entry: StoryProposal): Promise<StoryProposal>
    findProposalById(id: Id): Promise<StoryProposal | null>
    findProposalByProjectId(projectId: Id): Promise<StoryProposal[]>
    updateProposal(id: Id, data: Partial<Pick<StoryProposal, 'status' | 'reviewedBy' | 'reviewNote'>>): Promise<StoryProposal>
    deleteProposal(id: Id): Promise<void>
}
