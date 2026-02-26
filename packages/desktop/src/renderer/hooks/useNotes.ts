import { useState, useEffect, useCallback } from 'react'
import type { Note, AddNotePayload, UpdateNotePayload } from '@ockham/shared'

export function useNotes() {
    const [notes, setNotes] = useState<Note[]>([])
    const [loading, setLoading] = useState(true)

    /** Load all notes for current workspace */
    const loadNotes = useCallback(async () => {
        setLoading(true)
        try {
            const result = await window.notesApi.loadNotes()
            setNotes(result)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadNotes()
    }, [loadNotes])

    /** Add a new note */
    const addNote = useCallback(
        async (payload: AddNotePayload) => {
            const note = await window.notesApi.addNote(payload)
            await loadNotes()
            return note
        },
        [loadNotes]
    )

    /** Update an existing note */
    const updateNote = useCallback(
        async (payload: UpdateNotePayload) => {
            const note = await window.notesApi.updateNote(payload)
            await loadNotes()
            return note
        },
        [loadNotes]
    )

    /** Delete a note */
    const deleteNote = useCallback(
        async (id: string) => {
            await window.notesApi.deleteNote(id)
            await loadNotes()
        },
        [loadNotes]
    )

    return {
        notes,
        loading,
        loadNotes,
        addNote,
        updateNote,
        deleteNote,
    }
}
