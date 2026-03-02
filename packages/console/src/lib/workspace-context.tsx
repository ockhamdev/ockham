'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { trpc } from './trpc-client'

interface WorkspaceState {
    teamId: string | null
    projectId: string | null
    teams: Array<{ id: string; name: string; slug: string }>
    projects: Array<{ id: string; name: string; slug: string }>
    setTeamId: (id: string) => void
    setProjectId: (id: string) => void
    isLoading: boolean
}

const WorkspaceContext = createContext<WorkspaceState | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const [teamId, setTeamIdState] = useState<string | null>(null)
    const [projectId, setProjectIdState] = useState<string | null>(null)

    const { data: teams, isLoading: teamsLoading } = trpc.team.list.useQuery()
    const { data: projects, isLoading: projectsLoading } = trpc.project.list.useQuery(
        { teamId: teamId! },
        { enabled: !!teamId }
    )

    // Auto-select first team
    useEffect(() => {
        if (teams?.length && !teamId) {
            setTeamIdState(teams[0].id)
        }
    }, [teams, teamId])

    // Auto-select first project when team changes
    useEffect(() => {
        if (projects?.length) {
            setProjectIdState(projects[0].id)
        } else {
            setProjectIdState(null)
        }
    }, [projects])

    const setTeamId = (id: string) => {
        setTeamIdState(id)
        setProjectIdState(null)
    }

    const setProjectId = (id: string) => {
        setProjectIdState(id)
    }

    return (
        <WorkspaceContext.Provider
            value={{
                teamId,
                projectId,
                teams: (teams as Array<{ id: string; name: string; slug: string }>) ?? [],
                projects: (projects as Array<{ id: string; name: string; slug: string }>) ?? [],
                setTeamId,
                setProjectId,
                isLoading: teamsLoading || projectsLoading,
            }}
        >
            {children}
        </WorkspaceContext.Provider>
    )
}

export function useWorkspace() {
    const ctx = useContext(WorkspaceContext)
    if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
    return ctx
}
