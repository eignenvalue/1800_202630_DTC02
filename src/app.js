import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
//--------------------------------------------------------------
// If you have custom global styles, import them as well:
//--------------------------------------------------------------
import '/src/styles/style.css';

//--------------------------------------------------------------
// Custom global JS code (shared with all pages)can go here.
//--------------------------------------------------------------

// This is an example function. Replace it with your own logic.
function sayHello() {
  // TODO: implement your logic here
}
document.addEventListener('DOMContentLoaded', sayHello);


const upButton = document.getElementById("video-up");
const downButton = document.getElementById("video-down");
const manager = document.querySelector("scrollable-video-manager");

if (upButton) {
  upButton.addEventListener("click", () => {
    manager.goPrevious();
  });
}

if(downButton) {
  downButton.addEventListener("click", () => {
    manager.goNext();
  });
}