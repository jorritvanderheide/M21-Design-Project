/**
 * Imports
 */

import "./css/style.css";
import * as THREE from "three";
import CameraControls from "camera-controls";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { AfterimagePass } from "three/examples/jsm/postprocessing/AfterimagePass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { GlitchPass } from "three/examples/jsm/postprocessing/GlitchPass.js";
import { Lensflare, LensflareElement } from "three/examples/jsm/objects/Lensflare.js";
import { FlakesTexture } from "three/examples/jsm/textures/FlakesTexture.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import Stats from "stats-js";

/**
 * Declaration
 */

// Constants
const DOLLY_DISTANCE = 50; // Camera zoom distance on node click (close)
const DOLLY_DISTANCE_FAR = 250; // Camera zoom distance on node click (far)
const BACK_KEY = "Escape"; // Key to escape menus
const HAS_STATS = false; // Toggle FPS counter

// Variables
var autoRotate = true; // Holds true auto rotate is turned on
var hasGrid = false; // Holds true is UI is visible
var hasUI = true; // Holds true is UI is visible
let ifStart = false; // Holds true after first user input
var intersectsPointer; // Holds true when an object is detected under the cursor
let hasRecommendation = false; // Holds true if recomendations are enabled
var shapeCounter = 1; // Number of objects
var fileCounter = 1; // Number of files uploaded
var rotationSpeed = 10; // Speed of the camera rotation
var colorArray = [0x8e44ad, 0x27ae60, 0xe67e22, 0x3498db, 0xc0392b, 0xf1c40f]; // Possible colors of the nodes

/**
 * Init
 */

// Clear local storage on startup
localStorage.clear();

// Hotfix for a bug that scrols down the page on the first mouse click
document.documentElement.scrollTop = 0;

// Install camera controls
CameraControls.install({ THREE: THREE });

// Stats configuration
const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
if (HAS_STATS == true) {
  document.body.appendChild(stats.dom);
}

// Create canvas
const canvas = document.querySelector("canvas.webgl");

// Create scene
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x35485e, 0.001);
scene.background = new THREE.Color(0x352b43);

// Create node shapes
let nodeGeometry;
const nodeGeometry1 = new THREE.SphereBufferGeometry(15, 64, 64);
const nodeGeometry2 = new THREE.TorusGeometry(20, 5, 64, 32);
const nodeGeometry3 = new THREE.CylinderBufferGeometry(12.5, 12.5, 20, 64);
const nodeGeometry4 = new THREE.DodecahedronBufferGeometry(15);
var geometryArray = [nodeGeometry1, nodeGeometry2, nodeGeometry3, nodeGeometry4]; // Array that holds the different node shapes

// Retrieve window size
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// Create renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas, // Set DOM element for rendering
  antialias: false, // Set antialias to false because of post-processing effects
});

// Renderer configuration
renderer.autoClear = false;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(scene.fog.color);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Create visual effects
const composer = new EffectComposer(renderer);
const afterimagePass = new AfterimagePass();
const fxaaPass = new ShaderPass(FXAAShader);
const glitchPass = new GlitchPass();

// Create camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 1, 1000);
camera.position.set(100, 100, 100);

// Create node material and textures
let nodeMaterial = new THREE.MeshPhysicalMaterial();
let envmaploader = new THREE.PMREMGenerator(renderer);
// Load environment map
new RGBELoader().setPath("textures/").load("envmap.hdr", function (hdrmap) {
  // Configure textures
  let nodeTexture = new THREE.CanvasTexture(new FlakesTexture());
  nodeTexture.wrapS = THREE.RepeatWrapping;
  nodeTexture.wrapT = THREE.RepeatWrapping;
  nodeTexture.repeat.set(10, 6);
  let envmap = envmaploader.fromCubemap(hdrmap); // Set loaded environment map
  // Set material propertes
  const fancyMaterial = {
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    metalness: 1,
    roughness: 0.8,
    normalMap: nodeTexture,
    normalScale: new THREE.Vector2(0.15, 0.15),
    envMap: envmap.texture, // Add environment map
  };
  nodeMaterial = new THREE.MeshPhysicalMaterial(fancyMaterial); // The final material
});

