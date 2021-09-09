import * as THREE from "../../../js/build/three.module.js";
import { PositionalAudioHelper } from "../../../js/examples/jsm/helpers/PositionalAudioHelper.js";
import { scene } from "../../World.js";
import { camera } from "../../World.js";

let last = performance.now();
let audio;
let analyser;

function mapRange(value, minf, maxf, mins, maxs) {
  value = (value - minf) / (maxf - minf);
  return mins + value * (maxs - mins);
}

function createBirds() {
  const vector = new THREE.Vector4();
  const instances = 500;
  const positions = [];
  const offsets = [];
  const colors = [];
  const orientationsStart = [];
  const orientationsEnd = [];

  positions.push(0.25, -2.25, 0);
  positions.push(-0.25, 0.25, 0);
  positions.push(0, 5, 0.25);

  // instanced attributes

  for (let i = 0; i < instances; i++) {
    // offsets

    offsets.push(Math.random() - 5, Math.random() - 5, Math.random() - 5);

    // colors

    colors.push(
      Math.random() * 250,
      Math.random() * 200,
      Math.random() * 50,
      Math.random() * 200
    );

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

  const geometry = new THREE.InstancedBufferGeometry();
  geometry.instanceCount = instances; // set so its initalized for dat.GUI, will be set in first draw otherwise
  const colorAttribute = new THREE.Uint8BufferAttribute(colors, 4);
  colorAttribute.normalized = true;

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );

  geometry.setAttribute(
    "offset",
    new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3)
  );
  geometry.setAttribute("color", colorAttribute);
  geometry.setAttribute(
    "orientationStart",
    new THREE.InstancedBufferAttribute(new Float32Array(orientationsStart), 4)
  );
  geometry.setAttribute(
    "orientationEnd",
    new THREE.InstancedBufferAttribute(new Float32Array(orientationsEnd), 4)
  );

  // material

  const material = new THREE.RawShaderMaterial({
    uniforms: {
      time: { value: 1.0 },
      sineTime: { value: 1.0 },
    },
    vertexShader: document.getElementById("vertexShader").textContent,
    fragmentShader: document.getElementById("fragmentShader").textContent,
    side: THREE.DoubleSide,
    transparent: true,
  });

  //

  const bird = new THREE.Mesh(geometry, material);

  const audioLoader = new THREE.AudioLoader();

  const listener = new THREE.AudioListener();
  camera.add(listener);

  audioLoader.load("sounds/snippets/monk.mp3", function (buffer) {
    audio = new THREE.PositionalAudio(listener);
    audio.setBuffer(buffer);
    audio.setDistanceModel("exponential");
    audio.setRefDistance(400);
    audio.setRolloffFactor(200);
    audio.setDirectionalCone(100, 270, 0);
    audio.rotation.set(0, Math.PI / 2, 0);
    audio.setLoop(true);

    const helper = new PositionalAudioHelper(audio, 3);
    // audio.add(helper);

    audio.play();

    bird.add(audio);
  });

  // analyser = new THREE.AudioAnalyser(audio, 256);

  bird.tick = () => {
    const time = performance.now();

    const object = scene.children[2];

    // object.scale.set(Math.sin(v), Math.sin(y), Math.sin(y / v));
    object.rotation.y += Math.sin(time) * 0.5;
    object.rotation.z = time * 0.0005;
    object.material.uniforms["time"].value = 0.05 * time;
    object.material.uniforms["sineTime"].value = Math.sin(
      object.material.uniforms["time"].value * 0.05
    );

    // const data = analyser.getFrequencyData();
    // const dataAvg = analyser.getAverageFrequency();

    // for (let i = 0; i < data.length; i++) {
    //   const value = 1;
    //   const v = data[i] / 512;
    //   const y = (v * 300) / 5000;
    // }
  };
  return bird;
}

export { createBirds };
