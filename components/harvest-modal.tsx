"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGame } from "@/contexts/game-context";
import cropsData from "@/public/crops-data.json";
import * as THREE from "three";

interface HarvestModalProps {
  onClose: () => void;
  onComplete: (message: string) => void;
}

export default function HarvestModal({
  onClose,
  onComplete,
}: HarvestModalProps) {
  const { field, harvestField, applyResources } = useGame();
  const [stage, setStage] = useState<"waiting" | "ready" | "summary">(
    "waiting"
  );
  const [displayedText, setDisplayedText] = useState("");
  const [harvestData, setHarvestData] = useState<
    { crop: string; amount: number; earnings: number }[]
  >([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 🌾 Handle typewriter + growth
  useEffect(() => {
    applyResources();
    const text = "Waiting for crops to grow...";
    let index = 0;
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayedText(text.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
        setTimeout(() => setStage("ready"), 2000);
      }
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // ✨ Simple Three.js floating particle animation (for harvest celebration)
  useEffect(() => {
    if (stage !== "summary" || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    camera.position.z = 5;

    const geometry = new THREE.BufferGeometry();
    const particlesCount = 100;
    const positions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 8;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0xffd700, size: 0.1 });
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    const animate = () => {
      requestAnimationFrame(animate);
      particles.rotation.y += 0.001;
      particles.rotation.x += 0.001;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, [stage]);

  const handleHarvest = () => {
    const yields = harvestField();
    const data: { crop: string; amount: number; earnings: number }[] = [];
    let total = 0;

    Object.entries(yields).forEach(([cropType, amount]) => {
      const crop = cropsData.crops[cropType as keyof typeof cropsData.crops];
      const earnings = amount * crop.marketPrice;
      total += earnings;
      data.push({ crop: crop.name, amount, earnings });
    });

    setHarvestData(data);
    setTotalEarnings(total);
    setStage("summary");
  };

  const handleSell = () => {
    onComplete(`Sold all harvested crops for $${totalEarnings.toFixed(2)}!`);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-green-100/30 to-brown-200/30 backdrop-blur-lg flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl p-8 relative overflow-hidden bg-card/95 shadow-xl border border-green-300/30 rounded-2xl">
        {/* Canvas for celebration particles */}
        {stage === "summary" && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none opacity-60"
          />
        )}

        {/* WAITING STATE */}
        {stage === "waiting" && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xl text-foreground typewriter">
              {displayedText}
            </p>
          </div>
        )}

        {/* READY TO HARVEST */}
        {stage === "ready" && (
          <div className="text-center space-y-6 animate-fadeIn">
            <div className="text-6xl animate-bounce">🌾</div>
            <h2 className="text-3xl font-bold text-green-700">
              Ready to Harvest!
            </h2>
            <p className="text-muted-foreground">
              Your crops have matured and are ready for collection.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleHarvest}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Harvest Now
              </Button>
            </div>
          </div>
        )}

        {/* HARVEST SUMMARY */}
        {stage === "summary" && (
          <div className="relative z-10 text-center space-y-8 animate-fadeIn">
            <div className="text-5xl">💰</div>
            <h2 className="text-3xl font-bold text-green-700">
              Harvest Summary
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {harvestData.map((item, i) => (
                <div
                  key={i}
                  className="p-4 bg-green-50 border border-green-200 rounded-xl shadow-sm transition transform hover:scale-105"
                >
                  <h3 className="text-lg font-semibold text-green-800">
                    {item.crop}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.amount.toFixed(1)} kg
                  </p>
                  <p className="font-bold text-green-700 mt-1">
                    ${item.earnings.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Total Earnings</h3>
              <p className="text-3xl font-extrabold text-green-700">
                ${totalEarnings.toFixed(2)}
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button
                onClick={handleSell}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              >
                Sell All 🚜
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