// Setup recommendations
let recommendationGeometry = new THREE.IcosahedronBufferGeometry(10);
let recommendationMaterial = new THREE.MeshPhongMaterial();
recommendationMaterial.opacity = 1;
recommendationMaterial.depthWrite = false;
addRecommendation(); // Function to show recomendations at a random interval

// Setup impact clouds
let sliderSize = 25;
let impactTextureLoader = new THREE.TextureLoader();
let impactGemetry = new THREE.PlaneBufferGeometry(sliderSize * 3, sliderSize * 3); // The impact clouds consists of a plane
let impactMaterial = new THREE.MeshLambertMaterial();
let impactCloud = [];
// Load impact texture
impactTextureLoader.load("textures/smoke.jpg", function (impactTexture) {
  impactMaterial = new THREE.MeshLambertMaterial({
    alphaMap: impactTexture, // Add texture to mesh
    transparent: true,
    depthWrite: false,
  });
});

// Create space dust particles
const particleCloud = [];
const dustGeometry = new THREE.BufferGeometry();
const dustTexture = new THREE.TextureLoader().load("textures/dust.jpg"); // Load texture
// Create 500 particless
for (let i = 0; i < 500; i++) {
  const x = random(-Math.pow(Math.floor(Math.random() * 24), 2), Math.pow(Math.floor(Math.random() * 24), 2));
  const y = random(-Math.pow(Math.floor(Math.random() * 24), 2), Math.pow(Math.floor(Math.random() * 24), 2));
  const z = random(-Math.pow(Math.floor(Math.random() * 24), 2), Math.pow(Math.floor(Math.random() * 24), 2));
  particleCloud.push(x, y, z);
}
dustGeometry.setAttribute("position", new THREE.Float32BufferAttribute(particleCloud, 3));
// Space dust material propertiess
let cloudMaterial = new THREE.PointsMaterial({
  size: 2,
  sizeAttenuation: true,
  alphaMap: dustTexture, //Add loaded texture
  transparent: true,
  opacity: 0.75,
  depthWrite: false, // Disables transpratent parts in textures to clips
});
cloudMaterial.color.setHSL(1.0, 0.3, 0.7);
const particles = new THREE.Points(dustGeometry, cloudMaterial);
scene.add(particles); // Add particles to scene

// Create point lights and lense flare
const textureLoader = new THREE.TextureLoader();
const flare1 = textureLoader.load("textures/lensflare/lensflare0.png");
const flare2 = textureLoader.load("textures/lensflare/lensflare3.png");

// Add point lights of type 1 (default)
addLight(0, 0, 0);
addLight(-1000, 1000, 1000);
addLight(1000, -1000, 1000);
addLight(1000, 1000, -1000);

// Add point lights of type 2 (far lights)
addLight2(0.55, 0.9, 0.5, 5000, 0, -1000);
addLight2(0.08, 0.8, 0.5, 0, 0, -1000);

// Function for type 1 creation
function addLight(x, y, z) {
  let color = new THREE.Color(0xffffff);
  const light = new THREE.PointLight(color, 10, 2000);
  light.position.set(x, y, z);
  scene.add(light); // Add light to scene
  // Add flares
  const lensflare = new Lensflare();
  lensflare.addElement(new LensflareElement(flare1, 500, 0, light.color));
  lensflare.addElement(new LensflareElement(flare2, 60, 0.6));
  lensflare.addElement(new LensflareElement(flare2, 70, 0.7));
  lensflare.addElement(new LensflareElement(flare2, 120, 0.9));
  lensflare.addElement(new LensflareElement(flare2, 70, 1));
  light.add(lensflare); // Add flare to scene
}

// Function for type 2 creation
function addLight2(h, s, l, x, y, z) {
  const light = new THREE.PointLight(0xffffff, 1.5, 2000);
  light.color.setHSL(h, s, l);
  light.position.set(x, y, z);
  scene.add(light); // Add to scene
  // Add flares
  const lensflare = new Lensflare();
  lensflare.addElement(new LensflareElement(flare2, 60, 0.6));
  lensflare.addElement(new LensflareElement(flare2, 70, 0.7));
  lensflare.addElement(new LensflareElement(flare2, 120, 0.9));
  lensflare.addElement(new LensflareElement(flare2, 70, 1));
  light.add(lensflare); // Add flare to scene
}

