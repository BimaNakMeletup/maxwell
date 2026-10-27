import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

// Setup Canvas & Renderer
const canvas = document.getElementById('webgl-canvas');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Scene with plain white background
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// Camera centered with responsive mobile framing
const camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

function adjustCameraForScreen() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspect = width / height;

  camera.aspect = aspect;

  // Di HP portrait (aspect < 1.0), mundurkan kamera agar Maxwell tidak terpotong
  const baseDistance = 4.5;
  if (aspect < 1.0) {
    camera.position.z = baseDistance / (aspect * 1.12);
    camera.position.y = 0.3;
  } else {
    camera.position.z = baseDistance;
    camera.position.y = 0.4;
  }

  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

adjustCameraForScreen();

// Lighting setup for clean white background
const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
mainLight.position.set(4, 7, 5);
mainLight.castShadow = true;
mainLight.shadow.mapSize.width = 1024;
mainLight.shadow.mapSize.height = 1024;
mainLight.shadow.bias = -0.001;
scene.add(mainLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.9);
fillLight.position.set(-4, 3, -3);
scene.add(fillLight);

// Soft contact shadow on the floor
const shadowPlaneGeo = new THREE.PlaneGeometry(10, 10);
const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.12 });
const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = -1.0;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

// Asset Base URL helper
const BASE_URL = import.meta.env.BASE_URL || './';
const getAssetUrl = (path) => {
  const cleanBase = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
  return `${cleanBase}${path.replace(/^\//, '')}`;
};

// Textures
const textureLoader = new THREE.TextureLoader();

const bodyTexture = textureLoader.load(getAssetUrl('textures/dingus_nowhiskers.jpg'));
bodyTexture.colorSpace = THREE.SRGBColorSpace;
bodyTexture.flipY = true;

const whiskersTexture = textureLoader.load(getAssetUrl('textures/dingus_whiskers.tga.png'));
whiskersTexture.colorSpace = THREE.SRGBColorSpace;
whiskersTexture.flipY = true;

// Maxwell Model Pivot (centered at 0, 0, 0)
const maxwellPivot = new THREE.Group();
scene.add(maxwellPivot);

const fbxLoader = new FBXLoader();

function loadModel(url, isFallback = false) {
  fbxLoader.load(
    url,
    (fbx) => {
      // Calculate bounding box to center Maxwell accurately
      const bbox = new THREE.Box3().setFromObject(fbx);
      const center = new THREE.Vector3();
      const size = new THREE.Vector3();
      bbox.getCenter(center);
      bbox.getSize(size);

      // Normalize size so Maxwell fits nicely in the center
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2.4 / (maxDim || 1);
      fbx.scale.setScalar(scale);

      // Center offset
      fbx.position.x = -center.x * scale;
      fbx.position.y = -center.y * scale;
      fbx.position.z = -center.z * scale;

      // Materials for Maxwell: Body & Whiskers
      const bodyMaterial = new THREE.MeshStandardMaterial({
        map: bodyTexture,
        roughness: 0.8,
        metalness: 0.05
      });

      const whiskersMaterial = new THREE.MeshStandardMaterial({
        map: whiskersTexture,
        transparent: true,
        alphaTest: 0.15,
        side: THREE.DoubleSide,
        depthWrite: true,
        roughness: 0.5
      });

      // Assign materials
      fbx.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          // Maxwell FBX contains 2 material groups:
          // index 0: 'dingus' (badan kucing)
          // index 1: 'whiskers' (kumis transparan)
          if (Array.isArray(child.material)) {
            child.material = child.material.map((mat, idx) => {
              const mName = (mat?.name || '').toLowerCase();
              if (mName.includes('whisker') || idx === 1) {
                return whiskersMaterial;
              }
              return bodyMaterial;
            });
          } else {
            const name = (child.name || '').toLowerCase();
            const matName = (child.material?.name || '').toLowerCase();
            const isWhisker = name.includes('whisker') || matName.includes('whisker');
            child.material = isWhisker ? whiskersMaterial : bodyMaterial;
          }
        }
      });

      maxwellPivot.add(fbx);
    },
    undefined,
    (error) => {
      console.warn('Gagal memuat model:', url, error);
      if (!isFallback) {
        loadModel(getAssetUrl('model/[etkjdoiqwhuiorhvuier.fbx'), true);
      }
    }
  );
}

loadModel(getAssetUrl('model/maxwell.fbx'));

