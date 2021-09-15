import * as THREE from "../../js/build/three.module.js";

function createRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true });

  renderer.physicallyCorrectLights = true;
  renderer.setClearColor(0xffffff);

  return renderer;
}

export { createRenderer };
