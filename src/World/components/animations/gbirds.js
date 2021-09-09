import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js";
import { PositionalAudioHelper } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/helpers/PositionalAudioHelper.js";
import { scene } from "../../World.js";
import { camera } from "../../World.js";
import { analyser } from "../animations/cylinder.js";
import { createRenderer } from "../../systems/renderer.js";

let fam = [];
let geometry, material;
let audio, bird, data, texture;
let angle = 0;
let angleV = 0;
let angleA = 0;
let newBirds = [];

let speed, clock, mouse;

function mapRange(value, minf, maxf, mins, maxs) {
  value = (value - minf) / (maxf - minf);
  return mins + value * (maxs - mins);
}

function generateBirds() {
  const renderer = createRenderer();
  clock = new THREE.Clock();
  mouse = new THREE.Vector2();
  const textureLoader = new THREE.TextureLoader();
  texture = textureLoader.load("images/textures/3GWCDMA.png");

  data = analyser.getFrequencyData();

  const format = renderer.capabilities.isWebGL2
    ? THREE.RedFormat
    : THREE.LuminanceAlphaFormat;

  const dataTexture = new THREE.DataTexture(data, 128, 1, format);

  geometry = new THREE.ConeGeometry(5, 10, 2);
  material = new THREE.MeshLambertMaterial({
    color: 0xbf71ff,
    map: texture,
    emissive: 0xffffff,
    emissiveMap: dataTexture,
  });

  for (let i = 0; i < 200; i++) {
    const s = i / 2;
    bird = new THREE.Mesh(geometry, material);
    bird.position.set(s - 2, 0, -300);
    bird.rotation.set(Math.PI / 2, 0, Math.PI / 2);

    fam.push(bird);
  }

  const audioLoader = new THREE.AudioLoader();
  const listener = new THREE.AudioListener();
  camera.add(listener);

  audioLoader.load("sounds/ebird/rockpigeonwing.mp3", function (buffer) {
    for (let i = 0; i < 1; i++) {
      audio = new THREE.PositionalAudio(listener);

      audio.setBuffer(buffer);
      audio.setDistanceModel("exponential");
      audio.setRefDistance(300);
      audio.setDirectionalCone(90, 270, 0);
      audio.rotation.set(Math.PI / 4, Math.PI / 2, 0);

      audio.play();

      const helper = new PositionalAudioHelper(audio, 3);
      audio.add(helper);

      bird.add(audio);
    }
  });

  fam.tick = () => {
    var clock = new THREE.Clock();
    var elapsedTime = clock.getElapsedTime();
    const dataAvg = analyser.getAverageFrequency();

    //trying raycaster
    const delta = clock.getDelta();

    const displacement = new THREE.Vector3(0, speed, 0);
    const target = new THREE.Vector3();
    const velocity1 = new THREE.Vector3();

    speed += angleA;

    const raycaster = new THREE.Raycaster();

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children);

    for (let i = 0; i < intersects.length; i++) {
      const intersect = intersects[0];

      const geo = new THREE.ConeGeometry(1, 10, 2);
      geo.translate(-200, 30, -210);
      const material = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        opacity: 0.6,
        transparent: true,
        map: texture,
      });

      const newBird = new THREE.Mesh(geo, material);
      newBird.position
        .copy(intersect.point)
        .add(intersect.face.normal)
        .divideScalar(Math.sin(dataAvg));

      scene.add(newBird);

      newBirds.push(newBird);

      //displacement
      displacement.copy(velocity1).multiplyScalar(delta);
      //target
      target.copy(intersect.point).add(displacement);

      while (newBirds.length > 100) {
        newBirds.splice(0, 1);
      }
    }

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

      var position = new THREE.Vector3(window.innerWidth / 100, 0, 0);

      var velocity = new THREE.Vector3(otherMap, Math.sin(v), Math.cos(v));
      var acceleration = new THREE.Vector3(Math.sin(v), Math.sin(otherMap), v);

      var avg = new THREE.Vector3();
      var total = 0;

      fam.forEach((b) => {
        material.emissiveMap.needsUpdate = true;

        var d = velocity.distanceTo(b.position);

        if (d >= 300 || d <= 20) {
          avg.add(b.position);
          total++;

          velocity.multiplyScalar(-1);
          acceleration.multiplyScalar(-1);
        }

        b.position.add(velocity);
        velocity.add(acceleration);

        b.scale.y = (Math.sin(angle) * dataAvg) / 15;
        b.scale.z = (Math.sin(angle) * dataAvg) / 30;

        b.rotation.y += Math.sin(angle);

        // b.position.y = Math.sin(y) * 2;

        angle += Math.sin(newMap) * y;

        angle += angleV;
        angleV += otherMap;
      });

      newBirds.forEach((b) => {
        b.scale.y += Math.sin(newMap) * 5;
        b.position.z += Math.sin(angle) * 3;
        b.rotation.z += Math.sin(Math.PI / 2);
        angle += Math.sin(newMap) * y;

        angle += angleV;
        angleV += otherMap;

        // fam.push(b);
      });
    }
  };

  return fam;
}

export { generateBirds };
