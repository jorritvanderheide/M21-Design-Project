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

// Init
localStorage.clear();
document.documentElement.scrollTop = 0;

// Install
CameraControls.install({ THREE: THREE });

// Constants
const DOLLY_DISTANCE = 50;
const DOLLY_DISTANCE_FAR = 250;
const BACK_KEY = "Escape";
const HAS_STATS = false;

// Variables
var autoRotate = true;
var hasGrid = false;
var shapeCounter = 1;
var fileCounter = 1;
var hasUI = true;
var rotationSpeed = 10;
var colorArray = [0x8e44ad, 0x27ae60, 0xe67e22, 0x3498db, 0xc0392b, 0xf1c40f];
let ifStart = true;

// Stats
const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
if (HAS_STATS == true) {
  document.body.appendChild(stats.dom);
}

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x35485e, 0.001);
scene.background = new THREE.Color(0x352b43);

// Geometry
let nodeGeometry;
const nodeGeometry1 = new THREE.SphereBufferGeometry(15, 64, 64);
const nodeGeometry2 = new THREE.TorusGeometry(20, 5, 64, 32);
const nodeGeometry3 = new THREE.CylinderBufferGeometry(12.5, 12.5, 20, 64);
const nodeGeometry4 = new THREE.DodecahedronBufferGeometry(15);
var geometryArray = [nodeGeometry1, nodeGeometry2, nodeGeometry3, nodeGeometry4];

// Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// Renderer=
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: false,
});
renderer.autoClear = false;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(scene.fog.color);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Effects
const composer = new EffectComposer(renderer);
const afterimagePass = new AfterimagePass();
const fxaaPass = new ShaderPass(FXAAShader);
const glitchPass = new GlitchPass();

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 1, 1000);
camera.position.set(100, 100, 100);

// Node texture
let nodeMaterial = new THREE.MeshPhysicalMaterial();
let envmaploader = new THREE.PMREMGenerator(renderer);
new RGBELoader().setPath("textures/").load("envmap.hdr", function (hdrmap) {
  // Textures
  let nodeTexture = new THREE.CanvasTexture(new FlakesTexture());
  nodeTexture.wrapS = THREE.RepeatWrapping;
  nodeTexture.wrapT = THREE.RepeatWrapping;
  nodeTexture.repeat.set(10, 6);

  let envmap = envmaploader.fromCubemap(hdrmap);
  const ballMaterial = {
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    metalness: 1,
    roughness: 0.8,
    normalMap: nodeTexture,
    normalScale: new THREE.Vector2(0.15, 0.15),
    envMap: envmap.texture,
  };

  nodeMaterial = new THREE.MeshPhysicalMaterial(ballMaterial);
});

// Recommendations
let hasRecommendation = false;
let recommendationGeometry = new THREE.IcosahedronBufferGeometry(10);
let recommendationMaterial = new THREE.MeshPhongMaterial();
recommendationMaterial.opacity = 1;
recommendationMaterial.depthWrite = false;
addRecommendation();

// Space dust
const cloudGeometry = new THREE.BufferGeometry();
const vertices = [];
const cloudTexture = new THREE.TextureLoader().load("textures/dust.jpg");
for (let i = 0; i < 500; i++) {
  const x = random(-Math.pow(Math.floor(Math.random() * 24), 2), Math.pow(Math.floor(Math.random() * 24), 2));
  const y = random(-Math.pow(Math.floor(Math.random() * 24), 2), Math.pow(Math.floor(Math.random() * 24), 2));
  const z = random(-Math.pow(Math.floor(Math.random() * 24), 2), Math.pow(Math.floor(Math.random() * 24), 2));
  vertices.push(x, y, z);
}
cloudGeometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
let cloudMaterial = new THREE.PointsMaterial({
  size: 2,
  sizeAttenuation: true,
  alphaMap: cloudTexture,
  transparent: true,
  opacity: 0.75,
  depthWrite: false,
});
cloudMaterial.color.setHSL(1.0, 0.3, 0.7);
const particles = new THREE.Points(cloudGeometry, cloudMaterial);
scene.add(particles);

// Set lens flare origin
const textureLoader = new THREE.TextureLoader();

const textureFlare0 = textureLoader.load("textures/lensflare/lensflare0.png");
const textureFlare3 = textureLoader.load("textures/lensflare/lensflare3.png");

addLight(0, 0, 0);

addLight(-1000, 1000, 1000);
addLight(1000, -1000, 1000);
addLight(1000, 1000, -1000);

