import * as THREE from "https://unpkg.com/three@0.121.1/build/three.module.js";

function createRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true });

  renderer.physicallyCorrectLights = true;

  return renderer;
}

export { createRenderer };
