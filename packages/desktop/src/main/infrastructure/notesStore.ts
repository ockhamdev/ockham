import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import type { Note } from '@ockham/shared'
import type { AddNotePayload, UpdateNotePayload } from '@ockham/shared'

const DATA_DIR = '.ockham'
const NOTES_FILE = 'notes.json'

/**
 * Resolve the notes.json path within a workspace.
 */
function getNotesPath(workspacePath: string): string {
    return path.join(workspacePath, DATA_DIR, NOTES_FILE)
}

/**
 * Ensure the .ockham directory exists in the workspace.
 */
function ensureDataDir(workspacePath: string): void {
    const dir = path.join(workspacePath, DATA_DIR)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
}

/**
 * Read all notes from a workspace.
 */
export function loadNotes(workspacePath: string): Note[] {
    const filePath = getNotesPath(workspacePath)
    if (!fs.existsSync(filePath)) {
        return []
    }
    try {
        const raw = fs.readFileSync(filePath, 'utf-8')
        return JSON.parse(raw) as Note[]
    } catch {
        return []
    }
}

/**
 * Save all notes to a workspace.
 */
function saveNotes(workspacePath: string, notes: Note[]): void {
    ensureDataDir(workspacePath)
    const filePath = getNotesPath(workspacePath)
    fs.writeFileSync(filePath, JSON.stringify(notes, null, 2), 'utf-8')
}

/**
 * Add a new note.
 */
export function addNote(workspacePath: string, payload: AddNotePayload): Note {
    const notes = loadNotes(workspacePath)
    const now = new Date().toISOString()
    const note: Note = {
        id: uuidv4(),
        title: payload.title,
        content: payload.content,
        createdAt: now,
        updatedAt: now,
    }
    notes.unshift(note)
    saveNotes(workspacePath, notes)
    return note
}

/**
 * Update an existing note.
 */
export function updateNote(
    workspacePath: string,
    payload: UpdateNotePayload
): Note {
    const notes = loadNotes(workspacePath)
    const index = notes.findIndex((n) => n.id === payload.id)
    if (index === -1) {
        throw new Error(`Note not found: ${payload.id}`)
    }
    const note = notes[index]
    if (payload.title !== undefined) note.title = payload.title
    if (payload.content !== undefined) note.content = payload.content
    note.updatedAt = new Date().toISOString()
    notes[index] = note
    saveNotes(workspacePath, notes)
    return note
}

/**
 * Delete a note by ID.
 */
export function deleteNote(workspacePath: string, id: string): void {
    let notes = loadNotes(workspacePath)
    notes = notes.filter((n) => n.id !== id)
    saveNotes(workspacePath, notes)
}
