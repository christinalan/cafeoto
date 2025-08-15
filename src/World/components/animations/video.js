// components/videoCube.js
import * as THREE from "../../../js/build/three.module.js";

export function createVideoCube() {
  // ---- local params (edit here, not in World) ----
  const PARAMS = {
    url: "video/output_720p.mp4",      // <-- put your 30s video here
    size: 425,
    center: { x: 0, y: 0, z: 0 },    // position at scene center
    opacity: 1.0,
    doubleSided: true,
    toneMapped: false,               // keep video brightness stable despite exposure
    rotate: { x: 0, y: 0.002, z: 0 },// gentle spin; set 0s to disable
    playOnClickSelector: "#startButton", // plays on user click if autoplay is blocked
  };

  // --- 1) video element ---
  const video = document.createElement("video");
  video.src = PARAMS.url;
  video.crossOrigin = "anonymous";
  video.loop = true;
  video.muted = true;          // important for autoplay
  video.playsInline = true;
  video.preload = "auto";
  video.setAttribute("webkit-playsinline", "true");

  // --- 2) video texture ---
  const texture = new THREE.VideoTexture(video);
  texture.encoding = THREE.sRGBEncoding;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.format = THREE.RGBFormat;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  // --- 3) material + mesh (keeps lighting independent) ---
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: PARAMS.opacity < 1,
    opacity: PARAMS.opacity,
    side: PARAMS.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
    toneMapped: PARAMS.toneMapped,
    depthWrite: true,
  });

  const geo = new THREE.BoxGeometry(PARAMS.size, PARAMS.size, PARAMS.size);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(PARAMS.center.x, PARAMS.center.y, PARAMS.center.z);

  // --- 4) autoplay try + gesture fallback ---
  const tryPlay = () => {
    const p = video.play?.();
    if (p?.catch) p.catch(() => {/* will play on click */});
  };
  tryPlay();

  const onUserStart = () => { video.play?.(); window.removeEventListener("click", onUserStart, { once: true }); };
  const startBtn = PARAMS.playOnClickSelector ? document.querySelector(PARAMS.playOnClickSelector) : null;
  if (startBtn) startBtn.addEventListener("click", onUserStart, { once: true });
  window.addEventListener("click", onUserStart, { once: true });

  // --- 5) updatable API ---
  const api = {
    mesh,
    video,
    texture,
    // convenience: change center without touching World
    setCenter(x, y, z) { mesh.position.set(x, y, z); },
    setRotate(rx = 0, ry = 0, rz = 0) { PARAMS.rotate.x = rx; PARAMS.rotate.y = ry; PARAMS.rotate.z = rz; },
    play() { tryPlay(); },
    pause() { try { video.pause(); } catch {} },
    tick(dt = 1/60) {
      // simple spin (scaled by dt so it’s framerate independent)
      if (PARAMS.rotate) {
        mesh.rotation.x += PARAMS.rotate.x * dt * 60;
        mesh.rotation.y += PARAMS.rotate.y * dt * 60;
        mesh.rotation.z += PARAMS.rotate.z * dt * 60;
      }
      // VideoTexture updates automatically each render
    },
    dispose() {
      try { video.pause(); } catch {}
      if (mesh.parent) mesh.parent.remove(mesh);
      geo.dispose();
      material.dispose();
      texture.dispose();
    }
  };

  return api;
}
