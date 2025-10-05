"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { useGame } from "@/contexts/game-context";
import cropsData from "@/public/crops-data.json";

const GRID_SIZE = 5;
const CELL_SIZE = 10;

export default function Field3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const { field, selectedCrop, plantCrop, inventory } = useGame();

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd1e5);

    const camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(30, 35, 45);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // Orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);
    controls.update();

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(50, 100, 50);
    scene.add(dirLight);

    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(
        GRID_SIZE * CELL_SIZE * 2,
        GRID_SIZE * CELL_SIZE * 2
      ),
      new THREE.MeshStandardMaterial({ color: 0x3b7a3b })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Field group (centered)
    const fieldGroup = new THREE.Group();
    const offset = ((GRID_SIZE - 1) * CELL_SIZE) / 2;
    const tileGeometry = new THREE.BoxGeometry(
      CELL_SIZE - 0.2,
      1,
      CELL_SIZE - 0.2
    );
    const fontLoader = new FontLoader();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    // Base material for field tiles
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x8d5524 });

    // Create field tiles
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const tile = new THREE.Mesh(tileGeometry, baseMaterial.clone());
        tile.position.set(
          col * CELL_SIZE - offset,
          0,
          row * CELL_SIZE - offset
        );
        tile.userData = { row, col };
        fieldGroup.add(tile);
      }
    }
    scene.add(fieldGroup);

    // Crop icons (2D emojis as sprites)
    const textureLoader = new THREE.TextureLoader();
    const emojiTextures: Record<string, THREE.Texture> = {};
    for (const [name, data] of Object.entries(cropsData.crops)) {
      const emojiCanvas = document.createElement("canvas");
      emojiCanvas.width = 128;
      emojiCanvas.height = 128;
      const ctx = emojiCanvas.getContext("2d")!;
      ctx.font = "100px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText((data as any).icon, 64, 64);
      const texture = new THREE.CanvasTexture(emojiCanvas);
      emojiTextures[name] = texture;
    }

    // Create emoji sprites for planted crops
    const createCropSprite = (type: string) => {
      const texture = emojiTextures[type];
      const material = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(4, 4, 1);
      return sprite;
    };

    // Populate initial crops
    const cropSprites: (THREE.Sprite | null)[][] = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(null));

    const updateCrops = () => {
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          const tile = field[row][col];
          const existingSprite = cropSprites[row][col];
          if (tile && !existingSprite) {
            const sprite = createCropSprite(tile.type);
            const tileMesh = fieldGroup.children.find(
              (m: any) => m.userData.row === row && m.userData.col === col
            );
            if (tileMesh) {
              sprite.position.set(tileMesh.position.x, 3, tileMesh.position.z);
              scene.add(sprite);
              cropSprites[row][col] = sprite;
            }
          } else if (!tile && existingSprite) {
            scene.remove(existingSprite);
            cropSprites[row][col] = null;
          }
        }
      }
    };

    updateCrops();

    // Planting handler (click detection)
    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(fieldGroup.children);
      if (intersects.length > 0) {
        const tileMesh = intersects[0].object as THREE.Mesh;
        const { row, col } = tileMesh.userData;
        if (selectedCrop && inventory.seeds[selectedCrop] > 0) {
          plantCrop(row, col, selectedCrop);
          updateCrops();
        }
      }
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);

    // Render loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handling
    const handleResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [field, selectedCrop, inventory]);

  return <div ref={mountRef} className="w-full h-full" />;
}
