// components/animations/pipes.js
import * as THREE from "../../../js/build/three.module.js";

// ------------ tweakables ------------
const PIPE_COUNT   = 5;
const HEIGHT       = 3000;
const RADIUS       = 3;
const RADIAL_SEGS  = 10;
const HEIGHT_SEGS  = 10;

const X_SPREAD     = 300;
const Z_BASE       = -200;
const Z_JITTER     = 400;

const CUBECAM_UPDATE_FRAMES = 6;

// texture (waterfall look)
const TEX = {
  repeat: new THREE.Vector2(1, 8),
  scrollSpeed: 0.08,
};

// surface ripple (vertex shimmer)
const RIPPLE = {
  amp: 1.5,
  freqCirc: 6.0,
  freqY:   0.0025,
  speed:   2.0,
};

// static arc (baked once)
const ARC_Z = { strength: 0, direction: 1 };
const ARC_X = { strength: 0,   direction: 1 };

// falling motion (no bobbing)
const DROP = {
  baseSpeed: 200,     // world units/sec even with silence
  audioScale: 900,    // how much low band adds (0..1 -> +this u/s)
  easePow: 0.4,       // sqrt-ish response to lows
  perPipeJitter: 0.4 // ±25% randomization per pipe
};

// ------------ helpers ------------
function avgRange(arr, a, b){ let s=0,c=0; for(let i=a;i<b;i++){ s+=arr[i]; c++; } return c? s/c:0; }
function readBands(analyser){
  if(!analyser) return {low:0, mid:0, high:0};
  const d = analyser.getFrequencyData(); if(!d||!d.length) return {low:0,mid:0,high:0};
  const n = d.length;
  return {
    low:  avgRange(d, 0, Math.floor(n*0.20)) / 255,
    mid:  avgRange(d, Math.floor(n*0.20), Math.floor(n*0.75)) / 255,
    high: avgRange(d, Math.floor(n*0.75), n) / 255
  };
}

