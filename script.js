const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("canvas") });
renderer.setSize(window.innerWidth, window.innerHeight);

const loader = new THREE.GLTFLoader();
let currentAvatar;
const avatars = {};

// Load all models
async function loadModels() {
  const models = [
    { name: "pointing", path: "models/pointing.glb" },
    { name: "wave", path: "models/wave.glb" },
    { name: "clap", path: "models/clap.glb" },
    { name: "greetings", path: "models/greetings.glb" },
  ];

  for (const model of models) {
    const gltf = await loader.loadAsync(model.path);
    avatars[model.name] = gltf.scene;
    avatars[model.name].visible = false; // Hide initially
    scene.add(avatars[model.name]);
  }

  // Set default avatar
  currentAvatar = avatars["greetings"];
  currentAvatar.visible = true;
}
loadModels();

camera.position.z = 5;
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
});

const cameraElement = new Camera(document.getElementById("canvas"), {
  onFrame: async () => {
    await hands.send({ image: cameraElement.video });
  },
  width: 1280,
  height: 720,
});
cameraElement.start();
hands.onResults((results) => {
  if (!results.multiHandLandmarks) return;

  const landmarks = results.multiHandLandmarks[0];
  const fingersUp = countFingersUp(landmarks);

  // Gesture detection logic
  if (isPointing(landmarks)) {
    switchAvatar("pointing");
  } else if (isWaving(landmarks)) {
    switchAvatar("wave");
  } else if (isClapping(landmarks)) {
    switchAvatar("clap");
  } else {
    switchAvatar("greetings");
  }
});

// Helper: Switch between avatars
function switchAvatar(name) {
  if (currentAvatar === avatars[name]) return;
  
  currentAvatar.visible = false;
  currentAvatar = avatars[name];
  currentAvatar.visible = true;
}

// Helper: Detect gestures (simplified)
function isPointing(landmarks) {
  // Check if index finger is extended, others closed
  // (Customize based on your needs)
  return landmarks[8].y < landmarks[6].y && landmarks[12].y > landmarks[10].y;
}

function isWaving(landmarks) {
  // Check if hand is moving side-to-side (requires tracking motion)
  return false; // Implement logic
}

function isClapping(landmarks) {
  // Check if both hands are close together (if tracking 2 hands)
  return false; // Implement logic
}





