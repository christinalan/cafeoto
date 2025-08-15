// components/scene.js (replace your sphere/material section)

import * as THREE from "../../js/build/three.module.js";

function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0xBA0000, 0, 5000);

  // ---------- Audio-react config ----------
  const REACT = {
    lowThresh:  0.10,  // lower -> easier to trigger fog growth
    attack:     0.06,  // seconds (rise faster)
    release:    0.35,  // seconds (fall slower)
  };

  // Base fog distances (what you set initially)
  const FOG_BASE = { near: 100, far: 5000 };
  // How far we let fog push when bass is strong
  const FOG_LIMITS = {
    nearMin: 15,      // closest the fog front can move toward camera
    farMin:  1200,    // closest the fog end can come in
  };

  // Helpers
  const clamp01 = (v)=> Math.max(0, Math.min(1, v));
  const lerp    = (a,b,t)=> a + (b-a)*t;
  const avgRange = (arr,a,b)=>{ let s=0,c=0; for(let i=a;i<b;i++){ s+=arr[i]; c++; } return c? s/c:0; };
  const remapExcess = (v, th)=> Math.max(0, v - th) / Math.max(1e-6, (1 - th));
  function envFollow(curr, target, dt, atk, rel) {
    const k = target > curr ? (1 - Math.exp(-dt / atk)) : (1 - Math.exp(-dt / rel));
    return curr + (target - curr) * k;
  }
  function readBands(analyser){
    if (!analyser) return { low:0, mid:0, high:0 };
    const d = analyser.getFrequencyData();
    if (!d || !d.length) return { low:0, mid:0, high:0 };
    const n = d.length;
    return {
      low:  avgRange(d, 0, Math.floor(n*0.20)) / 255,
      mid:  avgRange(d, Math.floor(n*0.20), Math.floor(n*0.75)) / 255,
      high: avgRange(d, Math.floor(n*0.75), n) / 255,
    };
  }

  // --- load textures 1..44 ---
  const textureLoader = new THREE.TextureLoader();
  const textures = [];
  for (let i = 1; i <= 44; i++) {
    const tex = textureLoader.load(`images/textures/gqrx/${i}.png`);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 2);
    textures.push(tex);
  }

  const R = 450;
  const EPS = 2; // tiny offset to avoid z-fighting

  // ---------- INNER (dark, faces inward) ----------
  const geoInner = new THREE.SphereGeometry(R, 60, 40);
  geoInner.scale(-1, 1, 1); // invert so faces point inward (visible from inside)

  const matInner = new THREE.MeshPhongMaterial({
    color: 0x000000,         // dark interior
    specular: 0x111111,      // faint specular so it isn’t totally flat
    shininess: 10,
    transparent: true,
    opacity: 0.8,           // how dark it feels inside (raise for darker)
    side: THREE.FrontSide,   // with scale(-1), FrontSide = inside faces
    depthWrite: false,
  });

  const innerDome = new THREE.Mesh(geoInner, matInner);
  scene.add(innerDome);

  // ---------- OUTER (textured, visible from its backfaces) ----------
  const geoOuter = new THREE.SphereGeometry(R + EPS, 60, 40);
  // not inverted; we’ll render its backfaces so we see the outside skin from inside

  const matA = new THREE.MeshPhongMaterial({
    map: textures[0],
    side: THREE.FrontSide,    // see the outer surface from inside
    shininess: 70,
    specular: new THREE.Color(0x888888),
    transparent: true,
    opacity: 0.3,           // how much the texture “bleeds” through
    depthWrite: false,
  });

  const matB = new THREE.MeshPhongMaterial({
    map: textures[1],
    side: THREE.FrontSide,
    shininess: 70,
    specular: new THREE.Color(0x888888),
    transparent: true,
    opacity: 0.0,            // start hidden; crossfade will raise this
    depthWrite: false,
  });

  const skyA = new THREE.Mesh(geoOuter, matA);
  const skyB = new THREE.Mesh(geoOuter, matB);
  scene.add(skyA, skyB);

  // ---------- crossfade + scroll ----------
  const scrollSpeedA = 0.01;
  const scrollSpeedB = 0.01;
  const switchIntervalSec = 15;
  const fadeDurationSec   = 10;

  let currentIndex = 0;
  let nextIndex    = 1;
  let isFading     = false;
  let fadeStartMs  = 0;
  let lastSwitchMs = performance.now();

  function pickNextIndex(exclude) {
    let idx = Math.floor(Math.random() * textures.length);
    if (idx === exclude) idx = (idx + 1) % textures.length;
    return idx;
  }

  function startFade(now) {
    nextIndex = pickNextIndex(currentIndex);
    matB.map = textures[nextIndex];
    // match scroll so the waterfall is continuous
    matB.map.offset.copy(matA.map.offset);
    matB.needsUpdate = true;
    isFading = true;
    fadeStartMs = now;
    lastSwitchMs = now;
  }

    // ---------- analyser hookup ----------
    let analyser = null;
    scene.attachAnalyser = (a) => { analyser = a || null; };
  
    // smoothed bass envelope 0..1
    let lowEnv = 0;
  

  scene.tick = (dt = 1/60) => {
    // slow pan
    skyA.rotation.y += 0.0005;
    skyB.rotation.y += 0.0005;

    // gentle horizontal ripple
    const t = performance.now() / 1000;
    const rippleSpeed = 2.0, rippleAmp = 0.005;
    if (matA.map) matA.map.offset.x = Math.sin(t * rippleSpeed) * rippleAmp;
    if (matB.map) matB.map.offset.x = Math.sin(t * rippleSpeed) * rippleAmp;

    // vertical scroll (waterfall)
    if (matA.map) matA.map.offset.y -= dt * scrollSpeedA;
    if (matB.map) matB.map.offset.y -= dt * scrollSpeedB;

    // timed crossfade
    const now = performance.now();
    if (!isFading && now - lastSwitchMs >= switchIntervalSec * 1000) startFade(now);

    if (isFading) {
      const u = Math.min((now - fadeStartMs) / (fadeDurationSec * 1000), 1);
      matA.opacity = 0.28 * (1 - u); // keep outer skin subtle
      matB.opacity = 0.28 * u;

      if (u >= 1) {
        currentIndex = nextIndex;
        matA.map = matB.map;
        matA.opacity = 0.28;
        matA.needsUpdate = true;
        matB.opacity = 0.0;
        isFading = false;
      }
    }

      // ---------- AUDIO → FOG (bass boosts fog) ----------
    // Read bands and smooth low
    const bands = readBands(analyser);
    const lowExcess = remapExcess(bands.low, REACT.lowThresh); // 0..1 above threshold
    lowEnv = envFollow(lowEnv, lowExcess, dt, REACT.attack, REACT.release);

    // Map to fog distances: higher bass => denser fog (nearer near, nearer far)
    // near:  baseNear -> nearMin
    // far:   baseFar  -> farMin
    const k = clamp01(lowEnv); // 0..1
    const newNear = lerp(FOG_BASE.near, FOG_LIMITS.nearMin, k);
    const newFar  = lerp(FOG_BASE.far,  FOG_LIMITS.farMin,  k);

    scene.fog.near = newNear;
    scene.fog.far  = Math.max(newNear + 50, newFar); // keep far > near by a margin

    // Optional: tint fog slightly darker on strong bass (subtle)
    const baseFog = new THREE.Color(0xBA0000);
    const darkFog = new THREE.Color(0x400000);
    scene.fog.color.lerpColors(baseFog, darkFog, k * 0.5);
  };

  return scene;
}

