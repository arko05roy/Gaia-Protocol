"use client"

import { useAccount } from "wagmi"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DebugPage() {
  const { address, isConnected, chainId } = useAccount()
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    // Capture console logs
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn

    console.log = (...args) => {
      setLogs((prev) => [...prev, `[LOG] ${JSON.stringify(args)}`])
      originalLog(...args)
    }

    console.error = (...args) => {
      setLogs((prev) => [...prev, `[ERROR] ${JSON.stringify(args)}`])
      originalError(...args)
    }

    console.warn = (...args) => {
      setLogs((prev) => [...prev, `[WARN] ${JSON.stringify(args)}`])
      originalWarn(...args)
    }

    return () => {
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  }, [])

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Debug Console</h1>

        {/* Wallet Info */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Wallet Info</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-semibold">Connected:</span> {isConnected ? "✅ Yes" : "❌ No"}
            </p>
            <p>
              <span className="font-semibold">Address:</span> {address || "Not connected"}
            </p>
            <p>
              <span className="font-semibold">Chain ID:</span> {chainId || "Unknown"}
            </p>
            <p>
              <span className="font-semibold">Expected Chain ID:</span> 424242 (Gaia L2)
            </p>
          </div>
        </Card>

        {/* Console Logs */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Console Logs</h2>
            <Button
              onClick={() => setLogs([])}
              variant="outline"
              className="text-sm"
            >
              Clear
            </Button>
          </div>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-xs max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Try creating a task...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Instructions */}
        <Card className="p-6 mt-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold mb-2">How to Debug:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Check wallet is connected to Chain ID 424242</li>
            <li>Go to Projects page and try creating a task</li>
            <li>Watch this page for error logs</li>
            <li>Also check browser DevTools Console (F12) for more details</li>
          </ol>
        </Card>
      </div>
    </div>
  )
}
