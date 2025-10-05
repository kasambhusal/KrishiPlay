"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(onComplete, 500)
          return 100
        }
        return prev + 2
      })
    }, 50)

    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-grass/10 to-soil/10">
      <div className="space-y-8 text-center">
        <div className="relative w-64 h-64 mx-auto">
          <Image src="/logo.png" alt="KrishiPlay Logo" fill className="object-contain" priority />
        </div>

        <div className="w-80 space-y-2">
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground font-mono">{progress}%</p>
        </div>
      </div>
    </div>
  )
}
