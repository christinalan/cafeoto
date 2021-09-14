import * as THREE from "../../js/build/three.module.js";

function createCamera() {
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000);
  camera.position.set(0, 0, 20);
  // camera.rotation.set(0, Math.PI, 0);

  camera.tick = () => {
    // console.log(values);
  };

  return camera;
}

export { createCamera };
