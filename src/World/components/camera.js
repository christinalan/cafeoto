// import * as THREE from "../../js/build/three.module.js";
// import { GUI } from "../../js/examples/jsm/libs/dat.gui.module.js";
// import { CinematicCamera } from "../../js/examples/jsm/cameras/CinematicCamera.js";

// function createCamera() {
//   // const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000);
//   const camera = new CinematicCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
//   camera.setLens(12);
//   camera.focusAt(100);              // Distance in world units where the sharpest focus is
//   // camera.postprocessing.enabled = true; 


//   const params = {
//     center: new THREE.Vector3(0, 0, 0),
//     baseRadius: 900,
//     radiusBreath: 140,     // radius breathing amplitude
//     baseThetaSpeed: 0.1,  // azimuth rad/sec (around Y)
//     basePhiSpeed:   0.03,  // polar rad/sec (latitude up/down)
//     highSpeedScale: 2,  // highs add to both speeds
//     lowSpeedScale:  0.04,  // lows subtract from both speeds
//     phiMin: 0.25,          // keep away from poles (0..PI)
//     phiMax: Math.PI - 0.25,
//     rollMax: 0.12,         // max roll (bank) in radians
//   };

//   // spherical state
//   let radius = params.baseRadius;
//   let theta  = 0.0;                // azimuth
//   let phi    = Math.PI * 0.45;     // start somewhere mid-latitude

//   // audio hookup
//   let analyser = null;
//   camera.attachAnalyser = (a) => { analyser = a || null; };

//   // envelopes
//   let lowEnv = 0, highEnv = 0;

//   // helpers
//   const avgRange = (arr,a,b)=>{ let s=0,c=0; for(let i=a;i<b;i++){ s+=arr[i]; c++; } return c? s/c:0; };
//   const readBands = (analyser)=>{
//     if (!analyser) return {low:0, mid:0, high:0};
//     const d = analyser.getFrequencyData();
//     if (!d || !d.length) return {low:0, mid:0, high:0};
//     const n = d.length;
//     return {
//       low:  avgRange(d, 0, Math.floor(n*0.20)) / 255,
//       mid:  avgRange(d, Math.floor(n*0.20), Math.floor(n*0.75)) / 255,
//       high: avgRange(d, Math.floor(n*0.75), n) / 255,
//     };
//   };
//   const envFollow = (curr, target, dt, atk=0.08, rel=0.25)=>{
//     const k = target > curr ? (1 - Math.exp(-dt/atk)) : (1 - Math.exp(-dt/rel));
//     return curr + (target - curr) * k;
//   };
//   const clamp = (v,a,b)=> Math.max(a, Math.min(b,v));

//   // init position
//   camera.position.set(radius, radius * Math.cos(phi), 0);
//   camera.lookAt(params.center);

//   // reuse objects
//   const spherical = new THREE.Spherical();
//   const tmpPos = new THREE.Vector3();
//   const tmpUp  = new THREE.Vector3(0,1,0);

//   camera.tick = (dt = 1/60) => {
//     // --- audio envelopes ---
//     const bands = readBands(analyser);
//     lowEnv  = envFollow(lowEnv,  bands.low  || 0, dt, 0.06, 0.28);
//     highEnv = envFollow(highEnv, bands.high || 0, dt, 0.06, 0.28);

//     const baseThetaSpeed = 0.1; // constant spin around Y axis
//     const audioThetaSpeed = highEnv * params.highSpeedScale - lowEnv * params.lowSpeedScale;

//     // --- angular speeds (audio-reactive) ---
//     const thetaSpeed = clamp(
//       params.baseThetaSpeed + highEnv * params.highSpeedScale - lowEnv * params.lowSpeedScale,
//       0.01, 0.35
//     );
//     const phiSpeed = clamp(
//       params.basePhiSpeed + highEnv * (params.highSpeedScale * 0.6) - lowEnv * (params.lowSpeedScale * 0.6),
//       0.005, 0.2
//     );


//       theta += (baseThetaSpeed + audioThetaSpeed) * dt;

//       // keep phi moving based on audio but not tied to theta
//       phi += Math.sin(theta * 0.7) * phiSpeed * dt * 1.5;
//       phi = clamp(phi, params.phiMin, params.phiMax);

//     // theta += thetaSpeed * dt;                 // wrap automatically by cosine/sine
//     // phi   += Math.sin(theta * 0.7) * phiSpeed * dt * 1.5; // meandering lat change
//     // phi    = clamp(phi, params.phiMin, params.phiMax);

//     // --- radius breathing ---
//     radius = params.baseRadius + Math.sin(theta * 0.5) * params.radiusBreath * (0.5 + highEnv * 0.8);

//     // --- position from spherical ---
//     spherical.set(radius, phi, theta); // (radius, phi, theta)
//     tmpPos.setFromSpherical(spherical).add(params.center);
//     camera.position.copy(tmpPos);

//     // --- look at center ---
//     camera.lookAt(params.center);

//     // --- roll/bank (rotate around view axis) ---
//     // roll more with highs, a little countered by lows
//     const roll = (highEnv - lowEnv * 0.4) * params.rollMax;
//     // apply roll by rotating camera.up around forward axis
//     const forward = tmpPos.sub(params.center).normalize(); // camera to center, then invert
//     forward.multiplyScalar(-1); // forward direction from camera toward center
//     camera.up.copy(tmpUp).applyAxisAngle(forward, roll);
//     camera.lookAt(params.center); // re-assert with rolled up vector
//   };

//   // keep aspect correct
//   window.addEventListener("resize", () => {
//     camera.aspect = window.innerWidth / window.innerHeight;
//     camera.updateProjectionMatrix();
//   });

//   return camera;
// }

// export { createCamera };

import * as THREE from "../../js/build/three.module.js";
import { GUI } from "../../js/examples/jsm/libs/dat.gui.module.js";
import { CinematicCamera } from "../../js/examples/jsm/cameras/CinematicCamera.js";

function createCamera() {
  // const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000);
  const camera = new CinematicCamera(45, window.innerWidth / window.innerHeight, 0.1, 5000);
  camera.setLens(12);


  camera.position.set(0, 250, 0);
  camera.rotation.x = -Math.PI/2
  camera.updateProjectionMatrix();


  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  })

  return camera;
}

export { createCamera };
