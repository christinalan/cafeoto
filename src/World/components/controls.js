import * as THREE from "../../js/build/three.module.js";
import { PointerLockControls } from "../../js/examples/jsm/controls/PointerLockControls.js";

let objects = [];
let raycaster;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

let prevTime = performance.now();

function createControls(camera, canvas) {
  const controls = new PointerLockControls(camera, canvas);
  const blocker = document.getElementById("blocker");
  const instructions = document.getElementById("instructions");

  raycaster = new THREE.Raycaster(
    new THREE.Vector3(),
    new THREE.Vector3(0, -1, 0),
    0,
    10
  );

  window.addEventListener("click", () => {
    controls.lock();
    // console.log("locking controls");
  });

  blocker.addEventListener("click", () => {
    controls.lock();
    // console.log("locking controls");
  });

  controls.addEventListener("lock", function () {
    instructions.style.display = "none";
    blocker.style.display = "none";
    // console.log("no instructions");
  });

  controls.addEventListener("unlock", function () {
    blocker.style.display = "block";
    instructions.style.display = "";
    // console.log("instructions");
  });

  const onKeyDown = function (event) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveForward = true;
        break;

      case "ArrowLeft":
      case "KeyA":
        moveLeft = true;
        break;

      case "ArrowDown":
      case "KeyS":
        moveBackward = true;
        break;

      case "ArrowRight":
      case "KeyD":
        moveRight = true;
        break;

      case "Space":
        if (canJump === true) velocity.y += 250;
        canJump = false;
        break;
    }
  };

  const onKeyUp = function (event) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        moveForward = false;
        break;

      case "ArrowLeft":
      case "KeyA":
        moveLeft = false;
        break;

      case "ArrowDown":
      case "KeyS":
        moveBackward = false;
        break;

      case "ArrowRight":
      case "KeyD":
        moveRight = false;
        break;
    }
  };

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  controls.tick = () => {
    // objects.push(allobjects);

    const time = performance.now();
    if (controls.isLocked === true) {
      //   console.log("hello tick activated for controls");

      raycaster.ray.origin.copy(controls.getObject().position);
      raycaster.ray.origin.y -= 10;

      const intersections = raycaster.intersectObjects(objects);

      const onObject = intersections.length > 0;

      const delta = (time - prevTime) / 5000;

      velocity.x -= velocity.x * 10.0 * delta;
      velocity.z -= velocity.z * 10.0 * delta;

      velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

      direction.z = Number(moveForward) - Number(moveBackward);
      direction.x = Number(moveRight) - Number(moveLeft);
      direction.normalize(); // this ensures consistent movements in all directions

      if (moveForward || moveBackward)
        velocity.z -= direction.z * 100.0 * delta;
      if (moveLeft || moveRight) velocity.x -= direction.x * 100.0 * delta;

      if (onObject === true) {
        velocity.y = Math.max(0, velocity.y);
        canJump = true;
      }

      controls.moveRight(-velocity.x * delta);
      controls.moveForward(-velocity.z * delta);

      // controls.getObject().position.y += velocity.y * delta; // new behavior
      controls.getObject().position.set(100, 500, 0); // start higher
      controls.getObject().rotation.x = -Math.PI / 4; // tilt down if needed

      if (controls.getObject().position.y < 10) {
        velocity.y = 0;
        controls.getObject().position.y = 10;

        canJump = true;
      }
    }
    prevTime = time;
  };

  return controls;
}

export { createControls, raycaster };
