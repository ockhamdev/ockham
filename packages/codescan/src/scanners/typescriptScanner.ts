import * as ts from 'typescript'
import crypto from 'crypto'
import type { LanguageScanner, ScanOutput, SyntaxUnit } from '../types'

/**
 * TypeScript/JavaScript scanner.
 * Uses the TypeScript Compiler API to parse source files and extract syntax units.
 */
export const typescriptScanner: LanguageScanner = {
    extensions: ['ts', 'tsx', 'js', 'jsx', 'mts', 'cts', 'mjs', 'cjs'],

    scan(absolutePath: string, relativePath: string, source: string): ScanOutput {
        const syntaxUnits: SyntaxUnit[] = []
        const coveredLineSet = new Set<number>()

        // Determine script kind from extension
        const ext = absolutePath.split('.').pop()?.toLowerCase() || ''
        let scriptKind: ts.ScriptKind
        switch (ext) {
            case 'tsx':
                scriptKind = ts.ScriptKind.TSX
                break
            case 'jsx':
                scriptKind = ts.ScriptKind.JSX
                break
            case 'js':
            case 'mjs':
            case 'cjs':
                scriptKind = ts.ScriptKind.JS
                break
            default:
                scriptKind = ts.ScriptKind.TS
        }

        // Parse the source file
        const sourceFile = ts.createSourceFile(
            absolutePath,
            source,
            ts.ScriptTarget.Latest,
            true,
            scriptKind
        )

        // Walk the AST
        visitNode(sourceFile, sourceFile, source, relativePath, syntaxUnits, coveredLineSet)

        // Extract comments
        extractComments(sourceFile, source, relativePath, syntaxUnits, coveredLineSet)

        // Extract blank/whitespace lines
        extractBlankLines(sourceFile, source, relativePath, syntaxUnits, coveredLineSet)

        // Sort covered lines
        const coveredLines = Array.from(coveredLineSet).sort((a, b) => a - b)

        return { coveredLines, syntaxUnits }
    },
}

/**
 * Recursively visit AST nodes and extract syntax units.
 */
function visitNode(
    node: ts.Node,
    sourceFile: ts.SourceFile,
    source: string,
    relativePath: string,
    syntaxUnits: SyntaxUnit[],
    coveredLines: Set<number>
): void {
    if (shouldExtract(node)) {
        const unit = extractUnit(node, sourceFile, source, relativePath)
        if (unit) {
            syntaxUnits.push(unit)
            // Mark all lines spanned by this unit as covered
            for (let line = unit.startLine; line <= unit.endLine; line++) {
                coveredLines.add(line)
            }
        }
    }

    // Continue walking children
    ts.forEachChild(node, (child) => {
        visitNode(child, sourceFile, source, relativePath, syntaxUnits, coveredLines)
    })
}

/**
 * Determine whether a node should be extracted as a syntax unit.
 */
function shouldExtract(node: ts.Node): boolean {
    switch (node.kind) {
        case ts.SyntaxKind.ClassDeclaration:
        case ts.SyntaxKind.FunctionDeclaration:
        case ts.SyntaxKind.MethodDeclaration:
        case ts.SyntaxKind.PropertyDeclaration:
        case ts.SyntaxKind.Constructor:
        case ts.SyntaxKind.GetAccessor:
        case ts.SyntaxKind.SetAccessor:
        case ts.SyntaxKind.InterfaceDeclaration:
        case ts.SyntaxKind.TypeAliasDeclaration:
        case ts.SyntaxKind.EnumDeclaration:
        case ts.SyntaxKind.EnumMember:
        case ts.SyntaxKind.VariableStatement:
        case ts.SyntaxKind.ImportDeclaration:
        case ts.SyntaxKind.ExportDeclaration:
        case ts.SyntaxKind.ExportAssignment:
        case ts.SyntaxKind.ArrowFunction:
            return true
        default:
            return false
    }
}

/**
 * Extract a SyntaxUnit from an AST node.
 */
