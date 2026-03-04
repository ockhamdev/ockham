/**
 * Normalize a git remote URL into a slug.
 *
 * Examples:
 *   git@github.com:ockhamdev/ockham.git   → github.com/ockhamdev/ockham
 *   https://github.com/ockhamdev/ockham.git → github.com/ockhamdev/ockham
 *   git://github.com/ockhamdev/ockham.git   → github.com/ockhamdev/ockham
 *   http://github.com/ockhamdev/ockham      → github.com/ockhamdev/ockham
 *   ssh://git@github.com/ockhamdev/ockham   → github.com/ockhamdev/ockham
 */
export function normalizeGitRemoteUrl(url: string): string {
    let s = url.trim()

    // Remove protocol prefixes
    s = s.replace(/^(ssh|git|https?):\/\//, '')

    // Remove git@ prefix and convert : to /
    // git@github.com:org/repo → github.com/org/repo
    s = s.replace(/^git@/, '')
    s = s.replace(/:(?!\/)/, '/')

    // Remove .git suffix
    s = s.replace(/\.git$/, '')

    // Remove trailing slash
    s = s.replace(/\/$/, '')

    // Remove leading user@ if still present (e.g. user@host)
    s = s.replace(/^[^@]+@/, '')

    return s
}
