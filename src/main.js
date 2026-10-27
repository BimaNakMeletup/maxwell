import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

// ==========================================================================
// ASSET PATH RESOLVER
// ==========================================================================
const BASE_URL = import.meta.env.BASE_URL || './';
const getAssetUrl = (path) => {
  const cleanBase = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
  return `${cleanBase}${path.replace(/^\//, '')}`;
};

// ==========================================================================
// AUDIO SETUP (Mode Biasa: audio.mp3 | Mode Gugur: Blue Oiia.mp3)
// ==========================================================================
const normalAudio = new Audio(getAssetUrl('audio.mp3'));
normalAudio.loop = true;
normalAudio.preload = 'auto';

const beachAudio = new Audio(getAssetUrl('Blue Oiia.mp3'));
beachAudio.loop = true;
beachAudio.preload = 'auto';

function stopAllAudio() {
  if (!normalAudio.paused) normalAudio.pause();
  if (!beachAudio.paused) beachAudio.pause();
}

// ==========================================================================
// RENDERER & CANVAS SETUP
// ==========================================================================
const canvas = document.getElementById('webgl-canvas');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true, // Memungkinkan background gugur.jpg terlihat
  powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// Camera
const camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

function adjustCamera() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspect = width / height;

  camera.aspect = aspect;

  const baseDistance = 5.5;
  if (aspect < 1.0) {
    camera.position.z = baseDistance / (aspect * 1.05);
    camera.position.y = 0.15;
  } else {
    camera.position.z = baseDistance;
    camera.position.y = 0.2;
  }

  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

adjustCamera();

// ==========================================================================
// LIGHTING SETUP (Studio & Golden Autumn Bloom)
// ==========================================================================
const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
scene.add(ambientLight);

const mainSunLight = new THREE.DirectionalLight(0xffffff, 2.0);
mainSunLight.position.set(4, 7, 5);
mainSunLight.castShadow = true;
mainSunLight.shadow.mapSize.width = 1024;
mainSunLight.shadow.mapSize.height = 1024;
mainSunLight.shadow.bias = -0.001;
scene.add(mainSunLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.9);
fillLight.position.set(-4, 3, -3);
scene.add(fillLight);

// Lampu Rim Emas Belakang (Golden Edge Glow untuk efek Blooming Maxwell)
const autumnRimLight = new THREE.DirectionalLight(0xffaa33, 0);
autumnRimLight.position.set(0, 3, -4);
scene.add(autumnRimLight);

// Bayangan lantai kontak Maxwell di jalan setapak
const shadowPlaneGeo = new THREE.PlaneGeometry(10, 10);
const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.12 });
const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = -1.0;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

