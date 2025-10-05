"use client"

import { useState, useEffect } from "react"
import LoadingScreen from "@/components/loading-screen"
import CropSelection from "@/components/crop-selection"
import GameField from "@/components/game-field"
import { GameProvider } from "@/contexts/game-context"

export default function Home() {
  const [gameState, setGameState] = useState<"loading" | "location" | "crop-selection" | "playing">("loading")
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setGameState("location")
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const handleLocationGranted = (lat: number, lon: number) => {
    setLocation({ lat, lon })
    setGameState("crop-selection")
  }

  const handleCropSelected = () => {
    setGameState("playing")
  }

  return (
    <GameProvider>
      <main className="min-h-screen bg-gradient-to-b from-sky/20 to-background">
        {gameState === "loading" && <LoadingScreen onComplete={() => setGameState("location")} />}
        {gameState === "location" && <LocationRequest onLocationGranted={handleLocationGranted} />}
        {gameState === "crop-selection" && <CropSelection onComplete={handleCropSelected} />}
        {gameState === "playing" && location && <GameField location={location} />}
      </main>
    </GameProvider>
  )
}

function LocationRequest({ onLocationGranted }: { onLocationGranted: (lat: number, lon: number) => void }) {
  const [error, setError] = useState<string>("")

  const requestLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onLocationGranted(position.coords.latitude, position.coords.longitude)
        },
        (error) => {
          console.error("Location error:", error)
          setError("Unable to get location. Using default location.")
          // Default to a sample location
          setTimeout(() => onLocationGranted(28.6139, 77.209), 2000)
        },
      )
    } else {
      setError("Geolocation not supported. Using default location.")
      setTimeout(() => onLocationGranted(28.6139, 77.209), 2000)
    }
  }

  useEffect(() => {
    requestLocation()
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <h2 className="text-2xl font-bold text-foreground">Requesting Location Access</h2>
        <p className="text-muted-foreground">We need your location to provide accurate weather data</p>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  )
}
