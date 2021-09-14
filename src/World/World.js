import { createCamera } from "./components/camera.js";
import { createScene } from "./components/scene.js";
import { createControls } from "./components/controls.js";
import { createOrbitControls } from "./components/orbitcontrols.js";
// import { createDeviceControls } from "./components/devicecontrols.js";

import { createAmbient, createDirectional } from "./components/light.js";
import { createFloor } from "./components/building.js";

import { createCylinder } from "./components/animations/cylinder.js";
import { createBirds } from "./components/animations/birds2.js";
import { createLineBird } from "./components/animations/birds.js";
import { createFlock } from "./components/animations/birds3.js";
import { generateBirds } from "./components/animations/gbirds.js";

import { createRenderer } from "./systems/renderer.js";
import { Resizer } from "./systems/Resizer.js";
import { Loop } from "./systems/Loop.js";

let camera;
let renderer;
let scene;
let loop;
let controls;

class World {
  constructor(container) {
    camera = createCamera();
    scene = createScene();
    renderer = createRenderer();
    loop = new Loop(camera, scene, renderer);
    container.append(renderer.domElement);

    controls = createControls(camera, renderer.domElement);
    scene.add(controls.getObject());

    // const orbitControls = createOrbitControls(camera, renderer.domElement);

    const ambientL = createAmbient();
    const dirL = createDirectional();
    const floors = createFloor();

    //animations
    const birds = createBirds();
    const birdLine = createLineBird();
    const flock = createFlock();
    const cylinders = createCylinder();
    const gbirds = generateBirds();

    loop.updatables.push(
      camera,
      scene,
      floors,
      birds,
      birdLine,
      flock,
      cylinders,
      gbirds,
      controls
    );

    scene.add(ambientL, birds, birdLine);

    for (let i = 0; i < floors.length; i++) {
      scene.add(floors[i]);
    }

    for (let i = 0; i < cylinders.length; i++) {
      scene.add(cylinders[i]);
    }

    for (let i = 0; i < flock.length; i++) {
      scene.add(flock[i]);
    }

    for (let i = 0; i < gbirds.length; i++) {
      scene.add(gbirds[i]);

      // while (gbirds.length > 50) {
      //   gbirds.splice(0, 1);
      // }

      // for (let i = gbirds.length - 1; i >= 0; i--) {
      //   gbirds.splice(i, 1);
      //   gbirds.remove(i);
      // }
    }

    const resizer = new Resizer(container, camera, renderer);
  }

  // 2. Render the scene
  render() {
    renderer.render(scene, camera);
  }

  start() {
    loop.start();
  }

  stop() {
    loop.stop();
  }
}

export { World, camera, scene, controls, renderer };
