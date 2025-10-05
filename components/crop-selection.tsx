"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky, Float, Text } from "@react-three/drei";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState, useEffect, Suspense } from "react";

export default function CropSelection({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [sceneReady, setSceneReady] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const delay1 = setTimeout(() => setSceneReady(true), 800); // Start rendering scene after 0.8s
    const delay2 = setTimeout(() => setShowButton(true), 3500);
    return () => {
      clearTimeout(delay1);
      clearTimeout(delay2);
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-sky-100 to-green-100 overflow-hidden">
      {/* 3D Scene (lazy rendered) */}
      {sceneReady && (
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center text-green-700 font-semibold text-xl">
              Loading Farm...
            </div>
          }
        >
          <Canvas camera={{ position: [0, 3, 6], fov: 55 }}>
            <ambientLight intensity={0.8} />
            <directionalLight position={[5, 10, 5]} intensity={1.2} />
            <Sky sunPosition={[100, 10, 100]} turbidity={8} />

            {/* Floating Title */}
            <Float speed={2} rotationIntensity={0.4}>
              <Text
                position={[0, 1, 0]}
                fontSize={0.8}
                color="#2e7d32"
                anchorX="center"
                anchorY="middle"
              >
                KrishiPlay
              </Text>
            </Float>

            {/* Grass */}
            <mesh rotation-x={-Math.PI / 2} position={[0, -1, 0]}>
              <planeGeometry args={[20, 20]} />
              <meshStandardMaterial color="#8FBC8F" />
            </mesh>

            {/* Trees */}
            {[...Array(6)].map((_, i) => (
              <group
                key={i}
                position={[Math.random() * 12 - 6, -1, Math.random() * 12 - 6]}
              >
                <mesh>
                  <cylinderGeometry args={[0.1, 0.1, 1]} />
                  <meshStandardMaterial color="#8B4513" />
                </mesh>
                <mesh position={[0, 0.8, 0]}>
                  <sphereGeometry args={[0.5, 16, 16]} />
                  <meshStandardMaterial color="#2E8B57" />
                </mesh>
              </group>
            ))}

            <OrbitControls enableZoom={false} enablePan={false} />
          </Canvas>
        </Suspense>
      )}

      {/* Overlay Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: sceneReady ? 1 : 0, y: sceneReady ? 0 : 20 }}
        transition={{ delay: 1, duration: 1.2, ease: "easeOut" }}
        className="absolute bottom-36 w-full text-center"
      >
        <h2 className="text-3xl md:text-4xl font-extrabold text-green-800 drop-shadow-lg">
          Welcome to Your Virtual Farm 🌾
        </h2>
        <p className="text-gray-700 mt-2 font-medium">
          Experience farming like never before — plant, water, and harvest your
          dream crops! <br />
          Get personalized crop recommendations for your location with{" "}
          <span className="text-green-700 font-semibold">Krishi AI</span>.
        </p>
      </motion.div>

      {/* Start Button */}
      {showButton && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="absolute bottom-16 w-full text-center"
        >
          <Button
            size="lg"
            onClick={onComplete}
            className="px-10 py-3 text-lg bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg cursor-pointer"
          >
            Start Farming 🚜
          </Button>
        </motion.div>
      )}
    </div>
  );
}