export { createScene };



// function createScene() {
//   const scene = new THREE.Scene();

//   // Load texture (equirectangular panoramic image)
//   const textureLoader = new THREE.TextureLoader();
//   const texture = textureLoader.load("images/textures/try.jpeg");
//   texture.mapping = THREE.EquirectangularReflectionMapping; // make sure it wraps correctly

//   // Create an inverted sphere
//   const geometry = new THREE.SphereGeometry(500, 60, 40); // radius should be big enough to enclose your scene
//   geometry.scale(-1, 1, 1); // invert the sphere so faces point inward

//   const material = new THREE.MeshBasicMaterial({ map: texture });
//   const skySphere = new THREE.Mesh(geometry, material);
//   scene.add(skySphere);

//   // Fog for depth
//   scene.fog = new THREE.Fog(0xBA0000, 0, 2000);

//   // Optional: rotate sphere slowly
//   scene.tick = () => {
//     skySphere.rotation.y += 0.0005; // slow pan
//   };

//   return scene;
// }

// export { createScene };

// import * as THREE from "../../js/build/three.module.js";

// function createScene() {
//   const scene = new THREE.Scene();

//   // Load texture (equirectangular panoramic image)
//   const textureLoader = new THREE.TextureLoader();
//   const textures = [
//     textureLoader.load("images/textures/gqrx/1.png"),
//     textureLoader.load("images/textures/gqrx/2.png"),
//     textureLoader.load("images/textures/gqrx/3.png"),
//     textureLoader.load("images/textures/gqrx/4.png"),
//   ];

//   textures.forEach(tex => {
//     tex.mapping = THREE.EquirectangularReflectionMapping;
//     tex.needsUpdate = true;
//   });

//   const sphereGeometry = new THREE.SphereGeometry(800, 60, 40);
//   sphereGeometry.scale(-1, 1, 1); // invert so you're inside it
//   const sphereMaterial = new THREE.MeshBasicMaterial({ map: textures[0] });
  
//   const skySphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
//   scene.add(skySphere);
  
//   // Change texture every 5 seconds
//   let currentIndex = 0;
//   setInterval(() => {
//     currentIndex = (currentIndex + 1) % textures.length;
//     sphereMaterial.map = textures[currentIndex];
//     sphereMaterial.needsUpdate = true;
//   }, 10000);

//   // Fog for depth
//   scene.fog = new THREE.Fog(0xBA0000, 0, 3000);

//   // Optional: rotate sphere slowly
//   scene.tick = () => {
//     skySphere.rotation.y += 0.0005; // slow pan
//   };

//   return scene;
// }

// export { createScene };