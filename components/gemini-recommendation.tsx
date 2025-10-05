"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";

interface GeminiRecommendationProps {
  location: { lat: number; lon: number };
  weatherData: { temperature: number; precipitation: number; elevation?: number, soilType?: string };
}

export default function GeminiRecommendation({ location, weatherData }: GeminiRecommendationProps) {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<string[] | null>(null);
  const [open, setOpen] = useState(false);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const prompt = `
You are an agricultural AI assistant.
Based on the following data:
- Location: lat ${location.lat}, lon ${location.lon}
- Avg temperature: ${weatherData.temperature}°C
- Avg precipitation: ${weatherData.precipitation}mm
- Elevation: ${weatherData.elevation}m
- Soil type: ${weatherData.soilType}
Suggest the **top 4-5 crops** best suited for this location for all four seasons (Spring, Summer, Autumn, Winter).
Give short names only, formatted as a numbered list.
`


      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (error) {
      console.error("Gemini error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <motion.div
        className="absolute top-4 left-4 bg-white/20 backdrop-blur-md rounded-xl p-3 cursor-pointer shadow-lg border border-white/10 z-40"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setOpen(true);
          if (!recommendations) fetchRecommendations();
        }}
      >
        <Sparkles className="text-white drop-shadow-md" size={28} />
      </motion.div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 space-y-4 bg-white/90 shadow-xl rounded-2xl border border-gray-200">
            <h2 className="text-2xl font-semibold text-center text-gray-900">
              🌱 Crop Recommendations
            </h2>

            {loading ? (
              <div className="flex flex-col items-center justify-center space-y-2 py-4">
                <Loader2 className="animate-spin text-green-600" size={30} />
                <p className="text-sm text-gray-600">Analyzing your field...</p>
              </div>
            ) : recommendations ? (
              <ul className="space-y-2 text-center">
                {recommendations.map((crop, i) => (
                  <li key={i} className="text-lg font-medium text-gray-800">
                    {crop}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-sm text-gray-500">
                Click again to retry fetching recommendations.
              </p>
            )}

            <Button onClick={() => setOpen(false)} className="w-full bg-green-600 hover:bg-green-700">
              Close
            </Button>
          </Card>
        </div>
      )}
    </>
  );
}
