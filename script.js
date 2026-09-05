import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ========== PLANET DATA ==========
const PLANET_DATA = {
  Mercury: {
    icon: '☿', radius: '4.879 km', tilt: '0.03°', rotation: '58.6 dana',
    orbit: '88 dana', distance: '57.9 mil. km', moons: '0',
    info: 'Najmanja planeta i najbliža Suncu. Površina je puna kratera, a temperature se kreću od −180 °C do +430 °C.'
  },
  Venus: {
    icon: '♀', radius: '12.104 km', tilt: '177.4°', rotation: '243 dana (unazad)',
    orbit: '225 dana', distance: '108.2 mil. km', moons: '0',
    info: 'Najtoplija planeta zbog jakog stakleničkog efekta. Atmosfera je gusta i sastoji se uglavnom od CO₂.'
  },
  Earth: {
    icon: '🌍', radius: '12.742 km', tilt: '23.5°', rotation: '24 sata',
    orbit: '365.25 dana', distance: '149.6 mil. km', moons: '1 (Mesec)',
    info: 'Jedina poznata planeta sa životom. Ima tečnu vodu, zaštitnu atmosferu i magnetno polje.'
  },
  Mars: {
    icon: '♂', radius: '6.779 km', tilt: '25.2°', rotation: '24.6 sata',
    orbit: '687 dana', distance: '227.9 mil. km', moons: '2 (Fobos, Dejmos)',
    info: 'Crvena planeta. Ima najveći vulkan u Sunčevom sistemu (Olympus Mons) i duboke kanjone.'
  },
  Jupiter: {
    icon: '♃', radius: '139.820 km', tilt: '3.1°', rotation: '9.9 sata',
    orbit: '11.9 godina', distance: '778.5 mil. km', moons: '95+ (Io, Evropa, Ganimed, Kalisto...)',
    info: 'Najveća planeta. Gasni džin sa Velikom crvenom mrljom – olujom većom od Zemlje.'
  },
  Saturn: {
    icon: '♄', radius: '116.460 km', tilt: '26.7°', rotation: '10.7 sata',
    orbit: '29.5 godina', distance: '1.43 mlrd. km', moons: '146+',
    info: 'Poznat po spektakularnim prstenovima od leda i stena. Druga najveća planeta u sistemu.'
  },
  Uranus: {
    icon: '♅', radius: '50.724 km', tilt: '97.8°', rotation: '17.2 sata',
    orbit: '84 godine', distance: '2.87 mlrd. km', moons: '28',
    info: 'Ledeni džin koji se „kotrlja“ na boku. Atmosfera sadrži metan koji mu daje plavo-zelenu boju.'
  },
  Neptune: {
    icon: '♆', radius: '49.244 km', tilt: '28.3°', rotation: '16.1 sata',
    orbit: '165 godina', distance: '4.5 mlrd. km', moons: '16',
    info: 'Najudaljenija planeta. Ima najjače vetrove u Sunčevom sistemu – do 2.100 km/h.'
  },
  Pluto: {
    icon: '♇', radius: '2.377 km', tilt: '122.5°', rotation: '6.4 dana',
    orbit: '248 godina', distance: '5.9 mlrd. km', moons: '5 (Haron...)',
    info: 'Patuljasta planeta. Ima tanku atmosferu i srcoliku ravnicu (Tombaugh Regio).'
  }
};

// ========== STATE ==========
const state = {
  paused: false,
  speed: 1,
  selectedPlanet: null,
  isFocusing: false,
  isResetting: false,
  focusProgress: 0,
  focusStartCam: new THREE.Vector3(),
  focusStartTarget: new THREE.Vector3(),
  focusEndCam: new THREE.Vector3(),
  focusEndTarget: new THREE.Vector3(),
  resetStartCam: new THREE.Vector3(),
  resetStartTarget: new THREE.Vector3()
};

const DEFAULT_CAM = new THREE.Vector3(-175, 115, 5);
const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0);

// ========== LOADING ==========
const loadingManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);
const cubeLoader = new THREE.CubeTextureLoader(loadingManager);
const gltfLoader = new GLTFLoader(loadingManager);

