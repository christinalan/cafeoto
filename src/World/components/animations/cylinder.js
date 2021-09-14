import * as THREE from "../../../js/build/three.module.js";
import { PositionalAudioHelper } from "../../../js/examples/jsm/helpers/PositionalAudioHelper.js";
import { camera } from "../../World.js";
// import { audioData } from "../../World.js";

let cylinders = [];
let audio2, audio3, audio4, audio5, audio6;
let angle = 0;

let posaudios = [];

let analyser;
let sig;
let posaudio1;
let data;
let sig2, sig3, sig4, sig5, sig6;

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

  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load("images/textures/sdr_earth.jpeg");

  const geo = new THREE.CylinderGeometry(50, 50, 2000, 2000);
  const geo1 = new THREE.CylinderGeometry(5, 5, 500, 500);
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
  posaudio1.setRefDistance(40);
  posaudio1.setRolloffFactor(3);
  posaudio1.setVolume(0.5);
  posaudio1.setDirectionalCone(45, 180, 0);
  posaudio1.rotation.set(Math.PI / 2, Math.PI / 5, 0);

  const helper1 = new PositionalAudioHelper(posaudio1, 1);
  // posaudio1.add(helper1);

  analyser = new THREE.AudioAnalyser(posaudio1, 256);

  cylinder1.add(posaudio1);

  //loading other sounds

  const cylinder2 = new THREE.Mesh(geo1, mat);
  cylinder2.rotation.set(Math.random() * Math.PI, 0, Math.random() * Math.PI);
  cylinder2.position.set(
    Math.random() * 10,
    Math.random() * 10,
    Math.random() * 100
  );

  const cylinder3 = new THREE.Mesh(geo1, mat);
  cylinder3.rotation.set(Math.random() * Math.PI, 0, Math.random() * Math.PI);
  cylinder3.position.set(
    Math.random() * 10,
    Math.random() * 10,
    Math.random() * 100
  );

  const cylinder4 = new THREE.Mesh(geo1, mat);
  cylinder4.rotation.set(Math.random() * Math.PI, 0, Math.random() * Math.PI);
  cylinder4.position.set(
    Math.random() * 10,
    Math.random() * 20,
    Math.random() * 200
  );

  const cylinder5 = new THREE.Mesh(geo1, mat);
  cylinder5.rotation.set(Math.random() * Math.PI, 0, Math.random() * Math.PI);
  cylinder5.position.set(
    Math.random() * 20,
    Math.random() * 30,
    Math.random() * 200
  );

  const cylinder6 = new THREE.Mesh(geo1, mat);
  cylinder6.rotation.set(Math.random() * Math.PI, 0, Math.random() * Math.PI);
  cylinder6.position.set(
    Math.random() * 30,
    Math.random() * 10,
    Math.random() * 300
  );

  const audioLoader = new THREE.AudioLoader();
  audioLoader.load("sounds/snippets/60.mp3", function (buffer) {
    for (let i = 0; i < 1; i++) {
      audio2 = new THREE.PositionalAudio(listener);
      audio2.setBuffer(buffer);
      audio2.setLoop(true);
      audio2.setVolume(0.5);
      audio2.setRefDistance(100);
      audio2.setRolloffFactor(3);
      audio2.setDirectionalCone(45, 180, 0);

      audio2.play();

      const helper2 = new PositionalAudioHelper(audio2, 1);
      audio2.add(helper2);

      cylinder2.add(audio2);
    }
  });

  audioLoader.load("sounds/148.mp3", function (buffer) {
    for (let i = 0; i < 1; i++) {
      audio3 = new THREE.PositionalAudio(listener);
      audio3.setBuffer(buffer);
      audio3.setLoop(true);
      audio3.setVolume(0.5);
      audio3.setRolloffFactor(5);
      audio3.setRefDistance(100);
      audio3.setDirectionalCone(30, 200, 0);

      audio3.play();

      const helper3 = new PositionalAudioHelper(audio3, 3);
      audio3.add(helper3);

      cylinder3.add(audio3);
    }
  });

  audioLoader.load("sounds/snippets/850.mp3", function (buffer) {
    for (let i = 0; i < 1; i++) {
      audio4 = new THREE.PositionalAudio(listener);
      audio4.setBuffer(buffer);
      audio4.setLoop(true);
      audio4.setVolume(0.5);
      audio4.setRolloffFactor(5);
      audio4.setRefDistance(100);
      audio4.setDirectionalCone(45, 180, 0);

      audio4.play();

      const helper4 = new PositionalAudioHelper(audio4, 2);
      audio4.add(helper4);

      cylinder4.add(audio4);
    }
  });

  audioLoader.load("sounds/CITIBike.mp3", function (buffer) {
    for (let i = 0; i < 1; i++) {
      audio5 = new THREE.PositionalAudio(listener);
      audio5.setBuffer(buffer);
      audio5.setLoop(true);
      audio5.setVolume(0.5);
      audio5.setRolloffFactor(5);
      audio5.setRefDistance(100);
      audio5.setDirectionalCone(30, 200, 0);

      audio5.play();

      const helper5 = new PositionalAudioHelper(audio4, 1);
      audio5.add(helper5);

      cylinder5.add(audio5);
    }
  });

  audioLoader.load("sounds/Link.mp3", function (buffer) {
    for (let i = 0; i < 1; i++) {
      audio6 = new THREE.PositionalAudio(listener);
      audio6.setBuffer(buffer);
      audio6.setLoop(true);
      audio6.setVolume(0.5);
      audio6.setRolloffFactor(3);
      audio6.setRefDistance(100);
      audio6.setDirectionalCone(45, 180, 0);

      audio6.play();

      const helper6 = new PositionalAudioHelper(audio6, 2);
      audio6.add(helper6);

      cylinder6.add(audio6);
    }
  });

  cylinders.push(cylinder2, cylinder3, cylinder4, cylinder5, cylinder6);

  sig1.play();

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

        cylinders[i].scale.y += Math.sin(y) * 100;

        if (Math.sin(v) >= 0 && Math.sin(v) <= Math.PI / 2) {
          cylinders[i].rotation.z += Math.sin(v) * 0.001;
          cylinders[i].rotation.y += Math.sin(angle) * 0.01;
        } else {
          cylinders[i].rotation.x -= Math.sin(v) * 0.001;
          cylinders[i].rotation.y -= Math.sin(angle) * 0.01;
        }

        const d = velocity.distanceTo(cylinders[i].position);

        if (d > 0 && d < 100) {
          velocity.multiplyScalar(-1);
        }

        cylinders[i].position.add(velocity);

        if (audio2) {
          audio2.rotation.set(Math.sin(angle) * 0.001, Math.sin(y) * 0.001, 0);
        }

        if (audio3) {
          audio3.rotation.set(Math.sin(v) * 0.001, 0, Math.sin(y) * 0.001);
        }

        if (audio4) {
          audio4.rotation.set(0, Math.sin(v) * 0.001, Math.sin(angle) * 0.001);
        }

        if (audio5) {
          audio5.rotation.set(0, 0, Math.sin(angle) * 0.001);
        }

        if (audio6) {
          audio6.rotation.set(0, Math.sin(v) * 0.001, 0);
        }

        angle += Math.sin(otherMap);
      }

      const d = velocity.distanceTo(cylinders[0].position);

      if (d > 10 && d < 100) {
        velocity.multiplyScalar(-1);
        acceleration.multiplyScalar(-1);
      }

      velocity.add(acceleration);

      posaudio1.rotation.z += Math.sin(angle) * y;
      posaudio1.position.y += Math.sin(y) * 0.1;
      angle += Math.sin(newMap);
    }
  };

  return cylinders;
}

export { createCylinder, analyser };