addLight2(0.55, 0.9, 0.5, 5000, 0, -1000);
addLight2(0.08, 0.8, 0.5, 0, 0, -1000);

function addLight(x, y, z) {
  let color = new THREE.Color(0xffffff);
  const light = new THREE.PointLight(color, 10, 2000);
  light.position.set(x, y, z);
  scene.add(light);

  const lensflare = new Lensflare();
  lensflare.addElement(new LensflareElement(textureFlare0, 500, 0, light.color));
  lensflare.addElement(new LensflareElement(textureFlare3, 60, 0.6));
  lensflare.addElement(new LensflareElement(textureFlare3, 70, 0.7));
  lensflare.addElement(new LensflareElement(textureFlare3, 120, 0.9));
  lensflare.addElement(new LensflareElement(textureFlare3, 70, 1));
  light.add(lensflare);
}

function addLight2(h, s, l, x, y, z) {
  const light = new THREE.PointLight(0xffffff, 1.5, 2000);
  light.color.setHSL(h, s, l);
  light.position.set(x, y, z);
  scene.add(light);

  const lensflare = new Lensflare();
  lensflare.addElement(new LensflareElement(textureFlare3, 60, 0.6));
  lensflare.addElement(new LensflareElement(textureFlare3, 70, 0.7));
  lensflare.addElement(new LensflareElement(textureFlare3, 120, 0.9));
  lensflare.addElement(new LensflareElement(textureFlare3, 70, 1));
  light.add(lensflare);
}

function addLightRec(x, y, z) {
  let color = new THREE.Color(0xffffff);
  const light = new THREE.PointLight(color.setHex(Math.random() * 0xffffff), 0.001, 100);
  light.position.set(x, y, z);
  light.name = "recLight";
  scene.add(light);

  const lensflare = new Lensflare();
  lensflare.addElement(new LensflareElement(textureFlare0, 350, 0, light.color));
  lensflare.addElement(new LensflareElement(textureFlare3, 60, 0.6));
  lensflare.addElement(new LensflareElement(textureFlare3, 70, 0.7));
  lensflare.addElement(new LensflareElement(textureFlare3, 120, 0.9));
  lensflare.addElement(new LensflareElement(textureFlare3, 70, 1));
  light.add(lensflare);
}

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 1);

// Controls
const controls = new CameraControls(camera, canvas);
controls.minDistance = 50;
controls.maxDistance = 500;
controls.touches.two = CameraControls.ACTION.TOUCH_DOLLY;
controls.touches.three = CameraControls.ACTION.TOUCH_ROTATE;
controls.dollyTo(DOLLY_DISTANCE_FAR, true);

const transformControls = new TransformControls(camera, canvas);
transformControls.setMode("translate");

// Input
var raycaster = new THREE.Raycaster();
var pointer = new THREE.Vector2();

// Init scene
scene.add(ambientLight);
scene.add(camera);
collapseUI();

/**
 * Event listeners
 */

// Resize
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
// document.getElementById("agreeButton").addEventListener("click", hideConsent);
// document.getElementById("disagreeButton").addEventListener("click", hideConsent);

// Hide consent box
function hideConsent() {
  document.getElementById("consentBanner").classList.add("hidden");
}

// File drag & drop
document.addEventListener("dragstart", (event) => {
  dragged = event.target;
});

document.addEventListener("dragover", (event) => {
  event.preventDefault();
});

document.addEventListener("drop", (event) => {
  event.preventDefault();

  // move dragged element to the selected drop target
  if (event.target.className == "fileDrop box content is-normal") {
    const ul = document.getElementById("fileList");
    var li = document.createElement("li");
    li.innerHTML = "&#128196 file" + fileCounter + ".file";
    fileCounter++;
    ul.appendChild(li);
  }
});

// Controls
controls.addEventListener("control", cameraUserChange);
transformControls.addEventListener("dragging-changed", (event) => {
  controls.enabled = !event.value;
});

/**
 * Functions
 */

