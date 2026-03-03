import { useState, useEffect, useCallback } from 'react'
import { listNotes, createNote, updateNote, deleteNote, type NoteRecord } from '../api'

export function useNotes(projectId?: string) {
    const [notes, setNotes] = useState<NoteRecord[]>([])
    const [loading, setLoading] = useState(true)

    /** Load all notes for current project via tRPC */
    const loadNotes = useCallback(async () => {
        if (!projectId) {
            setLoading(false)
            return
        }
        setLoading(true)
        try {
            const result = await listNotes(projectId)
            setNotes(result)
        } finally {
            setLoading(false)
        }
    }, [projectId])

    useEffect(() => {
        loadNotes()
    }, [loadNotes])

    /** Add a new note */
    const addNoteHandler = useCallback(
        async (payload: { title: string; content: string }) => {
            if (!projectId) return null
            const note = await createNote({ projectId, ...payload })
            await loadNotes()
            return note
        },
        [projectId, loadNotes]
    )

    /** Update an existing note */
    const updateNoteHandler = useCallback(
        async (payload: { id: string; title?: string; content?: string }) => {
            const note = await updateNote(payload)
            await loadNotes()
            return note
        },
        [loadNotes]
    )

    /** Delete a note */
    const deleteNoteHandler = useCallback(
        async (id: string) => {
            await deleteNote(id)
            await loadNotes()
        },
        [loadNotes]
    )

    return {
        notes,
        loading,
        loadNotes,
        addNote: addNoteHandler,
        updateNote: updateNoteHandler,
        deleteNote: deleteNoteHandler,
    }
}
