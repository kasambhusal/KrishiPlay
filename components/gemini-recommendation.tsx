"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Loader2, Sparkles, X } from "lucide-react";

interface GeminiRecommendationProps {
  location: { lat: number; lon: number };
  weatherData: {
    temperature: number;
    precipitation: number;
    elevation?: number;
    soilType?: string;
  };
}

export default function GeminiRecommendation({
  location,
  weatherData,
}: GeminiRecommendationProps) {
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
`;

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
      {/* Floating Sparkles Button */}
      <motion.div
        className="absolute top-4 left-4 bg-white/30 backdrop-blur-lg rounded-2xl p-3 cursor-pointer shadow-lg border border-white/20 z-40"
        whileHover={{ scale: 1.1 }}
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="relative w-full max-w-lg h-[500px] p-6 space-y-6 bg-gradient-to-br from-green-100 to-green-50 shadow-2xl rounded-3xl border border-green-200 flex flex-col">
            {/* Close Button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-red-200 transition"
            >
              <X className="text-red-600" size={20} />
            </button>

            <h2 className="text-3xl font-bold text-center text-green-800 drop-shadow-sm">
              🌱 Crop Recommendations
            </h2>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center space-y-3 py-6">
                  <Loader2 className="animate-spin text-green-600" size={40} />
                  <p className="text-sm text-gray-700">
                    Analyzing your field...
                  </p>
                </div>
              ) : recommendations ? (
                <ul className="space-y-3 text-center text-lg font-medium text-green-900">
                  {recommendations.map((crop, i) => (
                    <li
                      key={i}
                      className="bg-green-200/50 px-4 py-2 rounded-xl shadow-inner"
                    >
                      {crop}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-sm text-gray-500">
                  Click again to retry fetching recommendations.
                </p>
              )}
            </div>

            <Button
              onClick={() => setOpen(false)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl shadow-md"
            >
              Close
            </Button>
          </Card>
        </div>
      )}
    </>
  );
}
