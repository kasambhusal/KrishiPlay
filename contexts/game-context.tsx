"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import cropsData from "@/public/crops-data.json";

interface CropCell {
  type: string;
  growthStage: number;
  waterApplied: number;
  fertilizerApplied: number;
}

interface Inventory {
  seeds: Record<string, number>;
  water: number;
  fertilizer: number;
}

interface WeatherData {
  temperature: number;
  precipitation: number;
}

interface GameContextType {
  field: (CropCell | null)[][];
  inventory: Inventory;
  money: number;
  selectedCrop: string | null;
  weatherData: WeatherData | null;
  canHarvest: boolean;
  setSelectedCrop: (crop: string | null) => void;
  plantCrop: (row: number, col: number, cropType: string) => void;
  addSeedsToInventory: (cropType: string, amount: number) => void;
  buySeeds: (cropType: string, amount: number) => boolean;
  buyWater: (amount: number) => boolean;
  buyFertilizer: (amount: number) => boolean;
  applyResources: () => void;
  harvestField: () => Record<string, number>;
  setWeatherData: (data: WeatherData) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [field, setField] = useState<(CropCell | null)[][]>(
    Array(5)
      .fill(null)
      .map(() => Array(5).fill(null))
  );
  const [inventory, setInventory] = useState<Inventory>({
    seeds: {},
    water: 0,
    fertilizer: 0,
  });
  const [money, setMoney] = useState(300); // Starting money
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  const plantCrop = (row: number, col: number, cropType: string) => {
    if (field[row][col] !== null) return;
    if ((inventory.seeds[cropType] || 0) <= 0) return;

    const newField = field.map((r) => [...r]);
    newField[row][col] = {
      type: cropType,
      growthStage: 0,
      waterApplied: 0,
      fertilizerApplied: 0,
    };
    setField(newField);

    setInventory((prev) => ({
      ...prev,
      seeds: {
        ...prev.seeds,
        [cropType]: (prev.seeds[cropType] || 0) - 1,
      },
    }));
  };

  const addSeedsToInventory = (cropType: string, amount: number) => {
    setInventory((prev) => ({
      ...prev,
      seeds: {
        ...prev.seeds,
        [cropType]: (prev.seeds[cropType] || 0) + amount,
      },
    }));
  };

  const buySeeds = (cropType: string, amount: number): boolean => {
    const cropData = cropsData.crops[cropType as keyof typeof cropsData.crops];
    const cost = cropData.baseCost * amount;

    if (money >= cost) {
      setMoney((prev) => prev - cost);
      addSeedsToInventory(cropType, amount);
      return true;
    }
    return false;
  };

  const buyWater = (amount: number): boolean => {
    const cost = 0.2 * amount;
    if (money >= cost) {
      setMoney((prev) => prev - cost);
      setInventory((prev) => ({ ...prev, water: prev.water + amount }));
      return true;
    }
    return false;
  };

  const buyFertilizer = (amount: number): boolean => {
    const cost = 2 * amount;
    if (money >= cost) {
      setMoney((prev) => prev - cost);
      setInventory((prev) => ({
        ...prev,
        fertilizer: prev.fertilizer + amount,
      }));
      return true;
    }
    return false;
  };

  // Helper: compute totals for current planted crops
  const computeTotals = (fld: (CropCell | null)[][]) =>
    fld.flat().reduce(
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

  const applyResources = () => {
    const planted = field.flat().filter(Boolean) as CropCell[];
    if (planted.length === 0) return;

    // compute numeric totals (do NOT use toFixed here)
    const { water: totalWaterNeeded, fertilizer: totalFertilizerNeeded } =
      computeTotals(field);

    // require full amounts to apply (you can change this to partial apply logic if you prefer)
    if (
      inventory.water < totalWaterNeeded ||
      inventory.fertilizer < totalFertilizerNeeded
    ) {
      // Not enough resources — do nothing (or you could partial-apply)
      return;
    }

    // subtract (use functional update to avoid stale closure), keep numeric and round to 1 decimal
    setInventory((prev) => {
      const newWater = Math.max(
        0,
        Number((prev.water - totalWaterNeeded).toFixed(1))
      );
      const newFertilizer = Math.max(
        0,
        Number((prev.fertilizer - totalFertilizerNeeded).toFixed(1))
      );
      return { ...prev, water: newWater, fertilizer: newFertilizer };
    });

    // mark water/fertilizer applied and grow each crop to final stage
    setField((prevField) =>
      prevField.map((row) =>
        row.map((cell) => {
          if (!cell) return null;
          const cropData =
            cropsData.crops[cell.type as keyof typeof cropsData.crops];
          const addedWater = cropData.waterNeed;
          const addedFertilizer = cropData.fertilizerNeed;

          return {
            ...cell,
            waterApplied: Number((cell.waterApplied + addedWater).toFixed(1)),
            fertilizerApplied: Number(
              (cell.fertilizerApplied + addedFertilizer).toFixed(1)
            ),
            // grow to final stage (use cropData.growthStages if you prefer)
            growthStage: cropData.growthStages ?? 4,
          };
        })
      )
    );
  };

  const harvestField = (): Record<string, number> => {
    const yields: Record<string, number> = {};
    let totalEarnings = 0;

    field.flat().forEach((cell) => {
      if (cell && cell.growthStage === 4) {
        const cropData =
          cropsData.crops[cell.type as keyof typeof cropsData.crops];
        yields[cell.type] = (yields[cell.type] || 0) + cropData.yieldPerPlant;
        totalEarnings += cropData.yieldPerPlant * cropData.marketPrice;
      }
    });

    setMoney((prev) => prev + totalEarnings);
    setField(
      Array(5)
        .fill(null)
        .map(() => Array(5).fill(null))
    );

    return yields;
  };

  // compute whether a harvest is possible (fields filled AND enough resources)
  const totalsNow = computeTotals(field);
  const canHarvest =
    field.flat().every((cell) => cell !== null) &&
    inventory.water >= totalsNow.water &&
    inventory.fertilizer >= totalsNow.fertilizer;

  return (
    <GameContext.Provider
      value={{
        field,
        inventory,
        money,
        selectedCrop,
        weatherData,
        canHarvest,
        setSelectedCrop,
        plantCrop,
        addSeedsToInventory,
        buySeeds,
        buyWater,
        buyFertilizer,
        applyResources,
        harvestField,
        setWeatherData,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within GameProvider");
  }
  return context;
}
