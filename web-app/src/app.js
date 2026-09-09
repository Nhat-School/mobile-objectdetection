import { classifyHandGesture, GestureDebouncer, GESTURE_INFO } from './gestureClassifier.js';
import { ObjectTracker } from './tracker.js';

// DOM Elements
const video = document.getElementById('webcam');
const canvas = document.getElementById('overlayCanvas');
const ctx = canvas.getContext('2d');
const staticImg = document.getElementById('staticImg');

const hudLaptopsInView = document.getElementById('hudLaptopsInView');
const hudTotalLaptops = document.getElementById('hudTotalLaptops');
const hudGesture = document.getElementById('hudGesture');
const hudFps = document.getElementById('hudFps');
const engineBadge = document.getElementById('engineBadge');
const cameraStatusText = document.getElementById('cameraStatusText');
const handDebugPill = document.getElementById('handDebugPill');
const statusRadarDot = document.getElementById('statusRadarDot');

const activeGesturePill = document.getElementById('activeGesturePill');
const activeGestureText = document.getElementById('activeGestureText');
const reactionBubble = document.getElementById('reactionBubble');

// Buttons
const btnSourceLive = document.getElementById('btnSourceLive');
const btnSourceImage = document.getElementById('btnSourceImage');
const imageControlsBar = document.getElementById('imageControlsBar');
const imageFileInput = document.getElementById('imageFileInput');
const btnTriggerUpload = document.getElementById('btnTriggerUpload');
const btnSnapLiveFrame = document.getElementById('btnSnapLiveFrame');

const btnSnapPhoto = document.getElementById('btnSnapPhoto');
const btnUploadQuick = document.getElementById('btnUploadQuick');
const btnFlipCamera = document.getElementById('btnFlipCamera');
const btnPauseResume = document.getElementById('btnPauseResume');
const btnResetTracker = document.getElementById('btnResetTracker');

const toast = document.getElementById('toast');
const toastEmoji = document.getElementById('toastEmoji');
const toastTitle = document.getElementById('toastTitle');
const toastSub = document.getElementById('toastSub');

// State
let currentMode = 'live'; // 'live' or 'image'
let currentFacingMode = 'user';
let isPaused = false;
let mediaStream = null;

let handsEngine = null;
let cocoModel = null;
let isCocoRunning = false;
let isHandsRunning = false;

let lastHandsResults = null;
let latestLaptopBoxes = [];

const debouncer = new GestureDebouncer(2, 2000);
const laptopTracker = new ObjectTracker({ iouThreshold: 0.25, maxDisappearedFrames: 25 });

// Web Audio API Synthesizer
let audioCtx = null;
function playTriggerChime(freq1 = 700, freq2 = 1050) {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    const now = audioCtx.currentTime;
    osc.frequency.setValueAtTime(freq1, now);
    osc.frequency.exponentialRampToValueAtTime(freq2, now + 0.12);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  } catch (e) {
    // audio optional
  }
}

// MediaPipe Hand Skeleton connections (21 joints)
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
];

// Frame rate & metrics
let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 0;

// Initialize MediaPipe Hands
function initMediaPipe() {
  try {
    if (typeof window.Hands === 'undefined') {
      setTimeout(initMediaPipe, 400);
      return;
    }

    handsEngine = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    handsEngine.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.50,
      minTrackingConfidence: 0.50
    });

    handsEngine.onResults(onHandsResults);
    engineBadge.textContent = 'HANDS READY';
    console.log('MediaPipe Hands initialized.');
  } catch (err) {
    console.error('MediaPipe Hands init error:', err);
    engineBadge.textContent = 'MP ERROR';
  }
}

// Initialize COCO-SSD for Laptop Detection
async function initCocoSsd() {
  try {
    if (typeof window.cocoSsd === 'undefined') {
      setTimeout(initCocoSsd, 400);
      return;
    }
    cocoModel = await window.cocoSsd.load({ base: 'mobilenet_v2' });
    engineBadge.textContent = 'AI READY';
    console.log('COCO-SSD loaded.');
  } catch (err) {
    console.warn('COCO-SSD note:', err);
  }
}

