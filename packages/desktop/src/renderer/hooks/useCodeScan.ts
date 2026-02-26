import { useState, useEffect, useCallback } from 'react'
import type { ScanResult } from '@ockham/shared'

export function useCodeScan() {
    const [result, setResult] = useState<ScanResult | null>(null)
    const [loading, setLoading] = useState(true)
    const [scanning, setScanning] = useState(false)

    /** Load last scan result on mount */
    const loadResult = useCallback(async () => {
        setLoading(true)
        try {
            const data = await window.codescanApi.getResult()
            setResult(data)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadResult()
    }, [loadResult])

    /** Execute a new scan */
    const runScan = useCallback(async () => {
        setScanning(true)
        try {
            const data = await window.codescanApi.runScan()
            setResult(data)
        } finally {
            setScanning(false)
        }
    }, [])

    return {
        result,
        loading,
        scanning,
        runScan,
        loadResult,
    }
}
