import * as THREE from "../../../js/build/three.module.js";
import { PositionalAudioHelper } from "../../../js/examples/jsm/helpers/PositionalAudioHelper.js";
import { createRenderer } from "../../systems/renderer.js";
import { camera } from "../../World.js";
import { scene } from "../../World.js";
import { analyser } from "../animations/cylinder.js";

let geometryT, materialT, dataTexture;
let fft, data;
let starling;
let starlings = [];
let screens = [];
let texture;
let angle = 0;
let angleV = 0;
let angleA = 0;
let audio;

let speed, clock, mouse;

function mapRange(value, minf, maxf, mins, maxs) {
  value = (value - minf) / (maxf - minf);
  return mins + value * (maxs - mins);
}

function onMouseDown(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function createStarling() {
  clock = new THREE.Clock();
  mouse = new THREE.Vector2();
  const renderer = createRenderer();
  const textureLoader = new THREE.TextureLoader();

  texture = textureLoader.load("images/textures/3GWCDMA.png");

  fft = 128;
  data = analyser.getFrequencyData();

  const format = renderer.capabilities.isWebGL2
    ? THREE.RedFormat
    : THREE.LuminanceFormat;

  dataTexture = new THREE.DataTexture(data, fft / 20, 1, format);

  const octRadius = 2;

  geometryT = new THREE.OctahedronGeometry(octRadius);
  geometryT.translate(0, 30, 1000);

  materialT = new THREE.MeshLambertMaterial({
    color: 0xb4ff75,
    map: texture,
    emissive: 0xffffff,
    emissiveMap: dataTexture,
  });

  for (let i = 0; i < 150; i++) {
    const s = i / 2;
    starling = new THREE.Mesh(geometryT, materialT);
    starling.position.set(s - 2, s + 10, 500);
    starling.rotation.set(0, Math.PI / 2, Math.PI / 2);

    starlings.push(starling);
  }

  const audioLoader = new THREE.AudioLoader();
  const listener = new THREE.AudioListener();
  camera.add(listener);

  audioLoader.load("sounds/ebird/orientalturtledove.mp3", function (buffer) {
    for (let i = 0; i < 1; i++) {
      audio = new THREE.PositionalAudio(listener);

      audio.setBuffer(buffer);
      audio.setDistanceModel("exponential");
      audio.setRefDistance(100);
      audio.setRolloffFactor(50);
      audio.setDirectionalCone(90, 270, 0);
      audio.rotation.set(Math.PI / 2, Math.PI / 2, 0);
      audio.setLoop(true);

      audio.play();

      const helper = new PositionalAudioHelper(audio, 3);
      //   audio.add(helper);

      starling.add(audio);
    }
  });

  window.addEventListener("click", onMouseDown, false);

  starlings.tick = () => {
    var clock = new THREE.Clock();
    var elapsedTime = clock.getElapsedTime();
    const dataAvg = analyser.getAverageFrequency();

    const displacement = new THREE.Vector3(0, speed, 0);
    const target = new THREE.Vector3();
    const velocity = new THREE.Vector3();

    speed += angleA;

    const delta = clock.getDelta();

    /////////////ANALYZER STARTS HERE

    for (let i = 0; i < data.length; i++) {
      let value = 1;
      var v = data[i] / 2048;
      var y = (v * 300) / 5000;

      var newMap = mapRange(value, 0, 255, 0, v);
      var otherMap = mapRange(
        value,
        0,
        1024,
        window.innerHeight / 5000,
        dataAvg
      );

      starlings.forEach((starling) => {
        materialT.emissiveMap.needsUpdate = true;
        starling.scale.x = (Math.sin(angle) * dataAvg) / 20;
        starling.scale.z = (Math.sin(angle) * dataAvg) / 20;

        starling.rotation.z += Math.sin(y) * 0.1;
        starling.rotation.y += Math.sin(y) * 0.1;

        starling.position.x = Math.sin(angle) * 0.01;
        starling.position.z = Math.sin(angle) * 0.001;

        angle += Math.sin(newMap) * y * 0.001;

        angle += angleV * 0.01;
        angleV += otherMap * 0.01;
      });
    }
  };
  return starlings;
}

export { createStarling };
