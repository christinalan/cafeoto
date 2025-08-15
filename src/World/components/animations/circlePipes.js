// components/animations/pipes.js
import * as THREE from "../../../js/build/three.module.js";

// ========= TWEAKABLES =========
const SPHERE_R = 1000;      // must match your sky sphere radius
const INSET    = 1.5;      // slightly inside to avoid z-fighting

// Pipe "family" (meridians) and short segments per pipe
const PIPE_COUNT         = 13;   // meridians around full 360°
const SEGMENTS_PER_PIPE  = 5;   // short pieces per meridian
const SEG_LENGTH_RAD     = Math.PI / 6; // ~5° tall per segment

// Cylinder used as the base for a segment (small height; just for vertex density)
const SEG_RADIUS     = 3;
const RADIAL_SEGS    = 32;
const HEIGHT_SEGS    = 24;

// Reflections
const CUBECAM_UPDATE_FRAMES = 6;

// Waterfall texture on the tubes
const TEX = {
  repeat: new THREE.Vector2(1, 8),
  scrollSpeedY: 0.08,
  rippleXSpeed: 2.0,
  rippleXAmp:   0.005
};

// Subtle surface shimmer
const RIPPLE = {
  amp: 0.6,
  freqCirc: 6.0,
  freqY:   0.0025,
  speed:   2.0
};

// Audio → motion (latitude rate, rad/sec). Positive = move DOWN, negative = move UP.
const DROP = {
  baseSpeed: 0.10,     // always a little motion
  scale:     2,     // audio adds/subtracts this much
  easePow:   0.6,      // sqrt-like curve
  jitter:    0.30      // ±30% per-segment speed variation
};

const IDLE_VIS_FLOOR = 0.18;   // 0..1 visibility floor when below threshold
const START_VISIBLE  = 0.30; 

// Segment activation (visibility) gates
const THRESH = {
  low:  0.05, // lows must exceed this to light DOWN-moving segments
  high: 0.10  // highs must exceed this to light UP-moving segments
};
// Smooth the on/off so it doesn’t flicker
const ENV = {
  attack: 0.05, // seconds (rise)
  release: 0.25 // seconds (fall)
};

// ========= HELPERS =========
function avgRange(arr, a, b){ let s=0,c=0; for(let i=a;i<b;i++){ s+=arr[i]; c++; } return c? s/c:0; }
function readBands(analyser){
  if(!analyser) return {low:0, mid:0, high:0};
  const d = analyser.getFrequencyData(); if(!d||!d.length) return {low:0, mid:0, high:0};
  const n = d.length;
  return {
    low:  avgRange(d, 0, Math.floor(n*0.20)) / 255,
    mid:  avgRange(d, Math.floor(n*0.20), Math.floor(n*0.75)) / 255,
    high: avgRange(d, Math.floor(n*0.75), n) / 255
  };
}
// φ = polar (0..π), λ = azimuth (-π..π)
function sphToCart(R, phi, lambda, out = new THREE.Vector3()){
  const s = Math.sin(phi);
  out.set(
    R * s * Math.cos(lambda),
    R * Math.cos(phi),
    R * s * Math.sin(lambda)
  );
  return out;
}
function tangentBasis(phi, lambda, N, Tlam, B){
  const s = Math.sin(phi), c = Math.cos(phi);
  N.set(s*Math.cos(lambda), c, s*Math.sin(lambda)).normalize();
  Tlam.set(-Math.sin(lambda), 0, Math.cos(lambda)).normalize();
  B.copy(N).cross(Tlam).normalize();
}
// envelope
function envFollow(curr, target, dt, atk, rel){
  const k = target > curr ? (1 - Math.exp(-dt/atk)) : (1 - Math.exp(-dt/rel));
  return curr + (target - curr) * k;
}