function addLightRec(x, y, z) {
  let color = new THREE.Color(0xffffff);
  const light = new THREE.PointLight(color.setHex(Math.random() * 0xffffff), 0.001, 100);
  light.position.set(x, y, z);
  light.name = "recLight";
  scene.add(light);

  const lensflare = new Lensflare();
  lensflare.addElement(new LensflareElement(flare1, 350, 0, light.color));
  lensflare.addElement(new LensflareElement(flare2, 60, 0.6));
  lensflare.addElement(new LensflareElement(flare2, 70, 0.7));
  lensflare.addElement(new LensflareElement(flare2, 120, 0.9));
  lensflare.addElement(new LensflareElement(flare2, 70, 1));
  light.add(lensflare);
}

// Create ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// Create camera controls
const controls = new CameraControls(camera, canvas);
controls.minDistance = 50;
controls.maxDistance = 500;
controls.touches.two = CameraControls.ACTION.TOUCH_DOLLY; // Set custom touch actions
controls.touches.three = CameraControls.ACTION.TOUCH_ROTATE; // Set custom touch actions
controls.dollyTo(DOLLY_DISTANCE_FAR, true); // Position camera in default position
const transformControls = new TransformControls(camera, canvas);
transformControls.setMode("translate");

// Create user input
var raycaster = new THREE.Raycaster();
var pointer = new THREE.Vector2();

// Init scene
scene.add(camera);
collapseUI(); // Hides the UI on first launch

/**
 * Event listeners
 */

// Window resize
window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderers
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  composer.setSize(sizes.width, sizes.height);
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Pointer input
document.addEventListener("mousemove", onPointerMove);
document.addEventListener("click", onPointerClick);
document.addEventListener("touch", onPointerClick);

// Keyboard input
document.addEventListener("keydown", onKeyPress);

// UI input
document.getElementById("addButton").addEventListener("click", addNode);
document.getElementById("changeShapeButton").addEventListener("click", changeNodeShape);
document.getElementById("transformButton").addEventListener("click", transformNode);
document.getElementById("backButton").addEventListener("click", backAll);
document.getElementById("uploadButton").addEventListener("click", uploadPrompt);
document.getElementById("cloudButton").addEventListener("click", setImpact);
document.getElementById("impactSlider").addEventListener("mouseup", setSlider);
document.getElementById("impactSlider").addEventListener("touchend", setSlider);
document.getElementById("deleteUploadNotification").addEventListener("click", deleteUpload);
document.getElementById("noDeleteUploadNotification").addEventListener("click", noDeleteUpload);

// File drag & drop
document.addEventListener("dragstart", (event) => {
  dragged = event.target;
});
document.addEventListener("dragover", (event) => {
  event.preventDefault();
});
document.addEventListener("drop", (event) => {
  event.preventDefault();

  // Move dragged element to the selected drop target
  if (event.target.className == "fileDrop box content is-normal") {
    const ul = document.getElementById("fileList");
    var li = document.createElement("li"); // Create new list item
    li.innerHTML = "&#128196 file" + fileCounter + ".file"; // Set file name
    fileCounter++;
    ul.appendChild(li); // Add to DOM
  }
});

// Camera controls
controls.addEventListener("control", cameraUserChange);
transformControls.addEventListener("dragging-changed", (event) => {
  controls.enabled = !event.value;
});

/**
 * Functions
 */

// On pointer move
function onPointerMove(event) {
  // Set pointer location
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  // Check raycaster for collisionss
  raycaster.setFromCamera(pointer, camera);
  intersectsPointer = raycaster.intersectObjects(scene.children, false);
  // If a collision is detected
  if (intersectsPointer.length > 0) {
    if (
      intersectsPointer[0].object.type != "GridHelper" &&
      intersectsPointer[0].object.type != "Points" &&
      intersectsPointer[0].object.name != "impactCloud"
    ) {
      document.body.style.cursor = "pointer"; // Change cursor shape
      if (hasUI == false) {
        // Get node data from local storage and show UI
        document.getElementById("nodeType").innerHTML = localStorage.getItem(intersectsPointer[0].object.id + ".type");
        document.getElementById("nodeName").innerHTML = localStorage.getItem(intersectsPointer[0].object.id + ".name");
        document.getElementById("nodeDesc").innerHTML = localStorage.getItem(intersectsPointer[0].object.id + ".desc");
        document.getElementById("whiteboardBox").style.right = "0";
      }
      // Otherwize, hide UI
    } else {
      document.body.style.cursor = "default";
      if (hasUI == false) {
        // Hide UI
        document.getElementById("whiteboardBox").style.right = "calc(-15vw - 2.5em)";
      }
    }
    // Otherwize, hide UI
  } else {
    document.body.style.cursor = "default";
    if (hasUI == false) {
      // Hide UI
      document.getElementById("whiteboardBox").style.right = "calc(-15vw - 2.5em)";
    }
  }
}

