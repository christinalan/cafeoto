import * as THREE from "../../../js/build/three.module.js";
import { PositionalAudioHelper } from "../../../js/examples/jsm/helpers/PositionalAudioHelper.js";
import { scene } from "../../World.js";
import { camera } from "../../World.js";

let audio, audioV, analyser;
let starling;
let flock = [];
let position, velocity, acceleration;

function createFlock() {
  position = new THREE.Vector3(
    window.innerWidth / 20,
    window.innerHeight / 10,
    0
  );

  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load("images/textures/3GWCDMA.png");

  const birdGeo = new THREE.SphereGeometry(0.5, Math.random() * 1, position.y);
  const birdMaterial = new THREE.MeshLambertMaterial({
    color: 0xffff5e,
    map: texture,
  });

  for (let i = 0; i < 300; i++) {
    const s = i / 3;
    starling = new THREE.Mesh(birdGeo, birdMaterial);
    starling.position.set(s - 20, 10, -50);

    flock.push(starling);
  }

  const audioLoader = new THREE.AudioLoader();
  const listener = new THREE.AudioListener();
  camera.add(listener);

  audioLoader.load("sounds/ebird/lessercoucal.mp3", function (buffer) {
    for (let i = 0; i < 1; i++) {
      audio = new THREE.PositionalAudio(listener);

      audio.setBuffer(buffer);
      audio.setDistanceModel("exponential");
      audio.setRefDistance(300);
      audio.setDirectionalCone(90, 180, 0);
      audio.setLoop(true);

      audio.play();

      // const helper = new PositionalAudioHelper(audio, 2);
      // audio.add(helper);

      // starling.add(audio);
    }
  });

  flock.tick = () => {
    const clock = new THREE.Clock();
    const time = clock.getElapsedTime();
    velocity = new THREE.Vector3().random(Math.sin());
    acceleration = new THREE.Vector3().random(Math.cos());

    for (let bird of flock) {
      const d = velocity.distanceTo(bird.position);

      bird.position.add(velocity);
      velocity.add(acceleration).random(Math.sin());

      if (d >= 80 || d <= 20) {
        velocity.multiplyScalar(-1);
        acceleration.multiplyScalar(-1);
      }
      // else {
      //   velocity.multiplyScalar(0.1);
      //   acceleration.multiplyScalar(0.1);
      // }

      bird.rotation.y += 1;
      bird.rotation.z += Math.sin(time) * 5;
    }
  };

  return flock;
}

export { createFlock };