// Camera initialization
async function startCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
  }

  const constraints = {
    audio: false,
    video: {
      facingMode: currentFacingMode,
      width: { ideal: 640 },
      height: { ideal: 480 }
    }
  };

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
  } catch (e) {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    } catch (fallbackErr) {
      console.error('Camera failed:', fallbackErr);
      cameraStatusText.textContent = 'NO CAMERA';
      return;
    }
  }

  video.srcObject = mediaStream;

  // Start playing
  try {
    await video.play();
  } catch (e) {}

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;

  // Ensure render loop starts
  requestAnimationFrame(renderLoop);
}

// Live Video Render Loop
let loopCounter = 0;
async function renderLoop(timestamp) {
  if (currentMode !== 'live') return;

  if (!isPaused) {
    // Metrics
    frameCount++;
    if (timestamp - lastFrameTime >= 1000) {
      fps = Math.round((frameCount * 1000) / (timestamp - lastFrameTime));
      frameCount = 0;
      lastFrameTime = timestamp;
      hudFps.textContent = `${fps} fps`;
    }

    loopCounter++;

    // Ensure dimensions match video
    if (video.videoWidth > 0 && canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // 1. Send frame to MediaPipe Hands
    if (handsEngine && !isHandsRunning && video.readyState >= 2) {
      isHandsRunning = true;
      handsEngine.send({ image: video })
        .then(() => { isHandsRunning = false; })
        .catch(() => { isHandsRunning = false; });
    }

    // 2. Send frame to COCO-SSD (every 4th frame for high FPS)
    if (cocoModel && !isCocoRunning && loopCounter % 4 === 0 && video.readyState >= 2) {
      isCocoRunning = true;
      cocoModel.detect(video).then((predictions) => {
        const laptopDetections = predictions
          .filter((p) => (p.class === 'laptop' || p.class === 'tv') && p.score > 0.38)
          .map((p) => ({
            className: 'Laptop',
            box: { x: p.bbox[0], y: p.bbox[1], width: p.bbox[2], height: p.bbox[3] },
            confidence: p.score
          }));

        latestLaptopBoxes = laptopTracker.update(laptopDetections);
        const stats = laptopTracker.getStats();
        hudLaptopsInView.textContent = stats.currentlyInView;
        hudTotalLaptops.textContent = stats.totalUniqueCounted;
        isCocoRunning = false;
      }).catch(() => {
        isCocoRunning = false;
      });
    }

    // 3. Draw canvas overlay
    drawLiveScene();
  }

  requestAnimationFrame(renderLoop);
}

// MediaPipe Results Handler
function onHandsResults(results) {
  lastHandsResults = results;

  const handsCount = (results.multiHandLandmarks && results.multiHandLandmarks.length) || 0;
  if (handsCount > 0) {
    handDebugPill.textContent = `Hands: ${handsCount} tracked (21 pts)`;
    handDebugPill.style.color = '#39FF14';
    handDebugPill.style.borderColor = '#39FF14';
  } else {
    handDebugPill.textContent = 'Hands: 0 in view';
    handDebugPill.style.color = '#8B949E';
    handDebugPill.style.borderColor = '#30363D';
  }

  let recognizedGesture = 'none';
  let bestConfidence = 0;

  if (handsCount > 0) {
    for (const landmarks of results.multiHandLandmarks) {
      const { gesture, confidence } = classifyHandGesture(landmarks);
      if (gesture !== 'none' && confidence > bestConfidence) {
        recognizedGesture = gesture;
        bestConfidence = confidence;
      }
    }
  }

  const debounced = debouncer.process(recognizedGesture, bestConfidence);

  const info = GESTURE_INFO[debounced.gesture] || GESTURE_INFO.none;
  hudGesture.textContent = info.label;
  hudGesture.style.color = info.color;

  if (debounced.gesture !== 'none') {
    activeGesturePill.style.display = 'block';
    activeGesturePill.style.background = info.color;
    activeGestureText.textContent = `${info.emoji} ${Math.round(debounced.confidence * 100)}%`;
  } else {
    activeGesturePill.style.display = 'none';
  }

  if (debounced.isTriggered) {
    handleGestureTrigger(debounced.gesture, debounced.confidence);
  }
}

// Trigger visuals, sound, and haptics
function handleGestureTrigger(gesture, confidence) {
  const info = GESTURE_INFO[gesture];
  if (!info) return;

  if (gesture === 'thumbs_down') {
    playTriggerChime(660, 440);
  } else {
    playTriggerChime(750, 1100);
  }

  if (navigator.vibrate) {
    if (gesture === 'finger_heart') {
      navigator.vibrate([60, 40, 60, 40, 80]);
    } else if (gesture === 'thumbs_down') {
      navigator.vibrate([100, 60, 100]);
    } else {
      navigator.vibrate([70, 50, 70]);
    }
  }

  reactionBubble.textContent = info.emoji.split(' ')[0] || '✨';
  reactionBubble.style.borderColor = info.color;
  reactionBubble.style.boxShadow = `0 0 35px ${info.color}`;
  reactionBubble.classList.add('show');
  setTimeout(() => reactionBubble.classList.remove('show'), 1200);

  showToast(info.emoji, `${info.label} (${Math.round(confidence * 100)}%)`, info.action);
}

function showToast(emoji, title, sub) {
  toastEmoji.textContent = emoji;
  toastTitle.textContent = title;
  toastSub.textContent = sub;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2400);
}