// On pointer click
function onPointerClick(event) {
  event.preventDefault();
  // Check for first user input
  if (ifStart == false) {
    ifStart = true;
  }
  // Show glitch effect
  glitch();
  // Enable controls
  if (scene.getObjectByName("transformControls")) {
    controls.enabled = true;
  }
  // Check for collisions
  raycaster.setFromCamera(pointer, camera);
  var intersects = raycaster.intersectObjects(scene.children, false);
  // If collisions detected
  if (intersects.length > 0) {
    // Check if collided with node
    if (intersects[0].object.material.metalness == 1) {
      shapeCounter = geometryArray.indexOf(intersects[0].object.geometry) + 1; // Reset shapeCounter for node shape changes
      saveLS(); // Save active node info to local storage
      // Reset active node
      if (scene.getObjectByName("activeNode")) {
        scene.getObjectByName("activeNode").name = "";
      }
      intersects[0].object.name = "activeNode"; // Set new active node
      // Check if node has an impact cloud
      if (typeof scene.getObjectByName("activeNode").userData == "number") {
        document.getElementById("impactSlider").disabled = false; // Enable impact slider
      } else {
        document.getElementById("impactSlider").disabled = true; // Disable impact slider
      }
      loadLS(); // Load active node info from local storage
      autoRotate = false; // Disable camera autorotate
      // If in transform mode, detach and reattach any transformControls
      if (scene.getObjectByName("transformControls")) {
        transformControls.detach();
        transformControls.name = "";
        transformNode(); // Reset transform controls
        // Else, position camera to new active node
      } else {
        controls.setPosition(
          intersects[0].object.position.x,
          intersects[0].object.position.y,
          intersects[0].object.position.z,
          true
        );
        controls.dollyTo(DOLLY_DISTANCE + intersects[0].object.position.distanceTo(new THREE.Vector3(0, 0, 0)), true); // Focus camera ons new active nodes
      }
      openUI(); // Open the UI
    }
  }
  unGlitch(); // Stop glitch effect
}

// Handle keyboard shortcuts
function onKeyPress(event) {
  // On BACK_KEY
  if (event.code == BACK_KEY) {
    backAll(); // Run backAll function to go to the initial view
  }
}

// Function for adding a node
function addNode() {
  backAll(); // Run backAll function to reset necessaray parameters
  controls.enabled = true; // Enable camera controls
  // Set random node shape
  let randomShape = random(0, geometryArray.length);
  nodeGeometry = geometryArray[randomShape];
  // Create a new node object
  const newNode = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
  let color = new THREE.Color(colorArray[random(0, colorArray.length)]);
  newNode.material.color = color;
  newNode.name = "activeNode";
  // Set object parameters position
  newNode.position.set(random(-100, 100), random(-100, 100), random(-100, 100));
  newNode.castShadow = true;
  newNode.receiveShadow = true;
  // Disable camera autorotate and controls
  autoRotate = false;
  controls.enabled = false;
  // Add node to scene
  scene.add(newNode);
  // Focus camera on node
  controls.setPosition(newNode.position.x, newNode.position.y, newNode.position.z, true);
  controls.dollyTo(DOLLY_DISTANCE + newsNode.position.distanceTo(new THREE.Vector3(0, 0, 0)), true);
  openUI(); // Open UIs
}

// Function that triggers node recomendations
function addRecommendation() {
  setInterval(addRandom, random(10000, 20000)); // Call a function that repeats at a semi-random interval
}

