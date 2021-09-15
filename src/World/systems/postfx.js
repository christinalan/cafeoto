import * as THREE from "../../js/build/three.module.js";
import { EffectComposer } from "../../js/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "../../js/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "../../js/examples/jsm/postprocessing/UnrealBloomPass.js";
import { camera, scene, renderer } from "../World.js";

function createEffect() {
  const composer = new EffectComposer(renderer);

  composer.addPass(new RenderPass(scene, camera));

  var bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
  );
  bloomPass.threshold = 0.1;
  bloomPass.strength = 3;
  bloomPass.radius = 1;
  bloomPass.renderToScreen = true;

  bloomPass.renderToScreen = true;

  composer.addPass(bloomPass);

  composer.tick = () => {
    composer.render();
  };

  return composer;
}

export { createEffect };
