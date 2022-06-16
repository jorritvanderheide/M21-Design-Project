// Get window size
let width = window.innerWidth;
let height = window.innerHeight;

// Add random elements with a custom importance value
for (let i = 0; i < 100; i++) {
  // Position randomly
  let randomX = random(0, width - 25);
  let randomY = random(0, height - 25);

  // Create the new element
  let newElement = document.createElement("div");

  // Edit its properties
  let nodeSize = random(0, 100);
  let nodeSizePx = 100 - nodeSize + 25;
  newElement.className = "node";
  newElement.setAttribute("id", i);
  newElement.value = nodeSize;
  newElement.style.left = randomX + "px";
  newElement.style.top = randomY + "px";
  newElement.style.width = nodeSizePx + "px";
  newElement.style.height = nodeSizePx + "px";

  // Append element to document
  document.body.appendChild(newElement);

  // Hide nodes >50
  if (i > 50) {
    document.getElementById(i).classList.add("hidden");
  }
}

// Event listeners for the sliders
document.getElementById("slider1").addEventListener("input", setSlider1); // Complexity slider
document.getElementById("slider2").addEventListener("input", setSlider2); // Chrono slider

// Function to handle the complexity slider
function setSlider1() {
  let sliderValue = this.value;
  for (let i = 0; i < 100; i++) {
    let currentNode = document.getElementById(i);
    if (parseInt(currentNode.value) < sliderValue) {
      if (currentNode.classList.contains("hidden")) {
        currentNode.classList.remove("hidden");
      }
    } else {
      currentNode.classList.add("hidden");
    }
  }
}

// Function to handle the chrono slider
function setSlider2() {
  let sliderValue = this.value;
  for (let i = 0; i < 100; i++) {
    let currentNode = document.getElementById(i);
    if (i > sliderValue) {
      currentNode.classList.add("hidden2");
    } else {
      if (currentNode.classList.contains("hidden2")) {
        currentNode.classList.remove("hidden2");
      }
    }
  }
}

// Random value
function random(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}
