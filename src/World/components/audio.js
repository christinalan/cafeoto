// import * as THREE from "../../js/build/three.module.js";

function onProcess(e) {
  var leftBuffer = e.inputBuffer.getChannelData(0);
  var rightBuffer = e.inputBuffer.getChannelData(1);
  checkClipping(leftBuffer);
  checkClipping(rightBuffer);
}

function checkClipping(buffer) {
  var isClipping = false;
  // Iterate through buffer to check if any of the |values| exceeds 1.
  for (var i = 0; i < buffer.length; i++) {
    var absValue = Math.abs(buffer[i]);
    if (absValue >= 1.0) {
      isClipping = true;
      break;
    }
  }
  // this.isClipping = isClipping;
  // if (isClipping) {
  //   lastClipTime = new Date();
  // }

  return isClipping;
}

export { checkClipping };
