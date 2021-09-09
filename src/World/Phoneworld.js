import { createCamera } from "./components/camera.js";
import { createScene } from "./components/scene.js";
import { createDeviceControls } from "./components/devicecontrols.js";

import { createRenderer } from "./systems/renderer.js";
import { Resizer } from "./systems/Resizer.js";
import { Loop } from "./systems/Loop.js";

let camera;
let renderer;
let scene;
let loop;
let deviceControls;

class Phone {
  constructor(container) {
    console.log("are you working?");
    camera = createCamera();
    scene = createScene();
    renderer = createRenderer();
    loop = new Loop(camera, scene, renderer);
    container.append(renderer.domElement);

    deviceControls = createDeviceControls(camera);

    loop.updatables.push(camera, scene, deviceControls);

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

export { Phone };