// Function that adds recommendation nodes to scene
function addRandom() {
  // Check for first user input
  if (intersectsPointer && ifStart == true) {
    // Check for previous recommendation node and UI visibility
    if (hasRecommendation == false && hasUI == false && intersectsPointer.length == 0) {
      hasRecommendation = true;
      let recX = random(-100, 100);
      let recY = random(-100, 100);
      let recZ = random(-100, 100);
      // Create recommendation node and point light
      addLightRec(recX, recY, recZ);
      const newRecommendation = new THREE.Mesh(recommendationGeometry, recommendationMaterial.clone());
      let color = new THREE.Color(0xffffff);
      newRecommendation.material.color = color.setHex(Math.random() * 0xffffff);
      newRecommendation.name = "recommendationNode";
      // Get recomendation from list
      let randomRec = random(0, 2);
      if (randomRec == 0) {
        document.getElementById("nodeType").innerHTML = "person recommendation";
        document.getElementById("nodeName").innerHTML = "Jorrit van der Heide";
        document.getElementById("nodeDesc").innerHTML =
          "You might want to link to this content, that is already available in the Repository of Transformation.";
      } else if (randomRec == 1) {
        document.getElementById("nodeType").innerHTML = "method recommendation";
        document.getElementById("nodeName").innerHTML = "Transforming Practices";
        document.getElementById("nodeDesc").innerHTML =
          "You might want to link to this content, that is already available in the Repository of Transformation.";
      } else {
        document.getElementById("nodeType").innerHTML = "case recommendation";
        document.getElementById("nodeName").innerHTML = "Station of Being";
        document.getElementById("nodeDesc").innerHTML =
          "You might want to link to this content, that is already available in the Repository of Transformation.";
      }
      // Add recommendation to scene
      newRecommendation.position.set(recX, recY, recZ);
      scene.add(newRecommendation);
      scene.getObjectByName("recommendationNode");
      // Update local storages
      localStorage.setItem(
        scene.getObjectByName("recommendationNode").id + ".type",
        document.getElementById("nodeType").innerHTML
      );
      localStorage.setItem(
        scene.getObjectByName("recommendationNode").id + ".name",
        document.getElementById("nodeName").innerHTML
      );
      localStorage.setItem(
        scene.getObjectByName("recommendationNode").id + ".desc",
        document.getElementById("nodeDesc").innerHTML
      );
      document.getElementById("nodeType").innerHTML = "nodetype";
      document.getElementById("nodeName").innerHTML = "Node Name";
      document.getElementById("nodeDesc").innerHTML = "Type a description for this node here.";
      // If not meeting the recommednation requirements
    } else {
      // Remove recommendation nodess
      var removeObject = scene.getObjectByName("recommendationNode");
      var removeLight = scene.getObjectByName("recLight");
      scene.remove(removeObject);
      scene.remove(removeLight);
      hasRecommendation = false; // Update recommendation state
    }
  }
}

// Function to change the node shape
function changeNodeShape() {
  // If an active node is present
  if (scene.getObjectByName("activeNode")) {
    // Check if shape counter needs resetting
    if (shapeCounter < geometryArray.length) {
      scene.getObjectByName("activeNode").geometry = geometryArray[shapeCounter]; // Update shape
      shapeCounter++;
    } else {
      shapeCounter = 0; // Reset shape counter
      scene.getObjectByName("activeNode").geometry = geometryArray[shapeCounter]; // Update shape
      shapeCounter++;
    }
  }
}