// ==========================================================================
// PENGATURAN PUTARAN & MOMENTUM (Sesuaikan di sini)
// ==========================================================================
export const ROTATION_CONFIG = {
  // Gesekan / Inersia: Menentukan berapa lama Maxwell terus berputar setelah di-scroll
  // 0.985 = Berputar sangat lama (licin / meluncur)
  // 0.965 = Berputar sedang (alami)
  // 0.900 = Cepat berhenti
  friction: 0.968,

  // Dorongan per scroll:
  // Semakin besar, semakin kencang putaran yang dihasilkan dari satu kali scroll
  scrollForce: 0.00065,

  // Kecepatan putaran maksimum
  maxSpeed: 0.5
};

// ==========================================================================
// AUDIO CONTROLLER (audio.mp3)
// ==========================================================================
const bgAudio = new Audio(getAssetUrl('audio.mp3'));
bgAudio.loop = true;
bgAudio.preload = 'auto';

// ==========================================================================
// ROTATION VELOCITY PHYSICS
// ==========================================================================
let angularVelocity = 0;

// Scroll event (Wheel)
window.addEventListener('wheel', (e) => {
  // deltaY > 0 (scroll ke bawah) -> muter ke kanan (positif)
  // deltaY < 0 (scroll ke atas)  -> muter ke kiri  (negatif)
  // Kecepatan dorongan sebanding dengan kecepatan gerak scroll
  angularVelocity += e.deltaY * ROTATION_CONFIG.scrollForce;

  // Batasi kecepatan maksimal
  angularVelocity = Math.max(
    -ROTATION_CONFIG.maxSpeed,
    Math.min(ROTATION_CONFIG.maxSpeed, angularVelocity)
  );
}, { passive: true });

// Mouse Drag to spin
let isDragging = false;
let previousMouseX = 0;

window.addEventListener('mousedown', (e) => {
  isDragging = true;
  previousMouseX = e.clientX;

  // Hentikan putaran dan pause audio seketika saat diklik
  angularVelocity = 0;
  if (!bgAudio.paused) {
    bgAudio.pause();
  }
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const deltaX = e.clientX - previousMouseX;
  previousMouseX = e.clientX;
  angularVelocity += deltaX * 0.003;
  angularVelocity = Math.max(
    -ROTATION_CONFIG.maxSpeed,
    Math.min(ROTATION_CONFIG.maxSpeed, angularVelocity)
  );
});

window.addEventListener('mouseup', () => {
  isDragging = false;
});

// Touch swipe (mobile)
let touchStartY = 0;
let touchStartX = 0;

window.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;

    // Hentikan putaran seketika saat disentuh
    angularVelocity = 0;
    if (!bgAudio.paused) {
      bgAudio.pause();
    }

    // Buka kunci audio untuk browser HP pada sentuhan pertama jika diperlukan
    bgAudio.play().then(() => {
      if (Math.abs(angularVelocity) < 0.001) {
        bgAudio.pause();
      }
    }).catch(() => {});
  }
}, { passive: true });

window.addEventListener('touchmove', (e) => {
  if (!e.touches || e.touches.length !== 1) return;
  const currentY = e.touches[0].clientY;
  const currentX = e.touches[0].clientX;
  const deltaY = touchStartY - currentY;
  const deltaX = currentX - touchStartX;
  touchStartY = currentY;
  touchStartX = currentX;

  // Usap ke atas / kanan -> muter ke kanan
  // Usap ke bawah / kiri  -> muter ke kiri
  const touchImpulse = (deltaY * 0.006) + (deltaX * 0.006);
  angularVelocity += touchImpulse;
  angularVelocity = Math.max(
    -ROTATION_CONFIG.maxSpeed,
    Math.min(ROTATION_CONFIG.maxSpeed, angularVelocity)
  );
}, { passive: true });

// ==========================================================================
// RENDER & PHYSICS LOOP
// ==========================================================================
function animate() {
  requestAnimationFrame(animate);

  // Terapkan kecepatan putaran ke model Maxwell
  if (maxwellPivot) {
    maxwellPivot.rotation.y += angularVelocity;

    // Gesekan: Kecepatan berkurang secara bertahap setiap frame
    angularVelocity *= ROTATION_CONFIG.friction;

    // Ambang batas berhenti total
    if (Math.abs(angularVelocity) < 0.00015) {
      angularVelocity = 0;
    }
  }

  // Audio sinkron dengan putaran:
  // Memutar selama Maxwell berputar, pause ketika berhenti (resume dari titik terakhir)
  if (Math.abs(angularVelocity) > 0.001) {
    if (bgAudio.paused) {
      bgAudio.play().catch(() => {});
    }
  } else {
    if (!bgAudio.paused) {
      bgAudio.pause();
    }
  }

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

// Window Resize & Orientation Change (Mobile responsive)
window.addEventListener('resize', adjustCameraForScreen);
window.addEventListener('orientationchange', adjustCameraForScreen);
