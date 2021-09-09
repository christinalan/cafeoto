// "use strict";

import * as THREE from "https://unpkg.com/three@0.121.1/build/three.module.js";
import { DeviceOrientationControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/controls/DeviceOrientationControls.js";

let camera;
let renderer;
let scene;
let deviceControls;
let cone;
let buttonPressed = false;

let button = document.getElementById("button");
let a, b, c;
let alpha, beta, gamma;
let enabled = false;

function sendData() {
  if (location.protocol != "https:") {
    location.href =
      "https:" +
      window.location.href.substring(window.location.protocol.length);
  }
  if (
    typeof DeviceMotionEvent !== "undefined" &&
    typeof DeviceMotionEvent.requestPermission === "function"
  ) {
    // (optional) Do something before API request prompt.
    DeviceMotionEvent.requestPermission()
      .then((response) => {
        // (optional) Do something after API prompt dismissed.
        if (response == "granted") {
          window.addEventListener("deviceorientation", handleOrientation);
        }
      })
      .catch(console.error);
  } else {
    alert("DeviceMotionEvent is not defined");
    // window.addEventListener("devicemotion", handleOrientation);
  }
}

function handleOrientation(event) {
  document.getElementById("alphaV").innerHTML = "";
  document.getElementById("betaV").innerHTML = "";
  document.getElementById("gammaV").innerHTML = "";

  //sensor refresh rate
  const updateRate = 1 / 30;

  // do something for 'e' here.
  alpha = event.alpha;
  beta = event.beta;
  gamma = event.gamma;
  enabled = true;

  a = document.createElement("p");
  b = document.createElement("p");
  c = document.createElement("p");

  a.innerHTML = `alpha ${alpha}`; //360 (looking around)
  b.innerHTML = `beta: ${beta}`; //tilting forward and back
  c.innerHTML = `gamma: ${gamma}`; //tilting left and right

  document.getElementById("alphaV").appendChild(a);
  document.getElementById("betaV").appendChild(b);
  document.getElementById("gammaV").appendChild(c);
}

function init() {
  const container = document.getElementById("container");
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa6fbff);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );

  camera.position.set(0, 3, 0);

  //basic cone
  const geometry = new THREE.ConeGeometry(0.1, 1, 10);
  const material = new THREE.MeshBasicMaterial({
    wireframe: true,
    color: 0xffff00,
  });
  cone = new THREE.Mesh(geometry, material);
  scene.add(cone);

  cone.rotation.set(Math.PI / 5, 0, 0);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  deviceControls = new DeviceOrientationControls(camera);
  animate();
}

function animate() {
  requestAnimationFrame(animate);

  render();
}

function render() {
  deviceControls.update();

  cone.rotation.z += Math.sin(Math.PI / 4) * 0.01;
  renderer.render(scene, camera);
}

button.addEventListener("click", () => {
  sendData();
  init();
  buttonPressed = true;
});

export { deviceControls };