const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

loadingManager.onProgress = (url, loaded, total) => {
  const pct = Math.round((loaded / Math.max(total, 1)) * 100);
  progressFill.style.width = pct + '%';
  progressText.textContent = pct + '%';
};

loadingManager.onLoad = () => {
  setTimeout(() => {
    document.getElementById('loader').classList.add('fade-out');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('hint').classList.remove('hidden');
    setTimeout(() => document.getElementById('hint').classList.add('hidden'), 5000);
  }, 400);
};

// ========== SCENE ==========
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.copy(DEFAULT_CAM);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.screenSpacePanning = false;
controls.minDistance = 15;
controls.maxDistance = 600;
controls.target.copy(DEFAULT_TARGET);

// ========== POSTPROCESSING ==========
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const outlinePass = new OutlinePass(
  new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera
);
outlinePass.edgeStrength = 2.5;
outlinePass.edgeGlow = 0.8;
outlinePass.edgeThickness = 1.2;
outlinePass.visibleEdgeColor.set(0xffffff);
outlinePass.hiddenEdgeColor.set(0x111111);
composer.addPass(outlinePass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight), 1.2, 0.5, 0.85
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

// ========== LIGHTING ==========
scene.add(new THREE.AmbientLight(0xffffff, 0.55));
scene.add(new THREE.HemisphereLight(0x8ab4ff, 0x1a1208, 0.35));
const sunLight = new THREE.PointLight(0xfff5e0, 12, 1200, 0.6);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(1024, 1024);
sunLight.shadow.camera.near = 5;
sunLight.shadow.camera.far = 600;
sunLight.shadow.bias = -0.0005;
scene.add(sunLight);

// ========== BACKGROUND ==========
scene.background = cubeLoader.load([
  '3.jpg', '1.jpg', '2.jpg',
  '2.jpg', '4.jpg', '2.jpg'
]);

// ========== HELPERS ==========
function loadTex(url) {
  const t = textureLoader.load(url);
  if (t.colorSpace !== undefined) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ========== SUN ==========
const SUN_SIZE = 16;
const sunMat = new THREE.MeshStandardMaterial({
  emissive: 0xfff0a0,
  emissiveMap: loadTex('sun.jpg'),
  emissiveIntensity: 1.6,
  map: loadTex('sun.jpg')
});
const sun = new THREE.Mesh(new THREE.SphereGeometry(SUN_SIZE, 64, 48), sunMat);
scene.add(sun);

const sunGlow = new THREE.Mesh(
  new THREE.SphereGeometry(SUN_SIZE * 1.15, 32, 24),
  new THREE.MeshBasicMaterial({ color: 0xffcc55, transparent: true, opacity: 0.15, side: THREE.BackSide })
);
sun.add(sunGlow);

// ========== PLANET FACTORY ==========
function createPlanet({ name, size, distance, tilt, map, bump = null, atmosphere = null, ring = null, moons = [], customMaterial = null }) {
  const group = new THREE.Group();
  const system = new THREE.Group();

  let material;
  if (customMaterial) {
    material = customMaterial;
  } else if (bump) {
    material = new THREE.MeshPhongMaterial({
      map: loadTex(map),
      bumpMap: textureLoader.load(bump),
      bumpScale: 0.55,
      shininess: 8,
      specular: 0x222222,
      emissive: 0x111111,
      emissiveIntensity: 0.15
    });
  } else {
    material = new THREE.MeshPhongMaterial({
      map: loadTex(map),
      shininess: 8,
      specular: 0x222222,
      emissive: 0x111111,
      emissiveIntensity: 0.15
    });
  }

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 48, 36), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.rotation.z = (tilt * Math.PI) / 180;
  mesh.userData.planetName = name;
  system.add(mesh);

  let atmMesh = null;
  if (atmosphere) {
    atmMesh = new THREE.Mesh(
      new THREE.SphereGeometry(size * 1.025, 48, 36),
      new THREE.MeshPhongMaterial({
        map: loadTex(atmosphere),
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
        emissive: 0x222222,
        emissiveIntensity: 0.1
      })
    );
    atmMesh.userData.planetName = name;
    mesh.add(atmMesh);
  }

  let ringMesh = null;
  if (ring) {
    const ringGeo = new THREE.RingGeometry(ring.inner, ring.outer, 64);
    const pos = ringGeo.attributes.position;
    const uv = ringGeo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const len = Math.sqrt(x * x + y * y);
      uv.setXY(i, (len - ring.inner) / (ring.outer - ring.inner), 0.5);
    }
    ringMesh = new THREE.Mesh(ringGeo, new THREE.MeshStandardMaterial({
      map: loadTex(ring.texture),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      alphaTest: 0.1,
      roughness: 0.9
    }));
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.receiveShadow = true;
    system.add(ringMesh);
  }

  // Orbit path
  const curve = new THREE.EllipseCurve(0, 0, distance, distance, 0, Math.PI * 2, false, 0);
  const orbitLine = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(curve.getPoints(128)),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07 })
  );
  orbitLine.rotation.x = Math.PI / 2;
  group.add(orbitLine);

  system.position.x = distance;
  group.add(system);
  scene.add(group);

  const moonObjects = moons.map((m) => {
    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(m.size, 24, 18),
      new THREE.MeshPhongMaterial({
        map: loadTex(m.map),
        bumpMap: m.bump ? textureLoader.load(m.bump) : null,
        bumpScale: 0.4,
        shininess: 5,
        emissive: 0x111111,
        emissiveIntensity: 0.12
      })
    );
    moonMesh.castShadow = true;
    moonMesh.receiveShadow = true;
    system.add(moonMesh);
    return { mesh: moonMesh, orbitRadius: m.orbitRadius, orbitSpeed: m.orbitSpeed, angle: Math.random() * Math.PI * 2 };
  });

  return { name, group, system, mesh, atmMesh, ringMesh, moons: moonObjects, size, distance, spinSpeed: 0, orbitSpeed: 0 };
}

