"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export default function MusicToggleButton() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize the audio only once
    audioRef.current = new Audio("/sounds/background.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.25;

    return () => {
      // Cleanup when unmounting
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      // Pause the music
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Try to play (handle browser autoplay restrictions)
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          console.warn("Autoplay prevented. User interaction required.");
        });
    }
  };

  return (
    <Button
      className="absolute top-5 left-20 p-2 bg-white/40 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 z-40"
      onClick={toggleMusic}
    >
      {isPlaying ? "🔇 Stop Music" : "🔊 Play Music"}
    </Button>
  );
}
