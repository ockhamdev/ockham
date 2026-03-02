import type { Id } from '../shared'
import type { Project } from './project'

/**
 * 项目仓储接口
 */
export interface ProjectRepository {
    create(project: Project): Promise<Project>
    findById(id: Id): Promise<Project | null>
    findBySlug(teamId: Id, slug: string): Promise<Project | null>
    findByTeamId(teamId: Id): Promise<Project[]>
    update(id: Id, data: Partial<Pick<Project, 'name' | 'slug' | 'description'>>): Promise<Project>
    delete(id: Id): Promise<void>
}
