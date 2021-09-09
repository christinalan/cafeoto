// import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js";'
import * as THREE from "https://unpkg.com/three@0.121.1/build/three.module.js";
import { OrbitControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/controls/OrbitControls.js";

function createOrbitControls(camera, canvas) {
  const controls = new OrbitControls(camera, canvas);

  controls.enableDamping = true;
  controls.minDistance = 0.1;
  controls.maxDistance = 1000;

  //   controls.tick = () => controls.update();

  return controls;
}

export { createOrbitControls };
