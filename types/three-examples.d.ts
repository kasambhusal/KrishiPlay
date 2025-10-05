declare module 'three/examples/jsm/controls/OrbitControls' {
  import { Camera } from 'three';
  export class OrbitControls {
    constructor(object: Camera, domElement?: HTMLElement | null);
    enabled: boolean;
    target: import('three').Vector3;
    minDistance: number;
    maxDistance: number;
    rotateSpeed: number;
    zoomSpeed: number;
    panSpeed: number;
    update(): void;
    dispose(): void;
    saveState(): void;
    reset(): void;
    // allow any other members
    [key: string]: any;
  }
  export { OrbitControls };
}

declare module 'three/examples/jsm/loaders/FontLoader' {
  import { Font } from 'three/examples/jsm/loaders/FontLoader';
  export class FontLoader {
    constructor();
    load(url: string, onLoad: (font: any) => void, onProgress?: (event: ProgressEvent) => void, onError?: (event: ErrorEvent) => void): void;
    parse(json: any): any;
  }
  export { FontLoader };
}
