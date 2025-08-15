import * as THREE from "../../js/build/three.module.js";

function createFloor({renderer}) {
  const clock = new THREE.Clock();

  // ---- load textures 1..44 ----
  const loader = new THREE.TextureLoader();
  const textures = [];
  for (let i = 1; i <= 44; i++) {
    const tex = loader.load(`images/textures/gqrx/${i}.png`);
    // If your PNGs are sRGB, you can uncomment this:
    // tex.encoding = THREE.sRGBEncoding;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 2);
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    tex.magFilter = THREE.LinearFilter;  // sharper without pixelation
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    textures.push(tex);
  }

  // ---- materials (Phong, reacts to lights) ----
  const makeMat = (map, opacity = 1) =>
    new THREE.MeshPhongMaterial({
      map,
      side: THREE.DoubleSide,
      shininess: 70,
      specular: new THREE.Color(0x888888),
      transparent: true,
      opacity,
      depthWrite: false,          // prevent z-fighting while crossfading
    });

  const matA = makeMat(textures[0], 1);
  const matB = makeMat(textures[1], 0);

  // ---- geometry ----
  const geom = new THREE.PlaneGeometry(10000, 10000);

  // Use a group so we can return a single object with a tick()
  const group = new THREE.Group();

  const floorA = new THREE.Mesh(geom, matA);
  const floorB = new THREE.Mesh(geom, matB);

  // Match your original transform
  [floorA, floorB].forEach(m => {
    m.rotation.set(Math.PI / 2, Math.PI / 2, 0);
    m.position.set(-150, 400, 0);
    m.receiveShadow = true;
    m.renderOrder = 1; // stable draw order during fade
  });

  // Slight polygon offset on B so the GPU is extra sure about ordering
  floorB.material.polygonOffset = true;
  floorB.material.polygonOffsetFactor = -1;
  floorB.material.polygonOffsetUnits = -1;

  group.add(floorA, floorB);

  // ---- fade timing ----
  const SWITCH_SEC = 15;    // time between fade starts
  const FADE_SEC   = 10;   // crossfade duration

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
    // Keep scroll in sync for seamless transition
    matB.map = textures[nextIndex];
    matB.map.offset.copy(matA.map.offset);
    matB.needsUpdate = true;

    isFading = true;
    fadeStartMs = now;
    lastSwitchMs = now;
  }

  // ---- optional motion of the texture itself ----
  const RIPPLE_SPEED = 0.005;
  const RIPPLE_AMP   = 10;
  const SCROLL_SPEED = 0.15;

  group.tick = () => {
    const dt = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    // your original floor bobbing on Z
    const speed = 0.3;
    group.position.z += Math.sin(elapsed) * 2;

    // OPTIONAL: “waterfall” scroll and tiny horizontal ripple
    const t = performance.now() / 1000;
    if (matA.map) {
      matA.map.offset.x = Math.sin(t * RIPPLE_SPEED) * RIPPLE_AMP;
      matA.map.offset.y -= dt * SCROLL_SPEED;
    }
    if (matB.map) {
      matB.map.offset.x = Math.sin(t * RIPPLE_SPEED) * RIPPLE_AMP;
      matB.map.offset.y -= dt * SCROLL_SPEED;
    }

    // schedule fade
    const now = performance.now();
    if (!isFading && now - lastSwitchMs >= SWITCH_SEC * 1000) {
      startFade(now);
    }

    // drive crossfade
    if (isFading) {
      const u = Math.min((now - fadeStartMs) / (FADE_SEC * 1000), 1);
      matA.opacity = 1 - u;
      matB.opacity = u;

      if (u >= 1) {
        // commit: B becomes new A
        currentIndex = nextIndex;
        matA.map = matB.map;
        matA.opacity = 1;
        matA.needsUpdate = true;

        matB.opacity = 0;
        isFading = false;
      }
    }
  };

  return group;
}

export { createFloor };
