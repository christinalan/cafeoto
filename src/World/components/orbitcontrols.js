import * as THREE from "../../js/build/three.module.js";
import { OrbitControls } from "../../js/examples/jsm/controls/OrbitControls.js";

function createOrbitControls(camera, canvas) {
  const controls = new OrbitControls(camera, canvas);

  controls.enableDamping = true;
  controls.minDistance = 0.1;
  controls.maxDistance = 1000;

  //   controls.tick = () => controls.update();

  return controls;
}

export { createOrbitControls };