// ========== EARTH SHADER ==========
const earthUniforms = {
  dayMap: { value: loadTex('earth_daymap.jpg') },
  nightMap: { value: loadTex('earth_nightmap.jpg') },
  sunDir: { value: new THREE.Vector3(1, 0, 0) }
};

const earthMaterial = new THREE.ShaderMaterial({
  uniforms: earthUniforms,
  vertexShader: `
    varying vec2 vUv; varying vec3 vNormal;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D dayMap; uniform sampler2D nightMap; uniform vec3 sunDir;
    varying vec2 vUv; varying vec3 vNormal;
    void main() {
      vec3 N = normalize(vNormal);
      float NdotL = max(dot(N, normalize(sunDir)), 0.0);
      float blend = smoothstep(0.0, 0.35, NdotL);
      vec3 day = texture2D(dayMap, vUv).rgb;
      vec3 night = texture2D(nightMap, vUv).rgb * 0.55;
      vec3 color = mix(night, day, blend);
      float rim = 1.0 - max(dot(N, vec3(0.0, 0.0, 1.0)), 0.0);
      color += vec3(0.15, 0.25, 0.45) * pow(rim, 3.0) * 0.3;
      gl_FragColor = vec4(color, 1.0);
    }
  `
});

// ========== CREATE PLANETS ==========
const mercury = createPlanet({ name: 'Mercury', size: 2.4, distance: 42, tilt: 0.03, map: 'mercurymap.jpg', bump: 'mercurybump.jpg' });
mercury.spinSpeed = 0.004; mercury.orbitSpeed = 0.0045;

const venus = createPlanet({ name: 'Venus', size: 5.8, distance: 68, tilt: 177.4, map: 'venusmap.jpg', bump: 'venusbump.jpg', atmosphere: 'venus_atmosphere.jpg' });
venus.spinSpeed = 0.0015; venus.orbitSpeed = 0.0018;

const earth = createPlanet({
  name: 'Earth', size: 6.2, distance: 95, tilt: 23.5, map: 'earth_daymap.jpg',
  atmosphere: 'earth_atmosphere.jpg', customMaterial: earthMaterial,
  moons: [{ size: 1.55, map: 'moonmap.jpg', bump: 'moonbump.jpg', orbitRadius: 12, orbitSpeed: 0.012 }]
});
earth.spinSpeed = 0.01; earth.orbitSpeed = 0.0012;

