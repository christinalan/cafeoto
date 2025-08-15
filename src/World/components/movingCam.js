import * as THREE from "../../js/build/three.module.js";
import { GUI } from "../../js/examples/jsm/libs/dat.gui.module.js";
import { CinematicCamera } from "../../js/examples/jsm/cameras/CinematicCamera.js";

function createMovingCamera() {
  // const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000);
  const camera = new CinematicCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
  camera.setLens(10);
  camera.focusAt(100);              // Distance in world units where the sharpest focus is
  // camera.postprocessing.enabled = true; 

  // add to params:
const params = {
    center: new THREE.Vector3(0, 0, 0),
    baseRadius: 1600,
    radiusBreath: 140,
    baseThetaSpeed: 0.1,
    basePhiSpeed:   0.03,
    highSpeedScale: 2,
    lowSpeedScale:  0.04,
    // widen the latitude range a bit so there’s room to reach the “top”
    phiMin: 0.15,                    // closer to the top pole (0 = North pole)
    phiMax: Math.PI - 0.20,          // near the bottom, but not all the way
    rollMax: 0.12,
  
    // NEW: bias & shaping for “up top” motion
    topBias: 0.65,   // 0=no bias, 1=strongly biased toward the top (smaller phi)
    phiEase: 0.7,    // <1 lingers more at extremes; 1 = plain sine
    phiGain: 1.0     // scales overall up/down motion
  };
  
  // spherical state
  let radius = params.baseRadius;
  let theta  = 0.0;
  let phi    = Math.PI * 0.45;
  
  // NEW: independent latitude phase
  let phiPhase = 0;

  // audio hookup
  let analyser = null;
  camera.attachAnalyser = (a) => { analyser = a || null; };

  // envelopes
  let lowEnv = 0, highEnv = 0;

  // helpers
  const avgRange = (arr,a,b)=>{ let s=0,c=0; for(let i=a;i<b;i++){ s+=arr[i]; c++; } return c? s/c:0; };
  const readBands = (analyser)=>{
    if (!analyser) return {low:0, mid:0, high:0};
    const d = analyser.getFrequencyData();
    if (!d || !d.length) return {low:0, mid:0, high:0};
    const n = d.length;
    return {
      low:  avgRange(d, 0, Math.floor(n*0.20)) / 255,
      mid:  avgRange(d, Math.floor(n*0.20), Math.floor(n*0.75)) / 255,
      high: avgRange(d, Math.floor(n*0.75), n) / 255,
    };
  };
  const envFollow = (curr, target, dt, atk=0.08, rel=0.25)=>{
    const k = target > curr ? (1 - Math.exp(-dt/atk)) : (1 - Math.exp(-dt/rel));
    return curr + (target - curr) * k;
  };
  const clamp = (v,a,b)=> Math.max(a, Math.min(b,v));

  // init position
  camera.position.set(radius, radius * Math.cos(phi), 0);
  camera.lookAt(params.center);

  // reuse objects
  const spherical = new THREE.Spherical();
  const tmpPos = new THREE.Vector3();
  const tmpUp  = new THREE.Vector3(0,1,0);

  camera.tick = (dt = 1/60) => {
    // --- audio envelopes ---
    const bands = readBands(analyser);
    lowEnv  = envFollow(lowEnv,  bands.low  || 0, dt, 0.06, 0.28);
    highEnv = envFollow(highEnv, bands.high || 0, dt, 0.06, 0.28);

    const baseThetaSpeed = 0.1; // constant spin around Y axis
    const audioThetaSpeed = highEnv * params.highSpeedScale - lowEnv * params.lowSpeedScale;

   // --- angular speeds (audio-reactive) ---
const thetaSpeed = THREE.MathUtils.clamp(
    params.baseThetaSpeed + highEnv * params.highSpeedScale - lowEnv * params.lowSpeedScale,
    0.01, 0.35
  );
  const phiSpeed = THREE.MathUtils.clamp(
    params.basePhiSpeed + highEnv * (params.highSpeedScale * 0.6) - lowEnv * (params.lowSpeedScale * 0.6),
    0.005, 0.25
  );
  
  // azimuth
  theta += thetaSpeed * dt;
  
  // latitude: independent LFO with bias toward the top
  phiPhase += phiSpeed * dt * params.phiGain;
  
  // shape the sine so it lingers more at extremes (phiEase < 1)
  let s = Math.sin(phiPhase);
  s = Math.sign(s) * Math.pow(Math.abs(s), params.phiEase);
  
  // compute biased midpoint toward the top (smaller phi)
  const span = (params.phiMax - params.phiMin);
  const midNeutral = params.phiMin + span * 0.5;          // middle of range
  const midTop     = params.phiMin + span * 0.30;         // skewed toward top
  const mid        = THREE.MathUtils.lerp(midNeutral, midTop, params.topBias);
  
  // amplitude stays within the bounds
  const amp = span * 0.5;
  
  // target phi and smooth toward it (nice easing)
  const phiTarget = THREE.MathUtils.clamp(mid + s * amp, params.phiMin, params.phiMax);
  phi = THREE.MathUtils.lerp(phi, phiTarget, 1 - Math.exp(-dt * 3.0));

    // theta += thetaSpeed * dt;                 // wrap automatically by cosine/sine
    // phi   += Math.sin(theta * 0.7) * phiSpeed * dt * 1.5; // meandering lat change
    // phi    = clamp(phi, params.phiMin, params.phiMax);

    // --- radius breathing ---
    radius = params.baseRadius + Math.sin(theta * 0.5) * params.radiusBreath * (0.5 + highEnv * 0.8);

    // --- position from spherical ---
    spherical.set(radius, phi, theta); // (radius, phi, theta)
    tmpPos.setFromSpherical(spherical).add(params.center);
    camera.position.copy(tmpPos);

    // --- look at center ---
    camera.lookAt(params.center);

    // --- roll/bank (rotate around view axis) ---
    // roll more with highs, a little countered by lows
    const roll = (highEnv - lowEnv * 0.4) * params.rollMax;
    // apply roll by rotating camera.up around forward axis
    const forward = tmpPos.sub(params.center).normalize(); // camera to center, then invert
    forward.multiplyScalar(-1); // forward direction from camera toward center
    camera.up.copy(tmpUp).applyAxisAngle(forward, roll);
    camera.lookAt(params.center); // re-assert with rolled up vector
  };

  // keep aspect correct
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  return camera;
}

export { createMovingCamera };