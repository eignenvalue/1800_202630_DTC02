const upButton = document.getElementById("video-up");
const downButton = document.getElementById("video-down");
const manager = document.querySelector("scrollable-video-manager");

if (upButton) {
    upButton.addEventListener("click", () => {
        manager.goPrevious();
    });
}

if (downButton) {
    downButton.addEventListener("click", () => {
        manager.goNext();
    });
}