const mars = createPlanet({ name: 'Mars', size: 3.5, distance: 125, tilt: 25.2, map: 'marsmap.jpg', bump: 'marsbump.jpg' });
mars.spinSpeed = 0.0095; mars.orbitSpeed = 0.0009;

const jupiter = createPlanet({
  name: 'Jupiter', size: 17, distance: 210, tilt: 3.1, map: 'jupiter.jpg',
  moons: [
    { size: 1.5, map: 'jupiterIo.jpg', orbitRadius: 22, orbitSpeed: 0.008 },
    { size: 1.3, map: 'jupiterEuropa.jpg', orbitRadius: 27, orbitSpeed: 0.005 },
    { size: 1.9, map: 'jupiterGanymede.jpg', orbitRadius: 33, orbitSpeed: 0.003 },
    { size: 1.6, map: 'jupiterCallisto.jpg', orbitRadius: 39, orbitSpeed: 0.002 }
  ]
});
jupiter.spinSpeed = 0.02; jupiter.orbitSpeed = 0.0004;

const saturn = createPlanet({
  name: 'Saturn', size: 14.5, distance: 280, tilt: 26.7, map: 'saturnmap.jpg',
  ring: { inner: 18, outer: 30, texture: 'saturn_ring.png' }
});
saturn.spinSpeed = 0.018; saturn.orbitSpeed = 0.00025;

const uranus = createPlanet({
  name: 'Uranus', size: 7.5, distance: 340, tilt: 97.8, map: 'uranus.jpg',
  ring: { inner: 9, outer: 12, texture: 'uranus_ring.png' }
});
uranus.spinSpeed = 0.012; uranus.orbitSpeed = 0.00015;

const neptune = createPlanet({ name: 'Neptune', size: 7.2, distance: 385, tilt: 28.3, map: 'neptune.jpg' });
neptune.spinSpeed = 0.013; neptune.orbitSpeed = 0.0001;

const pluto = createPlanet({ name: 'Pluto', size: 1.3, distance: 420, tilt: 122.5, map: 'plutomap.jpg' });
pluto.spinSpeed = 0.003; pluto.orbitSpeed = 0.00007;

const planets = [mercury, venus, earth, mars, jupiter, saturn, uranus, neptune, pluto];

const raycastTargets = [];
planets.forEach((p) => {
  raycastTargets.push(p.mesh);
  if (p.atmMesh) raycastTargets.push(p.atmMesh);
});

// ========== MARS GLB MOONS ==========
const marsMoonsGLB = [
  { path: 'phobos.glb', orbitRadius: 6, orbitSpeed: 0.015, scale: 0.08, angle: 0 },
  { path: 'deimos.glb', orbitRadius: 10, orbitSpeed: 0.006, scale: 0.06, angle: 1.5 }
];
marsMoonsGLB.forEach((m) => {
  gltfLoader.load(m.path, (gltf) => {
    const obj = gltf.scene;
    obj.scale.setScalar(m.scale);
    obj.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    mars.system.add(obj);
    m.mesh = obj;
  });
});

// ========== ASTEROIDS ==========
const asteroidData = [];

function createAsteroidField(count, minR, maxR) {
  const geo = new THREE.IcosahedronGeometry(0.6, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.95, metalness: 0.1, flatShading: true });
  const instanced = new THREE.InstancedMesh(geo, mat, count);
  instanced.castShadow = true;
  instanced.receiveShadow = true;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const r = THREE.MathUtils.randFloat(minR, maxR);
    const theta = Math.random() * Math.PI * 2;
    const y = THREE.MathUtils.randFloatSpread(4);
    dummy.position.set(r * Math.cos(theta), y, r * Math.sin(theta));
    dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    const s = THREE.MathUtils.randFloat(0.3, 1.1);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    instanced.setMatrixAt(i, dummy.matrix);
    asteroidData.push({ mesh: instanced, index: i, radius: r, angle: theta, y, scale: s, rotSpeed: THREE.MathUtils.randFloat(0.001, 0.004) });
  }
  instanced.instanceMatrix.needsUpdate = true;
  scene.add(instanced);
}