// Pointer move
var intersectsPointer;
function onPointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  intersectsPointer = raycaster.intersectObjects(scene.children, false);
  if (intersectsPointer.length > 0) {
    if (
      intersectsPointer[0].object.type != "GridHelper" &&
      intersectsPointer[0].object.type != "Points" &&
      intersectsPointer[0].object.name != "impactCloud"
    ) {
      document.body.style.cursor = "pointer";
      if (hasUI == false) {
        // Get item data
        document.getElementById("nodeType").innerHTML = localStorage.getItem(intersectsPointer[0].object.id + ".type");
        document.getElementById("nodeName").innerHTML = localStorage.getItem(intersectsPointer[0].object.id + ".name");
        document.getElementById("nodeDesc").innerHTML = localStorage.getItem(intersectsPointer[0].object.id + ".desc");
        document.getElementById("whiteboardBox").style.right = "0";
      }
    } else {
      document.body.style.cursor = "default";
      if (hasUI == false) {
        document.getElementById("whiteboardBox").style.right = "calc(-15vw - 2.5em)";
      }
    }
  } else {
    document.body.style.cursor = "default";
    if (hasUI == false) {
      document.getElementById("whiteboardBox").style.right = "calc(-15vw - 2.5em)";
    }
  }
}

// Pointer click
function onPointerClick(event) {
  event.preventDefault();

  // Check for first user input
  if (ifStart == false) {
    ifStart = true;
  }

  // Show glitch
  glitch();

  if (scene.getObjectByName("transformControls")) {
    // Enable controls
    controls.enabled = true;
  }

  // Check for intersections
  raycaster.setFromCamera(pointer, camera);
  var intersects = raycaster.intersectObjects(scene.children, false);
  if (intersects.length > 0) {
    if (intersects[0].object.material.metalness == 1) {
      // Reset shapeCounter
      shapeCounter = geometryArray.indexOf(intersects[0].object.geometry) + 1;

      // Save active node info to LS
      saveLS();

      // Reset active node
      if (scene.getObjectByName("activeNode")) {
        scene.getObjectByName("activeNode").name = "";
      }
      intersects[0].object.name = "activeNode";

      // Check if hasImpact
      if (typeof scene.getObjectByName("activeNode").userData == "number") {
        document.getElementById("impactSlider").disabled = false;
      } else {
        document.getElementById("impactSlider").disabled = true;
      }

      // Load active node info from LS
      loadLS();

      // Disable camera autorotate
      autoRotate = false;

      // If in transform mode, detach and reattach any transformControls
      if (scene.getObjectByName("transformControls")) {
        transformControls.detach();
        transformControls.name = "";
        transformNode();
      } else {
        // Else, position camera to new activeNodes
        controls.setPosition(
          intersects[0].object.position.x,
          intersects[0].object.position.y,
          intersects[0].object.position.z,
          true
        );
        controls.dollyTo(DOLLY_DISTANCE + intersects[0].object.position.distanceTo(new THREE.Vector3(0, 0, 0)), true);
      }

      // Open the UI
      openUI();
    }
  }

  // Stop glitch
  unGlitch();
}
// Keyboard presses
function onKeyPress(event) {
  // On BACKKEY
  if (event.code == BACK_KEY) {
    backAll();
  }
}

// Add node
function addNode() {
  backAll();

  // Enable controls
  controls.enabled = true;

  let nodeRand = random(0, geometryArray.length);
  nodeGeometry = geometryArray[nodeRand];

  // Add new mesh
  const newNode = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
  let color = new THREE.Color(colorArray[random(0, colorArray.length)]);
  newNode.material.color = color;
  newNode.name = "activeNode";

  // Set mesh position
  newNode.position.set(random(-100, 100), random(-100, 100), random(-100, 100));
  newNode.castShadow = true;
  newNode.receiveShadow = true;

  // Disable camera autorotate
  autoRotate = false;
  controls.enabled = false;

  // Add mesh to scene
  scene.add(newNode);

  // Set controls
  controls.setPosition(newNode.position.x, newNode.position.y, newNode.position.z, true);
  controls.dollyTo(DOLLY_DISTANCE + newNode.position.distanceTo(new THREE.Vector3(0, 0, 0)), true);
  openUI();
}

function addRecommendation() {
  setInterval(addRandom, random(10000, 20000));
}

function addRandom() {
  if (intersectsPointer && ifStart == true) {
    if (hasRecommendation == false && hasUI == false && intersectsPointer.length == 0) {
      hasRecommendation = true;
      let recX = random(-100, 100);
      let recY = random(-100, 100);
      let recZ = random(-100, 100);
      addLightRec(recX, recY, recZ);
      const newRecommendation = new THREE.Mesh(recommendationGeometry, recommendationMaterial.clone());
      let color = new THREE.Color(0xffffff);
      newRecommendation.material.color = color.setHex(Math.random() * 0xffffff);
      newRecommendation.name = "recommendationNode";
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
      newRecommendation.position.set(recX, recY, recZ);
      scene.add(newRecommendation);
      scene.getObjectByName("recommendationNode");
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
    } else {
      var removeObject = scene.getObjectByName("recommendationNode");
      var removeLight = scene.getObjectByName("recLight");
      scene.remove(removeObject);
      scene.remove(removeLight);
      hasRecommendation = false;
    }
  }
}

