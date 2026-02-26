import { useState, useEffect, useCallback, useMemo } from 'react'

export type ThemeMode = 'system' | 'light' | 'dark'

const THEME_KEY = 'ockham-theme'

function getSystemTheme(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
}

export function useTheme() {
    const [mode, setModeState] = useState<ThemeMode>(() => {
        const stored = localStorage.getItem(THEME_KEY) as ThemeMode | null
        return stored || 'system'
    })

    const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme)

    const resolvedTheme = useMemo(
        () => (mode === 'system' ? systemTheme : mode),
        [mode, systemTheme]
    )

    const setMode = useCallback((newMode: ThemeMode) => {
        setModeState(newMode)
        localStorage.setItem(THEME_KEY, newMode)
    }, [])

    // Sync data-theme attribute
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', resolvedTheme)
    }, [resolvedTheme])

    // Listen for system theme changes
    useEffect(() => {
        const mql = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = () => {
            setSystemTheme(mql.matches ? 'dark' : 'light')
        }
        mql.addEventListener('change', handler)
        return () => mql.removeEventListener('change', handler)
    }, [])

    return { mode, resolvedTheme, setMode }
}
