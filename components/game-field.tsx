"use client";

import { useState, useEffect } from "react";
import Field3D from "@/components/field-3d";
import GroqRecommendation from "@/components/gemini-recommendation";
import GameHUD from "@/components/game-hud";
import ShopModal from "@/components/shop-modal";
import HarvestModal from "@/components/harvest-modal";
import NotificationToast from "@/components/notification-toast";
import { useGame } from "@/contexts/game-context";
import { fetchWeatherData } from "@/lib/weather-api";

interface GameFieldProps {
  location: { lat: number; lon: number };
}

export default function GameField({ location }: GameFieldProps) {
  const { weatherData, setWeatherData } = useGame();
  const [shopOpen, setShopOpen] = useState<
    "seeds" | "water" | "fertilizer" | null
  >(null);
  const [harvestModalOpen, setHarvestModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    // Fetch weather data
    fetchWeatherData(location.lat, location.lon).then((data) => {
      setWeatherData(data);
    });
    showNotification(
      "You must fill entire field with crops to unlock Harvesting!"
    );
  }, [location]);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <Field3D />
      <GameHUD
        location={location}
        onOpenShop={setShopOpen}
        onHarvest={() => setHarvestModalOpen(true)}
      />
      {/* 🌾 Gemini Recommendation Button */}
      {weatherData && (
        <GroqRecommendation location={location} weatherData={weatherData} />
      )}
      {shopOpen && (
        <ShopModal
          type={shopOpen}
          onClose={() => setShopOpen(null)}
          onPurchase={(message) => {
            showNotification(message);
            setShopOpen(null);
          }}
        />
      )}

      {harvestModalOpen && (
        <HarvestModal
          onClose={() => setHarvestModalOpen(false)}
          onComplete={(message) => {
            showNotification(message);
            setHarvestModalOpen(false);
          }}
        />
      )}

      {notification && <NotificationToast message={notification} />}
    </div>
  );
}
