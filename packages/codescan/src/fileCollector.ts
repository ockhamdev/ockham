import fs from 'fs'
import path from 'path'
import ignore, { type Ignore } from 'ignore'

interface CollectedFile {
    /** Relative path from workspace root */
    relativePath: string
    /** Absolute path */
    absolutePath: string
    /** Total line count */
    totalLines: number
}

/**
 * Collect all files in a workspace directory, respecting .gitignore rules
 * at every directory level.
 */
export function collectFiles(workspacePath: string): CollectedFile[] {
    const files: CollectedFile[] = []
    const rootIgnore = createIgnoreForDir(workspacePath)

    // Always ignore these directories regardless of .gitignore
    const alwaysIgnore = ignore().add([
        '.git',
        'node_modules',
        '.ockham',
    ])

    walkDirectory(workspacePath, '', rootIgnore, alwaysIgnore, files, workspacePath)
    return files
}

/**
 * Create an Ignore instance from a .gitignore file in the given directory.
 */
function createIgnoreForDir(dirPath: string): Ignore {
    const ig = ignore()
    const gitignorePath = path.join(dirPath, '.gitignore')
    if (fs.existsSync(gitignorePath)) {
        const content = fs.readFileSync(gitignorePath, 'utf-8')
        ig.add(content)
    }
    return ig
}

/**
 * Recursively walk directory, applying .gitignore rules at each level.
 */
function walkDirectory(
    currentDir: string,
    relativeTo: string,
    parentIgnore: Ignore,
    alwaysIgnore: Ignore,
    result: CollectedFile[],
    workspacePath: string
): void {
    let entries: fs.Dirent[]
    try {
        entries = fs.readdirSync(currentDir, { withFileTypes: true })
    } catch {
        return
    }

    // Check for local .gitignore and merge with parent
    const localIgnore = createIgnoreForDir(currentDir)
    const combinedIgnore = ignore()
        .add(parentIgnore)
        .add(localIgnore)

    for (const entry of entries) {
        const name = entry.name
        const relPath = relativeTo ? `${relativeTo}/${name}` : name

        // Always skip certain directories
        if (alwaysIgnore.ignores(relPath.endsWith('/') ? relPath : (entry.isDirectory() ? `${relPath}/` : relPath))) {
            if (entry.isDirectory() && (name === '.git' || name === 'node_modules' || name === '.ockham')) {
                continue
            }
        }

        // Check .gitignore
        if (combinedIgnore.ignores(relPath)) {
            continue
        }

        const fullPath = path.join(currentDir, name)

        if (entry.isDirectory()) {
            walkDirectory(fullPath, relPath, combinedIgnore, alwaysIgnore, result, workspacePath)
        } else if (entry.isFile()) {
            try {
                const content = fs.readFileSync(fullPath, 'utf-8')
                const totalLines = content.split('\n').length
                result.push({
                    relativePath: relPath,
                    absolutePath: fullPath,
                    totalLines,
                })
            } catch {
                // Skip files that can't be read (binary, permissions, etc.)
            }
        }
    }
}
