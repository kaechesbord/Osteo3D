import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { MaterialLibrary, createContactShadowTexture } from '../three/proceduralMaterials';
import { buildCompleteSkeleton, BoneMeshRecord } from '../three/proceduralBones';
import { sound } from '../audio/soundEffects';

interface SkeletalCanvasProps {
  selectedBoneId: string | null;
  hoveredBoneId: string | null;
  highlightedBoneId: string | null; // For quiz target or academy lesson highlight
  quizFlashState: 'correct' | 'incorrect' | null;
  explodedFactor: number; // 0.0 (assembled) to 1.0 (fully disarticulated)
  soloMode: boolean; // Solo study mode isolates single bone
  cameraCommand: {
    target: [number, number, number];
    position: [number, number, number];
    token: number;
  } | null;
  onSelectBone: (boneId: string | null) => void;
  onHoverBone: (boneId: string | null) => void;
}

export const SkeletalCanvas: React.FC<SkeletalCanvasProps> = ({
  selectedBoneId,
  hoveredBoneId,
  highlightedBoneId,
  quizFlashState,
  explodedFactor,
  soloMode,
  cameraCommand,
  onSelectBone,
  onHoverBone,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const boneRecordsRef = useRef<Map<string, BoneMeshRecord> | null>(null);
  const materialsRef = useRef<MaterialLibrary | null>(null);
  const animFrameIdRef = useRef<number>(0);

  // Camera damping state
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.5, 9.2));
  const targetCamLook = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const isTransitioningCam = useRef<boolean>(false);

  // Refs for current props to avoid tearing down loop
  const propsRef = useRef({
    selectedBoneId,
    hoveredBoneId,
    highlightedBoneId,
    quizFlashState,
    explodedFactor,
    soloMode,
    onSelectBone,
    onHoverBone,
  });

  useEffect(() => {
    propsRef.current = {
      selectedBoneId,
      hoveredBoneId,
      highlightedBoneId,
      quizFlashState,
      explodedFactor,
      soloMode,
      onSelectBone,
      onHoverBone,
    };
  }, [selectedBoneId, hoveredBoneId, highlightedBoneId, quizFlashState, explodedFactor, soloMode, onSelectBone, onHoverBone]);

  // Respond to camera move commands
  useEffect(() => {
    if (cameraCommand && cameraRef.current && controlsRef.current) {
      targetCamPos.current.set(...cameraCommand.position);
      targetCamLook.current.set(...cameraCommand.target);
      isTransitioningCam.current = true;
    }
  }, [cameraCommand]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Detect software WebGL as instructed by Three.js skill
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Initialize Three.js Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x020617);
    scene.fog = new THREE.FogExp2(0x020617, 0.038);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.5, 9.2);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    rendererRef.current = renderer;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Studio Environment Lighting (PMREM + RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio 3-Point Light Rig
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x0f172a, 0.85);
    scene.add(hemiLight);

    // Warm Directional Key Light
    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.8);
    keyLight.position.set(5, 8, 6);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.camera.left = -5;
    keyLight.shadow.camera.right = 5;
    keyLight.shadow.camera.top = 7;
    keyLight.shadow.camera.bottom = -7;
    scene.add(keyLight);

    // Cool Rim / Back Light
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(-5, 4, -5);
    scene.add(rimLight);

    // Front soft fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(0, 0, 5);
    scene.add(fillLight);

    // Radial Contact Shadow Plane on ground
    const shadowTex = createContactShadowTexture();
    const shadowGeo = new THREE.PlaneGeometry(6.5, 6.5);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -5.55;
    scene.add(shadowMesh);

    // Orbit Controls with damping
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxDistance = 22;
    controls.minDistance = 1.2;
    controls.maxPolarAngle = Math.PI / 2 + 0.15;
    controls.target.set(0, 0, 0);

    // User interaction cancels automated camera animations
    controls.addEventListener('start', () => {
      isTransitioningCam.current = false;
    });

    // Material Library & Procedural Bones
    const materials = new MaterialLibrary();
    materialsRef.current = materials;

    const { skeletonRoot, boneRecords } = buildCompleteSkeleton(materials);
    boneRecordsRef.current = boneRecords;
    scene.add(skeletonRoot);

    // Raycaster for Hover & Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function getIntersectedBoneId(clientX: number, clientY: number): string | null {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(skeletonRoot.children, true);

      for (const hit of intersects) {
        let curr: THREE.Object3D | null = hit.object;
        while (curr && curr !== skeletonRoot) {
          if (curr.userData && curr.userData.boneId) {
            return curr.userData.boneId;
          }
          curr = curr.parent;
        }
      }
      return null;
    }

    let lastHovered: string | null = null;
    const onPointerMove = (e: MouseEvent) => {
      const boneId = getIntersectedBoneId(e.clientX, e.clientY);
      if (boneId !== lastHovered) {
        lastHovered = boneId;
        container.style.cursor = boneId ? 'pointer' : 'default';
        propsRef.current.onHoverBone(boneId);
      }
    };

    let pointerDownPos = { x: 0, y: 0 };
    const onPointerDown = (e: MouseEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: MouseEvent) => {
      const dx = Math.abs(e.clientX - pointerDownPos.x);
      const dy = Math.abs(e.clientY - pointerDownPos.y);
      // Treat as click only if not a drag rotate
      if (dx < 5 && dy < 5) {
        const boneId = getIntersectedBoneId(e.clientX, e.clientY);
        propsRef.current.onSelectBone(boneId);
        if (boneId) {
          sound.playClick();
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointermove', onPointerMove);
    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointerup', onPointerUp);

    // Resize Handler
    const onResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop
    let lastTime = performance.now();
    const tempVec = new THREE.Vector3();

    const tick = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Camera Damping Transition
      if (isTransitioningCam.current && cameraRef.current && controlsRef.current) {
        cameraRef.current.position.lerp(targetCamPos.current, 0.08);
        controlsRef.current.target.lerp(targetCamLook.current, 0.08);

        if (
          cameraRef.current.position.distanceTo(targetCamPos.current) < 0.05 &&
          controlsRef.current.target.distanceTo(targetCamLook.current) < 0.05
        ) {
          isTransitioningCam.current = false;
        }
      }

      controls.update();

      // Disarticulation Position Interpolation
      const currentFactor = propsRef.current.explodedFactor;
      const selId = propsRef.current.selectedBoneId;
      const hovId = propsRef.current.hoveredBoneId;
      const highId = propsRef.current.highlightedBoneId;
      const quizFlash = propsRef.current.quizFlashState;
      const solo = propsRef.current.soloMode;

      if (boneRecordsRef.current) {
        boneRecordsRef.current.forEach((record) => {
          // Calculate target position based on disarticulation vector
          tempVec.copy(record.defaultPosition).addScaledVector(record.disarticulateVector, currentFactor);

          // Smoothly glide bone into position
          record.group.position.lerp(tempVec, 0.12);

          // Material highlighting state
          const isSelected = record.id === selId;
          const isHovered = record.id === hovId;
          const isHighlighted = record.id === highId;

          // Solo inspection rotation
          if (solo && isSelected) {
            record.group.rotation.y += 0.008;
          } else {
            record.group.rotation.set(0, 0, 0);
          }

          // Apply appropriate material
          record.group.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              if (quizFlash && (isSelected || isHighlighted)) {
                mesh.material = quizFlash === 'correct' ? materials.quizCorrectMaterial : materials.quizIncorrectMaterial;
              } else if (isSelected) {
                mesh.material = materials.selectedMaterial;
              } else if (isHighlighted) {
                mesh.material = materials.selectedMaterial;
              } else if (isHovered) {
                mesh.material = materials.hoveredMaterial;
              } else if (solo) {
                mesh.material = materials.dimmedMaterial;
              } else {
                // Restore original standard bone or cartilage material
                const orig = record.originalMaterials.get(mesh);
                if (orig) mesh.material = orig;
              }
            }
          });
        });
      }

      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(tick);
    };

    animFrameIdRef.current = requestAnimationFrame(tick);

    // Cleanup
    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', onResize);
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointerup', onPointerUp);

      controls.dispose();
      materials.dispose();
      renderer.dispose();

      if (dom.parentElement) {
        dom.parentElement.removeChild(dom);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden select-none outline-none"
    />
  );
};