function changeNodeShape() {
  if (scene.getObjectByName("activeNode")) {
    if (shapeCounter < geometryArray.length) {
      scene.getObjectByName("activeNode").geometry = geometryArray[shapeCounter];
      shapeCounter++;
    } else {
      shapeCounter = 0;
      scene.getObjectByName("activeNode").geometry = geometryArray[shapeCounter];
      shapeCounter++;
    }
  }
}

// Transform node
function transformNode() {
  if (!scene.getObjectByName("transformControls")) {
    // Disable camera rotation
    autoRotate = false;

    if (hasGrid == false) {
      // Add gridhelpers
      const gridHelperXpos = new THREE.GridHelper(400, 10);
      const gridHelperXmin = new THREE.GridHelper(400, 10);
      const gridHelperYpos = new THREE.GridHelper(400, 10);
      const gridHelperYmin = new THREE.GridHelper(400, 10);
      const gridHelperZpos = new THREE.GridHelper(400, 10);
      const gridHelperZmin = new THREE.GridHelper(400, 10);

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

      scene.add(gridHelperXpos);
      scene.add(gridHelperXmin);
      scene.add(gridHelperYpos);
      scene.add(gridHelperYmin);
      scene.add(gridHelperZpos);
      scene.add(gridHelperZmin);

      // Stop grid init
      hasGrid = true;
    }

    // Attach controls
    if (scene.getObjectByName("activeNode")) {
      transformControls.attach(scene.getObjectByName("activeNode"));
      transformControls.name = "transformControls";
      scene.add(transformControls);
      showGrid();
    }
  } else {
    backAll();
  }
}

// Back
function backAll() {
  if (!document.getElementById("uploadNotification").classList.contains("hidden")) {
    document.getElementById("uploadNotification").classList.add("hidden");
  } else {
    transformControls.detach();
    transformControls.name = "";
    autoRotate = true;
    shapeCounter = 1;
    if (scene.getObjectByName("activeNode")) {
      saveLS();
      clearLS();
      scene.getObjectByName("activeNode").name = "";
    }
    hideGrid();
    collapseUI();

    controls.dollyTo(DOLLY_DISTANCE_FAR, true);

    // Enable controls
    controls.enabled = true;
  }
}

// Camera updates
function cameraUserChange() {
  showGrid();
}

