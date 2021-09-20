import * as THREE from "../../js/build/three.module.js";

let time = 0;
let delta = 0;

function createAmbient() {
  let clock = new THREE.Clock();
  const ambientLight = new THREE.AmbientLight(0xa2b6d1, 0.1);

  ambientLight.tick = () => {
    delta = clock.getDelta();
    var elapsedTime = clock.getElapsedTime();
    var speed = 1;

    if (ambientLight.intensity > 11) {
      speed *= 1;
    } else {
      speed *= 0.003;
    }

    time += delta * speed;

    ambientLight.intensity = Math.abs(Math.sin(time) * 100);
    console.log(time, ambientLight.intensity);
  };

  return ambientLight;
}

function createDirectional() {
  const directionalLight = new THREE.DirectionalLight(0xc3ecff, 1);
  directionalLight.position.set(0, 10, 5);

  const d = 5;
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.left = -d;
  directionalLight.shadow.camera.right = d;
  directionalLight.shadow.camera.top = d;
  directionalLight.shadow.camera.bottom = -d;

  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 20;

  directionalLight.shadow.mapSize.x = 1024;
  directionalLight.shadow.mapSize.y = 1024;

  return directionalLight;
}

export { createAmbient, createDirectional };