// ========= MAIN =========
export function createSphericalPipes({
  scene,
  camera,
  renderer,
  audioUrl = "sounds/CafeOTO.mp3"
}) {
  if (!scene || !camera) throw new Error("createReflectiveAudioPipes: scene & camera are required");
  const group = new THREE.Group();

  // --- reflections
  const cubeRT = new THREE.WebGLCubeRenderTarget(512, { generateMipmaps:true, minFilter:THREE.LinearMipmapLinearFilter });
  const cubeCam = new THREE.CubeCamera(1, 10000, cubeRT);
  scene.add(cubeCam);
  scene.environment = cubeRT.texture;

  // --- shared texture
  const loader = new THREE.TextureLoader();
  const sharedTex = loader.load("images/textures/gqrx/32.png");
  sharedTex.wrapS = THREE.RepeatWrapping;
  sharedTex.wrapT = THREE.RepeatWrapping;
  sharedTex.repeat.copy(TEX.repeat);

  // --- audio
  const listener = new THREE.AudioListener();
  camera.add(listener);

  const soundHost = new THREE.Object3D();
  scene.add(soundHost);

  let audio = null;
  let analyser = null;

  const audioLoader = new THREE.AudioLoader();
  audioLoader.load(
    audioUrl,
    (buffer) => {
      audio = new THREE.PositionalAudio(listener);
      audio.setBuffer(buffer);
      audio.setDistanceModel("inverse");
      audio.setRefDistance(60);
      audio.setRolloffFactor(1.2);
      audio.setMaxDistance(10000);
      audio.setDirectionalCone(360, 360, 0);
      audio.setLoop(true);
      audio.setVolume(1);

      soundHost.add(audio);
      const ctx = listener.context;
      if (ctx && ctx.state === "suspended") ctx.resume();
      if (!audio.isPlaying) audio.play();

      analyser = new THREE.AudioAnalyser(audio, 1024);
      analyser.analyser.smoothingTimeConstant = 0.8;
      analyser.analyser.minDecibels = -100;
      analyser.analyser.maxDecibels = -10;
    },
    undefined,
    (err) => console.error("[audio] load error:", err)
  );

  // --- material (shared)
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.25,
    metalness: 0.3,
    roughness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    envMap: cubeRT.texture,
    envMapIntensity: 1,
    map: sharedTex,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  // --- a small cylinder we’ll “wrap” onto the sphere per-segment
  const segGeoBase = new THREE.CylinderGeometry(
    SEG_RADIUS, SEG_RADIUS, /*height*/ SEG_LENGTH_RAD, RADIAL_SEGS, HEIGHT_SEGS, true
  );

  // For the base geo we cache per-vertex params alpha/v/r (so we can place on sphere)
  (function cacheSegParams(g){
    const pos = g.attributes.position;
    const yHalf = SEG_LENGTH_RAD * 0.5;
    const alphaArr = new Float32Array(pos.count);
    const vArr     = new Float32Array(pos.count);
    const rArr     = new Float32Array(pos.count);
    for(let vi=0; vi<pos.count; vi++){
      const ix = vi*3, iy = ix+1, iz = ix+2;
      const x  = pos.array[ix], y = pos.array[iy], z = pos.array[iz];
      alphaArr[vi] = Math.atan2(z, x);
      rArr[vi]     = Math.hypot(x, z);
      vArr[vi]     = (y + yHalf) / (SEG_LENGTH_RAD); // 0..1
    }
    g.userData.alpha = alphaArr;
    g.userData.v     = vArr;
    g.userData.r     = rArr;
  })(segGeoBase);

  // --- build a lot of short segments on 360° meridians
  function buildSegments() {
    while (group.children.length) group.remove(group.children[0]);

    for (let p = 0; p < PIPE_COUNT; p++) {
      // uniform coverage around full 360°
      const lambda0 = -Math.PI + (p / PIPE_COUNT) * Math.PI * 2;

      for (let s = 0; s < SEGMENTS_PER_PIPE; s++) {
        const geo = segGeoBase.clone(); // small, so cloning is OK
        // store a copy of cached params on this clone
        geo.userData.alpha = segGeoBase.userData.alpha;
        geo.userData.v     = segGeoBase.userData.v;
        geo.userData.r     = segGeoBase.userData.r;

        const mesh = new THREE.Mesh(geo, material);

        // LAT start random so the dome is filled from the first frame
        mesh.userData.phiOffset = Math.random() * Math.PI; // 0..π
        mesh.userData.lambda0   = lambda0;

        // per-segment personality
        mesh.userData.speedJitter = 1 + (Math.random()*2 - 1) * DROP.jitter;   // ±
        mesh.userData.audioWeight = THREE.MathUtils.randFloat(0.7, 1.3);       // 0.7..1.3
        mesh.userData.env = START_VISIBLE;  // visibility envelope 0..1
        mesh.visible = true;

        group.add(mesh);
      }
    }
  }

  buildSegments();

  // --- animation state
  let frame = 0;
  let tRipple = 0;

  // temp vectors
  const N  = new THREE.Vector3();
  const Tλ = new THREE.Vector3();
  const B  = new THREE.Vector3();
  const P  = new THREE.Vector3();

  const api = {
    group,

    tick(dt = 1/60){
      if (!renderer) return;

      // reflections
      frame++;
      if (frame % CUBECAM_UPDATE_FRAMES === 0) {
        cubeCam.position.copy(camera.position);
        const vis = group.visible;
        group.visible = false;
        cubeCam.update(renderer, scene);
        group.visible = vis;
      }

      // audio → up/down control and activation gates
      const bands = readBands(analyser);
    //   console.log(bands);
      const lowE  = Math.pow(Math.max(0, bands.low  || 0), DROP.easePow); // 0..1
      const highE = Math.pow(Math.max(0, bands.high || 0), DROP.easePow); // 0..1
      // signed control: positive = go DOWN, negative = go UP
      const signedControl = (lowE - highE);

      // global base rate (then individualized per segment)
      const dPhiBase = DROP.baseSpeed + DROP.scale * signedControl; // rad/sec

      // texture + ripple time
      sharedTex.offset.y -= dt * TEX.scrollSpeedY;
      const t = performance.now() / 1000;
      sharedTex.offset.x = Math.sin(t * TEX.rippleXSpeed) * TEX.rippleXAmp;
      tRipple += dt * RIPPLE.speed;

      // thresholds turned into [0..1] "excess" for envelopes
      const lowExcess  = Math.max(0, (bands.low  || 0) - THRESH.low ) / Math.max(1e-6, (1 - THRESH.low));
      const highExcess = Math.max(0, (bands.high || 0) - THRESH.high) / Math.max(1e-6, (1 - THRESH.high));

      // animate every little segment
      for (const mesh of group.children) {
        if (!mesh.isMesh) continue;

        const geo = mesh.geometry;
        const pos = geo.attributes.position;
        const alphaArr = geo.userData.alpha;
        const vArr     = geo.userData.v;
        const rArr     = geo.userData.r;

        const lambda0 = mesh.userData.lambda0;
        let   phiOff  = mesh.userData.phiOffset;

        // per-segment speed with jitter & weight
        const speed = (dPhiBase * (mesh.userData.speedJitter || 1)) * (mesh.userData.audioWeight || 1);

        // advance latitude (wrap 0..π)
        phiOff += speed * dt;
        if (phiOff < 0)      phiOff += Math.PI;
        else if (phiOff > Math.PI) phiOff -= Math.PI;
        mesh.userData.phiOffset = phiOff;

        // thresholds → excess
        let lowExcess  = 0, highExcess = 0;
        if (analyser) {
        lowExcess  = Math.max(0, (bands.low  || 0) - THRESH.low ) / Math.max(1e-6, 1 - THRESH.low);
        highExcess = Math.max(0, (bands.high || 0) - THRESH.high) / Math.max(1e-6, 1 - THRESH.high);
        }

        // if moving down: gate by lows; if moving up: gate by highs
        const gate = (speed >= 0 ? lowExcess : highExcess);

        // blend in the idle floor so they don’t vanish
        const target = Math.max(IDLE_VIS_FLOOR, gate) * (mesh.userData.audioWeight || 1);

        mesh.userData.env = envFollow(
        mesh.userData.env,
        THREE.MathUtils.clamp(target, 0, 1),
        dt, ENV.attack, ENV.release
        );

        // keep them visible; you can also modulate opacity by env if you want
        mesh.visible = mesh.userData.env > 0.02;

        if (!mesh.visible) continue; // skip the math when hidden

        // place this short cylinder segment onto the sphere
        for (let vi = 0; vi < pos.count; vi++) {
          const ix = vi*3, iy = ix+1, iz = ix+2;

          const alpha = alphaArr[vi];
          const v     = vArr[vi];     // 0..1 inside the short segment
          const r     = rArr[vi];

          // segment spans SEG_LENGTH_RAD in φ
          const phi = (phiOff + v * SEG_LENGTH_RAD) % Math.PI;
          sphToCart(SPHERE_R - INSET, phi, lambda0, P);

          // local basis
          tangentBasis(phi, lambda0, N, Tλ, B);

          // tube cross-section in tangent plane
          const dx = Math.cos(alpha) * r;
          const dz = Math.sin(alpha) * r;

          let vx = P.x + Tλ.x * dx + B.x * dz;
          let vy = P.y + Tλ.y * dx + B.y * dz;
          let vz = P.z + Tλ.z * dx + B.z * dz;

          // tiny shimmer
          if (RIPPLE.amp !== 0){
            const wave = Math.sin(alpha * RIPPLE.freqCirc + v * SEG_LENGTH_RAD / Math.PI * SPHERE_R * RIPPLE.freqY + tRipple) * RIPPLE.amp;
            vx += B.x * wave * 0.25;
            vy += B.y * wave * 0.25;
            vz += B.z * wave * 0.25;
          }

          pos.array[ix] = vx;
          pos.array[iy] = vy;
          pos.array[iz] = vz;
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();
      }
    },

    get audio(){ return audio; },
    get analyser(){ return analyser; }
  };

  return api;
}