createAsteroidField(800, 145, 175);
createAsteroidField(1500, 400, 450);

gltfLoader.load('asteroidPack.glb', (gltf) => {
  const meshes = [];
  gltf.scene.traverse((c) => { if (c.isMesh) meshes.push(c); });
  if (!meshes.length) return;
  for (let i = 0; i < 120; i++) {
    const clone = meshes[i % meshes.length].clone();
    const r = THREE.MathUtils.randFloat(148, 172);
    const theta = Math.random() * Math.PI * 2;
    clone.position.set(r * Math.cos(theta), THREE.MathUtils.randFloatSpread(3), r * Math.sin(theta));
    clone.scale.setScalar(THREE.MathUtils.randFloat(0.5, 1.4));
    clone.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    clone.castShadow = true;
    scene.add(clone);
    asteroidData.push({ mesh: clone, index: -1, radius: r, angle: theta, y: clone.position.y, scale: clone.scale.x, rotSpeed: THREE.MathUtils.randFloat(0.001, 0.003), isClone: true });
  }
});

// ========== INTERACTION ==========
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function setMouse(e) {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

window.addEventListener('pointermove', setMouse);
window.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  setMouse(e);
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(raycastTargets, false);
  if (hits.length > 0) {
    const name = hits[0].object.userData.planetName;
    if (name) focusPlanet(name);
  }
});

function focusPlanet(name) {
  const p = planets.find((pl) => pl.name === name);
  if (!p) return;
  state.selectedPlanet = p;
  state.isFocusing = true;
  state.isResetting = false;
  state.focusProgress = 0;
  state.focusStartCam.copy(camera.position);
  state.focusStartTarget.copy(controls.target);
  const worldPos = new THREE.Vector3();
  p.mesh.getWorldPosition(worldPos);
  state.focusEndTarget.copy(worldPos);
  const dist = Math.max(p.size * 4.5, 18);
  const dir = camera.position.clone().sub(worldPos).normalize();
  if (dir.lengthSq() < 0.01) dir.set(0.6, 0.4, 0.7).normalize();
  state.focusEndCam.copy(worldPos).add(dir.multiplyScalar(dist));
  showPanel(name);
}

function showPanel(name) {
  const d = PLANET_DATA[name];
  if (!d) return;
  document.getElementById('panelIcon').textContent = d.icon;
  document.getElementById('panelName').textContent = name;
  document.getElementById('panelRadius').textContent = d.radius;
  document.getElementById('panelTilt').textContent = d.tilt;
  document.getElementById('panelRotation').textContent = d.rotation;
  document.getElementById('panelOrbit').textContent = d.orbit;
  document.getElementById('panelDistance').textContent = d.distance;
  document.getElementById('panelMoons').textContent = d.moons;
  document.getElementById('panelInfo').textContent = d.info;
  document.getElementById('planetPanel').classList.remove('hidden');
}

function closePanel() {
  document.getElementById('planetPanel').classList.add('hidden');
  state.selectedPlanet = null;
  state.isResetting = true;
  state.isFocusing = false;
  state.focusProgress = 0;
  state.resetStartCam.copy(camera.position);
  state.resetStartTarget.copy(controls.target);
}

document.getElementById('panelClose').addEventListener('click', closePanel);

// ========== HUD ==========
document.getElementById('btnPause').addEventListener('click', () => {
  state.paused = !state.paused;
  document.getElementById('btnPause').textContent = state.paused ? '▶' : '⏸';
});

document.querySelectorAll('[data-speed]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.speed = parseFloat(btn.dataset.speed);
    document.querySelectorAll('[data-speed]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

document.getElementById('btnReset').addEventListener('click', () => {
  closePanel();
  state.isResetting = true;
  state.isFocusing = false;
  state.focusProgress = 0;
  state.resetStartCam.copy(camera.position);
  state.resetStartTarget.copy(controls.target);
});

document.getElementById('btnFullscreen').addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
});

