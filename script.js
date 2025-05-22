// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("canvas") });
renderer.setSize(window.innerWidth, window.innerHeight);

const loader = new THREE.GLTFLoader();
let currentAvatar;
const avatars = {};
let modelsLoaded = false;

// Error handling wrapper for GLTFLoader
async function loadModelWithRetry(path, retries = 3) {
  try {
    const gltf = await loader.loadAsync(path);
    return gltf;
  } catch (error) {
    if (retries > 0) {
      console.warn(`Retrying load for ${path}... (${retries} attempts left)`);
      return loadModelWithRetry(path, retries - 1);
    }
    throw error;
  }
}

// Load all models with error handling
// Replace your loadModels() with this debug version
async function loadModels() {
  const models = [
    { name: "pointing", path: "https://its-kanii.github.io/Avatar/models/pointing.glb" },
    // ... other models
  ];

  for (const model of models) {
    try {
      console.log("Trying to load:", model.path);
      const gltf = await loader.loadAsync(model.path);
      console.log("Success!", model.name);
      avatars[model.name] = gltf.scene;
      scene.add(avatars[model.name]);
    } catch (error) {
      console.error("FAILED:", model.name, error);
    }
  }
}

    // Set default avatar
    currentAvatar = avatars["greetings"];
    currentAvatar.visible = true;
    modelsLoaded = true;
    console.log("All models loaded successfully!");
  } catch (error) {
    console.error("Failed to load models:", error);
    alert(`Error loading 3D models. Please check console for details.`);
  }
}

loadModels();

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// MediaPipe Hands setup
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
});

// Camera setup with error handling
let cameraElement;
try {
  cameraElement = new Camera(document.getElementById("canvas"), {
    onFrame: async () => {
      if (modelsLoaded) { // Only process if models are loaded
        await hands.send({ image: cameraElement.video });
      }
    },
    width: 1280,
    height: 720,
  });
  cameraElement.start();
} catch (error) {
  console.error("Camera initialization failed:", error);
  alert("Could not access camera. Please ensure permissions are granted.");
}

// Gesture detection
hands.onResults((results) => {
  if (!modelsLoaded || !results.multiHandLandmarks) return;

  const landmarks = results.multiHandLandmarks[0];
  
  // Improved gesture detection with null checks
  if (landmarks && landmarks.length >= 21) { // MediaPipe provides 21 landmarks
    if (isPointing(landmarks)) {
      switchAvatar("pointing");
    } else if (isWaving(landmarks)) {
      switchAvatar("wave");
    } else if (isClapping(landmarks)) {
      switchAvatar("clap");
    } else {
      switchAvatar("greetings");
    }
  }
});

// Avatar switching with safety checks
function switchAvatar(name) {
  if (!avatars[name] || currentAvatar === avatars[name]) return;
  
  currentAvatar.visible = false;
  currentAvatar = avatars[name];
  currentAvatar.visible = true;
}

// Enhanced gesture detection functions
function isPointing(landmarks) {
  // Check if index finger is extended and others are closed
  const indexExtended = landmarks[8].y < landmarks[6].y; // Tip below PIP joint
  const middleClosed = landmarks[12].y > landmarks[10].y;
  const ringClosed = landmarks[16].y > landmarks[14].y;
  const pinkyClosed = landmarks[20].y > landmarks[18].y;
  const thumbClosed = landmarks[4].x > landmarks[3].x;
  
  return indexExtended && middleClosed && ringClosed && pinkyClosed && thumbClosed;
}

function isWaving(landmarks) {
  // Implement based on hand motion over time
  return false;
}

function isClapping(landmarks) {
  // Implement based on two hands proximity
  return false;
}

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initial camera position
camera.position.z = 5;





