// import * as THREE from "../../js/build/three.module.js";

import { createCamera } from "./components/camera.js";
import { createScene } from "./components/scene.js";
import { createControls } from "./components/controls.js";
import { createOrbitControls } from "./components/orbitcontrols.js";
// import { createDeviceControls } from "./components/devicecontrols.js";

import { createAmbient, createDirectional, createStaticLight } from "./components/light.js";
import { createFloor } from "./components/building.js";

import { createReflectiveAudioPipes } from "./components/animations/pipes.js";
import { createSphericalPipes } from "./components/animations/circlePipes.js"
import { createVideoCube } from "./components/animations/video.js"

import { createRenderer } from "./systems/renderer.js";
import { Resizer } from "./systems/Resizer.js";
import { Loop } from "./systems/Loop.js";

import { createEffect } from "./systems/postfx.js";

let camera;
let renderer;
let scene;
let loop;
let controls;

function waitForAnalyserData(getAnalyser, {
  timeoutMs = 8000,   // bail after 8s if nothing shows up
  intervalMs = 120,   // poll ~8x/sec
  requireNonZeroSample = true, // ensure at least one non-zero bin before resolving
} = {}) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const timer = setInterval(() => {
      const an = getAnalyser && getAnalyser();
      if (an && typeof an.getFrequencyData === "function") {
        const arr = an.getFrequencyData();
        if (arr && arr.length) {
          if (!requireNonZeroSample || arr.some(v => v > 0)) {
            clearInterval(timer);
            resolve(an);
            return;
          }
        }
      }
      if (performance.now() - start > timeoutMs) {
        clearInterval(timer);
        reject(new Error("Analyser never produced data (timeout)"));
      }
    }, intervalMs);
  });
}

class World {
  constructor(container) {
    camera = createCamera();
    scene = createScene();
    renderer = createRenderer();
    loop = new Loop(camera, scene, renderer);
    container.append(renderer.domElement);

    // controls = createControls(camera, renderer.domElement);
    // scene.add(controls.getObject());
    // const composer = createEffect();
    
    const orbitControls = createOrbitControls(camera, renderer.domElement);

    orbitControls.maxDistance = 1500; // default might be ~1000
    
    const ambientL = createAmbient();
    const dirL = createDirectional();
    // const staticL = createStaticLight();
    // const pipes = createReflectiveAudioPipes({ scene, camera, renderer, audioUrl: "sounds/CafeOTO.mp3" });
    const circlePipes = createSphericalPipes({scene, camera, renderer, audioUrl: "sounds/CafeOTO.mp3"})
    const videoCube = createVideoCube()
    const floor = createFloor({renderer});
    
    ambientL.attachRenderer(renderer);


    scene.add( ambientL, dirL, videoCube.mesh, floor ); //took out birdLine, birds, pipes.group, circlePipes.group, 

    loop.updatables.push(
      // camera,
      scene,
      // circlePipes,
      videoCube,
      ambientL,
      dirL,
      floor,
      // controls,
      {tick: () => orbitControls.update() }
    );

    videoCube.setCenter(0, 0, 0);
    videoCube.setRotate(0, 0.002, 0);

    waitForAnalyserData(() => circlePipes.analyser)
    .then((analyser) => {
      // camera.attachAnalyser?.(analyser);
      ambientL.attachAnalyser(analyser);
      dirL.attachAnalyser(analyser);
      scene.attachAnalyser(analyser)
      console.log("[World] analyser attached to camera & lights");
    })
    .catch(err => {
      console.warn("[World] analyser not ready:", err.message);
      // Optional: attach anyway so they at least exist
      const an = circlePipes.analyser;
      if (an) {
        camera.attachAnalyser?.(an);
        ambientL.attachAnalyser(an);
        dirL.attachAnalyser(an);
      }
    });

    // for (let i = 0; i < floors.length; i++) {
    //   scene.add(floors[i]);
    // }

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

export { World, camera, scene, renderer, controls };