// ==========================================================================
// EFEK DAUN-DAUN MUSIM GUGUR (FALLING AUTUMN LEAVES)
// ==========================================================================
function createAutumnLeafTexture(type) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 128, 128);

  if (type === 0) {
    // Daun Maple Merah Jingga
    const grad = ctx.createRadialGradient(64, 70, 10, 64, 64, 60);
    grad.addColorStop(0, '#ff9800');
    grad.addColorStop(0.5, '#e64a19');
    grad.addColorStop(1, '#c2185b');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(64, 10);
    ctx.quadraticCurveTo(72, 30, 85, 25);
    ctx.quadraticCurveTo(80, 40, 105, 42);
    ctx.quadraticCurveTo(95, 55, 115, 68);
    ctx.quadraticCurveTo(98, 75, 104, 90);
    ctx.quadraticCurveTo(88, 86, 82, 102);
    ctx.quadraticCurveTo(70, 94, 66, 118);
    ctx.lineTo(62, 118);
    ctx.quadraticCurveTo(58, 94, 46, 102);
    ctx.quadraticCurveTo(40, 86, 24, 90);
    ctx.quadraticCurveTo(30, 75, 13, 68);
    ctx.quadraticCurveTo(33, 55, 23, 42);
    ctx.quadraticCurveTo(48, 40, 43, 25);
    ctx.quadraticCurveTo(56, 30, 64, 10);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 220, 150, 0.65)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(64, 115);
    ctx.lineTo(64, 25);
    ctx.moveTo(64, 85);
    ctx.lineTo(95, 52);
    ctx.moveTo(64, 85);
    ctx.lineTo(33, 52);
    ctx.moveTo(64, 65);
    ctx.lineTo(82, 38);
    ctx.moveTo(64, 65);
    ctx.lineTo(46, 38);
    ctx.stroke();
  } else if (type === 1) {
    // Daun Birch Kuning Keemasan
    const grad = ctx.createLinearGradient(64, 15, 64, 115);
    grad.addColorStop(0, '#ffea00');
    grad.addColorStop(0.5, '#ffa000');
    grad.addColorStop(1, '#ff6d00');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(64, 15);
    ctx.bezierCurveTo(95, 35, 105, 80, 68, 108);
    ctx.lineTo(66, 120);
    ctx.lineTo(62, 120);
    ctx.lineTo(60, 108);
    ctx.bezierCurveTo(23, 80, 33, 35, 64, 15);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 200, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(64, 115);
    ctx.lineTo(64, 25);
    for (let y = 40; y <= 90; y += 14) {
      ctx.moveTo(64, y);
      ctx.lineTo(78, y - 8);
      ctx.moveTo(64, y);
      ctx.lineTo(50, y - 8);
    }
    ctx.stroke();
  } else {
    // Daun Oak Amber Tembaga
    const grad = ctx.createLinearGradient(30, 20, 98, 110);
    grad.addColorStop(0, '#ff5722');
    grad.addColorStop(0.6, '#e65100');
    grad.addColorStop(1, '#bf360c');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(64, 14);
    ctx.quadraticCurveTo(80, 20, 84, 32);
    ctx.quadraticCurveTo(76, 42, 92, 52);
    ctx.quadraticCurveTo(80, 62, 90, 76);
    ctx.quadraticCurveTo(76, 85, 78, 102);
    ctx.lineTo(66, 120);
    ctx.lineTo(62, 120);
    ctx.lineTo(50, 102);
    ctx.quadraticCurveTo(52, 85, 38, 76);
    ctx.quadraticCurveTo(48, 62, 36, 52);
    ctx.quadraticCurveTo(52, 42, 44, 32);
    ctx.quadraticCurveTo(48, 20, 64, 14);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 230, 170, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(64, 115);
    ctx.lineTo(64, 25);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(c);
  return texture;
}

const leafMaterials = [
  new THREE.MeshStandardMaterial({
    map: createAutumnLeafTexture(0),
    transparent: true,
    alphaTest: 0.05,
    side: THREE.DoubleSide,
    roughness: 0.35,
    metalness: 0.05
  }),
  new THREE.MeshStandardMaterial({
    map: createAutumnLeafTexture(1),
    transparent: true,
    alphaTest: 0.05,
    side: THREE.DoubleSide,
    roughness: 0.35,
    metalness: 0.05
  }),
  new THREE.MeshStandardMaterial({
    map: createAutumnLeafTexture(2),
    transparent: true,
    alphaTest: 0.05,
    side: THREE.DoubleSide,
    roughness: 0.35,
    metalness: 0.05
  })
];

const leafGeo = new THREE.PlaneGeometry(0.36, 0.36);
const autumnGroup = new THREE.Group();
autumnGroup.visible = false;
scene.add(autumnGroup);

const leafData = [];
const TOTAL_LEAVES = 70;

