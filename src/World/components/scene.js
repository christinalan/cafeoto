import * as THREE from "https://unpkg.com/three@0.121.1/build/three.module.js";
import { camera } from "../World.js";

let texture;
function createScene() {
  const scene = new THREE.Scene();
  // scene.background = new THREE.Color(0xafe2fe);
  const textureLoader = new THREE.CubeTextureLoader();
  texture = textureLoader.load([
    "images/textures/pos-x.jpg",
    "images/textures/neg-x.jpg",
    "images/textures/pos-y.jpg",
    "images/textures/neg-y.jpg",
    "images/textures/pos-z.jpg",
    "images/textures/neg-z.jpg",
  ]);
  scene.background = texture;

  scene.fog = new THREE.Fog(0x7ed1ff, 0, 750);

  scene.tick = () => {
    // if (camera.position.x >= 20 && camera.position.z >= 0) {
    //   texture.offset.x += 100;
    //   texture.offset.y += 100;
    //   console.log("yay");
    // }
  };

  return scene;
}

export { createScene };
