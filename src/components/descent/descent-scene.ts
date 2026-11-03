import * as THREE from "three";

export type DescentStopArt = {
  art: string;
  accent: string;
};

export type DescentScene = {
  /** 0 → first waypoint, 1 → last waypoint */
  setProgress: (value: number) => void;
  setPointer: (x: number, y: number) => void;
  setActive: (active: boolean) => void;
  onFrame: (listener: (state: { stop: number; camera: THREE.Vector3 }) => void) => void;
  dispose: () => void;
};

const ISLAND_SIZE = 4.8;
const STOP_DEPTH = 16;
const STOP_DROP = 5;

/** Luma-keyed billboard: the generated art sits on pure black, so brightness becomes alpha. */
const islandVertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const islandFragment = `
  uniform sampler2D uMap;
  uniform float uOpacity;
  uniform float uGlow;
  varying vec2 vUv;
  void main() {
    vec4 c = texture2D(uMap, vUv);
    float luma = max(c.r, max(c.g, c.b));
    float alpha = smoothstep(0.06, 0.2, luma);
    alpha *= smoothstep(0.64, 0.5, length(vUv - 0.5));
    gl_FragColor = vec4(c.rgb * (1.0 + uGlow), alpha * uOpacity);
  }
`;

const starVertex = `
  attribute float aSize;
  attribute float aTwinkle;
  uniform float uTime;
  uniform float uWarp;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float depth = -mv.z;
    gl_PointSize = min(aSize * (1.0 + uWarp * 0.6) * (220.0 / depth), 7.0);
    vAlpha = smoothstep(70.0, 6.0, depth) * (0.55 + 0.45 * sin(uTime * 1.3 + aTwinkle));
    gl_Position = projectionMatrix * mv;
  }
`;

const starFragment = `
  varying float vAlpha;
  uniform vec3 uColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vAlpha;
    gl_FragColor = vec4(uColor, a);
  }
`;

function glowTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,0.9)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.28)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function islandPosition(index: number) {
  const side = index % 2 === 0 ? 1 : -1;
  return new THREE.Vector3(side * 3, -index * STOP_DROP, -index * STOP_DEPTH);
}

