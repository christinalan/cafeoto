import { World } from "./World/World.js";

let listenButton = document.getElementById("startButton");

function main() {
  const overlay = document.getElementById("overlay");
  overlay.remove();

  const container = document.getElementById("container");

  const world = new World(container);

  world.start();
}

listenButton.addEventListener("click", () => {
  console.log("starting audio");

  main();
});