function extractUnit(
    node: ts.Node,
    sourceFile: ts.SourceFile,
    source: string,
    relativePath: string
): SyntaxUnit | null {
    const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
    const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd())

    const nodeText = source.substring(node.getStart(sourceFile), node.getEnd())
    const sha1 = crypto.createHash('sha1').update(nodeText).digest('hex')

    const name = getNodeName(node) || '<anonymous>'
    const type = ts.SyntaxKind[node.kind]

    return {
        type,
        name,
        filePath: relativePath,
        startLine: start.line + 1,      // Convert 0-based to 1-based
        startColumn: start.character + 1,
        endLine: end.line + 1,
        endColumn: end.character + 1,
        sha1,
    }
}

/**
 * Try to extract a name from a node.
 */
function getNodeName(node: ts.Node): string | undefined {
    // Nodes with a 'name' property
    if (
        ts.isClassDeclaration(node) ||
        ts.isFunctionDeclaration(node) ||
        ts.isMethodDeclaration(node) ||
        ts.isPropertyDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node) ||
        ts.isEnumDeclaration(node) ||
        ts.isGetAccessor(node) ||
        ts.isSetAccessor(node)
    ) {
        return node.name?.getText()
    }

    if (ts.isEnumMember(node)) {
        return node.name.getText()
    }

    if (ts.isConstructorDeclaration(node)) {
        return 'constructor'
    }

    // VariableStatement: extract the first variable name
    if (ts.isVariableStatement(node)) {
        const decl = node.declarationList.declarations[0]
        if (decl && ts.isIdentifier(decl.name)) {
            return decl.name.text
        }
    }

    // Import: extract module specifier
    if (ts.isImportDeclaration(node)) {
        return node.moduleSpecifier.getText()
    }

    return undefined
}

/**
 * Extract all comments from the source file as syntax units.
 */
function extractComments(
    sourceFile: ts.SourceFile,
    source: string,
    relativePath: string,
    syntaxUnits: SyntaxUnit[],
    coveredLines: Set<number>
): void {
    const seen = new Set<string>()

    function scanNodeComments(node: ts.Node): void {
        const leading = ts.getLeadingCommentRanges(source, node.getFullStart())
        if (leading) {
            for (const range of leading) {
                const key = `${range.pos}:${range.end}`
                if (seen.has(key)) continue
                seen.add(key)

                const text = source.substring(range.pos, range.end)
                const start = sourceFile.getLineAndCharacterOfPosition(range.pos)
                const end = sourceFile.getLineAndCharacterOfPosition(range.end)
                const sha1 = crypto.createHash('sha1').update(text).digest('hex')
                const type = range.kind === ts.SyntaxKind.SingleLineCommentTrivia
                    ? 'SingleLineComment'
                    : 'MultiLineComment'

                const unit: SyntaxUnit = {
                    type,
                    name: '<comment>',
                    filePath: relativePath,
                    startLine: start.line + 1,
                    startColumn: start.character + 1,
                    endLine: end.line + 1,
                    endColumn: end.character + 1,
                    sha1,
                }
                syntaxUnits.push(unit)
                for (let line = unit.startLine; line <= unit.endLine; line++) {
                    coveredLines.add(line)
                }
            }
        }

        ts.forEachChild(node, scanNodeComments)
    }

    scanNodeComments(sourceFile)
}

/**
 * Extract blank/whitespace-only lines as syntax units.
 * These fill in gaps not covered by any AST node or comment.
 */
function extractBlankLines(
    sourceFile: ts.SourceFile,
    source: string,
    relativePath: string,
    syntaxUnits: SyntaxUnit[],
    coveredLines: Set<number>
): void {
    // suppress unused parameter — needed for consistent scanner interface
    void sourceFile

    const lines = source.split('\n')
    for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1
        if (coveredLines.has(lineNum)) continue

        const lineText = lines[i]
        if (lineText.trim() === '') {
            const sha1 = crypto.createHash('sha1').update(`blank:${lineNum}`).digest('hex')
            const unit: SyntaxUnit = {
                type: 'BlankLine',
                name: '<blank>',
                filePath: relativePath,
                startLine: lineNum,
                startColumn: 1,
                endLine: lineNum,
                endColumn: lineText.length + 1,
                sha1,
            }
            syntaxUnits.push(unit)
            coveredLines.add(lineNum)
        }
    }
}