for (let i = 0; i < TOTAL_LEAVES; i++) {
  const type = i % 3;
  const mesh = new THREE.Mesh(leafGeo, leafMaterials[type]);

  const x = (Math.random() - 0.5) * 8.5;
  const y = Math.random() * 5.5 - 1.0;
  const z = (Math.random() - 0.5) * 6.0;

  mesh.position.set(x, y, z);
  mesh.rotation.set(
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2
  );
  const scale = 0.22 + Math.random() * 0.24;
  mesh.scale.setScalar(scale);

  autumnGroup.add(mesh);

  leafData.push({
    mesh,
    vy: 0.55 + Math.random() * 0.65,
    driftX: (Math.random() - 0.35) * 0.45,
    driftZ: (Math.random() - 0.5) * 0.25,
    flutterFreq: 1.8 + Math.random() * 2.2,
    flutterAmp: 0.35 + Math.random() * 0.3,
    phaseX: Math.random() * Math.PI * 2,
    phaseZ: Math.random() * Math.PI * 2,
    rotSpeedX: (Math.random() - 0.5) * 2.2,
    rotSpeedY: (Math.random() - 0.5) * 2.5,
    rotSpeedZ: (Math.random() - 0.5) * 1.8
  });
}

// Butiran Debu Emas Melayang (Golden Dust Motes)
function createGoldenMoteTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 245, 200, 1)');
  grad.addColorStop(0.3, 'rgba(255, 200, 100, 0.7)');
  grad.addColorStop(0.7, 'rgba(255, 150, 50, 0.25)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

const MOTE_COUNT = 40;
const moteGeo = new THREE.BufferGeometry();
const motePositions = new Float32Array(MOTE_COUNT * 3);
const moteSeeds = [];

for (let i = 0; i < MOTE_COUNT; i++) {
  const px = (Math.random() - 0.5) * 7.5;
  const py = Math.random() * 4.0 - 0.8;
  const pz = (Math.random() - 0.5) * 5.0;
  motePositions[i * 3] = px;
  motePositions[i * 3 + 1] = py;
  motePositions[i * 3 + 2] = pz;
  moteSeeds.push({
    baseX: px,
    baseY: py,
    baseZ: pz,
    speed: 0.6 + Math.random() * 0.8,
    phase: Math.random() * Math.PI * 2
  });
}
moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
const moteMat = new THREE.PointsMaterial({
  size: 0.2,
  map: createGoldenMoteTexture(),
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  color: 0xffe082
});
const goldenDust = new THREE.Points(moteGeo, moteMat);
autumnGroup.add(goldenDust);

// ==========================================================================
// 2 MODE: MODE BIASA & MODE GUGUR (MUSIM GUGUR BLOOMING)
// ==========================================================================
let isAutumnMode = false;
const toggleBtn = document.getElementById('mode-toggle-btn');

function setAutumnMode(active) {
  isAutumnMode = active;
  stopAllAudio();

  if (isAutumnMode) {
    // 1. MODE GUGUR: Background Gugur + Blooming Emas + Daun Berjatuhan
    document.body.classList.add('mode-autumn');
    document.body.style.backgroundImage = `url("${getAssetUrl('gugur.jpg')}")`;
    document.body.style.backgroundColor = '#b85d19';

    scene.background = null; // Canvas transparan agar gambar gugur.jpg terlihat
    autumnGroup.visible = true;

    // Pencahayaan Musim Gugur Keemasan (Golden Hour Blooming)
    ambientLight.intensity = 2.1;
    ambientLight.color.setHex(0xffdfc4);
    mainSunLight.intensity = 2.9;
    mainSunLight.color.setHex(0xffb84d);
    fillLight.intensity = 1.2;
    fillLight.color.setHex(0xff8c42);
    autumnRimLight.intensity = 2.5;

    shadowPlaneMat.opacity = 0.35;

    if (toggleBtn) {
      toggleBtn.classList.add('autumn-active');
      const icon = toggleBtn.querySelector('.mode-icon');
      const label = toggleBtn.querySelector('.mode-label');
      if (icon) icon.textContent = '⚪';
      if (label) label.textContent = 'plain';
    }

    beachAudio.play().catch(() => { });
  } else {
    // 2. MODE BIASA (Putih Bersih Polos)
    document.body.classList.remove('mode-autumn');
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '#ffffff';

    scene.background = new THREE.Color(0xffffff);
    autumnGroup.visible = false;

    ambientLight.intensity = 1.4;
    ambientLight.color.setHex(0xffffff);
    mainSunLight.intensity = 2.0;
    mainSunLight.color.setHex(0xffffff);
    fillLight.intensity = 0.9;
    fillLight.color.setHex(0xffffff);
    autumnRimLight.intensity = 0;

    shadowPlaneMat.opacity = 0.12;

    if (toggleBtn) {
      toggleBtn.classList.remove('autumn-active');
      const icon = toggleBtn.querySelector('.mode-icon');
      const label = toggleBtn.querySelector('.mode-label');
      if (icon) icon.textContent = '🍂';
      if (label) label.textContent = 'Mode Gugur';
    }
  }
}

if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    setAutumnMode(!isAutumnMode);
  });
}