// ------------ main ------------
export function createReflectiveAudioPipes({
  scene,
  camera,
  renderer,
  audioUrl = "sounds/plane.mp3"
}) {
  if (!scene || !camera) throw new Error("createReflectiveAudioPipes: scene & camera are required");
  const group = new THREE.Group();

  // reflections
  const cubeRT = new THREE.WebGLCubeRenderTarget(512, { generateMipmaps:true, minFilter:THREE.LinearMipmapLinearFilter });
  const cubeCam = new THREE.CubeCamera(1, 10000, cubeRT);
  scene.add(cubeCam);
  scene.environment = cubeRT.texture;

  // shared texture
  const loader = new THREE.TextureLoader();
  const sharedTex = loader.load("images/textures/gqrx/30.png");
  sharedTex.wrapS = THREE.RepeatWrapping;
  sharedTex.wrapT = THREE.RepeatWrapping;
  sharedTex.repeat.copy(TEX.repeat);

  // audio + analyser
  const listener = new THREE.AudioListener();
  camera.add(listener);

  const soundHost = new THREE.Object3D();
  scene.add(soundHost);

  let audio = null;
  let analyser = null;
  let followIndex = null;

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

  // bright + reflective + textured
  function makeMaterial(){
    return new THREE.MeshPhysicalMaterial({
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
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }

  // build: bake arc, cache base, assign per-pipe fall jitter
  function buildPipes(){
    while(group.children.length) group.remove(group.children[0]);

    for(let i=0;i<PIPE_COUNT;i++){
      const mat = makeMaterial();
      const geo = new THREE.CylinderGeometry(RADIUS, RADIUS, HEIGHT, RADIAL_SEGS, HEIGHT_SEGS, true);

      // bake arc
      const pos = geo.attributes.position;
      const yHalf = HEIGHT * 0.5;
      for(let vi=0; vi<pos.count; vi++){
        const ix = vi*3, iy = ix+1, iz = ix+2;
        const by = pos.array[iy];
        const yNorm = by / yHalf;
        const zArc = ARC_Z.direction * ARC_Z.strength * (yNorm * yNorm);
        const xArc = ARC_X.direction * ARC_X.strength * (yNorm * yNorm);
        pos.array[ix] += xArc;
        pos.array[iz] += zArc;
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();

      // cache arced base for ripple
      geo.userData.basePos = pos.array.slice();

      const mesh = new THREE.Mesh(geo, mat);

      // layout in horizontal arc
      const a = (i / Math.max(1, PIPE_COUNT - 1)) * Math.PI * 0.9 - Math.PI * 0.45;
      const x = Math.cos(a)*3 * X_SPREAD;
      const z = Z_BASE + Math.sin(a) * X_SPREAD + (Math.random()*2 - 1) * Z_JITTER;

      // start near the top
      const topY = HEIGHT * 0.5 + 500;     // a bit above sphere ceiling
      mesh.position.set(x-500, topY, z+100);
      mesh.rotation.y = (Math.random()*2 - 1) * Math.PI;

      // per-pipe random speed jitter
      mesh.userData.speedJitter = 1 + (Math.random()*2 - 1) * DROP.perPipeJitter;

      group.add(mesh);
    }

    followIndex = Math.floor(group.children.length / 2);
  }

  buildPipes();

  // animation state
  let frame = 0;
  let tRipple = 0;

  const api = {
    group,

    tick(dt = 1/60){
      if(!renderer) return;

      // reflections
      frame++;
      if (frame % CUBECAM_UPDATE_FRAMES === 0) {
        cubeCam.position.copy(camera.position);
        const vis = group.visible;
        group.visible = false;
        cubeCam.update(renderer, scene);
        group.visible = vis;
      }

      // audio: low band drives speed
      const B = readBands(analyser);
      const lowBoost = Math.pow(Math.max(0, B.low || 0), DROP.easePow); // 0..1
      const audioSpeed = DROP.baseSpeed + DROP.audioScale * lowBoost;   // u/s

      // texture scroll + ripple time
      sharedTex.offset.y -= dt * TEX.scrollSpeed;
      tRipple += dt * RIPPLE.speed;

      // bounds
      const topY    = HEIGHT * 0.5 + 500;  // respawn height
      const bottomY = -HEIGHT * 0.5 - 500; // kill height

      // move pipes downward; respawn at top
      for(const mesh of group.children){
        if(!mesh.isMesh) continue;

        // descend
        const v = audioSpeed * (mesh.userData.speedJitter || 1);
        mesh.position.y -= v * dt;

        // recycle
        if(mesh.position.y < bottomY){
          mesh.position.y = topY;
          // (optional) small lateral jitter to avoid visible repetition
          mesh.position.x += (Math.random()*2 - 1) * 10;
          mesh.position.z += (Math.random()*2 - 1) * 10;
        }

        // ripple (around arced base)
        const g = mesh.geometry;
        const pos = g.attributes.position;
        const base = g.userData.basePos;
        if (!base || RIPPLE.amp === 0) continue;

        for(let i=0;i<pos.count;i++){
          const ix=i*3, iy=ix+1, iz=ix+2;
          const bx=base[ix], by=base[iy], bz=base[iz];

          const r = Math.hypot(bx, bz);
          const theta = Math.atan2(bz, bx);
          const wave = Math.sin(theta*RIPPLE.freqCirc + by*RIPPLE.freqY + tRipple);
          const newR = r + wave * RIPPLE.amp;

          pos.array[ix] = Math.cos(theta) * newR;
          pos.array[iy] = by;
          pos.array[iz] = Math.sin(theta) * newR;
        }
        pos.needsUpdate = true;
        g.computeVertexNormals();
      }

      // have the sound source follow one pipe (optional)
      if (audio && group.children[followIndex]) {
        const pipe = group.children[followIndex];
        pipe.updateWorldMatrix(true, false);
        pipe.getWorldPosition(soundHost.position);
        const q = new THREE.Quaternion();
        pipe.getWorldQuaternion(q);
        soundHost.setRotationFromQuaternion(q);
      }
    },

    get audio(){ return audio; },
    get analyser(){ return analyser; }
  };

  return api;
}
