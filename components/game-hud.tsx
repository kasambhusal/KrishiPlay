"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGame } from "@/contexts/game-context";
import cropsData from "@/public/crops-data.json";
import { motion } from "framer-motion";
import MusicToggleButton from "./toggle-music";

interface GameHUDProps {
  location: { lat: number; lon: number };
  onOpenShop: (type: "seeds" | "water" | "fertilizer") => void;
  onHarvest: () => void;
}

const cropIcons: Record<string, string> = {
  cauliflower: "🥦",
  paddy: "🌾",
  wheat: "🌾",
  onion: "🧅",
  maize: "🌽",
};

export default function GameHUD({
  location,
  onOpenShop,
  onHarvest,
}: GameHUDProps) {
  const {
    inventory,
    money,
    weatherData,
    field,
    selectedCrop,
    setSelectedCrop,
  } = useGame();

  // Count planted crops
  const plantCounts = field.flat().reduce((acc, cell) => {
    if (cell) acc[cell.type] = (acc[cell.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const allFieldsFilled = field.flat().every((cell) => cell !== null);

  // Calculate total resource needs for all planted crops
  const totalNeeds = field.flat().reduce(
    (totals, cell) => {
      if (!cell) return totals;
      const cropData =
        cropsData.crops[cell.type as keyof typeof cropsData.crops];
      totals.water += cropData.waterNeed;
      totals.fertilizer += cropData.fertilizerNeed;
      return totals;
    },
    { water: 0, fertilizer: 0 }
  );

  const hasEnoughResources =
    inventory.water >= totalNeeds.water &&
    inventory.fertilizer >= totalNeeds.fertilizer;

  const resourceTextColor = (hasEnough: boolean) =>
    hasEnough ? "text-green-500" : "text-red-500";

  return (
    <>
      {/* Weather Info (Top Right) */}
      <Card className="absolute top-4 right-4 p-4 bg-card/90 backdrop-blur-sm">
        <div className="space-y-2 text-sm">
          <div className="font-semibold text-foreground">Weather Data</div>
          <div className="text-muted-foreground">
            <div>🌡 Temp: {weatherData?.temperature.toFixed(2) ?? "--"}°C</div>
            <div>
              📍 Location: {location.lat.toFixed(2)}, {location.lon.toFixed(2)}
            </div>
          </div>
        </div>
      </Card>
      <MusicToggleButton />

      {/* Money Display (Top Center) */}
      <Card className="absolute top-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-card/90 backdrop-blur-sm">
        <div className="text-2xl font-bold text-primary">
          💰 ${money.toFixed(2)}
        </div>
      </Card>

      {/* Crop Info & Inventory (Bottom Left) */}
      <Card className="absolute bottom-4 left-4 p-4 bg-card/90 backdrop-blur-sm space-y-3">
        <div className="font-semibold text-foreground">🌾 Planted Crops</div>
        <div className="space-y-1">
          {Object.entries(plantCounts).length > 0 ? (
            Object.entries(plantCounts).map(([type, count]) => (
              <div key={type} className="flex items-center gap-2 text-sm">
                <span className="text-xl">{cropIcons[type]}</span>
                <span className="text-muted-foreground">{count}x</span>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">
              No crops planted
            </div>
          )}
        </div>

        {/* Resource Status */}
        <div className="pt-3 border-t space-y-1">
          <div className="font-semibold text-foreground text-sm">
            🔧 Resources
          </div>
          <div className="text-sm">
            <div
              className={resourceTextColor(inventory.water >= totalNeeds.water)}
            >
              💧 Water: {inventory.water.toFixed(1)}L{" "}
              <span className="text-xs text-muted-foreground">
                / {totalNeeds.water.toFixed(1)}L needed
              </span>
            </div>
            <div
              className={resourceTextColor(
                inventory.fertilizer >= totalNeeds.fertilizer
              )}
            >
              🌱 Fertilizer: {inventory.fertilizer.toFixed(1)}kg{" "}
              <span className="text-xs text-muted-foreground">
                / {totalNeeds.fertilizer.toFixed(1)}kg needed
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Crop Selection (Bottom Center) */}
      <Card className="absolute bottom-4 left-1/2 -translate-x-1/2 p-4 bg-card/90 backdrop-blur-sm">
        <div className="space-y-2">
          <div className="text-sm font-semibold text-center text-foreground">
            🌱 Select Crop to Plant
          </div>
          <div className="flex gap-2 justify-center">
            {Object.entries(inventory.seeds).map(([cropId, count]) =>
              count > 0 ? (
                <Button
                  key={cropId}
                  variant={selectedCrop === cropId ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCrop(cropId)}
                  className="flex flex-col h-auto py-2"
                >
                  <span className="text-2xl">{cropIcons[cropId]}</span>
                  <span className="text-xs">{count}</span>
                </Button>
              ) : null
            )}
          </div>
        </div>
      </Card>

      {/* Shop Buttons (Right Center) */}
      {/* ========== MODERN FLOATING SHOP PANEL ========== */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-5 pointer-events-auto animate-float">
        {[
          {
            type: "seeds",
            icon: "🌱",
            label: "Seeds",
            color: "from-green-400 to-emerald-600",
          },
          {
            type: "water",
            icon: "💧",
            label: "Water",
            color: "from-blue-400 to-sky-600",
          },
          {
            type: "fertilizer",
            icon: "🧪",
            label: "Fertilizer",
            color: "from-yellow-400 to-amber-600",
          },
        ].map((shop) => (
          <motion.div
            key={shop.type}
            whileHover={{ scale: 1.1, rotate: 3, y: -2 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            onClick={() =>
              onOpenShop(shop.type as "seeds" | "water" | "fertilizer")
            }
            className="relative group cursor-pointer select-none"
          >
            {/* Icon Container */}
            <div
              className={`bg-gradient-to-br ${shop.color} text-white rounded-2xl w-16 h-16 flex flex-col items-center justify-center shadow-lg transition-all duration-300`}
            >
              <span className="text-3xl drop-shadow-sm animate-bounce-slow">
                {shop.icon}
              </span>
            </div>

            {/* Label Tooltip */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-white/90 text-black px-3 py-1 rounded-lg text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md backdrop-blur-sm">
              {shop.label}
            </div>

            {/* Glow Effect */}
            <div
              className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${shop.color} opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-500`}
            />
          </motion.div>
        ))}
      </div>

      {/* Harvest Button */}
      {allFieldsFilled && hasEnoughResources && (
        <Button
          onClick={onHarvest}
          size="lg"
          className="absolute bottom-24 left-1/2 -translate-x-1/2 harvest-glow cursor-pointer"
        >
          🌾 Ready to Harvest
        </Button>
      )}
    </>
  );
}