// Function to tansform nodes
function transformNode() {
  // Check if a node is already transformed
  if (!scene.getObjectByName("transformControls")) {
    autoRotate = false; // Disable camera rotation
    // Initate grid if not yet initiated
    if (hasGrid == false) {
      // Add gridhelpers
      const gridHelperXpos = new THREE.GridHelper(400, 10);
      const gridHelperXmin = new THREE.GridHelper(400, 10);
      const gridHelperYpos = new THREE.GridHelper(400, 10);
      const gridHelperYmin = new THREE.GridHelper(400, 10);
      const gridHelperZpos = new THREE.GridHelper(400, 10);
      const gridHelperZmin = new THREE.GridHelper(400, 10);
      // Set parameters
      gridHelperXpos.name = "gridXpos";
      gridHelperXpos.position.x = 200;
      gridHelperXpos.rotation.x = Math.PI / 2;
      gridHelperXpos.rotation.z = Math.PI / 2;
      gridHelperXpos.visible = false;
      gridHelperXmin.name = "gridXmin";
      gridHelperXmin.position.x = -200;
      gridHelperXmin.rotation.x = Math.PI / 2;
      gridHelperXmin.rotation.z = Math.PI / 2;
      gridHelperXmin.visible = false;
      gridHelperYpos.name = "gridYpos";
      gridHelperYpos.position.y = 200;
      gridHelperYpos.visible = false;
      gridHelperYmin.name = "gridYmin";
      gridHelperYmin.position.y = -200;
      gridHelperYmin.visible = false;
      gridHelperZpos.name = "gridZpos";
      gridHelperZpos.position.z = 200;
      gridHelperZpos.rotation.x = Math.PI / 2;
      gridHelperZpos.rotation.y = Math.PI / 2;
      gridHelperZpos.visible = false;
      gridHelperZmin.name = "gridZmin";
      gridHelperZmin.position.z = -200;
      gridHelperZmin.rotation.x = Math.PI / 2;
      gridHelperZmin.rotation.y = Math.PI / 2;
      gridHelperZmin.visible = false;
      // Add to scenes
      scene.add(gridHelperXpos);
      scene.add(gridHelperXmin);
      scene.add(gridHelperYpos);
      scene.add(gridHelperYmin);
      scene.add(gridHelperZpos);
      scene.add(gridHelperZmin);
      // Update grid state
      hasGrid = true;
    }
    // Attach transform controls to active node
    if (scene.getObjectByName("activeNode")) {
      transformControls.attach(scene.getObjectByName("activeNode"));
      transformControls.name = "transformControls";
      scene.add(transformControls); // Add transform controls to scene
      showGrid(); // Show the proper grids
    }
  } else {
    backAll(); // Back out and remove grids
  }
}

// Escape from anys view to the default view
function backAll() {
  // Check if requirements are met
  if (!document.getElementById("uploadNotification").classList.contains("hidden")) {
    document.getElementById("uploadNotification").classList.add("hidden");
  } else {
    transformControls.detach(); // Detach transform controls
    transformControls.name = "";
    autoRotate = true; // Enable camera auto rotate
    shapeCounter = 1; // Reset shape counter
    if (scene.getObjectByName("activeNode")) {
      saveLS(); // Save node info in node parameters
      clearLS(); // Clear local storage
      scene.getObjectByName("activeNode").name = "";
    }
    hideGrid(); // Hide grids
    collapseUI(); // Hide UI
    controls.dollyTo(DOLLY_DISTANCE_FAR, true); // sReset camera distance
    controls.enabled = true; // Enable camera controls
  }
}

// Function to update transform grid furing camera changess
function cameraUserChange() {
  showGrid(); // Update grids
}

// Function that checks which grids are needed and shows them
function showGrid() {
  // Check for transfrom controls
  if (scene.getObjectByName("transformControls")) {
    // Get inverse camera vector
    var direction = new THREE.Vector3(
      controls.camera.position.x * -1,
      controls.camera.position.y * -1,
      controls.camera.position.z * -1
    );
    // Set grids to visible or hidden based on the camera vector
    if (direction.x > 0) {
      scene.getObjectByName("gridXpos").visible = true;
      scene.getObjectByName("gridXmin").visible = false;
    } else {
      scene.getObjectByName("gridXpos").visible = false;
      scene.getObjectByName("gridXmin").visible = true;
    }
    if (direction.y > 0) {
      scene.getObjectByName("gridYpos").visible = true;
      scene.getObjectByName("gridYmin").visible = false;
    } else {
      scene.getObjectByName("gridYpos").visible = false;
      scene.getObjectByName("gridYmin").visible = true;
    }
    if (direction.z > 0) {
      scene.getObjectByName("gridZpos").visible = true;
      scene.getObjectByName("gridZmin").visible = false;
    } else {
      scene.getObjectByName("gridZpos").visible = false;
      scene.getObjectByName("gridZmin").visible = true;
    }
  }
}

