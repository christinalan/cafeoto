import * as THREE from "../../js/build/three.module.js";
import { GUI } from "../../js/examples/jsm/libs/dat.gui.module.js";
import { CinematicCamera } from "../../js/examples/jsm/cameras/CinematicCamera.js";

function createCamera() {
  // const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000);
  const camera = new CinematicCamera(45, 1, 0.1, 5000);
  camera.setLens(15);

  const options = {
    focalLength: 15,
    posZ: 20,
    rotX: 0,
    rotY: 0,
  };

  camera.position.set(0, 0, 20);

  const matChanger = function () {
    // for (const e in effectController) {
    //   if (e in camera.postprocessing.bokeh_uniforms) {
    //     camera.postprocessing.bokeh_uniforms[e].value = options[e];
    //   }
    // }

    camera.setLens(options.focalLength);
  };

  const gui = new GUI();
  const posFolder = gui.addFolder("Perspective");
  posFolder.add(camera.position, "z", -200, 50, 1).name("Position X");
  posFolder.add(camera.rotation, "y", 0, Math.PI, 0.01).name("Rotation Y");
  posFolder.add(camera.rotation, "z", 0, Math.PI, 0.01).name("Rotation Z");

  posFolder
    .add(options, "focalLength", 0.1, 100, 0.01)
    .name("Focal Length")
    .onChange(matChanger);
  posFolder.open();

  camera.tick = () => {
    // console.log(values);
  };

  return camera;
}

export { createCamera };