export function createDescentScene(host: HTMLElement, stops: DescentStopArt[]): DescentScene {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const width = () => host.clientWidth || window.innerWidth;
  const height = () => host.clientHeight || window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(width(), height());
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, width() / height(), 0.1, 160);

  scene.add(new THREE.HemisphereLight("#bdf7ef", "#2a0f3a", 1.1));
  const key = new THREE.DirectionalLight("#ffffff", 1.4);
  key.position.set(4, 6, 8);
  scene.add(key);

  const disposables: { dispose: () => void }[] = [];
  const loader = new THREE.TextureLoader();
  const glow = glowTexture();
  disposables.push(glow);

  type Island = {
    root: THREE.Group;
    billboard: THREE.Mesh;
    material: THREE.ShaderMaterial;
    halo: THREE.Sprite;
    ring: THREE.Mesh;
    cubes: THREE.InstancedMesh;
    cubeSeeds: { radius: number; speed: number; phase: number; lift: number; size: number }[];
    base: THREE.Vector3;
  };

  const islands: Island[] = stops.map((stop, index) => {
    const base = islandPosition(index);
    const root = new THREE.Group();
    root.position.copy(base);
    scene.add(root);

    const texture = loader.load(stop.art);
    // Raw sRGB values: the luma key and output both expect display-space color.
    texture.colorSpace = THREE.NoColorSpace;
    texture.anisotropy = 4;
    disposables.push(texture);

    const material = new THREE.ShaderMaterial({
      vertexShader: islandVertex,
      fragmentShader: islandFragment,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uMap: { value: texture },
        uOpacity: { value: 1 },
        uGlow: { value: 0 },
      },
    });
    const geometry = new THREE.PlaneGeometry(ISLAND_SIZE, ISLAND_SIZE);
    const billboard = new THREE.Mesh(geometry, material);
    billboard.renderOrder = 2;
    root.add(billboard);
    disposables.push(material, geometry);

    const haloMaterial = new THREE.SpriteMaterial({
      map: glow,
      color: new THREE.Color(stop.accent),
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const halo = new THREE.Sprite(haloMaterial);
    halo.scale.setScalar(ISLAND_SIZE * 1.9);
    halo.position.z = -0.6;
    halo.renderOrder = 1;
    root.add(halo);
    disposables.push(haloMaterial);

    const ringGeometry = new THREE.TorusGeometry(ISLAND_SIZE * 0.7, 0.016, 8, 160);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(stop.accent),
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2.15;
    ring.position.y = -ISLAND_SIZE * 0.3;
    ring.renderOrder = 3;
    root.add(ring);
    disposables.push(ringGeometry, ringMaterial);

    const cubeCount = 16;
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(stop.accent),
      emissive: new THREE.Color(stop.accent),
      emissiveIntensity: 0.55,
      roughness: 0.35,
      metalness: 0.1,
      transparent: true,
      opacity: 0.92,
    });
    const cubes = new THREE.InstancedMesh(cubeGeometry, cubeMaterial, cubeCount);
    cubes.renderOrder = 4;
    root.add(cubes);
    disposables.push(cubeGeometry, cubeMaterial);
    const cubeSeeds = Array.from({ length: cubeCount }, (_, seed) => ({
      radius: ISLAND_SIZE * (0.5 + ((seed * 37) % 17) / 40),
      speed: 0.18 + ((seed * 13) % 7) / 30,
      phase: (seed / cubeCount) * Math.PI * 2,
      lift: (((seed * 29) % 11) / 11 - 0.5) * 2.4,
      size: 0.08 + ((seed * 7) % 5) / 38,
    }));

    return { root, billboard, material, halo, ring, cubes, cubeSeeds, base };
  });

  const path = new THREE.CatmullRomCurve3(islands.map((island) => island.base.clone()));
  const pathGeometry = new THREE.BufferGeometry().setFromPoints(path.getPoints(240));
  const pathMaterial = new THREE.LineDashedMaterial({
    color: "#7fdad2",
    dashSize: 0.35,
    gapSize: 0.28,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  });
  const pathLine = new THREE.Line(pathGeometry, pathMaterial);
  pathLine.computeLineDistances();
  scene.add(pathLine);
  disposables.push(pathGeometry, pathMaterial);

  const totalDepth = (stops.length - 1) * STOP_DEPTH;
  const starCount = 2600;
  const starPositions = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);
  const starTwinkle = new Float32Array(starCount);
  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 70;
    starPositions[i * 3 + 1] = 12 - Math.random() * ((stops.length - 1) * STOP_DROP + 30);
    starPositions[i * 3 + 2] = 14 - Math.random() * (totalDepth + 50);
    starSizes[i] = 0.4 + Math.random() * 1.8;
    starTwinkle[i] = Math.random() * Math.PI * 2;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  starGeometry.setAttribute("aSize", new THREE.BufferAttribute(starSizes, 1));
  starGeometry.setAttribute("aTwinkle", new THREE.BufferAttribute(starTwinkle, 1));
  const starMaterial = new THREE.ShaderMaterial({
    vertexShader: starVertex,
    fragmentShader: starFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uWarp: { value: 0 },
      uColor: { value: new THREE.Color("#e6fffb") },
    },
  });
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
  disposables.push(starGeometry, starMaterial);

  let camCurve: THREE.CatmullRomCurve3;
  let lookCurve: THREE.CatmullRomCurve3;
  const buildCameraPath = () => {
    const aspect = width() / height();
    const wide = aspect > 0.95;
    const lateral = wide ? Math.min(2.6, 1.2 + aspect * 0.8) : 0;
    const lift = wide ? 0 : -1.7;
    const distance = wide ? 8.2 : 10.5;
    const camPoints: THREE.Vector3[] = [];
    const lookPoints: THREE.Vector3[] = [];
    islands.forEach((island, index) => {
      const side = index % 2 === 0 ? 1 : -1;
      const x = island.base.x - side * lateral;
      camPoints.push(new THREE.Vector3(x, island.base.y + 0.9 + lift, island.base.z + distance));
      lookPoints.push(new THREE.Vector3(x, island.base.y + lift, island.base.z));
    });
    camCurve = new THREE.CatmullRomCurve3(camPoints, false, "centripetal");
    lookCurve = new THREE.CatmullRomCurve3(lookPoints, false, "centripetal");
  };
  buildCameraPath();

  let target = 0;
  let current = 0;
  let pointerX = 0;
  let pointerY = 0;
  let smoothPointerX = 0;
  let smoothPointerY = 0;
  let warp = 0;
  let active = true;
  let frame = 0;
  let listener: ((state: { stop: number; camera: THREE.Vector3 }) => void) | null = null;

  const camPos = new THREE.Vector3();
  const lookPos = new THREE.Vector3();
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const position = new THREE.Vector3();
  const euler = new THREE.Euler();
  const clock = new THREE.Clock();
  const segments = stops.length - 1;

  const render = () => {
    const t = clock.getElapsedTime();
    const previous = current;
    current += (target - current) * (reduceMotion ? 1 : 0.075);
    const velocity = Math.abs(current - previous) * 60;
    warp += (Math.min(1, velocity * 2.4) - warp) * 0.08;

    const stopFloat = current * segments;
    const index = Math.min(segments - 1, Math.floor(stopFloat));
    const fraction = stopFloat - index;
    const eased = smoothstep(0.18, 0.82, fraction);
    const u = segments === 0 ? 0 : (index + eased) / segments;

    camCurve.getPoint(u, camPos);
    lookCurve.getPoint(u, lookPos);

    smoothPointerX += (pointerX - smoothPointerX) * 0.05;
    smoothPointerY += (pointerY - smoothPointerY) * 0.05;
    if (!reduceMotion) {
      camPos.x += smoothPointerX * 0.45;
      camPos.y += -smoothPointerY * 0.3;
    }
    camera.position.copy(camPos);
    camera.lookAt(lookPos);
    camera.fov = 50 + (reduceMotion ? 0 : warp * 14);
    camera.updateProjectionMatrix();

    starMaterial.uniforms.uTime.value = t;
    starMaterial.uniforms.uWarp.value = reduceMotion ? 0 : warp;

    islands.forEach((island, islandIndex) => {
      const bob = reduceMotion ? 0 : Math.sin(t * 0.8 + islandIndex * 1.7) * 0.18;
      island.root.position.set(island.base.x, island.base.y + bob, island.base.z);
      island.billboard.quaternion.copy(camera.quaternion);
      island.halo.material.opacity = 0.28 + Math.sin(t * 1.2 + islandIndex) * 0.08;

      const focus = 1 - Math.min(1, Math.abs(stopFloat - islandIndex));
      island.material.uniforms.uGlow.value = focus * 0.18;
      const distance = camera.position.distanceTo(island.root.position);
      island.material.uniforms.uOpacity.value = smoothstep(62, 18, distance);

      if (!reduceMotion) {
        island.ring.rotation.z = t * 0.25 * (islandIndex % 2 === 0 ? 1 : -1);
      }

      island.cubeSeeds.forEach((seed, cubeIndex) => {
        const angle = seed.phase + (reduceMotion ? 0 : t * seed.speed);
        position.set(
          Math.cos(angle) * seed.radius,
          seed.lift + (reduceMotion ? 0 : Math.sin(t * 0.9 + seed.phase) * 0.2),
          Math.sin(angle) * seed.radius * 0.55,
        );
        euler.set(t * seed.speed * 2, t * seed.speed * 1.6, 0);
        quaternion.setFromEuler(euler);
        scale.setScalar(seed.size);
        matrix.compose(position, quaternion, scale);
        island.cubes.setMatrixAt(cubeIndex, matrix);
      });
      island.cubes.instanceMatrix.needsUpdate = true;
    });

    renderer.render(scene, camera);
    listener?.({ stop: stopFloat, camera: camera.position });
  };

  const tick = () => {
    frame = requestAnimationFrame(tick);
    if (!active) return;
    render();
  };
  tick();

  const onResize = () => {
    camera.aspect = width() / height();
    camera.updateProjectionMatrix();
    renderer.setSize(width(), height());
    buildCameraPath();
  };
  window.addEventListener("resize", onResize);

  return {
    setProgress: (value) => {
      target = Math.min(1, Math.max(0, value));
    },
    setPointer: (x, y) => {
      pointerX = x;
      pointerY = y;
    },
    setActive: (value) => {
      active = value;
    },
    onFrame: (fn) => {
      listener = fn;
    },
    dispose: () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      disposables.forEach((item) => item.dispose());
      renderer.dispose();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
    },
  };
}
