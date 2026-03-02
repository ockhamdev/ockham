import type { Id } from '../shared'
import type { Team, Member, MemberRole } from './team'

/**
 * 团队仓储接口
 */
export interface TeamRepository {
    create(team: Team): Promise<Team>
    findById(id: Id): Promise<Team | null>
    findBySlug(slug: string): Promise<Team | null>
    findByUserId(userId: Id): Promise<Team[]>
    update(id: Id, data: Partial<Pick<Team, 'name' | 'slug'>>): Promise<Team>
    delete(id: Id): Promise<void>

    // 成员操作
    addMember(member: Member): Promise<Member>
    findMembers(teamId: Id): Promise<Member[]>
    findMember(teamId: Id, userId: Id): Promise<Member | null>
    updateMemberRole(id: Id, role: MemberRole): Promise<Member>
    removeMember(id: Id): Promise<void>
}
