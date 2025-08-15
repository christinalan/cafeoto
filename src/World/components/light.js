// components/light.js
import * as THREE from "../../js/build/three.module.js";

/* ===================== TWEAKABLES ===================== */

// Audio gating & smoothing
const REACT = {
  lowThresh:  0.01,   // bass must exceed this to start darkening
  highThresh: 0,   // treble must exceed this to start brightening
  attack:     0.05,   // rise (s)
  release:    0.35,   // fall (s)
};

// Base intensity/exposure ranges
const AMBIENT_INT = { min: 0.1, max: 20.0 };  // was 0.03..2.2
const DIR_INT     = { min: 0.0,  max: 50.0 }; // was 0..15
const EXPOSURE    = { min: 0.12, max: 2.4 };  // was 0.18..2.0

// Optional color drift
const AMBIENT_COLORS = {
  base: new THREE.Color(0xBA0000),
  high: new THREE.Color(0xffffff),
  low:  new THREE.Color(0x000000),
};

// High-band transient strobe
const STROBE = {
  highTrigger: 0.2,  // absolute high-band level to trigger (0..1)
  riseThresh:  0.10,  // OR rapid rise Δhigh to trigger
  hold:        0.1,  // full-bright hold time (s)
  decay:       0.35,  // fade time after hold (s)
  dirBoost:    6.0,   // extra directional intensity at peak
  exposureBoost: 2, // +exposure multiplier at peak (1.0 = none)
  jitter:      0.06,  // directional position jitter at peak (world units)
  colorFlash:  0.15,  // add whiteness to dir color at peak (0..1)
};

// Idle visibility floor so scene never goes totally blank by accident
const IDLE_VIS_FLOOR = 0.0;

/* ===================== HELPERS ===================== */

function avgRange(arr, a, b){ let s=0,c=0; for(let i=a;i<b;i++){ s+=arr[i]; c++; } return c? s/c:0; }
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
function envFollow(curr, target, dt, atk, rel) {
  const k = target > curr ? (1 - Math.exp(-dt / atk)) : (1 - Math.exp(-dt / rel));
  return curr + (target - curr) * k;
}
function remapExcess(v, th){
  // normalize how far above threshold we are
  const x = Math.max(0, v - th) / Math.max(1e-6, 1 - th);
  // add a gentle curve so small inputs are more visible
  return Math.pow(x, 0.5);
}

function lerp(a,b,t){ return a + (b - a) * t; }
function clamp01(v){ return Math.max(0, Math.min(1, v)); }

/* ===================== AMBIENT (audio + strobe drives exposure) ===================== */

export function createAmbient() {
  const ambient = new THREE.AmbientLight(AMBIENT_COLORS.base, AMBIENT_INT.min);

  let analyser = null;
  let renderer = null;

  // smoothed envelopes
  let lowEnv = 0, highEnv = 0;

  // strobe state
  let strobeEnv = 0;      // 0..1 flash envelope
  let strobeHold = 0;     // remaining hold time
  let lastHigh = 0;       // last frame's high level

  // wiring
  ambient.attachAnalyser = (a) => { analyser = a || null; };
  ambient.attachRenderer = (r) => { renderer = r || null; };

  ambient.tick = (dt = 1/60) => {
    const bands = readBands(analyser);
    
    // Excess above thresholds with curved response
    const lowEx  = remapExcess(bands.low,  REACT.lowThresh);   // 0..1
    let   highEx = remapExcess(bands.high, REACT.highThresh);  // 0..1
    
    // If highs are ~0, synthesize a little “sparkle” from lows
    // so the scene can still brighten/flash a bit.
    const surHigh = Math.min(1.0, highEx + lowEx * 0.45);
    
    // Smooth envelopes
    lowEnv  = envFollow(lowEnv,  lowEx,   dt, REACT.attack, REACT.release);
    highEnv = envFollow(highEnv, surHigh, dt, REACT.attack, REACT.release);
    
    // console.log('amb', { lowEnv:+lowEnv.toFixed(3), highEnv:+highEnv.toFixed(3), intensity:+ambient.intensity.toFixed(3), exp:+(renderer?.toneMappingExposure||0).toFixed(3) });
    // ---- strobe detection (high absolute or fast rise) ----
    const highDelta = Math.max(0, (bands.high || 0) - (lastHigh || 0));
    if ((bands.high || 0) > STROBE.highTrigger || highDelta > STROBE.riseThresh) {
      strobeEnv = 1.0;
      strobeHold = STROBE.hold;
    }
    if (strobeHold > 0) {
      strobeHold -= dt;
    } else if (strobeEnv > 0) {
      strobeEnv = Math.max(0, strobeEnv - dt / STROBE.decay);
    }
    lastHigh = bands.high || 0;

    // ---- ambient intensity & color ----
      // lows darken, highs brighten — stronger curves so it’s obvious
      const ambBright = lerp(AMBIENT_INT.min, AMBIENT_INT.max, Math.pow(highEnv, 0.95)); // highs lift
      const ambCrush  = 1.0 - 0.95 * Math.pow(lowEnv, 0.8);  // lows crush hard
      ambient.intensity = Math.max(IDLE_VIS_FLOOR, ambBright * ambCrush);

      // color drift (optional)
      ambient.color.copy(AMBIENT_COLORS.base);
      const tmp = new THREE.Color();
      tmp.copy(AMBIENT_COLORS.high).lerp(AMBIENT_COLORS.low, lowEnv);
      ambient.color.lerp(tmp, 0.6 * highEnv);

      // exposure: base from highs, strong darkening from lows, plus strobe if any
      if (renderer) {
        const expHi = lerp(EXPOSURE.min, EXPOSURE.max, Math.pow(highEnv, 0.9));
        const expLo = 1.0 - 0.98 * Math.pow(lowEnv, 0.85);
        let exposure = expHi * expLo;
        if (strobeEnv > 0) exposure *= (1.0 + STROBE.exposureBoost * strobeEnv);
        renderer.toneMappingExposure = exposure;
      }

    // ---- renderer exposure (base audio + strobe boost) ----
    if (renderer) {
      const expHi  = lerp(EXPOSURE.min, EXPOSURE.max, highEnv);
      const expLo  = 1.0 - 0.95 * Math.pow(lowEnv, 0.95);
      let exposure = expHi * expLo;

      if (strobeEnv > 0) {
        exposure *= (1.0 + STROBE.exposureBoost * strobeEnv);
      }
      renderer.toneMappingExposure = exposure;
    }
  };

  return ambient;
}

