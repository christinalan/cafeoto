import * as THREE from "../../../js/build/three.module.js";
import { PositionalAudioHelper } from "../../../js/examples/jsm/helpers/PositionalAudioHelper.js";
import { createRenderer } from "../../systems/renderer.js";
import { camera } from "../../World.js";
import { scene } from "../../World.js";
import { analyser } from "../animations/cylinder.js";

let geometryT, materialT, dataTexture;
let fft, data;
let starling, starlings;
let screens = [];
let texture;
let angle = 0;
let angleV = 0;
let angleA = 0;

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

  texture = textureLoader.load("images/textures/russian.png");

  fft = 128;
  data = analyser.getFrequencyData();

  const format = renderer.capabilities.isWebGL2
    ? THREE.RedFormat
    : THREE.LuminanceFormat;

  dataTexture = new THREE.DataTexture(data, fft / 20, 1, format);

  const octRadius = 20;

  geometryT = new THREE.OctahedronGeometry(octRadius);
  geometryT.translate(0, 30, -1000);

  function makeInstance(geometryT, texture, x, y, z) {
    materialT = new THREE.MeshLambertMaterial({
      color: 0xb4ff75,
      map: texture,
      emissive: 0xffffff,
      emissiveMap: dataTexture,
    });

    starling = new THREE.Mesh(geometryT, materialT);

    scene.add(starling);

    starling.position.x = x;
    starling.position.y = y;
    starling.position.z = z;

    starling.rotation.x = Math.PI / 2;

    return starling;
  }

  starlings = [
    makeInstance(geometryT, texture, 0, 0, 0),
    makeInstance(geometryT, texture, 0, 10, -100),
    makeInstance(geometryT, texture, 0, 10, -200),
    makeInstance(
      geometryT,
      texture,
      -Math.random() * 10,
      Math.random() * 30,
      Math.random() * 20
    ),
    makeInstance(
      geometryT,
      texture,
      Math.random() * 15,
      Math.random() * 20,
      Math.random() * 30
    ),
    makeInstance(
      geometryT,
      texture,
      Math.random() * 20,
      -Math.random() * 10,
      Math.random() * 50
    ),
    makeInstance(
      geometryT,
      texture,
      Math.random() * 40,
      -Math.random() * 20,
      Math.random() * 70
    ),
    makeInstance(
      geometryT,
      texture,
      -Math.random() * 30,
      Math.random() * 20,
      Math.random() * -30
    ),
    makeInstance(
      geometryT,
      texture,
      Math.random() * 10,
      Math.random() * 30,
      -Math.random() * 50
    ),
    makeInstance(
      geometryT,
      texture,
      Math.random() * 100,
      Math.random() * 30,
      -Math.random() * 100
    ),
  ];

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

    const raycaster = new THREE.Raycaster();

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children);

    for (let i = 0; i < intersects.length; i++) {
      const intersect = intersects[0];

      const screenGeo = new THREE.SphereGeometry(1, 20, 10);
      screenGeo.translate(0, 30, -300);
      const screenMaterial = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        map: texture,
      });

      const screen = new THREE.Mesh(screenGeo, screenMaterial);
      screen.position
        .copy(intersect.point)
        .add(intersect.face.normal)
        .divideScalar(Math.sin(dataAvg) * 0.01);

      scene.add(screen);

      screens.push(screen);

      //displacement
      displacement.copy(velocity).multiplyScalar(delta);
      //target
      target.copy(intersect.point).add(displacement);

      while (screens.length > 40) {
        screens.splice(0, 1);
      }
    }

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

        starling.rotation.x += Math.sin(y);
        starling.rotation.y += Math.sin(y);

        // starling.position.z = Math.sin(angle) * 0.01;

        angle += Math.sin(newMap) * y * 0.001;

        angle += angleV * 0.01;
        angleV += otherMap * 0.01;
      });

      for (let i = 0; i < screens.length; i++) {
        screens[i].scale.y += newMap * 5;
        screens[i].position.z = 0.01 * Math.sin(angle);
        angle += Math.sin(newMap) * y;

        angle += angleV;
        angleV += otherMap;
      }
    }
  };
  return starlings;
}

export { createStarling };