// Draw live scene onto transparent canvas over video
function drawLiveScene() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // 1. Draw Laptops
  drawLaptops(latestLaptopBoxes);

  // 2. Draw Hand Landmarks
  if (lastHandsResults && lastHandsResults.multiHandLandmarks) {
    drawHandSkeletons(lastHandsResults.multiHandLandmarks, w, h);
  }
}

function drawLaptops(boxes) {
  for (const track of boxes) {
    const b = track.box;
    ctx.save();
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00F0FF';
    ctx.shadowBlur = 10;
    ctx.strokeRect(b.x, b.y, b.width, b.height);

    ctx.fillStyle = 'rgba(7, 10, 15, 0.85)';
    ctx.shadowBlur = 0;
    const labelText = `💻 Laptop #${track.trackId} (${Math.round(track.confidence * 100)}%)`;
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    const textWidth = ctx.measureText(labelText).width;
    ctx.fillRect(b.x, Math.max(0, b.y - 26), textWidth + 14, 24);

    ctx.fillStyle = '#00F0FF';
    ctx.fillText(labelText, b.x + 7, Math.max(16, b.y - 9));
    ctx.restore();
  }
}

function drawHandSkeletons(multiHandLandmarks, w, h) {
  for (const landmarks of multiHandLandmarks) {
    // Connections
    ctx.save();
    ctx.strokeStyle = '#39FF14';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#39FF14';
    ctx.shadowBlur = 8;

    for (const [i1, i2] of HAND_CONNECTIONS) {
      const p1 = landmarks[i1];
      const p2 = landmarks[i2];
      ctx.beginPath();
      ctx.moveTo(p1.x * w, p1.y * h);
      ctx.lineTo(p2.x * w, p2.y * h);
      ctx.stroke();
    }
    ctx.restore();

    // Joints
    for (let i = 0; i < landmarks.length; i++) {
      const pt = landmarks[i];
      const px = pt.x * w;
      const py = pt.y * h;

      ctx.save();
      ctx.beginPath();
      const isTip = [4, 8, 12, 16, 20].includes(i);
      ctx.fillStyle = isTip ? '#FF1493' : '#00F0FF';
      ctx.arc(px, py, isTip ? 6 : 4, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
  }
}

// ----------------------------------------------------
// STATIC IMAGE CAPTURE & UPLOAD PROCESSING
// ----------------------------------------------------

async function processStaticImage(sourceElement, width, height) {
  // Switch to image mode
  currentMode = 'image';
  video.style.display = 'none';
  staticImg.style.display = 'block';
  cameraStatusText.textContent = 'STATIC IMAGE';
  statusRadarDot.style.background = 'var(--neon-cyan)';
  hudFps.textContent = 'SNAPSHOT';

  canvas.width = width;
  canvas.height = height;

  // Clear canvas and draw source image as background
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(sourceElement, 0, 0, width, height);

  showToast('🔍', 'Analyzing Snapshot', 'Running Hand Gestures & Laptop AI...');

  // 1. MediaPipe Hands detection on image
  if (handsEngine) {
    try {
      await handsEngine.send({ image: sourceElement });
    } catch (err) {
      console.warn('Hands on image err:', err);
    }
  }

  // 2. COCO-SSD detection on image
  let imageLaptopBoxes = [];
  if (cocoModel) {
    try {
      const predictions = await cocoModel.detect(sourceElement);
      const detections = predictions
        .filter((p) => (p.class === 'laptop' || p.class === 'tv') && p.score > 0.35)
        .map((p) => ({
          className: 'Laptop',
          box: { x: p.bbox[0], y: p.bbox[1], width: p.bbox[2], height: p.bbox[3] },
          confidence: p.score
        }));

      imageLaptopBoxes = laptopTracker.update(detections);
      const stats = laptopTracker.getStats();
      hudLaptopsInView.textContent = stats.currentlyInView;
      hudTotalLaptops.textContent = stats.totalUniqueCounted;
    } catch (err) {
      console.warn('COCO on image err:', err);
    }
  }

  // 3. Render overlays directly onto canvas on top of image
  drawLaptops(imageLaptopBoxes);
  if (lastHandsResults && lastHandsResults.multiHandLandmarks) {
    drawHandSkeletons(lastHandsResults.multiHandLandmarks, width, height);
  }
}

// Snap current video frame
function snapCurrentCameraFrame() {
  if (video.videoWidth === 0) return;
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = video.videoWidth;
  tempCanvas.height = video.videoHeight;
  const tCtx = tempCanvas.getContext('2d');
  tCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

  staticImg.src = tempCanvas.toDataURL('image/jpeg', 0.95);
  staticImg.onload = () => {
    processStaticImage(staticImg, tempCanvas.width, tempCanvas.height);
  };
}

// Handle User Uploaded Image file
function handleFileUpload(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    staticImg.src = e.target.result;
    staticImg.onload = () => {
      processStaticImage(staticImg, staticImg.naturalWidth, staticImg.naturalHeight);
    };
  };
  reader.readAsDataURL(file);
}

// Switch back to Live mode
function resumeLiveMode() {
  currentMode = 'live';
  staticImg.style.display = 'none';
  video.style.display = 'block';
  cameraStatusText.textContent = 'LIVE TRACKING';
  statusRadarDot.style.background = 'var(--neon-lime)';
  btnSourceLive.classList.add('active');
  btnSourceImage.classList.remove('active');
  imageControlsBar.style.display = 'none';
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  requestAnimationFrame(renderLoop);
}

// Event Listeners
btnSourceLive.addEventListener('click', resumeLiveMode);

btnSourceImage.addEventListener('click', () => {
  btnSourceLive.classList.remove('active');
  btnSourceImage.classList.add('active');
  imageControlsBar.style.display = 'flex';
  snapCurrentCameraFrame();
});

btnSnapPhoto.addEventListener('click', () => {
  btnSourceLive.classList.remove('active');
  btnSourceImage.classList.add('active');
  imageControlsBar.style.display = 'flex';
  snapCurrentCameraFrame();
});

btnSnapLiveFrame.addEventListener('click', snapCurrentCameraFrame);

btnUploadQuick.addEventListener('click', () => {
  imageFileInput.click();
});

btnTriggerUpload.addEventListener('click', () => {
  imageFileInput.click();
});

imageFileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) {
    btnSourceLive.classList.remove('active');
    btnSourceImage.classList.add('active');
    imageControlsBar.style.display = 'flex';
    handleFileUpload(e.target.files[0]);
  }
});

btnFlipCamera.addEventListener('click', () => {
  currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
  startCamera();
});

btnPauseResume.addEventListener('click', () => {
  if (currentMode === 'image') {
    resumeLiveMode();
    return;
  }
  isPaused = !isPaused;
  btnPauseResume.textContent = isPaused ? '▶️ Resume' : '⏸️ Pause';
  cameraStatusText.textContent = isPaused ? 'PAUSED' : 'LIVE TRACKING';
});

btnResetTracker.addEventListener('click', () => {
  laptopTracker.reset();
  hudLaptopsInView.textContent = '0';
  hudTotalLaptops.textContent = '0';
  showToast('🔁', 'Tracker Reset', 'Laptop IDs reset to 0');
});

// Reference Chips
document.querySelectorAll('.chip-btn').forEach((chip) => {
  chip.addEventListener('click', () => {
    const gestureKey = chip.dataset.gesture;
    handleGestureTrigger(gestureKey, 0.96);
  });
});

// Boot up
window.addEventListener('DOMContentLoaded', () => {
  initMediaPipe();
  initCocoSsd();
  startCamera();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
});