// Function to hide grids
function hideGrid() {
  if (scene.getObjectByName("gridXpos")) {
    scene.getObjectByName("gridXpos").visible = false;
  }
  if (scene.getObjectByName("gridXmin")) {
    scene.getObjectByName("gridXmin").visible = false;
  }
  if (scene.getObjectByName("gridYpos")) {
    scene.getObjectByName("gridYpos").visible = false;
  }
  if (scene.getObjectByName("gridYmin")) {
    scene.getObjectByName("gridYmin").visible = false;
  }
  if (scene.getObjectByName("gridZpos")) {
    scene.getObjectByName("gridZpos").visible = false;
  }
  if (scene.getObjectByName("gridZmin")) {
    scene.getObjectByName("gridZmin").visible = false;
  }
}

// Function to collapse the UI
function collapseUI() {
  hasUI = false; // Update UI state
  // Collapse UI
  document.getElementById("whiteboardBox").style.right = "calc(-15vw - 2.5em)";
  document.getElementById("ui").style.left = "calc(-15vw - 2.5em)";
  if (document.getElementById("addButton").classList.contains("hidden")) {
    document.getElementById("addButton").classList.remove("hidden"); // Update main buttons state
  }
  if (!document.getElementById("backButton").classList.contains("hidden")) {
    document.getElementById("backButton").classList.add("hidden"); // Update main buttons state
  }
}

// Function to open the UI
function openUI() {
  hasUI = true; // Update UI state
  // Open UI
  document.getElementById("whiteboardBox").style.right = "0";
  document.getElementById("ui").style.left = "0";
  if (!document.getElementById("addButton").classList.contains("hidden")) {
    document.getElementById("addButton").classList.add("hidden"); // Update main buttons state
  }
  if (document.getElementById("backButton").classList.contains("hidden")) {
    document.getElementById("backButton").classList.remove("hidden"); // Update main buttons state
  }
}

// Function to show the upload prompt
function uploadPrompt() {
  backAll(); // Go to inital view
  controls.dollyTo(500, true); // Zoom camera out
  rotationSpeed = 100; // Increase rotation speed
  document.getElementById("uploadNotification").classList.remove("hidden"); // Show prompt
}

// Function to reset the page
function deleteUpload() {
  document.getElementById("uploadNotification").classList.add("hidden");
  document.location.reload(); // Reload window
}

// Function to restore the normal state oof the page
function noDeleteUpload() {
  rotationSpeed = 10; // Set rotation speed to  normal
  controls.dollyTo(DOLLY_DISTANCE_FAR, true); // Zoom to default distance
  document.getElementById("uploadNotification").classList.add("hidden");
}

// Function to save node info in local storage
function saveLS() {
  if (scene.getObjectByName("activeNode")) {
    localStorage.setItem(
      scene.getObjectByName("activeNode").id + ".type", // Save type
      document.getElementById("nodeType").innerHTML
    );
    localStorage.setItem(
      scene.getObjectByName("activeNode").id + ".name", // Save names
      document.getElementById("nodeName").innerHTML
    );
    localStorage.setItem(
      scene.getObjectByName("activeNode").id + ".desc", // Save description
      document.getElementById("nodeDesc").innerHTML
    );
  }
}

// Function to load node info from the local storage
function loadLS() {
  document.getElementById("nodeType").innerHTML = localStorage.getItem(
    scene.getObjectByName("activeNode").id + ".type" // Load type
  );
  document.getElementById("nodeName").innerHTML = localStorage.getItem(
    scene.getObjectByName("activeNode").id + ".name" // Load name
  );
  document.getElementById("nodeDesc").innerHTML = localStorage.getItem(
    scene.getObjectByName("activeNode").id + ".desc" // Load description
  );
}

// Function to clear the node info in thes UI
function clearLS() {
  document.getElementById("nodeType").innerHTML = "nodetype";
  document.getElementById("nodeName").innerHTML = "Node Name";
  document.getElementById("nodeDesc").innerHTML = "Type a description for this node here.";
}

// Function for console logging
function log(string) {
  console.log(string);
}

