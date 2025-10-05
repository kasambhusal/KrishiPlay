"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGame } from "@/contexts/game-context";
import cropsData from "@/public/crops-data.json";

const cropIcons: Record<string, string> = {
  cauliflower: "🥦",
  paddy: "🌾",
  wheat: "🌾",
  onion: "🧅",
  maize: "🌽",
};

export default function CropSelection({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const { addSeedsToInventory } = useGame();
  const [selectedCrops, setSelectedCrops] = useState<Set<string>>(new Set());

  const toggleCrop = (cropId: string) => {
    const newSelected = new Set(selectedCrops);
    if (newSelected.has(cropId)) {
      newSelected.delete(cropId);
    } else {
      newSelected.add(cropId);
    }
    setSelectedCrops(newSelected);
  };

  const handleContinue = () => {
    // Add initial seeds to inventory
    selectedCrops.forEach((cropId) => {
      addSeedsToInventory(cropId, 0); // Start with 10 seeds of each selected crop
    });
    onComplete();
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">
            Select Your Crops
          </h1>
          <p className="text-muted-foreground">
            Choose the crops you want to grow in your farm
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(cropsData.crops).map(([id, crop]) => (
            <Card
              key={id}
              className={`p-6 cursor-pointer transition-all hover:scale-105 ${
                selectedCrops.has(id) ? "ring-2 ring-primary bg-primary/5" : ""
              }`}
              onClick={() => toggleCrop(id)}
            >
              <div className="flex items-center gap-4">
                <div className="text-5xl">{cropIcons[id]}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{crop.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    ${crop.baseCost}/seed
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Market: ${crop.marketPrice}/kg
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={selectedCrops.size === 0}
            className="px-8"
          >
            Start Farming ({selectedCrops.size} crops selected)
          </Button>
        </div>
      </div>
    </div>
  );
}
