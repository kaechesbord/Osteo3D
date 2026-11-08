import * as THREE from 'three';

// Procedural Bone Texture Generation using 2D Canvas
export function createProceduralBoneTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const size = 512;

  // 1. Color / Albedo Map
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d')!;

  // Base ivory bone gradient
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#f9f6ef');
  grad.addColorStop(0.5, '#eee7d8');
  grad.addColorStop(1, '#e3d9c3');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Subtle natural osteon rings & porous micro-texture
  const numOsteons = 80;
  for (let i = 0; i < numOsteons; i++) {
    const ox = Math.random() * size;
    const oy = Math.random() * size;
    const radius = 2 + Math.random() * 8;
    ctx.strokeStyle = 'rgba(180, 165, 140, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(ox, oy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Central Haversian canal dot
    ctx.fillStyle = 'rgba(140, 125, 100, 0.22)';
    ctx.beginPath();
    ctx.arc(ox, oy, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fine organic micro-speckle
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 12;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  const colorTexture = new THREE.CanvasTexture(colorCanvas);
  colorTexture.wrapS = THREE.RepeatWrapping;
  colorTexture.wrapT = THREE.RepeatWrapping;
  colorTexture.colorSpace = THREE.SRGBColorSpace;
  colorTexture.repeat.set(2, 2);

  // 2. Linear Bump / Height Map
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 256;
  bumpCanvas.height = 256;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 256, 256);

  // Fibrous lines along bone grain
  bCtx.strokeStyle = '#909090';
  bCtx.lineWidth = 1.5;
  for (let i = 0; i < 60; i++) {
    const y = Math.random() * 256;
    bCtx.beginPath();
    bCtx.moveTo(0, y);
    bCtx.bezierCurveTo(80, y + (Math.random() - 0.5) * 10, 180, y + (Math.random() - 0.5) * 10, 256, y);
    bCtx.stroke();
  }

  const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
  bumpTexture.wrapS = THREE.RepeatWrapping;
  bumpTexture.wrapT = THREE.RepeatWrapping;
  bumpTexture.repeat.set(2, 2);

  return { map: colorTexture, bumpMap: bumpTexture };
}

// Procedural Radial Contact Shadow Texture
export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const rad = size / 2;
  const grad = ctx.createRadialGradient(rad, rad, 0, rad, rad, rad);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  grad.addColorStop(0.35, 'rgba(2, 6, 23, 0.45)');
  grad.addColorStop(0.75, 'rgba(2, 6, 23, 0.15)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Material Library Factory
export class MaterialLibrary {
  public boneMaterial: THREE.MeshStandardMaterial;
  public cartilageMaterial: THREE.MeshStandardMaterial;
  public selectedMaterial: THREE.MeshStandardMaterial;
  public hoveredMaterial: THREE.MeshStandardMaterial;
  public quizCorrectMaterial: THREE.MeshStandardMaterial;
  public quizIncorrectMaterial: THREE.MeshStandardMaterial;
  public dimmedMaterial: THREE.MeshStandardMaterial;

  constructor() {
    const { map, bumpMap } = createProceduralBoneTexture();

    // Standard high-quality PBR bone material
    this.boneMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f0e3,
      map: map,
      bumpMap: bumpMap,
      bumpScale: 0.015,
      roughness: 0.38,
      metalness: 0.05,
    });

    // Costal Cartilage & Articular joint facets
    this.cartilageMaterial = new THREE.MeshStandardMaterial({
      color: 0x98c5d9,
      roughness: 0.25,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88,
    });

    // Highlight: Selected Bone
    this.selectedMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.2,
    });

    // Highlight: Hovered Bone
    this.hoveredMaterial = new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      emissive: 0x0369a1,
      emissiveIntensity: 0.25,
      roughness: 0.3,
      metalness: 0.1,
    });

    // Quiz: Correct answer flash
    this.quizCorrectMaterial = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x059669,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.1,
    });

    // Quiz: Incorrect answer flash
    this.quizIncorrectMaterial = new THREE.MeshStandardMaterial({
      color: 0xfb7185,
      emissive: 0xe11d48,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.1,
    });

    // Dimmed material for non-selected bones when in Solo inspection mode
    this.dimmedMaterial = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.8,
      metalness: 0.0,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    });
  }

  public dispose() {
    this.boneMaterial.map?.dispose();
    this.boneMaterial.bumpMap?.dispose();
    this.boneMaterial.dispose();
    this.cartilageMaterial.dispose();
    this.selectedMaterial.dispose();
    this.hoveredMaterial.dispose();
    this.quizCorrectMaterial.dispose();
    this.quizIncorrectMaterial.dispose();
    this.dimmedMaterial.dispose();
  }
}