// Check which grids are visible
function showGrid() {
  if (scene.getObjectByName("transformControls")) {
    var direction = new THREE.Vector3(
      controls.camera.position.x * -1,
      controls.camera.position.y * -1,
      controls.camera.position.z * -1
    );

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

// Hide grids
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

// UI
function collapseUI() {
  hasUI = false;
  document.getElementById("whiteboardBox").style.right = "calc(-15vw - 2.5em)";
  document.getElementById("ui").style.left = "calc(-15vw - 2.5em)";
  if (document.getElementById("addButton").classList.contains("hidden")) {
    document.getElementById("addButton").classList.remove("hidden");
  }
  if (!document.getElementById("backButton").classList.contains("hidden")) {
    document.getElementById("backButton").classList.add("hidden");
  }
}

function openUI() {
  hasUI = true;
  document.getElementById("whiteboardBox").style.right = "0";
  document.getElementById("ui").style.left = "0";
  if (!document.getElementById("addButton").classList.contains("hidden")) {
    document.getElementById("addButton").classList.add("hidden");
  }
  if (document.getElementById("backButton").classList.contains("hidden")) {
    document.getElementById("backButton").classList.remove("hidden");
  }
}

// Upload
function uploadPrompt() {
  backAll();
  controls.dollyTo(500, true);
  rotationSpeed = 100;
  document.getElementById("uploadNotification").classList.remove("hidden");
}

function deleteUpload() {
  document.getElementById("uploadNotification").classList.add("hidden");
  document.location.reload();
}

function noDeleteUpload() {
  rotationSpeed = 10;
  controls.dollyTo(DOLLY_DISTANCE_FAR, true);
  document.getElementById("uploadNotification").classList.add("hidden");
}

// Local Storage
function saveLS() {
  if (scene.getObjectByName("activeNode")) {
    localStorage.setItem(
      scene.getObjectByName("activeNode").id + ".type",
      document.getElementById("nodeType").innerHTML
    );
    localStorage.setItem(
      scene.getObjectByName("activeNode").id + ".name",
      document.getElementById("nodeName").innerHTML
    );
    localStorage.setItem(
      scene.getObjectByName("activeNode").id + ".desc",
      document.getElementById("nodeDesc").innerHTML
    );
  }
}

function loadLS() {
  document.getElementById("nodeType").innerHTML = localStorage.getItem(
    scene.getObjectByName("activeNode").id + ".type"
  );
  document.getElementById("nodeName").innerHTML = localStorage.getItem(
    scene.getObjectByName("activeNode").id + ".name"
  );
  document.getElementById("nodeDesc").innerHTML = localStorage.getItem(
    scene.getObjectByName("activeNode").id + ".desc"
  );
}

function clearLS() {
  document.getElementById("nodeType").innerHTML = "nodetype";
  document.getElementById("nodeName").innerHTML = "Node Name";
  document.getElementById("nodeDesc").innerHTML = "Type a description for this node here.";
}

// Console logging
function log(string) {
  console.log(string);
}

// Random value
function random(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// Glitch
function glitch() {
  glitchPass.enabled = true;
}

async function unGlitch() {
  setTimeout(function () {
    glitchPass.enabled = false;
  }, 100);
}

// Impact
let sliderSize = 25;
let loader3 = new THREE.TextureLoader();
let cloudGeo = new THREE.PlaneBufferGeometry(sliderSize * 3, sliderSize * 3);
let cloudMaterial2 = new THREE.MeshLambertMaterial();
let cloudParticles = [];

loader3.load("textures/smoke.jpg", function (texture) {
  cloudMaterial2 = new THREE.MeshLambertMaterial({
    alphaMap: texture,
    transparent: true,
    depthWrite: false,
  });
});

function setImpact() {
  if (typeof scene.getObjectByName("activeNode").userData != "number") {
    document.getElementById("impactSlider").disabled = false;
    let impactPos = scene.getObjectByName("activeNode").position;
    let cloud = new THREE.Mesh(cloudGeo, cloudMaterial2);
    cloud.position.set(impactPos.x, impactPos.y, impactPos.z);
    cloud.material.opacity = 0.35;
    cloud.name = "impactCloud";
    cloudParticles.push(cloud);
    scene.add(cloud);
    scene.getObjectByName("activeNode").userData = cloud.id;
    cloud.userData = scene.getObjectByName("activeNode").id;
  } else {
    document.getElementById("impactSlider").disabled = true;
    scene.remove(scene.getObjectById(scene.getObjectByName("activeNode").userData));
    scene.getObjectByName("activeNode").userData = null;
  }
}

function setSlider() {
  sliderSize = this.value;
  cloudGeo = new THREE.PlaneBufferGeometry(sliderSize * 3, sliderSize * 3);
  scene.remove(scene.getObjectById(scene.getObjectByName("activeNode").userData));
  scene.getObjectByName("activeNode").userData = null;
  setImpact();
}

// After effects
composer.addPass(new RenderPass(scene, camera));
composer.addPass(afterimagePass);
composer.addPass(fxaaPass);
composer.addPass(glitchPass);
glitchPass.enabled = false;

/**
 * Tick
 */
const clock = new THREE.Clock();

const tick = () => {
  // Get time passed
  const delta = clock.getDelta();

  // Begin stats
  stats.begin();

  // Update controls
  controls.update(delta);

  // Rotate scene
  if (autoRotate) {
    controls.azimuthAngle += rotationSpeed * delta * THREE.MathUtils.DEG2RAD;
  }

  // Turn recommendation
  if (scene.getObjectByName("recommendationNode")) {
    scene.getObjectByName("recommendationNode").rotation.y += 0.01;
  }

  // Turn impactClouds to camera and position
  for (let i = 0; i < scene.children.length; i++) {
    if (scene.children[i].name == "impactCloud") {
      scene.children[i].lookAt(camera.position);
      if (scene.getObjectByName("transformControls")) {
        scene.children[i].position.set(
          scene.getObjectById(scene.children[i].userData).position.x,
          scene.getObjectById(scene.children[i].userData).position.y,
          scene.getObjectById(scene.children[i].userData).position.z
        );
      }
    }
  }

  // Rotate shapes
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

  // Cloud generation
  cloudParticles.forEach((p) => {
    p.rotation.z -= 0.001;
  });

  // Render scene
  composer.render(scene, camera);

  // Call tick again on the next frame
  requestAnimationFrame(tick);

  // End stats
  stats.end();
};

// Run tick
tick();
