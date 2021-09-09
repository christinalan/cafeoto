import * as THREE from "../../../js/build/three.module.js";
import { PositionalAudioHelper } from "../../../js/examples/jsm/helpers/PositionalAudioHelper.js";
import { scene } from "../../World.js";
import { camera } from "../../World.js";

let last = performance.now();
let birds;
let audio, analyser;
let position, velocity, acceleration;

function mapRange(value, minf, maxf, mins, maxs) {
  value = (value - minf) / (maxf - minf);
  return mins + value * (maxs - mins);
}

function createLineBird() {
  const vector = new THREE.Vector4();
  const vertexCount = 150 * 3;
  const geometry = new THREE.BufferGeometry();

  const positions = [];
  const colors = [];
  const offsets = [];
  const orientationsStart = [];
  const orientationsEnd = [];

  for (let i = 0; i < vertexCount; i++) {
    offsets.push(Math.random() - 1, Math.random() - 1, Math.random() - 1);

    // adding x,y,z
    positions.push(-50 + (Math.random() * i) / 4);
    positions.push(-20 + Math.random() - 0.5);

    // positions.push(Math.random() - 0.5);
    // positions.push(Math.random() - 0.5);
    positions.push(-20 + Math.random() - 0.5);

    // adding r,g,b,a
    colors.push(Math.random() * 100);
    colors.push(Math.random() * 100);
    colors.push(Math.random() * 255);
    colors.push(Math.random() * 150);
    // orientation start

    vector.set(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    );
    vector.normalize();

    orientationsStart.push(vector.x, vector.y, vector.z, vector.w);

    // orientation end

    vector.set(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    );
    vector.normalize();

    orientationsEnd.push(vector.x, vector.y, vector.z, vector.w);
  }

  const positionAttribute = new THREE.Float32BufferAttribute(positions, 3);
  const colorAttribute = new THREE.Uint8BufferAttribute(colors, 4);
  colorAttribute.normalized = true;

  geometry.setAttribute("position", positionAttribute);
  geometry.setAttribute("color", colorAttribute);

  geometry.setAttribute(
    "offset",
    new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3)
  );
  geometry.setAttribute(
    "orientationStart",
    new THREE.InstancedBufferAttribute(new Float32Array(orientationsStart), 4)
  );
  geometry.setAttribute(
    "orientationEnd",
    new THREE.InstancedBufferAttribute(new Float32Array(orientationsEnd), 4)
  );

  // const birdUniforms = {
  //   texturePosition: { value: null },
  //   textureVelocity: { value: null },
  //   time: { value: 0.0 },
  //   delta: { value: 0.0 },
  //   sineTime: { value: 1.0 },
  // };

  const material = new THREE.RawShaderMaterial({
    uniforms: {
      texturePosition: { value: 0.0 },
      textureVelocity: { value: 0.0 },
      time: { value: 0.0 },
      delta: { value: 0.0 },
      sineTime: { value: 1.0 },
    },
    vertexShader: document.getElementById("vertexShader").textContent,
    fragmentShader: document.getElementById("fragmentShader").textContent,
    side: THREE.DoubleSide,
    transparent: true,
  });

  birds = new THREE.Mesh(geometry, material);

  birds.rotation.x = Math.PI / 2;
  birds.matrixAutoUpdate = false;
  birds.updateMatrix();

  const listener = new THREE.AudioListener();
  camera.add(listener);

  const audioLoader = new THREE.AudioLoader();

  audioLoader.load("sounds/snippets/monk3.mp3", function (buffer) {
    audio = new THREE.PositionalAudio(listener);
    audio.setBuffer(buffer);
    audio.setDistanceModel("exponential");
    audio.setRefDistance(400);
    audio.setDirectionalCone(100, 270, 0);
    audio.rotation.set(0, Math.PI / 2, 0);
    audio.setLoop(true);

    const helper = new PositionalAudioHelper(audio, 30);
    // audio.add(helper);

    audio.play();

    birds.add(audio);
  });

  birds.tick = () => {
    const now = performance.now();
    let delta = (now - last) / 1000;

    position = new THREE.Vector3(window.innerWidth / 100, 0, 0);

    velocity = new THREE.Vector3();
    acceleration = new THREE.Vector3().random(Math.sin());

    if (delta > 1) delta = 1; // safety cap on large deltas
    last = now;

    const object = scene.children[3];

    const d = velocity.distanceTo(object.position);

    if (d > 10 && d < 50) {
      velocity.multiplyScalar(-1);
      acceleration.multiplyScalar(-1);
    }

    object.rotation.z += Math.sin(now) * 10;
    object.rotation.y += Math.sin(now) * 2;

    // object.position.set(Math.random(Math.sin(Math.PI / 2)), Math.sin(now), 0);

    object.material.uniforms["time"].value = 0.05 * now;
    object.material.uniforms["sineTime"].value = Math.sin(
      object.material.uniforms["time"].value * 0.005
    );
  };

  return birds;
}

export { createLineBird };
