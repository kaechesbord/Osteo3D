import * as THREE from 'three';
import { MaterialLibrary } from './proceduralMaterials';
import { BONES_DATA } from '../data/skeletonData';

export interface BoneMeshRecord {
  id: string;
  group: THREE.Group;
  defaultPosition: THREE.Vector3;
  disarticulateVector: THREE.Vector3;
  targetPosition: THREE.Vector3;
  originalMaterials: Map<THREE.Mesh, THREE.Material | THREE.Material[]>;
}

// Helper to create smooth curved tube geometry
function createTube(points: THREE.Vector3[], radius: number, radialSegments: number = 8, tubularSegments: number = 24): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
}

export function buildCompleteSkeleton(materials: MaterialLibrary): {
  skeletonRoot: THREE.Group;
  boneRecords: Map<string, BoneMeshRecord>;
} {
  const skeletonRoot = new THREE.Group();
  skeletonRoot.name = 'HumanSkeleton';
  const boneRecords = new Map<string, BoneMeshRecord>();

  const boneDataMap = new Map(BONES_DATA.map(b => [b.id, b]));

  function registerBone(id: string, group: THREE.Group) {
    const data = boneDataMap.get(id);
    const defPos = data ? new THREE.Vector3(...data.defaultPosition) : group.position.clone();
    const disVec = data ? new THREE.Vector3(...data.disarticulateVector) : new THREE.Vector3(0, 0, 0);

    group.position.copy(defPos);
    group.userData = {
      boneId: id,
      name: data ? data.name : id,
      defaultPosition: defPos.clone(),
      disarticulateVector: disVec.clone(),
    };

    const originalMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.boneId = id;
        originalMaterials.set(mesh, mesh.material);
      }
    });

    boneRecords.set(id, {
      id,
      group,
      defaultPosition: defPos.clone(),
      disarticulateVector: disVec.clone(),
      targetPosition: defPos.clone(),
      originalMaterials,
    });

    skeletonRoot.add(group);
  }

  // ==========================================
  // 1. CRANIUM (Skull Vault & Facial Skeleton)
  // ==========================================
  const craniumGroup = new THREE.Group();
  craniumGroup.name = 'Cranium';
  {
    // Neurocranium Braincase Vault (Egg/spherical composite)
    const vaultGeo = new THREE.SphereGeometry(0.55, 32, 24);
    vaultGeo.scale(0.85, 0.95, 1.05);
    const vaultMesh = new THREE.Mesh(vaultGeo, materials.boneMaterial);
    vaultMesh.position.set(0, 0.15, -0.05);
    craniumGroup.add(vaultMesh);

    // Frontal Brow / Supraorbital ridges
    const browGeo = new THREE.BoxGeometry(0.68, 0.14, 0.22);
    const browMesh = new THREE.Mesh(browGeo, materials.boneMaterial);
    browMesh.position.set(0, 0.08, 0.44);
    craniumGroup.add(browMesh);

    // Orbit rings (Left & Right eye sockets)
    [-0.2, 0.2].forEach(x => {
      const orbitRingGeo = new THREE.TorusGeometry(0.12, 0.035, 12, 24);
      const orbitRingMesh = new THREE.Mesh(orbitRingGeo, materials.boneMaterial);
      orbitRingMesh.position.set(x, -0.02, 0.46);
      craniumGroup.add(orbitRingMesh);

      // Dark orbital cavity interior
      const cavGeo = new THREE.SphereGeometry(0.09, 16, 12);
      const cavMat = new THREE.MeshStandardMaterial({ color: 0x1e1b18, roughness: 0.9 });
      const cavMesh = new THREE.Mesh(cavGeo, cavMat);
      cavMesh.position.set(x, -0.02, 0.42);
      cavMesh.scale.set(1, 1, 0.6);
      craniumGroup.add(cavMesh);
    });

    // Nasal bridge & piriform aperture
    const noseGeo = new THREE.ConeGeometry(0.08, 0.22, 5);
    noseGeo.rotateX(Math.PI);
    const noseMesh = new THREE.Mesh(noseGeo, materials.boneMaterial);
    noseMesh.position.set(0, -0.08, 0.52);
    craniumGroup.add(noseMesh);

    // Zygomatic arches (cheekbones)
    [-0.34, 0.34].forEach(x => {
      const archPoints = [
        new THREE.Vector3(x * 0.7, -0.08, 0.42),
        new THREE.Vector3(x, -0.1, 0.2),
        new THREE.Vector3(x * 0.9, -0.05, -0.1),
      ];
      const archGeo = createTube(archPoints, 0.03, 8, 12);
      const archMesh = new THREE.Mesh(archGeo, materials.boneMaterial);
      craniumGroup.add(archMesh);
    });

    // Maxilla (Upper jaw with dental arch)
    const maxillaGeo = new THREE.BoxGeometry(0.44, 0.2, 0.28);
    const maxillaMesh = new THREE.Mesh(maxillaGeo, materials.boneMaterial);
    maxillaMesh.position.set(0, -0.22, 0.38);
    craniumGroup.add(maxillaMesh);

    // Occipital Condyles Base (articulating with Atlas)
    const baseGeo = new THREE.CylinderGeometry(0.18, 0.24, 0.16, 16);
    const baseMesh = new THREE.Mesh(baseGeo, materials.boneMaterial);
    baseMesh.position.set(0, -0.28, -0.12);
    craniumGroup.add(baseMesh);
  }
  registerBone('cranium', craniumGroup);

  // ==========================================
  // 2. MANDIBLE (Lower Jaw)
  // ==========================================
  const mandibleGroup = new THREE.Group();
  mandibleGroup.name = 'Mandible';
  {
    // Horseshoe mandibular body
    const bodyPoints = [
      new THREE.Vector3(-0.24, 0.08, -0.05),
      new THREE.Vector3(-0.22, -0.05, 0.18),
      new THREE.Vector3(0, -0.08, 0.3), // Chin
      new THREE.Vector3(0.22, -0.05, 0.18),
      new THREE.Vector3(0.24, 0.08, -0.05),
    ];
    const bodyGeo = createTube(bodyPoints, 0.05, 8, 20);
    const bodyMesh = new THREE.Mesh(bodyGeo, materials.boneMaterial);
    mandibleGroup.add(bodyMesh);

    // Mental protuberance (Chin prominence)
    const chinGeo = new THREE.BoxGeometry(0.14, 0.1, 0.08);
    const chinMesh = new THREE.Mesh(chinGeo, materials.boneMaterial);
    chinMesh.position.set(0, -0.08, 0.31);
    mandibleGroup.add(chinMesh);

    // Ascending rami & condyles (articulating with cranium TMJ)
    [-0.24, 0.24].forEach(x => {
      // Ramus
      const ramusGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.24, 8);
      const ramusMesh = new THREE.Mesh(ramusGeo, materials.boneMaterial);
      ramusMesh.position.set(x, 0.06, -0.04);
      ramusMesh.rotation.x = 0.2;
      mandibleGroup.add(ramusMesh);

      // Condyle head
      const condyleGeo = new THREE.SphereGeometry(0.045, 12, 10);
      condyleGeo.scale(1.2, 0.7, 0.8);
      const condyleMesh = new THREE.Mesh(condyleGeo, materials.cartilageMaterial);
      condyleMesh.position.set(x, 0.18, -0.08);
      mandibleGroup.add(condyleMesh);

      // Coronoid process
      const coronoidGeo = new THREE.ConeGeometry(0.035, 0.1, 6);
      const coronoidMesh = new THREE.Mesh(coronoidGeo, materials.boneMaterial);
      coronoidMesh.position.set(x * 0.95, 0.14, 0.02);
      mandibleGroup.add(coronoidMesh);
    });
  }
  registerBone('mandible', mandibleGroup);

  // ==========================================
  // 3. CERVICAL SPINE (C1 - C7)
  // ==========================================
  const cervicalGroup = new THREE.Group();
  cervicalGroup.name = 'CervicalSpine';
  {
    for (let i = 0; i < 7; i++) {
      const y = (3 - i) * 0.075;
      const vertSubGroup = new THREE.Group();
      vertSubGroup.position.set(0, y, 0);

      // Vertebral body (small, oval)
      const bodyGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.045, 12);
      const bodyMesh = new THREE.Mesh(bodyGeo, materials.boneMaterial);
      vertSubGroup.add(bodyMesh);

      // Bifid spinous process (pointing backward)
      const spinousGeo = new THREE.BoxGeometry(0.035, 0.03, 0.12);
      const spinousMesh = new THREE.Mesh(spinousGeo, materials.boneMaterial);
      spinousMesh.position.set(0, 0, -0.1);
      spinousMesh.rotation.x = -0.15;
      vertSubGroup.add(spinousMesh);

      // Transverse processes with transverse foramina
      [-0.14, 0.14].forEach(x => {
        const transGeo = new THREE.BoxGeometry(0.06, 0.03, 0.04);
        const transMesh = new THREE.Mesh(transGeo, materials.boneMaterial);
        transMesh.position.set(x, 0, -0.02);
        vertSubGroup.add(transMesh);
      });

      // Intervertebral disc (cartilage)
      if (i < 6) {
        const discGeo = new THREE.CylinderGeometry(0.115, 0.115, 0.02, 12);
        const discMesh = new THREE.Mesh(discGeo, materials.cartilageMaterial);
        discMesh.position.set(0, -0.035, 0);
        vertSubGroup.add(discMesh);
      }

      cervicalGroup.add(vertSubGroup);
    }
  }
  registerBone('cervical_spine', cervicalGroup);

  // ==========================================
  // 4. THORACIC SPINE (T1 - T12)
  // ==========================================
  const thoracicGroup = new THREE.Group();
  thoracicGroup.name = 'ThoracicSpine';
  {
    for (let i = 0; i < 12; i++) {
      const y = (5.5 - i) * 0.11;
      const vertSubGroup = new THREE.Group();
      vertSubGroup.position.set(0, y, 0);

      // Heart-shaped vertebral body
      const bodyGeo = new THREE.CylinderGeometry(0.15, 0.16, 0.07, 14);
      bodyGeo.scale(1.0, 1.0, 1.15);
      const bodyMesh = new THREE.Mesh(bodyGeo, materials.boneMaterial);
      vertSubGroup.add(bodyMesh);

      // Long downward-sloping spinous process
      const spinousGeo = new THREE.CylinderGeometry(0.02, 0.035, 0.18, 6);
      const spinousMesh = new THREE.Mesh(spinousGeo, materials.boneMaterial);
      spinousMesh.position.set(0, -0.05, -0.14);
      spinousMesh.rotation.x = 0.75; // Angled steeply downward
      vertSubGroup.add(spinousMesh);

      // Transverse costal facets for ribs
      [-0.18, 0.18].forEach(x => {
        const transGeo = new THREE.BoxGeometry(0.08, 0.04, 0.06);
        const transMesh = new THREE.Mesh(transGeo, materials.boneMaterial);
        transMesh.position.set(x, 0.01, -0.06);
        vertSubGroup.add(transMesh);
      });

      // Thoracic disc
      if (i < 11) {
        const discGeo = new THREE.CylinderGeometry(0.145, 0.145, 0.025, 12);
        const discMesh = new THREE.Mesh(discGeo, materials.cartilageMaterial);
        discMesh.position.set(0, -0.05, 0);
        vertSubGroup.add(discMesh);
      }

      thoracicGroup.add(vertSubGroup);
    }
  }
  registerBone('thoracic_spine', thoracicGroup);

  // ==========================================
  // 5. LUMBAR SPINE (L1 - L5)
  // ==========================================
  const lumbarGroup = new THREE.Group();
  lumbarGroup.name = 'LumbarSpine';
  {
    for (let i = 0; i < 5; i++) {
      const y = (2 - i) * 0.145;
      const vertSubGroup = new THREE.Group();
      vertSubGroup.position.set(0, y, 0);

      // Massive kidney-shaped vertebral body
      const bodyGeo = new THREE.CylinderGeometry(0.22, 0.23, 0.09, 16);
      bodyGeo.scale(1.2, 1.0, 0.95);
      const bodyMesh = new THREE.Mesh(bodyGeo, materials.boneMaterial);
      vertSubGroup.add(bodyMesh);

      // Thick, blunt rectangular spinous process
      const spinousGeo = new THREE.BoxGeometry(0.04, 0.075, 0.16);
      const spinousMesh = new THREE.Mesh(spinousGeo, materials.boneMaterial);
      spinousMesh.position.set(0, 0, -0.15);
      vertSubGroup.add(spinousMesh);

      // Sturdy transverse processes
      [-0.24, 0.24].forEach(x => {
        const transGeo = new THREE.BoxGeometry(0.1, 0.035, 0.04);
        const transMesh = new THREE.Mesh(transGeo, materials.boneMaterial);
        transMesh.position.set(x, 0, -0.04);
        vertSubGroup.add(transMesh);
      });

      // Thick lumbar shock-absorbing disc
      if (i < 4) {
        const discGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.035, 14);
        const discMesh = new THREE.Mesh(discGeo, materials.cartilageMaterial);
        discMesh.position.set(0, -0.065, 0);
        vertSubGroup.add(discMesh);
      }

      lumbarGroup.add(vertSubGroup);
    }
  }
  registerBone('lumbar_spine', lumbarGroup);

  // ==========================================
  // 6. SACRUM & COCCYX
  // ==========================================
  const sacrumGroup = new THREE.Group();
  sacrumGroup.name = 'SacrumCoccyx';
  {
    // Sacral inverted triangular body with forward concavity
    const sacrumGeo = new THREE.ConeGeometry(0.3, 0.45, 8);
    sacrumGeo.rotateX(Math.PI);
    sacrumGeo.scale(1.2, 1.0, 0.6);
    const sacrumMesh = new THREE.Mesh(sacrumGeo, materials.boneMaterial);
    sacrumMesh.position.set(0, 0.12, 0);
    sacrumMesh.rotation.x = -0.3; // Natural lordotic/kyphotic tilt
    sacrumGroup.add(sacrumMesh);

    // Median sacral crest (fused spinous processes)
    const crestGeo = new THREE.BoxGeometry(0.04, 0.38, 0.08);
    const crestMesh = new THREE.Mesh(crestGeo, materials.boneMaterial);
    crestMesh.position.set(0, 0.14, -0.12);
    sacrumGroup.add(crestMesh);

    // Coccyx (tailbone: 4 tiny fused segments)
    const coccyxPoints = [
      new THREE.Vector3(0, -0.12, -0.04),
      new THREE.Vector3(0, -0.18, -0.02),
      new THREE.Vector3(0, -0.24, 0.02),
      new THREE.Vector3(0, -0.28, 0.05),
    ];
    const coccyxGeo = createTube(coccyxPoints, 0.035, 6, 8);
    const coccyxMesh = new THREE.Mesh(coccyxGeo, materials.boneMaterial);
    sacrumGroup.add(coccyxMesh);
  }
  registerBone('sacrum_coccyx', sacrumGroup);

  // ==========================================
  // 7. STERNUM (Breastbone)
  // ==========================================
  const sternumGroup = new THREE.Group();
  sternumGroup.name = 'Sternum';
  {
    // Manubrium (Shield with jugular notch)
    const manubriumGeo = new THREE.BoxGeometry(0.24, 0.18, 0.045);
    const manubriumMesh = new THREE.Mesh(manubriumGeo, materials.boneMaterial);
    manubriumMesh.position.set(0, 0.35, 0.015);
    sternumGroup.add(manubriumMesh);

    // Sternal Angle of Louis transverse ridge
    const angleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.22, 8);
    angleGeo.rotateZ(Math.PI / 2);
    const angleMesh = new THREE.Mesh(angleGeo, materials.boneMaterial);
    angleMesh.position.set(0, 0.25, 0.02);
    sternumGroup.add(angleMesh);

    // Sternal Body (Gladiolus with segmental ridges)
    const bodyGeo = new THREE.BoxGeometry(0.17, 0.48, 0.04);
    const bodyMesh = new THREE.Mesh(bodyGeo, materials.boneMaterial);
    bodyMesh.position.set(0, 0.0, 0.0);
    sternumGroup.add(bodyMesh);

    // Xiphoid Process (Pointed cartilaginous bottom)
    const xiphoidGeo = new THREE.ConeGeometry(0.045, 0.12, 6);
    xiphoidGeo.rotateX(Math.PI);
    const xiphoidMesh = new THREE.Mesh(xiphoidGeo, materials.cartilageMaterial);
    xiphoidMesh.position.set(0, -0.28, -0.01);
    sternumGroup.add(xiphoidMesh);
  }
  registerBone('sternum', sternumGroup);

  // ==========================================
  // 8. RIBCAGE (Left & Right 12 Ribs each)
  // ==========================================
  function buildRibSet(isLeft: boolean): THREE.Group {
    const ribsGroup = new THREE.Group();
    const sign = isLeft ? 1 : -1;

    for (let i = 0; i < 12; i++) {
      const ribIdx = i + 1;
      const y = 0.5 - i * 0.095;
      const widthFactor = ribIdx <= 7 ? 0.35 + (ribIdx * 0.07) : 0.85 - (ribIdx - 7) * 0.08;
      const curveDepth = 0.45;

      const pBack = new THREE.Vector3(sign * 0.18, y + 0.04, -0.32);
      const pLateral = new THREE.Vector3(sign * widthFactor, y, 0.0);
      const pFront = new THREE.Vector3(sign * (ribIdx <= 7 ? 0.12 : 0.22), y - 0.06, ribIdx <= 10 ? 0.52 : 0.25);

      const ribPoints = [
        pBack,
        new THREE.Vector3(sign * (widthFactor * 0.65), y + 0.03, -0.25),
        pLateral,
        new THREE.Vector3(sign * (widthFactor * 0.85), y - 0.03, 0.32),
        pFront,
      ];

      const ribThickness = 0.022;
      const ribGeo = createTube(ribPoints, ribThickness, 7, 16);
      const ribMesh = new THREE.Mesh(ribGeo, materials.boneMaterial);
      ribsGroup.add(ribMesh);

      // Costal cartilage (for ribs 1-10 connecting to sternum)
      if (ribIdx <= 10) {
        const cartPoints = [
          pFront,
          new THREE.Vector3(sign * 0.06, y - 0.08, 0.58),
        ];
        const cartGeo = createTube(cartPoints, ribThickness * 0.9, 6, 6);
        const cartMesh = new THREE.Mesh(cartGeo, materials.cartilageMaterial);
        ribsGroup.add(cartMesh);
      }
    }
    return ribsGroup;
  }

  const leftRibs = buildRibSet(true);
  leftRibs.name = 'LeftRibs';
  registerBone('ribcage_left', leftRibs);

  const rightRibs = buildRibSet(false);
  rightRibs.name = 'RightRibs';
  registerBone('ribcage_right', rightRibs);

  // ==========================================
  // 9. CLAVICLES (Collarbones)
  // ==========================================
  function buildClavicle(isLeft: boolean): THREE.Group {
    const clavGroup = new THREE.Group();
    const sign = isLeft ? 1 : -1;

    // S-curved long bone tube
    const points = [
      new THREE.Vector3(sign * 0.08, 0.04, 0.06), // Sternal head
      new THREE.Vector3(sign * 0.26, 0.06, 0.09), // Anterior curve
      new THREE.Vector3(sign * 0.52, 0.03, 0.0),  // Posterior curve
      new THREE.Vector3(sign * 0.72, 0.01, -0.06),// Acromial end
    ];
    const clavGeo = createTube(points, 0.032, 8, 16);
    const clavMesh = new THREE.Mesh(clavGeo, materials.boneMaterial);
    clavGroup.add(clavMesh);

    // Acromial articular facet
    const acromFacetGeo = new THREE.SphereGeometry(0.04, 10, 8);
    acromFacetGeo.scale(1.2, 0.6, 0.8);
    const acromFacetMesh = new THREE.Mesh(acromFacetGeo, materials.cartilageMaterial);
    acromFacetMesh.position.copy(points[3]);
    clavGroup.add(acromFacetMesh);

    return clavGroup;
  }

  const leftClavicle = buildClavicle(true);
  registerBone('clavicle_left', leftClavicle);

  const rightClavicle = buildClavicle(false);
  registerBone('clavicle_right', rightClavicle);

  // ==========================================
  // 10. SCAPULAE (Shoulder Blades)
  // ==========================================
  function buildScapula(isLeft: boolean): THREE.Group {
    const scapGroup = new THREE.Group();
    const sign = isLeft ? 1 : -1;

    // Triangular body plate
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.22);
    shape.lineTo(sign * 0.32, 0.16);
    shape.lineTo(sign * 0.1, -0.28);
    shape.closePath();

    const extrudeSettings = { depth: 0.02, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.015, bevelThickness: 0.015 };
    const plateGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const plateMesh = new THREE.Mesh(plateGeo, materials.boneMaterial);
    scapGroup.add(plateMesh);

    // Scapular spine (diagonal posterior ridge)
    const spinePoints = [
      new THREE.Vector3(sign * 0.02, 0.14, -0.02),
      new THREE.Vector3(sign * 0.2, 0.18, -0.08),
      new THREE.Vector3(sign * 0.36, 0.22, -0.12),
    ];
    const spineGeo = createTube(spinePoints, 0.03, 7, 10);
    const spineMesh = new THREE.Mesh(spineGeo, materials.boneMaterial);
    scapGroup.add(spineMesh);

    // Acromion shelf process
    const acromionGeo = new THREE.BoxGeometry(0.09, 0.04, 0.14);
    const acromionMesh = new THREE.Mesh(acromionGeo, materials.boneMaterial);
    acromionMesh.position.set(sign * 0.38, 0.24, -0.04);
    scapGroup.add(acromionMesh);

    // Coracoid process (curved anterior finger)
    const coracoidPoints = [
      new THREE.Vector3(sign * 0.28, 0.18, 0.02),
      new THREE.Vector3(sign * 0.26, 0.2, 0.1),
    ];
    const coracoidGeo = createTube(coracoidPoints, 0.025, 6, 6);
    const coracoidMesh = new THREE.Mesh(coracoidGeo, materials.boneMaterial);
    scapGroup.add(coracoidMesh);

    // Glenoid fossa (socket for humerus head)
    const glenoidGeo = new THREE.CylinderGeometry(0.065, 0.075, 0.04, 14);
    glenoidGeo.rotateZ(Math.PI / 2);
    const glenoidMesh = new THREE.Mesh(glenoidGeo, materials.cartilageMaterial);
    glenoidMesh.position.set(sign * 0.35, 0.14, 0.02);
    scapGroup.add(glenoidMesh);

    return scapGroup;
  }

  const leftScapula = buildScapula(true);
  registerBone('scapula_left', leftScapula);

  const rightScapula = buildScapula(false);
  registerBone('scapula_right', rightScapula);

  // ==========================================
  // 11. HUMERUS (Upper Arm Bones)
  // ==========================================
  function buildHumerus(isLeft: boolean): THREE.Group {
    const humGroup = new THREE.Group();
    const sign = isLeft ? 1 : -1;

    // Hemispherical Head (facing medially toward glenoid)
    const headGeo = new THREE.SphereGeometry(0.12, 20, 16);
    headGeo.scale(1.1, 1.0, 1.0);
    const headMesh = new THREE.Mesh(headGeo, materials.cartilageMaterial);
    headMesh.position.set(-sign * 0.05, 0.42, 0.0);
    humGroup.add(headMesh);

    // Greater & Lesser Tubercles
    const tubGeo = new THREE.SphereGeometry(0.08, 12, 10);
    const tubMesh = new THREE.Mesh(tubGeo, materials.boneMaterial);
    tubMesh.position.set(sign * 0.06, 0.4, 0.04);
    humGroup.add(tubMesh);

    // Shaft (diaphysis with deltoid tuberosity)
    const shaftPoints = [
      new THREE.Vector3(0, 0.38, 0),
      new THREE.Vector3(sign * 0.02, 0.15, 0),
      new THREE.Vector3(0, -0.15, 0),
      new THREE.Vector3(0, -0.42, 0),
    ];
    const shaftGeo = createTube(shaftPoints, 0.055, 10, 16);
    const shaftMesh = new THREE.Mesh(shaftGeo, materials.boneMaterial);
    humGroup.add(shaftMesh);

    // Distal Epicondyles & Condyles (Capitulum and Trochlea)
    const distalGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.18, 14);
    distalGeo.rotateZ(Math.PI / 2);
    const distalMesh = new THREE.Mesh(distalGeo, materials.boneMaterial);
    distalMesh.position.set(0, -0.44, 0);
    humGroup.add(distalMesh);

    // Articular joint cartilage on distal condyle
    const condyleArtGeo = new THREE.SphereGeometry(0.065, 12, 10);
    condyleArtGeo.scale(1.4, 0.8, 1.0);
    const condyleArtMesh = new THREE.Mesh(condyleArtGeo, materials.cartilageMaterial);
    condyleArtMesh.position.set(0, -0.45, 0.02);
    humGroup.add(condyleArtMesh);

    return humGroup;
  }

  const leftHumerus = buildHumerus(true);
  registerBone('humerus_left', leftHumerus);

  const rightHumerus = buildHumerus(false);
  registerBone('humerus_right', rightHumerus);

  // ==========================================
  // 12. FOREARM (Radius & Ulna)
  // ==========================================
  function buildForearm(isLeft: boolean): THREE.Group {
    const foreGroup = new THREE.Group();
    const sign = isLeft ? 1 : -1;

    // --- Radius (Lateral, thumb-side) ---
    const radiusSub = new THREE.Group();
    radiusSub.position.set(sign * 0.065, 0, 0);

    // Radial head (disc)
    const rHeadGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.03, 14);
    const rHeadMesh = new THREE.Mesh(rHeadGeo, materials.cartilageMaterial);
    rHeadMesh.position.set(0, 0.38, 0);
    radiusSub.add(rHeadMesh);

    // Radial shaft (gently curved)
    const rShaftPoints = [
      new THREE.Vector3(0, 0.36, 0),
      new THREE.Vector3(sign * 0.015, 0.1, 0.01),
      new THREE.Vector3(0, -0.15, 0),
      new THREE.Vector3(0, -0.38, 0),
    ];
    const rShaftGeo = createTube(rShaftPoints, 0.038, 8, 14);
    const rShaftMesh = new THREE.Mesh(rShaftGeo, materials.boneMaterial);
    radiusSub.add(rShaftMesh);

    // Distal radial styloid process
    const rDistalGeo = new THREE.BoxGeometry(0.09, 0.06, 0.07);
    const rDistalMesh = new THREE.Mesh(rDistalGeo, materials.boneMaterial);
    rDistalMesh.position.set(0, -0.39, 0);
    radiusSub.add(rDistalMesh);

    foreGroup.add(radiusSub);

    // --- Ulna (Medial, pinky-side) ---
    const ulnaSub = new THREE.Group();
    ulnaSub.position.set(-sign * 0.065, 0, 0);

    // Olecranon process (elbow beak tip)
    const olecranonGeo = new THREE.BoxGeometry(0.07, 0.09, 0.08);
    const olecranonMesh = new THREE.Mesh(olecranonGeo, materials.boneMaterial);
    olecranonMesh.position.set(0, 0.41, -0.02);
    ulnaSub.add(olecranonMesh);

    // Trochlear notch articular surface
    const notchGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 10);
    notchGeo.rotateZ(Math.PI / 2);
    const notchMesh = new THREE.Mesh(notchGeo, materials.cartilageMaterial);
    notchMesh.position.set(0, 0.36, 0.02);
    ulnaSub.add(notchMesh);

    // Ulnar shaft (tapers distally)
    const uShaftPoints = [
      new THREE.Vector3(0, 0.35, 0),
      new THREE.Vector3(0, 0.05, 0),
      new THREE.Vector3(0, -0.2, 0),
      new THREE.Vector3(0, -0.38, 0),
    ];
    const uShaftGeo = createTube(uShaftPoints, 0.035, 8, 14);
    const uShaftMesh = new THREE.Mesh(uShaftGeo, materials.boneMaterial);
    ulnaSub.add(uShaftMesh);

    // Ulnar styloid process
    const uDistalGeo = new THREE.SphereGeometry(0.03, 8, 8);
    const uDistalMesh = new THREE.Mesh(uDistalGeo, materials.boneMaterial);
    uDistalMesh.position.set(0, -0.39, 0);
    ulnaSub.add(uDistalMesh);

    foreGroup.add(ulnaSub);

    return foreGroup;
  }

  const leftForearm = buildForearm(true);
  registerBone('forearm_left', leftForearm);

  const rightForearm = buildForearm(false);
  registerBone('forearm_right', rightForearm);

  // ==========================================
  // 13. HAND & WRIST (Carpals, Metacarpals, Phalanges)
  // ==========================================
  function buildHand(isLeft: boolean): THREE.Group {
    const handGroup = new THREE.Group();
    const sign = isLeft ? 1 : -1;

    // Carpal cluster (8 pebble bones condensed)
    const carpalGeo = new THREE.BoxGeometry(0.14, 0.09, 0.06);
    const carpalMesh = new THREE.Mesh(carpalGeo, materials.boneMaterial);
    carpalMesh.position.set(0, 0.16, 0);
    handGroup.add(carpalMesh);

    // 5 Metacarpals (Palm rays)
    for (let f = 0; f < 5; f++) {
      const isThumb = f === 0;
      const xOffset = isThumb ? sign * 0.1 : (f - 2.5) * 0.032 * sign;
      const yLen = isThumb ? 0.11 : 0.14;
      const zOffset = isThumb ? 0.03 : 0;

      const metaPoints = [
        new THREE.Vector3(xOffset * 0.8, 0.12, zOffset),
        new THREE.Vector3(xOffset, 0.12 - yLen, zOffset),
      ];
      const metaGeo = createTube(metaPoints, 0.016, 6, 4);
      const metaMesh = new THREE.Mesh(metaGeo, materials.boneMaterial);
      handGroup.add(metaMesh);

      // Knuckle (Metacarpal head)
      const knuckleGeo = new THREE.SphereGeometry(0.02, 8, 8);
      const knuckleMesh = new THREE.Mesh(knuckleGeo, materials.boneMaterial);
      knuckleMesh.position.set(xOffset, 0.12 - yLen, zOffset);
      handGroup.add(knuckleMesh);

      // Phalanges (fingers: 2 segments for thumb, 3 for fingers)
      const segments = isThumb ? 2 : 3;
      let currY = 0.12 - yLen;
      for (let s = 0; s < segments; s++) {
        const segLen = 0.055 - s * 0.01;
        const p1 = new THREE.Vector3(xOffset, currY, zOffset);
        const p2 = new THREE.Vector3(xOffset, currY - segLen, zOffset);
        const phalanGeo = createTube([p1, p2], 0.012 - s * 0.002, 6, 4);
        const phalanMesh = new THREE.Mesh(phalanGeo, materials.boneMaterial);
        handGroup.add(phalanMesh);
        currY -= segLen;
      }
    }

    return handGroup;
  }

  const leftHand = buildHand(true);
  registerBone('hand_left', leftHand);

  const rightHand = buildHand(false);
  registerBone('hand_right', rightHand);

  // ==========================================
  // 14. PELVIS (Os Coxae / Hip Bones)
  // ==========================================
  const pelvisGroup = new THREE.Group();
  pelvisGroup.name = 'Pelvis';
  {
    [-1, 1].forEach(side => {
      const sign = side;
      // Iliac flaring wing
      const iliacPoints = [
        new THREE.Vector3(sign * 0.28, 0.25, -0.05),
        new THREE.Vector3(sign * 0.48, 0.32, 0.05), // Crest peak
        new THREE.Vector3(sign * 0.44, 0.12, 0.2),  // ASIS
        new THREE.Vector3(sign * 0.32, -0.05, 0.1),
      ];
      const iliacGeo = createTube(iliacPoints, 0.08, 8, 14);
      const iliacMesh = new THREE.Mesh(iliacGeo, materials.boneMaterial);
      pelvisGroup.add(iliacMesh);

      // Iliac crest lip
      const lipGeo = new THREE.TorusGeometry(0.22, 0.035, 8, 16, Math.PI * 0.65);
      lipGeo.rotateZ(sign > 0 ? 0.3 : Math.PI - 0.3);
      const lipMesh = new THREE.Mesh(lipGeo, materials.boneMaterial);
      lipMesh.position.set(sign * 0.38, 0.22, 0.02);
      pelvisGroup.add(lipMesh);

      // Acetabular socket (hip joint cup)
      const acetabGeo = new THREE.SphereGeometry(0.12, 16, 12);
      acetabGeo.scale(1.0, 1.0, 0.8);
      const acetabMesh = new THREE.Mesh(acetabGeo, materials.cartilageMaterial);
      acetabMesh.position.set(sign * 0.42, -0.08, 0.05);
      pelvisGroup.add(acetabMesh);

      // Ischium (postero-inferior "sit bone")
      const ischiumGeo = new THREE.TorusGeometry(0.14, 0.045, 8, 14, Math.PI * 0.7);
      ischiumGeo.rotateY(Math.PI / 2);
      const ischiumMesh = new THREE.Mesh(ischiumGeo, materials.boneMaterial);
      ischiumMesh.position.set(sign * 0.3, -0.22, -0.05);
      pelvisGroup.add(ischiumMesh);

      // Pubic ramus converging to pubic symphysis
      const pubisPoints = [
        new THREE.Vector3(sign * 0.38, -0.08, 0.08),
        new THREE.Vector3(sign * 0.08, -0.22, 0.24),
      ];
      const pubisGeo = createTube(pubisPoints, 0.05, 6, 8);
      const pubisMesh = new THREE.Mesh(pubisGeo, materials.boneMaterial);
      pelvisGroup.add(pubisMesh);
    });

    // Pubic Symphysis fibrocartilage disc in center
    const symphGeo = new THREE.BoxGeometry(0.06, 0.1, 0.05);
    const symphMesh = new THREE.Mesh(symphGeo, materials.cartilageMaterial);
    symphMesh.position.set(0, -0.22, 0.24);
    pelvisGroup.add(symphMesh);
  }
  registerBone('pelvis', pelvisGroup);

  // ==========================================
  // 15. FEMUR (Thigh Bones)
  // ==========================================
  function buildFemur(isLeft: boolean): THREE.Group {
    const femurGroup = new THREE.Group();
    const sign = isLeft ? 1 : -1;

    // Ball head (facing medially into acetabulum)
    const headGeo = new THREE.SphereGeometry(0.14, 20, 16);
    const headMesh = new THREE.Mesh(headGeo, materials.cartilageMaterial);
    headMesh.position.set(-sign * 0.16, 0.52, 0.02);
    femurGroup.add(headMesh);

    // Femoral neck (angled at 125°)
    const neckPoints = [
      new THREE.Vector3(-sign * 0.14, 0.5, 0.02),
      new THREE.Vector3(0, 0.44, 0),
    ];
    const neckGeo = createTube(neckPoints, 0.075, 10, 8);
    const neckMesh = new THREE.Mesh(neckGeo, materials.boneMaterial);
    femurGroup.add(neckMesh);

    // Greater Trochanter (prominent lateral shoulder)
    const trochanterGeo = new THREE.BoxGeometry(0.12, 0.14, 0.12);
    const trochanterMesh = new THREE.Mesh(trochanterGeo, materials.boneMaterial);
    trochanterMesh.position.set(sign * 0.08, 0.44, -0.02);
    femurGroup.add(trochanterMesh);

    // Shaft (diaphysis, sturdy cylindrical bowed tube)
    const shaftPoints = [
      new THREE.Vector3(0, 0.4, 0),
      new THREE.Vector3(-sign * 0.02, 0.15, 0.03), // Anterior bow
      new THREE.Vector3(-sign * 0.03, -0.15, 0.03),
      new THREE.Vector3(-sign * 0.04, -0.45, 0),
    ];
    const shaftGeo = createTube(shaftPoints, 0.072, 10, 18);
    const shaftMesh = new THREE.Mesh(shaftGeo, materials.boneMaterial);
    femurGroup.add(shaftMesh);

    // Distal Bicondylar Expansion (Medial and Lateral Condyles)
    const condyleGeo = new THREE.CylinderGeometry(0.11, 0.12, 0.22, 16);
    condyleGeo.rotateZ(Math.PI / 2);
    const condyleMesh = new THREE.Mesh(condyleGeo, materials.boneMaterial);
    condyleMesh.position.set(-sign * 0.04, -0.52, -0.02);
    femurGroup.add(condyleMesh);

    // Knee joint articular cartilage
    const kneeArtGeo = new THREE.SphereGeometry(0.09, 14, 10);
    kneeArtGeo.scale(1.4, 0.7, 1.2);
    const kneeArtMesh = new THREE.Mesh(kneeArtGeo, materials.cartilageMaterial);
    kneeArtMesh.position.set(-sign * 0.04, -0.55, 0.02);
    femurGroup.add(kneeArtMesh);

    return femurGroup;
  }

  const leftFemur = buildFemur(true);
  registerBone('femur_left', leftFemur);

  const rightFemur = buildFemur(false);
  registerBone('femur_right', rightFemur);

  // ==========================================
  // 16. PATELLA (Kneecaps)
  // ==========================================
  function buildPatella(isLeft: boolean): THREE.Group {
    const patGroup = new THREE.Group();
    const sign = isLeft ? 1 : -1;

    // Teardrop sesamoid bone
    const patGeo = new THREE.ConeGeometry(0.08, 0.13, 8);
    patGeo.rotateX(Math.PI);
    patGeo.scale(1.1, 1.0, 0.55);
    const patMesh = new THREE.Mesh(patGeo, materials.boneMaterial);
    patMesh.position.set(0, 0, 0);
    patGroup.add(patMesh);

    // Posterior articular cartilage facet
    const facetGeo = new THREE.BoxGeometry(0.09, 0.09, 0.025);
    const facetMesh = new THREE.Mesh(facetGeo, materials.cartilageMaterial);
    facetMesh.position.set(0, 0.01, -0.035);
    patGroup.add(facetMesh);

    return patGroup;
  }

  const leftPatella = buildPatella(true);
  registerBone('patella_left', leftPatella);

  const rightPatella = buildPatella(false);
  registerBone('patella_right', rightPatella);

  // ==========================================
  // 17. TIBIA (Shinbones)
  // ==========================================
  function buildTibia(isLeft: boolean): THREE.Group {
    const tibGroup = new THREE.Group();
    const sign = isLeft ? 1 : -1;

    // Proximal Tibial Plateau (broad plateau with dual articular cavities)
    const plateauGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.09, 16);
    plateauGeo.scale(1.2, 1.0, 1.0);
    const plateauMesh = new THREE.Mesh(plateauGeo, materials.boneMaterial);
    plateauMesh.position.set(0, 0.48, 0);
    tibGroup.add(plateauMesh);

    // Meniscus articular cartilage surfaces
    const meniscGeo = new THREE.BoxGeometry(0.24, 0.025, 0.16);
    const meniscMesh = new THREE.Mesh(meniscGeo, materials.cartilageMaterial);
    meniscMesh.position.set(0, 0.53, 0);
    tibGroup.add(meniscMesh);

    // Tibial Tuberosity (anterior bump for patellar tendon)
    const tuberGeo = new THREE.BoxGeometry(0.07, 0.08, 0.06);
    const tuberMesh = new THREE.Mesh(tuberGeo, materials.boneMaterial);
    tuberMesh.position.set(0, 0.42, 0.09);
    tibGroup.add(tuberMesh);

    // Shaft with sharp anterior crest (shin blade)
    const shaftPoints = [
      new THREE.Vector3(0, 0.45, 0),
      new THREE.Vector3(0, 0.1, 0.01),
      new THREE.Vector3(0, -0.2, 0),
      new THREE.Vector3(0, -0.48, 0),
    ];
    const shaftGeo = createTube(shaftPoints, 0.062, 8, 16);
    const shaftMesh = new THREE.Mesh(shaftGeo, materials.boneMaterial);
    tibGroup.add(shaftMesh);

    // Medial Malleolus (inner ankle projection)
    const malleolusGeo = new THREE.BoxGeometry(0.06, 0.1, 0.08);
    const malleolusMesh = new THREE.Mesh(malleolusGeo, materials.boneMaterial);
    malleolusMesh.position.set(-sign * 0.055, -0.51, 0.0);
    tibGroup.add(malleolusMesh);

    return tibGroup;
  }

  const leftTibia = buildTibia(true);
  registerBone('tibia_left', leftTibia);

  const rightTibia = buildTibia(false);
  registerBone('tibia_right', rightTibia);

  // ==========================================
  // 18. FIBULA (Calf Bones)
  // ==========================================
  function buildFibula(isLeft: boolean): THREE.Group {
    const fibGroup = new THREE.Group();
    const sign = isLeft ? 1 : -1;

    // Proximal Head
    const headGeo = new THREE.SphereGeometry(0.05, 10, 8);
    const headMesh = new THREE.Mesh(headGeo, materials.boneMaterial);
    headMesh.position.set(0, 0.46, 0);
    fibGroup.add(headMesh);

    // Slender, delicate elongated shaft
    const shaftPoints = [
      new THREE.Vector3(0, 0.45, 0),
      new THREE.Vector3(0, 0.1, 0),
      new THREE.Vector3(0, -0.2, 0),
      new THREE.Vector3(0, -0.46, 0),
    ];
    const shaftGeo = createTube(shaftPoints, 0.024, 7, 14);
    const shaftMesh = new THREE.Mesh(shaftGeo, materials.boneMaterial);
    fibGroup.add(shaftMesh);

    // Lateral Malleolus (outer ankle bump, extends further down)
    const latMallGeo = new THREE.BoxGeometry(0.055, 0.12, 0.065);
    const latMallMesh = new THREE.Mesh(latMallGeo, materials.boneMaterial);
    latMallMesh.position.set(0, -0.5, 0);
    fibGroup.add(latMallMesh);

    return fibGroup;
  }

  const leftFibula = buildFibula(true);
  registerBone('fibula_left', leftFibula);

  const rightFibula = buildFibula(false);
  registerBone('fibula_right', rightFibula);

  // ==========================================
  // 19. FOOT & ANKLE (Tarsals, Metatarsals, Phalanges)
  // ==========================================
  function buildFoot(isLeft: boolean): THREE.Group {
    const footGroup = new THREE.Group();
    const sign = isLeft ? 1 : -1;

    // Calcaneus (Heel bone projecting backward)
    const heelPoints = [
      new THREE.Vector3(0, 0.04, -0.08),
      new THREE.Vector3(0, -0.04, -0.26),
    ];
    const heelGeo = createTube(heelPoints, 0.065, 8, 8);
    const heelMesh = new THREE.Mesh(heelGeo, materials.boneMaterial);
    footGroup.add(heelMesh);

    // Talus (Ankle dome)
    const talusGeo = new THREE.SphereGeometry(0.065, 12, 10);
    talusGeo.scale(1.0, 0.8, 1.2);
    const talusMesh = new THREE.Mesh(talusGeo, materials.cartilageMaterial);
    talusMesh.position.set(0, 0.06, -0.04);
    footGroup.add(talusMesh);

    // Midfoot Tarsals (Navicular, Cuboid, Cuneiforms)
    const midfootGeo = new THREE.BoxGeometry(0.14, 0.065, 0.14);
    const midfootMesh = new THREE.Mesh(midfootGeo, materials.boneMaterial);
    midfootMesh.position.set(0, 0.01, 0.1);
    footGroup.add(midfootMesh);

    // 5 Metatarsals (Arched rays)
    for (let t = 0; t < 5; t++) {
      const isHallux = t === 0; // Big toe
      const xOffset = isHallux ? -sign * 0.06 : (t - 2.5) * 0.03 * -sign;
      const tLen = isHallux ? 0.2 : 0.17;

      const metaPoints = [
        new THREE.Vector3(xOffset * 0.85, 0.01, 0.16),
        new THREE.Vector3(xOffset, -0.03, 0.16 + tLen),
      ];
      const metaGeo = createTube(metaPoints, isHallux ? 0.024 : 0.017, 6, 6);
      const metaMesh = new THREE.Mesh(metaGeo, materials.boneMaterial);
      footGroup.add(metaMesh);

      // Toe Phalanges
      const p1 = new THREE.Vector3(xOffset, -0.03, 0.16 + tLen);
      const p2 = new THREE.Vector3(xOffset, -0.04, 0.16 + tLen + (isHallux ? 0.09 : 0.07));
      const toeGeo = createTube([p1, p2], isHallux ? 0.019 : 0.013, 6, 4);
      const toeMesh = new THREE.Mesh(toeGeo, materials.boneMaterial);
      footGroup.add(toeMesh);
    }

    return footGroup;
  }

  const leftFoot = buildFoot(true);
  registerBone('foot_left', leftFoot);

  const rightFoot = buildFoot(false);
  registerBone('foot_right', rightFoot);

  return { skeletonRoot, boneRecords };
}
