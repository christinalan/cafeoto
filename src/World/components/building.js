import * as THREE from "https://unpkg.com/three@0.121.1/build/three.module.js";
import { PositionalAudioHelper } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/helpers/PositionalAudioHelper.js";
import { camera } from "../World.js";

let floors = [];
let floor, floor1;
let audio, audio1;

function createFloor() {
  let clock = new THREE.Clock();
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load("images/textures/3GWCDMA.png");
  const texture1 = textureLoader.load("images/textures/Mpp4800.png");

  const floorGeometry = new THREE.PlaneGeometry(100, 1000);
  const floorMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    map: texture,
  });

  const floorMaterial1 = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    map: texture1,
  });

  floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = Math.PI * -0.5;
  floor.position.set(-50, -150, -200);
  floor.receiveShadow = true;

  floor1 = new THREE.Mesh(floorGeometry, floorMaterial1);
  floor1.rotation.set(Math.PI * -0.5, 0, 0);
  floor1.position.set(100, -100, -600);

  floors.push(floor, floor1);

  //audio attachment

  const audioLoader = new THREE.AudioLoader();

  const listener = new THREE.AudioListener();
  camera.add(listener);

  audioLoader.load("sounds/st_1.mp3", function (buffer) {
    for (let i = 0; i < 1; i++) {
      audio = new THREE.PositionalAudio(listener);
      audio.setBuffer(buffer);
      audio.setDistanceModel("exponential");
      audio.setRefDistance(2000);
      audio.setDirectionalCone(90, 270, 0);

      audio.play();

      const helper = new PositionalAudioHelper(audio, 20);
      audio.add(helper);

      floor.add(audio);
    }
  });

  const audioLoader1 = new THREE.AudioLoader();

  audioLoader1.load("sounds/st_2.wav", function (buffer) {
    for (let i = 0; i < 1; i++) {
      audio1 = new THREE.PositionalAudio(listener);
      audio1.setBuffer(buffer);
      audio1.setDistanceModel("exponential");
      audio1.setRefDistance(3000);
      audio1.setDirectionalCone(90, 270, 0);

      audio1.play();

      const helper1 = new PositionalAudioHelper(audio1, 20);
      audio1.add(helper1);

      floor1.add(audio1);
    }
  });

  floors.tick = () => {
    var delta = clock.getDelta();
    var elapsedTime = clock.getElapsedTime();

    for (let floor of floors) {
      var speed = 0.3;
      floor.position.z += Math.sin(elapsedTime) * 2;
      // if (audio) {
      //   floor.children[0].rotation.y += Math.sin(Math.PI / 4) * speed;

      //   if (
      //     floor.children[0].rotation.y >= Math.PI / 4 &&
      //     floor.children[0].rotation.y <= 0
      //   ) {
      //     speed *= -1;
      //   }
      // }
    }
  };
  return floors;
}

function createMainHall() {
  const walls = [];
  const vertex = new THREE.Vector3();
  const color = new THREE.Color();

  let wGeo = new THREE.PlaneGeometry(500, 200, 100, 100);
  wGeo.translate(0, 50, 0);
  wGeo.rotateY(Math.PI / 2);

  //adding some vertex variation to walls
  let position = wGeo.attributes.position;

  for (let i = 0, l = position.count; i < l; i++) {
    vertex.fromBufferAttribute(position, i);

    vertex.x += Math.random() * 1 - 2;
    vertex.y += Math.random() * 1;
    vertex.z += Math.random() * 2;

    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  wGeo = wGeo.toNonIndexed();

  position = wGeo.attributes.position;
  const colorsFloor = [];

  for (let i = 0, l = position.count; i < l; i++) {
    color.setHSL(Math.random() * 0.01, 0.75, Math.random() * 0.15 + 0.01);
    colorsFloor.push(color.r, color.g, color.b);
  }

  wGeo.setAttribute("color", new THREE.Float32BufferAttribute(colorsFloor, 3));

  const wMaterial = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
  });

  const wall = new THREE.Mesh(wGeo, wMaterial);
  const wall2 = new THREE.Mesh(wGeo, wMaterial);
  wall.position.set(-10, 0, 0);
  wall2.position.set(10, 0, 0);

  walls.push(wall, wall2);

  return walls;
}

function createDoors() {
  const doors = [];

  const dGeo = new THREE.BoxGeometry(8, 25, 1);
  dGeo.rotateY(Math.PI / 2);
  const dMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
  });

  const door = new THREE.Mesh(dGeo, dMat);
  door.position.set(-11.5, 15, -20);

  const door1 = new THREE.Mesh(dGeo, dMat);
  door1.position.set(-11.5, 15, -140);

  const door2 = new THREE.Mesh(dGeo, dMat);
  door2.position.set(8.5, 15, -20);

  const door3 = new THREE.Mesh(dGeo, dMat);
  door3.position.set(8.5, 15, -140);

  doors.push(door, door1, door2, door3);
  return doors;
}

function createWalls() {
  const otherwalls = [];
  const smallGeo = new THREE.PlaneGeometry(400, 250);
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load("/images/textures/russian.png");

  const wMat = new THREE.MeshBasicMaterial({
    color: 0x6800005,
    map: texture,
    // color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
  });

  //left wall
  const wall = new THREE.Mesh(smallGeo, wMat);
  wall.position.set(-212, 50, 100);

  //2nd wall to the right
  const wall1 = new THREE.Mesh(smallGeo, wMat);
  wall1.position.set(-212, 50, -110);

  //ceiling ?
  const ceiling = new THREE.Mesh(smallGeo, wMat);
  ceiling.position.set(-212, 150, 0);
  ceiling.rotation.set(Math.PI / 2, 0, 0);

  //right side walls
  const wall2 = new THREE.Mesh(smallGeo, wMat);
  wall2.position.set(210, 50, 100);

  const wall3 = new THREE.Mesh(smallGeo, wMat);
  wall3.position.set(210, 50, -110);

  //ceiling
  const ceiling1 = new THREE.Mesh(smallGeo, wMat);
  ceiling1.position.set(209, 150, 0);
  ceiling1.rotation.set(Math.PI / 2, 0, 0);

  otherwalls.push(wall, wall1, ceiling, wall2, wall3, ceiling1);

  return otherwalls;
}

export { createFloor, createMainHall, createDoors, createWalls };
