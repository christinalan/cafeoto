import * as THREE from "https://unpkg.com/three@0.121.1/build/three.module.js";

function createCamera() {
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000);
  camera.position.set(0, 0, 20);

  camera.tick = () => {
    // console.log(values);
  };

  return camera;
}

export { createCamera };
