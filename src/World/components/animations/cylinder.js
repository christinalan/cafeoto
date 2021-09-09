// import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js";
import * as THREE from "https://unpkg.com/three@0.121.1/build/three.module.js";
import { PositionalAudioHelper } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/helpers/PositionalAudioHelper.js";
import { camera } from "../../World.js";
// import { audioData } from "../../World.js";

let cylinders = [];
let audio;
let angle = 0;

let posaudios = [];

let analyser;
let sig;
let posaudio1;
let data;

function wait() {
  setTimeout(sigplay, 10000);
}

function sigplay() {
  sig.play();
  sig.onended = (e) => {
    wait();
  };
}

function mapRange(value, minf, maxf, mins, maxs) {
  value = (value - minf) / (maxf - minf);
  return mins + value * (maxs - mins);
}

function createCylinder() {
  const sig1 = document.getElementById("track3");
  const sig2 = document.getElementById("track4");
  const sig3 = document.getElementById("track5");
  const sig4 = document.getElementById("track6");
  const sig5 = document.getElementById("track7");
  const sig6 = document.getElementById("track8");

  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load("images/textures/sdr_earth.jpeg");

  const geo = new THREE.CylinderGeometry(50, 50, 2000, 2000);
  const geo1 = new THREE.CylinderGeometry(8, 8, 500, 500);
  const mat = new THREE.MeshLambertMaterial({
    alphaTest: 0.6,
    opacity: 0.7,
    transparent: true,
    map: texture,
  });
  mat.side = THREE.DoubleSide;

  const cylinder1 = new THREE.Mesh(geo, mat);
  cylinder1.rotation.set(Math.PI / 2, 0, 0);
  cylinder1.position.set(0, 7, 50);
  cylinders.push(cylinder1);

  const listener = new THREE.AudioListener();
  camera.add(listener);

  posaudio1 = new THREE.PositionalAudio(listener);
  posaudio1.setMediaElementSource(sig1);
  posaudio1.setRefDistance(200);
  posaudio1.setDirectionalCone(45, 180, 0);
  posaudio1.rotation.set(Math.PI / 2, Math.PI / 5, 0);

  const helper1 = new PositionalAudioHelper(posaudio1, 1);
  posaudio1.add(helper1);

  analyser = new THREE.AudioAnalyser(posaudio1, 256);

  cylinder1.add(posaudio1);

  const posaudio2 = new THREE.PositionalAudio(listener);
  posaudio2.setMediaElementSource(sig2);
  posaudio2.setRefDistance(100);
  posaudio2.setDirectionalCone(45, 180, 0);
  posaudio2.rotation.set(Math.PI / 2, 0, 0);

  const helper2 = new PositionalAudioHelper(posaudio2, 3);
  posaudio2.add(helper2);

  const posaudio3 = new THREE.PositionalAudio(listener);
  posaudio3.setMediaElementSource(sig3);
  posaudio3.setRefDistance(100);
  posaudio3.setDirectionalCone(45, 180, 0);
  posaudio3.rotation.set(0, Math.PI / 2, 0);

  const helper3 = new PositionalAudioHelper(posaudio3, 3);
  posaudio3.add(helper3);

  const posaudio4 = new THREE.PositionalAudio(listener);
  posaudio4.setMediaElementSource(sig4);
  posaudio4.setRefDistance(100);
  posaudio4.setDirectionalCone(45, 180, 0);
  posaudio4.rotation.set(0, Math.PI / 3, Math.PI / 2);

  const helper4 = new PositionalAudioHelper(posaudio4, 3);
  posaudio4.add(helper4);

  const posaudio5 = new THREE.PositionalAudio(listener);
  posaudio5.setMediaElementSource(sig5);
  posaudio5.setRefDistance(100);
  posaudio5.setDirectionalCone(45, 180, 0);
  posaudio5.rotation.set(0, 0, Math.PI / 2);

  const helper5 = new PositionalAudioHelper(posaudio5, 3);
  posaudio5.add(helper5);

  const posaudio6 = new THREE.PositionalAudio(listener);
  posaudio6.setMediaElementSource(sig6);
  posaudio6.setRefDistance(100);
  posaudio6.setDirectionalCone(45, 180, 0);
  posaudio6.rotation.set(Math.PI / 3, Math.PI / 2, Math.PI / 2);

  const helper6 = new PositionalAudioHelper(posaudio6, 3);
  posaudio6.add(helper6);

  posaudios.push(posaudio2, posaudio3, posaudio4, posaudio5, posaudio6);

  //other cylinders
  for (let i = 0; i < 5; i++) {
    const cylinder = new THREE.Mesh(geo1, mat);
    cylinder.rotation.set(
      Math.random(i) * Math.PI,
      0,
      Math.random(i * Math.PI)
    );
    cylinder.position.set(
      Math.random(i) * 100,
      Math.random(i) * 10,
      Math.random(i) * 400
    );

    cylinder.add(posaudios[i]);
    cylinders.push(cylinder);
  }

  sig1.play();
  sig2.play();
  sig3.play();
  sig4.play();
  sig5.play();
  sig6.play();

  cylinders.tick = () => {
    var clock = new THREE.Clock();
    var elapsedTime = clock.getElapsedTime();

    data = analyser.getFrequencyData();
    const dataAvg = analyser.getAverageFrequency();

    for (let i = 0; i < data.length; i++) {
      const value = 1;
      const v = data[i] / 512;
      const y = (v * 300) / 5000;

      var newMap = mapRange(value, 0, 255, 0, v);
      var otherMap = mapRange(
        value,
        0,
        1024,
        window.innerHeight / 5000,
        dataAvg
      );

      const velocity = new THREE.Vector3(otherMap, Math.sin(v), Math.cos(v));
      const acceleration = new THREE.Vector3(
        Math.sin(v),
        Math.sin(otherMap),
        v
      );

      for (let i = 0; i < cylinders.length; i++) {
        if (i === 0) {
          continue;
        }

        cylinders[i].scale.y += Math.sin(y);

        if (Math.sin(v) >= 0 && Math.sin(v) <= Math.PI) {
          cylinders[i].rotation.z += Math.sin(v) * 0.001;
        } else {
          cylinders[i].rotation.x -= Math.sin(v) * 0.001;
        }

        const d = velocity.distanceTo(cylinders[i].position);

        if (d > 0 && d < 100) {
          velocity.multiplyScalar(-1);
        }

        cylinders[i].position.add(velocity);

        cylinders[i].children[0].rotation.set(
          otherMap,
          Math.sin(v),
          Math.cos(y)
        );

        // cylinders[i].children[0].rotation.y += Math.sin(angle) * 10;
        // cylinders[i].children[0].position.y += Math.sin(angle) * 0.1;
        angle += Math.sin(otherMap);

        // audio1.rotation.x += Math.sin(angle);
        // audio1.position.y += Math.sin(y) * 0.1;
        // angle += Math.sin(otherMap);
      }

      const d = velocity.distanceTo(cylinders[0].position);

      cylinders[0].scale.y += Math.sin(y);
      // cylinders[0].rotation.y += Math.sin(y);

      if (d > 10 && d < 100) {
        velocity.multiplyScalar(-1);
        acceleration.multiplyScalar(-1);
      }
      cylinders[0].position.add(velocity);
      velocity.add(acceleration);

      posaudio1.rotation.z += Math.sin(angle) * y;
      posaudio1.position.y += Math.sin(y) * 0.1;
      angle += Math.sin(newMap);
    }
  };

  return cylinders;
}

export { createCylinder, analyser };