// Function for generating random values
function random(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// Function to enable the glitch effect
function glitch() {
  glitchPass.enabled = true;
}

// Function to disable the glitch effect
async function unGlitch() {
  setTimeout(function () {
    glitchPass.enabled = false;
  }, 100);
}

// Function to create and remove impact clouds
function setImpact() {
  // If no impact cloud is yet present
  if (typeof scene.getObjectByName("activeNode").userData != "number") {
    document.getElementById("impactSlider").disabled = false; // Enable slider
    let impactPos = scene.getObjectByName("activeNode").position;
    // Create new cloud object
    let cloud = new THREE.Mesh(impactGemetry, impactMaterial);
    cloud.position.set(impactPos.x, impactPos.y, impactPos.z);
    cloud.material.opacity = 0.35;
    cloud.name = "impactCloud";
    impactCloud.push(cloud);
    scene.add(cloud); // Add cloud to scene
    scene.getObjectByName("activeNode").userData = cloud.id;
    cloud.userData = scene.getObjectByName("activeNode").id;
  } else {
    // If an impact cloud is already present
    document.getElementById("impactSlider").disabled = true; // Disable slider
    scene.remove(scene.getObjectById(scene.getObjectByName("activeNode").userData)); // Remove cloud from scene
    scene.getObjectByName("activeNode").userData = null;
  }
}

// Function to set the impact size
function setSlider() {
  sliderSize = this.value; // Get slider value from DOM elements
  impactGemetry = new THREE.PlaneBufferGeometry(sliderSize * 3, sliderSize * 3);
  scene.remove(scene.getObjectById(scene.getObjectByName("activeNode").userData)); // Select impact cloud coresponding to the selected impact node
  scene.getObjectByName("activeNode").userData = null;
  setImpact(); // Set the node impact
}

/**
 * After effects
 */

// Composer passes for visual effects
composer.addPass(new RenderPass(scene, camera));
composer.addPass(afterimagePass);
composer.addPass(fxaaPass);
composer.addPass(glitchPass);
glitchPass.enabled = false; // Disable glitch pass after initialization

/**
 * Tick
 */
const clock = new THREE.Clock();

// Runs for each tick
const tick = () => {
  const delta = clock.getDelta(); // Get time passed
  stats.begin(); // Begin stats
  controls.update(delta); // Update camera controls
  // Rotate scene
  if (autoRotate) {
    controls.azimuthAngle += rotationSpeed * delta * THREE.MathUtils.DEG2RAD;
  }
  s;
  // Turn impactClouds to camera and position them relative to their parent node
  for (let i = 0; i < scene.children.length; i++) {
    if (scene.children[i].name == "impactCloud") {
      scene.children[i].lookAt(camera.position); // Turn impact clouds to camera
      if (scene.getObjectByName("transformControls")) {
        //  Position impact clouds in the same position as their parent node (during transforming)
        scene.children[i].position.set(
          scene.getObjectById(scene.children[i].userData).position.x,
          scene.getObjectById(scene.children[i].userData).position.y,
          scene.getObjectById(scene.children[i].userData).position.z
        );
      }
    }
  }
  // Spin nodes in space
  for (let i = 0; i < scene.children.length; i++) {
    if (scene.children[i].type == "Mesh") {
      if (scene.children[i].children.length != 0) {
        if (scene.children[i].rotation.x == 0) {
          scene.children[i].rotation.y += 0.005;
          scene.children[i].rotation.z += 0.005;
        } else if (scene.children[i].rotation.y == 0) {
          scene.children[i].rotation.x += 0.005;
          scene.children[i].rotation.z += 0.005;
        } else if (scene.children[i].rotation.z == 0) {
          scene.children[i].rotation.x += 0.005;
          scene.children[i].rotation.y += 0.005;
        }
      } else {
        let randObj = new THREE.AxesHelper(5);
        randObj.visible = false;
        scene.children[i].add(randObj);
        let axis = random(0, 2);
        if (axis == 0) {
          scene.children[i].rotation.x += 0.005;
          scene.children[i].rotation.y += 0.005;
        } else if (axis == 1) {
          scene.children[i].rotation.y += 0.005;
          scene.children[i].rotation.z += 0.005;
        } else if (axis == 2) {
          scene.children[i].rotation.z += 0.005;
          scene.children[i].rotation.x += 0.005;
        }
      }
    }
  }
  // Spin recommendation nodes in space
  if (scene.getObjectByName("recommendationNode")) {
    scene.getObjectByName("recommendationNode").rotation.y += 0.01;
  }
  // Spin impact clouds during generation
  impactCloud.forEach((p) => {
    p.rotation.z -= 0.001;
  });

  // Render scene
  composer.render(scene, camera); // Render scene
  requestAnimationFrame(tick); // Call tick again on the next frame

  // End stats
  stats.end();
};

// Run each tick
tick();