/* ===================== DIRECTIONAL (audio + strobe flash) ===================== */

export function createDirectional() {
  const dir = new THREE.DirectionalLight(0xFFE7B3, DIR_INT.min);
  dir.position.set(-10, 50, 10);

  dir.castShadow = true;
  const d = 5;
  dir.shadow.camera.left   = -d;
  dir.shadow.camera.right  =  d;
  dir.shadow.camera.top    =  d;
  dir.shadow.camera.bottom = -d;
  dir.shadow.camera.near   =  1;
  dir.shadow.camera.far    = 40;
  dir.shadow.mapSize.set(1024, 1024);

  // base position for jitter
  const basePos = dir.position.clone();

  // wiring
  let analyser = null;
  dir.attachAnalyser = (a) => { analyser = a || null; };

  // envelopes
  let lowEnv = 0, highEnv = 0;

  // strobe
  let strobeEnv = 0;
  let strobeHold = 0;
  let lastHigh = 0;

  dir.tick = (dt = 1/60) => {
    const bands = readBands(analyser);

    // Excess above thresholds with curved response
    const lowEx  = remapExcess(bands.low,  REACT.lowThresh);   // 0..1
    let   highEx = remapExcess(bands.high, REACT.highThresh);  // 0..1
    
    const surHigh = Math.min(1.0, highEx + lowEx * 0.45);
    
    // Smooth envelopes
    lowEnv  = envFollow(lowEnv,  lowEx,   dt, REACT.attack, REACT.release);
    highEnv = envFollow(highEnv, surHigh, dt, REACT.attack, REACT.release);

    // strobe detection
    const highDelta = Math.max(0, (bands.high || 0) - (lastHigh || 0));
    if ((bands.high || 0) > STROBE.highTrigger || highDelta > STROBE.riseThresh) {
      strobeEnv = 1.0;
      strobeHold = STROBE.hold;
    }
    if (strobeHold > 0) {
      strobeHold -= dt;
    } else if (strobeEnv > 0) {
      strobeEnv = Math.max(0, strobeEnv - dt / STROBE.decay);
    }
    lastHigh = bands.high || 0;

    // base intensity (highs brighten, lows choke)
    const hiKick  = lerp(DIR_INT.min, DIR_INT.max, Math.pow(highEnv, 0.8));
    const loChoke = 1.0 - 0.80 * Math.pow(lowEnv, 0.85);
    let intensity = hiKick * loChoke;
    
    if (strobeEnv > 0) intensity += STROBE.dirBoost * strobeEnv;
    dir.intensity = intensity;

    // micro position jitter at flash peak (keeps shadows lively)
    if (strobeEnv > 0) {
      dir.position.set(
        basePos.x + (Math.random() * 2 - 1) * STROBE.jitter * strobeEnv,
        basePos.y + (Math.random() * 2 - 1) * STROBE.jitter * strobeEnv,
        basePos.z + (Math.random() * 2 - 1) * STROBE.jitter * strobeEnv
      );
    } else {
      dir.position.copy(basePos);
    }

    // color flash toward white on peaks, slightly warmer on lows
    const cooler = new THREE.Color(0xeaf7ff);
    const warmer = new THREE.Color(0xffd8c0);

    const baseColor = warmer.clone().lerp(cooler, Math.min(1, 0.2 + 0.8 * highEnv));
    const flashed   = baseColor.clone().lerp(new THREE.Color(0xffffff), STROBE.colorFlash * strobeEnv);

    // slight darkening on lowEnv to emphasize crush
    const hsl = { h:0, s:0, l:0 };
    flashed.getHSL(hsl);
    hsl.l = Math.max(0, hsl.l - 0.05 * lowEnv);
    dir.color.setHSL(hsl.h, hsl.s, hsl.l);
  };

  return dir;
}

export function createStaticLight() {
  
    const staticLight = new THREE.DirectionalLight(0xc3ecff, 5);
    staticLight.position.set(5, 0, 20);
  
    const d = 5;
    staticLight.castShadow = true;
    staticLight.shadow.camera.left = -d;
    staticLight.shadow.camera.right = d;
    staticLight.shadow.camera.top = d;
    staticLight.shadow.camera.bottom = -d;
  
    staticLight.shadow.camera.near = 1;
    staticLight.shadow.camera.far = 20;
  
    staticLight.shadow.mapSize.x = 1024;
    staticLight.shadow.mapSize.y = 1024;
  
    return staticLight;
}