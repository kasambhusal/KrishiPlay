"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useGame } from "@/contexts/game-context";
import cropsData from "@/public/crops-data.json";

interface ShopModalProps {
  type: "seeds" | "water" | "fertilizer";
  onClose: () => void;
  onPurchase: (message: string) => void;
}

const shopTitles = {
  seeds: "Seed Shop",
  water: "Irrigation Shop",
  fertilizer: "Fertilizer Shop",
};

const shopQuestions = {
  seeds: "How many seeds do you want to buy?",
  water: "How much water do you want to purchase (in liters)?",
  fertilizer: "How much fertilizer do you need (in kg)?",
};

const cropIcons: Record<string, string> = {
  cauliflower: "🥦",
  paddy: "🌾",
  wheat: "🌾",
  onion: "🧅",
  maize: "🌽",
};

export default function ShopModal({
  type,
  onClose,
  onPurchase,
}: ShopModalProps) {
  const { money, buySeeds, buyWater, buyFertilizer, inventory } = useGame();
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [totalCost, setTotalCost] = useState(0);

  // Typewriter effect
  useEffect(() => {
    const text = shopQuestions[type];
    let index = 0;
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayedText(text.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [type]);

  // Calculate cost dynamically
  useEffect(() => {
    const qty = Number(amount);
    if (isNaN(qty) || qty <= 0) {
      setTotalCost(0);
      return;
    }

    let unitCost = 0;
    if (type === "seeds" && selectedCrop) {
      const crop =
        cropsData.crops[selectedCrop as keyof typeof cropsData.crops];
      unitCost = crop.baseCost;
    } else if (type === "water") {
      unitCost = 0.02;
    } else if (type === "fertilizer") {
      unitCost = 0.37;
    }

    setTotalCost(qty * unitCost);
  }, [amount, type, selectedCrop]);

  const handlePurchase = () => {
    const qty = Number(amount);
    if (isNaN(qty) || qty <= 0) return;

    let success = false;

    if (type === "seeds" && selectedCrop) {
      success = buySeeds(selectedCrop, qty);
    } else if (type === "water") {
      success = buyWater(qty);
    } else if (type === "fertilizer") {
      success = buyFertilizer(qty);
    }

    if (success) {
      onPurchase(`✅ Purchased ${qty} ${type} for $${totalCost.toFixed(2)}.`);
    } else {
      onPurchase("❌ Insufficient funds!");
    }
  };

  const getUnitCost = () => {
    if (type === "seeds" && selectedCrop)
      return cropsData.crops[selectedCrop as keyof typeof cropsData.crops]
        .baseCost;
    if (type === "water") return 0.2;
    if (type === "fertilizer") return 2;
    return 0;
  };

  const canPurchase =
    Number(amount) > 0 &&
    (type !== "seeds" || (type === "seeds" && selectedCrop));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6 space-y-6 bg-card/95 shadow-xl">
        {/* Title + Question */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">
            {shopTitles[type]}
          </h2>
          <p className="text-lg text-muted-foreground">{displayedText}</p>
        </div>

        {/* Crop Selection for Seeds */}
        {type === "seeds" && (
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(cropsData.crops).map(([id, crop]) => (
              <Button
                key={id}
                variant={selectedCrop === id ? "default" : "outline"}
                onClick={() => setSelectedCrop(id)}
                className="flex flex-col h-auto py-3"
              >
                <span className="text-3xl mb-1">{cropIcons[id]}</span>
                <span className="text-xs">${crop.baseCost.toFixed(2)}</span>
              </Button>
            ))}
          </div>
        )}

        {/* Amount + Cost Summary */}
        {(type !== "seeds" || selectedCrop) && (
          <div className="space-y-3">
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
            />

            <div className="text-sm text-muted-foreground">
              <div>💲 Cost per unit: ${getUnitCost().toFixed(2)}</div>
              <div>🧮 Total cost: ${totalCost.toFixed(2)}</div>
              <div>💰 Your balance: ${money.toFixed(2)}</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-transparent"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={!canPurchase}
            className="flex-1"
          >
            Purchase
          </Button>
        </div>
      </Card>
    </div>
  );
}