// ========== ANIMATION ==========
const clock = new THREE.Clock();
const _mat = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _euler = new THREE.Euler();

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const speed = state.paused ? 0 : state.speed;

  sun.rotation.y += 0.001 * speed;

  planets.forEach((p) => {
    p.mesh.rotation.y += p.spinSpeed * speed;
    if (p.atmMesh) p.atmMesh.rotation.y += p.spinSpeed * 0.4 * speed;
    p.group.rotation.y += p.orbitSpeed * speed;
    p.moons.forEach((m) => {
      m.angle += m.orbitSpeed * speed;
      m.mesh.position.set(
        Math.cos(m.angle) * m.orbitRadius,
        Math.sin(m.angle) * m.orbitRadius * 0.15,
        Math.sin(m.angle) * m.orbitRadius
      );
      m.mesh.rotation.y += 0.02 * speed;
    });
  });

  marsMoonsGLB.forEach((m) => {
    if (!m.mesh) return;
    m.angle += m.orbitSpeed * speed;
    m.mesh.position.set(Math.cos(m.angle) * m.orbitRadius, Math.sin(m.angle) * 0.3, Math.sin(m.angle) * m.orbitRadius);
    m.mesh.rotation.y += 0.01 * speed;
  });

  asteroidData.forEach((a) => {
    a.angle += 0.00015 * speed;
    if (a.isClone) {
      a.mesh.position.x = Math.cos(a.angle) * a.radius;
      a.mesh.position.z = Math.sin(a.angle) * a.radius;
      a.mesh.rotation.x += a.rotSpeed * speed;
      a.mesh.rotation.y += a.rotSpeed * 0.7 * speed;
    } else {
      a.mesh.getMatrixAt(a.index, _mat);
      _mat.decompose(_pos, _quat, _scale);
      _pos.set(Math.cos(a.angle) * a.radius, a.y, Math.sin(a.angle) * a.radius);
      _euler.set(a.angle * 2, a.angle * 1.5, a.angle);
      _quat.setFromEuler(_euler);
      _scale.setScalar(a.scale);
      _mat.compose(_pos, _quat, _scale);
      a.mesh.setMatrixAt(a.index, _mat);
      a.mesh.instanceMatrix.needsUpdate = true;
    }
  });

  const earthWorld = new THREE.Vector3();
  earth.mesh.getWorldPosition(earthWorld);
  earthUniforms.sunDir.value.copy(new THREE.Vector3(0, 0, 0).sub(earthWorld).normalize());

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(raycastTargets, false);
  if (hits.length > 0) {
    const name = hits[0].object.userData.planetName;
    const planet = planets.find((p) => p.name === name);
    if (planet) {
      outlinePass.selectedObjects = [planet.mesh];
      document.body.style.cursor = 'pointer';
    }
  } else {
    outlinePass.selectedObjects = [];
    document.body.style.cursor = 'default';
  }

  if (state.isFocusing) {
    state.focusProgress = Math.min(state.focusProgress + dt * 1.4, 1);
    const t = easeInOutCubic(state.focusProgress);
    camera.position.lerpVectors(state.focusStartCam, state.focusEndCam, t);
    controls.target.lerpVectors(state.focusStartTarget, state.focusEndTarget, t);
    if (state.focusProgress >= 1) state.isFocusing = false;
  } else if (state.isResetting) {
    state.focusProgress = Math.min(state.focusProgress + dt * 1.2, 1);
    const t = easeInOutCubic(state.focusProgress);
    camera.position.lerpVectors(state.resetStartCam, DEFAULT_CAM, t);
    controls.target.lerpVectors(state.resetStartTarget, DEFAULT_TARGET, t);
    if (state.focusProgress >= 1) state.isResetting = false;
  } else if (state.selectedPlanet && !state.paused) {
    const wp = new THREE.Vector3();
    state.selectedPlanet.mesh.getWorldPosition(wp);
    controls.target.lerp(wp, 0.03);
  }

  controls.update();
  composer.render();
}

animate();

window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  outlinePass.resolution.set(w, h);
});