function getActiveAudio() {
  return isAutumnMode ? beachAudio : normalAudio;
}

// Inisialisasi awal ke Mode Biasa
setAutumnMode(false);

// ==========================================================================
// ASSET LOADER (FBX & TEXTURES)
// ==========================================================================
const textureLoader = new THREE.TextureLoader();

const bodyTexture = textureLoader.load(getAssetUrl('textures/dingus_nowhiskers.jpg'));
bodyTexture.colorSpace = THREE.SRGBColorSpace;
bodyTexture.flipY = true;

const whiskersTexture = textureLoader.load(getAssetUrl('textures/dingus_whiskers.tga.png'));
whiskersTexture.colorSpace = THREE.SRGBColorSpace;
whiskersTexture.flipY = true;

const maxwellPivot = new THREE.Group();
scene.add(maxwellPivot);

const fbxLoader = new FBXLoader();

function loadModel(url, isFallback = false) {
  fbxLoader.load(
    url,
    (fbx) => {
      const bbox = new THREE.Box3().setFromObject(fbx);
      const center = new THREE.Vector3();
      const size = new THREE.Vector3();
      bbox.getCenter(center);
      bbox.getSize(size);

      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2.4 / (maxDim || 1);
      fbx.scale.setScalar(scale);

      fbx.position.x = -center.x * scale;
      fbx.position.y = -center.y * scale;
      fbx.position.z = -center.z * scale;

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

      fbx.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

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
// CONFIG ROTASI & FISIKA
// ==========================================================================
export const ROTATION_CONFIG = {
  friction: 0.968,     // Inersia meluncur mulus
  scrollForce: 0.00065, // Kekuatan dorongan scroll
  maxSpeed: 0.5
};

let angularVelocity = 0;

function triggerAudio() {
  const audio = getActiveAudio();
  if (audio.paused) {
    audio.play().catch(() => { });
  }
}

// Scroll roda mouse
window.addEventListener('wheel', (e) => {
  angularVelocity += e.deltaY * ROTATION_CONFIG.scrollForce;
  angularVelocity = Math.max(
    -ROTATION_CONFIG.maxSpeed,
    Math.min(ROTATION_CONFIG.maxSpeed, angularVelocity)
  );
  triggerAudio();
}, { passive: true });

// Mouse Drag
let isDragging = false;
let previousMouseX = 0;

window.addEventListener('mousedown', (e) => {
  isDragging = true;
  previousMouseX = e.clientX;
  angularVelocity = 0;
  if (!isAutumnMode) {
    stopAllAudio();
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
  triggerAudio();
});

window.addEventListener('mouseup', () => {
  isDragging = false;
});

// Touch swipe (mobile)
let touchStartY = 0;
let touchStartX = 0;

window.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    isDragging = true;
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    angularVelocity = 0;

    if (!isAutumnMode) {
      stopAllAudio();
    }

    const audio = getActiveAudio();
    audio.play().then(() => {
      if (!isAutumnMode && Math.abs(angularVelocity) < 0.001) {
        audio.pause();
      }
    }).catch(() => { });
  }
}, { passive: true });

window.addEventListener('touchmove', (e) => {
  if (!e.touches || e.touches.length !== 1) return;
  const deltaY = touchStartY - e.touches[0].clientY;
  const deltaX = e.touches[0].clientX - touchStartX;
  touchStartY = e.touches[0].clientY;
  touchStartX = e.touches[0].clientX;

  angularVelocity += ((deltaY * 0.005) + (deltaX * 0.005));
  angularVelocity = Math.max(
    -ROTATION_CONFIG.maxSpeed,
    Math.min(ROTATION_CONFIG.maxSpeed, angularVelocity)
  );
  triggerAudio();
}, { passive: true });

window.addEventListener('touchend', () => {
  isDragging = false;
});

window.addEventListener('touchcancel', () => {
  isDragging = false;
});

// ==========================================================================
// ANIMATION LOOP (Maxwell Spin & Falling Autumn Leaves Simulation)
// ==========================================================================
let lastTime = performance.now();

function animate(currentTime = 0) {
  requestAnimationFrame(animate);

  const delta = Math.min((currentTime - lastTime) * 0.001, 0.05);
  lastTime = currentTime;
  const timeSec = currentTime * 0.001;

  if (maxwellPivot) {
    // Mode Musim Gugur: Muter terus tapi pelan & santai
    if (isAutumnMode && !isDragging) {
      maxwellPivot.rotation.y += 0.55 * delta;
    }

    // Terapkan kecepatan putaran inersia dari scroll / swipe
    maxwellPivot.rotation.y += angularVelocity;
    const decay = Math.pow(ROTATION_CONFIG.friction, delta * 60);
    angularVelocity *= decay;

    if (Math.abs(angularVelocity) < 0.00015) {
      angularVelocity = 0;
    }
  }

  // Animasi Daun Musim Gugur Berjatuhan
  if (isAutumnMode) {
    for (let i = 0; i < leafData.length; i++) {
      const leaf = leafData[i];
      leaf.mesh.position.y -= leaf.vy * delta;
      leaf.mesh.position.x += (Math.sin(timeSec * leaf.flutterFreq + leaf.phaseX) * leaf.flutterAmp + leaf.driftX) * delta;
      leaf.mesh.position.z += Math.cos(timeSec * leaf.flutterFreq * 0.8 + leaf.phaseZ) * 0.25 * delta;

      // 3D Tumbling
      leaf.mesh.rotation.x += leaf.rotSpeedX * delta;
      leaf.mesh.rotation.y += leaf.rotSpeedY * delta;
      leaf.mesh.rotation.z += leaf.rotSpeedZ * delta;

      // Reset ke atas saat menyentuh tanah jalan setapak
      if (leaf.mesh.position.y < -1.15) {
        leaf.mesh.position.y = 4.0 + Math.random() * 1.8;
        leaf.mesh.position.x = (Math.random() - 0.5) * 8.5;
        leaf.mesh.position.z = (Math.random() - 0.5) * 6.0;
      }
    }

    // Butiran Debu Emas Berkelap-kelip
    const motePosAttr = moteGeo.attributes.position;
    for (let i = 0; i < MOTE_COUNT; i++) {
      const s = moteSeeds[i];
      const ny = s.baseY + Math.sin(timeSec * s.speed + s.phase) * 0.25;
      motePosAttr.setY(i, ny);
    }
    motePosAttr.needsUpdate = true;
  }

  // Audio sinkronisasi dengan mode
  if (isAutumnMode) {
    if (beachAudio.paused) {
      beachAudio.play().catch(() => { });
    }
  } else {
    if (Math.abs(angularVelocity) > 0.001) {
      if (normalAudio.paused) {
        normalAudio.play().catch(() => { });
      }
    } else {
      if (!normalAudio.paused) {
        normalAudio.pause();
      }
    }
  }

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

window.addEventListener('resize', adjustCamera);
window.addEventListener('orientationchange', adjustCamera);
