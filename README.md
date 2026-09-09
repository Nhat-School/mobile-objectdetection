# 🚀 Option A: Universal Combined Object & Hand Gesture Mobile System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Framework: Expo SDK 57](https://img.shields.io/badge/Framework-Expo%20SDK%2057-blue.svg)](https://expo.dev)
[![Engine: React Native](https://img.shields.io/badge/React%20Native-0.86%20(React%2019)-61DAFB.svg)](https://reactnative.dev)
[![Vision Model: YOLO11s](https://img.shields.io/badge/Model-YOLO11s%20(512x512)-orange.svg)](https://github.com/ultralytics/ultralytics)
[![Runtime: 100% Offline](https://img.shields.io/badge/Inference-100%25%20On--Device%20Offline-success.svg)](#-100-offline-edge-architecture)

An end-to-end computer vision and mobile application system that delivers **100% offline, on-device object detection, anti-overcounting spatial tracking, and interactive hand gesture actions simultaneously in a single camera view** using **YOLO11** and **React Native / Expo**.

---

## 🌟 Option A Architecture: One Universal Combined Model

Instead of splitting tasks into separate models or view modes, **Option A trains a single unified 6-class neural network** that simultaneously detects laptops and recognizes hand gestures in the exact same frame:

| Class ID | Class Name | Display Badge | Visual Color | Real-Time Behavior |
| :---: | :--- | :--- | :--- | :--- |
| **0** | `laptop` | `Laptop #N` | `#00F0FF` / Neon Tracks | Multi-object IoU+Centroid tracking; anti-overcounting |
| **1** | `finger_heart` | `🫰 Heart` | `#FF1493` (Deep Pink) | 5-frame hold verification -> *"Sending love! ❤️"* |
| **2** | `scissor` | `✌️ Scissor` | `#FFD700` (Gold) | 5-frame hold verification -> *"Scissors detected! ✂️"* |
| **3** | `thumbs_up` | `👍 Thumbs Up` | `#00E676` (Spring Green) | 5-frame hold verification -> *"Great job! 👍"* |
| **4** | `palm` | `👋 Palm` | `#2979FF` (Electric Blue) | 5-frame hold verification -> *"Hello there! 👋"* |
| **5** | `fist` | `✊ Fist` | `#FF9100` (Amber) | 5-frame hold verification -> *"Power fist! ✊"* |

---

## ⚡ Engineered Solutions to Eliminate Trade-Offs

1. **512x512 Sweet-Spot Resolution (`imgsz=512`)**:
   - *The Problem*: Laptops require high resolution (640x640) for edge localization, while hand gestures need fast mobile FPS (320x320).
   - *The Solution*: Training at **512x512** provides **2.5x more spatial information** than 320x320 (resolving fine finger joints and distant laptops) while sustaining **20–25ms real-time latency** on budget mobile processors (Snapdragon 680, Helio G99).

2. **Class-Filtered Tracking (No Hand ID Pollution)**:
   - *The Problem*: An object tracker would assign meaningless track IDs (`Hand #14`, `Hand #15`) to moving hands.
   - *The Solution*: The spatial IoU + Centroid tracker **strictly filters for laptops (`classId === 0`)**, providing permanent track IDs (`Laptop #1`, `Laptop #2`) that eliminate overcounting across camera movements. Hand gestures bypass the tracker and feed directly into the temporal state machine.

3. **Dual Confidence Thresholds**:
   - *Laptop Threshold (`0.40`)*: High recall to maintain smooth tracking continuity as the camera pans.
   - *Gesture Action Threshold (`0.60`)*: High precision to prevent accidental vibrations or notification triggers from complex backgrounds.

4. **Synthetic Multi-Object Co-occurrence**:
   - Trained with **Mosaic (1.0)** and **Mixup (0.15)** augmentations, synthesizing multi-class training frames containing both laptops and gestures together.

---

## 📁 Repository Structure

```text
mobile-objectdetection/
├── LICENSE                                              # Permissive MIT License (free use & commercialization)
├── README.md                                            # Comprehensive project documentation
├── requirements.txt                                     # Python dependencies for local execution & training
├── objectdetection.ipynb                                # Unified Kaggle training notebook (Option A)
└── mobile-app/                                          # React Native / Expo mobile application
    ├── App.tsx                                          # Main application coordinator
    ├── app.json                                         # Expo project configuration & permissions
    ├── package.json                                     # App dependencies & scripts
    ├── metro.config.js                                  # Metro bundler config (.tflite asset support)
    ├── babel.config.js                                  # Babel worklet configuration
    ├── tsconfig.json                                    # TypeScript compiler configuration
    ├── assets/
    │   └── models/
    │       ├── universal_detector_float16.tflite        # Quantized offline 6-class model (drop here)
    │       ├── laptop_detector_float16.tflite           # Backward-compatible model alias
    │       └── model_config.json                        # Model metadata, 6 classes & thresholds
    └── src/
        ├── components/
        │   ├── ControlHeader.tsx                        # Unified HUD, stats, and gesture simulation bar
        │   ├── LiveTrackingView.tsx                     # Simultaneous live camera viewfinder & reaction HUD
        │   ├── PhotoCountView.tsx                       # Photo picker, 6-class box overlay & tally cards
        │   └── BoundingBoxOverlay.tsx                   # Responsive multi-class bounding box renderer
        ├── hooks/
        │   └── useYoloDetector.ts                       # Unified state coordinator & inference router
        ├── services/
        │   ├── offlineModelService.ts                   # 100% on-device model runner
        │   └── notificationService.ts                   # Offline push notifications & tactile haptics
        ├── utils/
        │   ├── objectTracker.ts                         # Class-filtered IoU + Centroid tracker
        │   ├── gestureStateMachine.ts                   # 5-frame hold verification & cooldown engine
        │   ├── yoloPostProcess.ts                       # Non-Maximum Suppression (NMS) & coordinate scaling
        │   └── performance.ts                           # Real-time FPS & latency tracker
        ├── constants/
        │   └── modelConfig.ts                           # 6-class names, color palettes, and thresholds
        └── types/
            └── detection.ts                             # TypeScript data interfaces
```

---

## 💻 Quickstart: Local Python Installation & Detection

Anyone can run real-time object detection on their computer (webcam, video, or photos) in seconds using the provided [`requirements.txt`](requirements.txt).

### 1. Set Up Virtual Environment & Install Dependencies

```bash
# 1. Clone repository
git clone https://github.com/Nhat-School/mobile-objectdetection.git
cd mobile-objectdetection

# 2. Create and activate an isolated virtual environment
python3 -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate

# 3. Install all dependencies with a single command
pip install -r requirements.txt
```

> [!TIP]
> **macOS Homebrew Users (PEP 668)**: If you prefer installing the YOLO CLI globally without a virtual environment, use `pipx` via Homebrew:
> ```bash
> brew install pipx
> pipx install ultralytics
> # Ensure ~/.local/bin is in your PATH:
> export PATH="$HOME/.local/bin:$PATH"
> ```

### 2. Run Instant Real-Time Detection
```bash
# Real-time webcam inference (press 'q' in the camera window to exit):
yolo predict model=yolo11n.pt source=0 show=True

# Run inference on a local image or video:
yolo predict model=yolo11n.pt source='path/to/photo.jpg' show=True
```

---

## 🚀 Part 1: Training the Universal Model on Kaggle

Everything is consolidated into a single self-contained notebook: **[`objectdetection.ipynb`](objectdetection.ipynb)**.

### What the Notebook Executes:
1. **Multi-Dataset Fetching (<10 seconds via direct curl)**:
   - **Laptop Datasets (>3,500 images)**:
     - Dataset 1: `new-workspace-xp2sh/laptop-tgbyh` (1,300 images)
     - Dataset 2: `object-detection-bwxix/laptop-retrain` (1,198 images)
     - Dataset 3: `dataset-pizme/laptop-6jbfw` (1,000+ images)
   - **Gesture Datasets (All 5 Classes)**:
     - High-speed balanced multi-class gesture dataset (Finger Heart, Scissor, Thumbs Up, Palm, Fist).
2. **6-Class Harmonization Engine**:
   - Standardizes and re-indexes all annotations into classes `0` through `5`.
   - Generates unified `data.yaml`.
3. **Training YOLO11n (512x512 with RAM Caching)**:
   - Pretrained backbone: `yolo11n.pt`
   - Augmentations: `mosaic=1.0`, `mixup=0.15`, `scale=0.5`
   - RAM Cache: `cache=True` (~15–20s per epoch on Tesla T4)
   - Optimizer: `AdamW` (`lr0=0.001`)
   - Clean epoch-by-epoch evaluation metrics logging.
4. **Automated Export & Packaging**:
   - Converts directly to Google LiteRT (`universal_detector_float16.tflite`) and ONNX.
   - Automatically cleans temporary files and packages into `/kaggle/working/universal_mobile_models.zip`.

### How to Run on Kaggle:
1. Open [Kaggle](https://www.kaggle.com/) and click **New Notebook**.
2. Click **File -> Upload Notebook** and select `objectdetection.ipynb`.
3. In **Settings -> Accelerator**, choose **GPU T4 x2** or **GPU P100**.
4. Set **Internet: ON**.
5. Click **Run All**.
6. When complete, download `universal_mobile_models.zip` from the **Output** tab.

---

## 📱 Part 2: Running the Mobile App (Expo SDK 57)

The mobile application is built on **Expo SDK 57**, **React Native 0.86**, and **React 19**, delivering high-performance, smooth camera rendering and offline inference.

### 1. Prerequisites
- **Node.js**: v18 or later
- **npm** or **yarn**
- **Mobile Device**: iPhone or Android phone with the latest **Expo Go** app installed from the App Store or Google Play Store.
- **macOS Requirement**: Install `watchman` to ensure file watching does not exceed system descriptors:
  ```bash
  brew install watchman
  ```

### 2. Install Mobile Dependencies
```bash
cd mobile-app
npm install
```

### 3. Deploy Your Trained Model
Extract your downloaded `universal_mobile_models.zip` from Kaggle and place the exported `.tflite` model into:
```text
mobile-app/assets/models/universal_detector_float16.tflite
```

> [!NOTE]
> The mobile app includes a built-in offline simulation mode. If the model file is not yet deployed, the app will automatically run simulation mode so you can preview the HUD, 6-class bounding boxes, and gesture interactions immediately!

### 4. Start Expo Dev Server
```bash
cd mobile-app
npm start
# or: npx expo start --tunnel
```

### 5. Launch in Expo Go
- **Android**: Open **Expo Go** and tap **"Scan QR code"** to scan the QR code displayed in your terminal.
- **iOS**: Open the native **Camera** app, point it at the terminal QR code, and tap the prompt to open in **Expo Go**.

---

## 🖥️ Part 3: Local Mac / PC Inference Guide

You can test YOLO models directly on your computer's built-in webcam or external USB camera.

### 1. Understanding the CLI Path on macOS
When installed via `pipx` or standard Python environments, the `yolo` executable is placed in your user bin directory:
- **pipx location**: `~/.local/bin/yolo`
- To run `yolo` directly from any terminal without specifying the path, ensure `~/.local/bin` is in your shell profile:
  ```bash
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
  source ~/.zshrc
  ```

### 2. Live Webcam Detection
```bash
# Detect using the default camera (source=0):
yolo predict model=yolo11n.pt source=0 show=True

# Run detection using your custom-trained weights:
yolo predict model=best.pt source=0 show=True conf=0.40
```
- **Controls**: Click the OpenCV video window and press `q` to quit.
- **Performance**: On Apple Silicon (M1/M2/M3/M4), YOLO11n achieves ~15–20 ms per frame on CPU and under 5 ms on Apple Neural Engine / MPS.

### 3. Image and Video File Detection
```bash
# Run on an image and display result:
yolo predict model=yolo11n.pt source='path/to/image.jpg' show=True

# Run on a video file and save the annotated output:
yolo predict model=yolo11n.pt source='path/to/video.mp4' save=True
```

---

## 🔬 How the Real-Time Anti-Overcounting Engine Works

When tracking laptops across live video, camera motion easily causes duplicate detections. Our tracker solves this mathematically:

```text
IoU(A, B) = Area(A ∩ B) / Area(A ∪ B)

Euclidean Distance d(c1, c2) = sqrt((x1 - x2)^2 + (y1 - y2)^2)
```

- **Class Filtering**: Only objects with `classId === 0` (`laptop`) enter the tracking register.
- **Persistent IDs**: Tracks retain their unique IDs (`Laptop #1`, `Laptop #2`) even during camera pans.
- **Grace Period**: Missing tracks are buffered for up to 15 frames, preventing ID changes during momentary occlusions.

---

## 🛡️ License

This project is licensed under the **MIT License** - anyone is free to use, modify, distribute, sublicense, and commercialize this software freely without restriction. See the [LICENSE](LICENSE) file for complete terms.
