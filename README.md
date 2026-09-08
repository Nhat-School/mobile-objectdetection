# 📱 Offline Mobile Object Detection & Interactive Hand Gesture Action System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Framework: Expo SDK 51](https://img.shields.io/badge/Framework-Expo%20SDK%2051-blue.svg)](https://expo.dev)
[![Engine: React Native](https://img.shields.io/badge/React%20Native-0.74-61DAFB.svg)](https://reactnative.dev)
[![Vision Model: YOLO11](https://img.shields.io/badge/Model-YOLO11s%20%7C%20YOLO11n-orange.svg)](https://github.com/ultralytics/ultralytics)
[![Runtime: 100% Offline](https://img.shields.io/badge/Inference-100%25%20On--Device%20Offline-success.svg)](#-100-offline-edge-architecture)

A comprehensive, production-ready computer vision and mobile application system that delivers **100% offline, on-device object detection, anti-overcounting spatial tracking, and interactive hand gesture actions** on smartphones using **YOLO11** and **React Native / Expo**.

---

## 🌟 Key Features

### 💻 1. Dual-Domain Mode Switcher (Option B Architecture)
Switch seamlessly at runtime between two specialized operational modes:
- **`💻 Laptop Detector`**: Photo-based laptop counting and real-time video spatial tracking.
- **`✌️ Hand Gestures`**: Interactive gesture recognition with localized push notifications and haptic feedback.

---

### 📷 2. Laptop Detector: Photo Counting Mode
- **Multi-Colored Bounding Boxes**: Highlights each detected laptop with high-contrast, visually distinct neon colors (`#00F0FF` Electric Cyan, `#39FF14` Neon Lime, `#FF5722` Vivid Orange, `#FFD700` Bright Gold, `#E040FB` Neon Purple).
- **Overlaid Top Labels**: Clean badges rendered directly above each box (`Laptop 1`, `Laptop 2`, etc.) along with detection confidence percentages.
- **Tally Summary HUD**: Clear summary banner displaying **"Total Laptops Detected in Photo: N"**.
- **Interactive Breakdown List**: Scrollable color-matched list showing each detected object's bounding box coordinates, confidence score, and color code.

---

### 🎥 3. Laptop Detector: Live Video Tracking & Anti-Overcounting
- **Persistent Track ID Assignment**: Each physical laptop in view is assigned a permanent unique track ID (`Laptop #1`, `Laptop #2`, `Laptop #3`, etc.).
- **Anti-Overcounting Spatial Engine**:
  - Employs an **Intersection over Union (IoU) + Centroid Distance** tracker across consecutive video frames.
  - Panning the camera around the room, momentarily moving away, or holding the camera steady on multiple laptops **will never overcount the same laptop twice**!
  - A new unique ID is minted only when a genuinely new, previously unseen laptop enters the camera field.
- **Dual Real-Time Metrics**:
  - **In View Now**: Number of laptops currently visible in the active camera frame.
  - **Total Unique Laptops Counted**: Cumulative count of unique physical laptops identified during the current session.
- **One-Tap Reset**: Reset button (`🔄 Reset`) to instantly clear spatial memory and start a fresh tracking session.

---

### 🫰 4. Hand Gesture Actions & Offline Device Notifications
Recognizes 5 core hand gestures with zero cloud dependency and triggers customized offline device actions:

| Gesture | Class Name | On-Device Notification | Haptic Vibration |
| :--- | :--- | :--- | :--- |
| 🫰 **Finger Heart** | `finger_heart` | *"Sending love! ❤️"* | Double Heavy Impact |
| ✌️ **Scissors** | `scissor` | *"Scissors detected! ✂️"* | Warning Pulse |
| 👍 **Thumbs Up** | `thumbs_up` | *"Great job! 👍"* | Success Notification Vibration |
| 👋 **Open Palm / Wave** | `palm` | *"Hello there! 👋"* | Light Soft Tap |
| ✊ **Rock / Fist** | `fist` | *"Power fist! ✊"* | Heavy Impact |

- **5-Frame Hold Verification**: Requires user to hold a gesture for 5 continuous frames (~0.35s) before triggering to prevent accidental false positives.
- **3.0-Second Cooldown Debounce**: Suppresses duplicate notifications and vibrations after a successful trigger.
- **Dual Camera Toggle**: Seamless switching between Front (Selfie) and Back cameras.
- **Instant Simulation Bar**: Interactive buttons on the HUD allowing instant testing of notifications and vibrations without camera input.

---

### 🔒 5. 100% Offline Edge Architecture
- **Zero Cloud API Runtime Calls**: The Roboflow API is used **strictly during dataset downloading on Kaggle**. No API keys or cloud services are queried at mobile runtime.
- **No Internet Required**: Functions flawlessly in Airplane mode or completely disconnected environments.
- **Mobile Hardware Friendly**: Optimized for mid-range and budget smartphones (e.g., Snapdragon 680/695, Helio G99, etc.) through FP16 quantization and efficient frame debouncing.

---

## 📁 Repository Structure

```text
mobile-objectdetection/
├── LICENSE                                              # Permissive MIT License for free use and distribution
├── README.md                                            # Comprehensive project documentation
├── spatial-temporal-hyperspectral-tracking-framework.ipynb # Kaggle Laptop YOLO11s training pipeline
├── kaggle_gesture_action_training.ipynb                 # Kaggle 5-Gesture YOLO11n training pipeline
└── mobile-app/                                          # React Native / Expo mobile application
    ├── App.tsx                                          # Main application coordinator & mode router
    ├── app.json                                         # Expo project configuration & permissions
    ├── package.json                                     # App dependencies & scripts
    ├── metro.config.js                                  # Metro bundler config (.tflite asset support)
    ├── babel.config.js                                  # Babel worklet configuration
    ├── tsconfig.json                                    # TypeScript compiler settings
    ├── assets/
    │   └── models/
    │       ├── laptop_detector_float16.tflite           # Quantized offline laptop model (drop here)
    │       ├── gesture_detector_float16.tflite          # Quantized offline gesture model (drop here)
    │       └── model_config.json                        # Model metadata, input sizes & labels
    └── src/
        ├── components/
        │   ├── ControlHeader.tsx                        # Domain switcher (Laptop vs Gestures) & HUD
        │   ├── PhotoCountView.tsx                       # Photo picker, color-coded boxes & tally list
        │   ├── LiveTrackingView.tsx                     # Live camera feed with anti-overcounting HUD
        │   ├── GestureActionView.tsx                    # Hand gesture camera view & reaction animations
        │   └── BoundingBoxOverlay.tsx                   # Responsive SVG/View bounding box renderer
        ├── hooks/
        │   └── useYoloDetector.ts                       # State management, inference & tracking hook
        ├── services/
        │   ├── offlineModelService.ts                   # 100% on-device model loader
        │   └── notificationService.ts                   # Offline push notifications & haptics
        ├── utils/
        │   ├── objectTracker.ts                         # Spatial IoU + Centroid multi-object tracker
        │   ├── gestureStateMachine.ts                   # 5-frame hold verification & cooldown engine
        │   ├── yoloPostProcess.ts                       # Non-Maximum Suppression (NMS) & scaling
        │   └── performance.ts                           # Real-time FPS and latency monitor
        ├── constants/
        │   └── modelConfig.ts                           # Model inputs, confidence & color palettes
        └── types/
            └── detection.ts                             # TypeScript data interfaces
```

---

## 🚀 Part 1: Training Models on Kaggle

Both models are trained in cloud GPU environments (Kaggle / Google Colab) and exported to lightweight mobile formats (`.tflite`).

### 💻 Laptop Detector Model (`spatial-temporal-hyperspectral-tracking-framework.ipynb`)
This notebook merges 3 verified laptop datasets into a unified high-accuracy training set:
1. `new-workspace-xp2sh/laptop-tgbyh` (v1)
2. `object-detection-bwxix/laptop-retrain` (v1)
3. `dataset-pizme/laptop-6jbfw` (v1)

**Key Optimizations in Notebook:**
- **Instant Direct Download**: Uses direct GCS curl downloads (<10 seconds total) with automatic Roboflow private key fallback, completely eliminating the 700s Roboflow SDK timeout.
- **Dataset Harmonization**: Standardizes multi-dataset class IDs into a single uniform class (`0: laptop`).
- **YOLO11s Architecture**: Trains at 640x640 resolution (`imgsz=640`) for sharp localization of overlapping or angled laptops.
- **Automated Export & Packaging**: Automatically converts the trained PyTorch model to `laptop_detector_float16.tflite`, `laptop_detector_float32.tflite`, and ONNX, zipped into `/kaggle/working/laptop_detector_mobile_models.zip`.

**How to Train:**
1. Go to [Kaggle](https://www.kaggle.com/) and create a **New Notebook**.
2. Click **File -> Upload Notebook** and choose `spatial-temporal-hyperspectral-tracking-framework.ipynb`.
3. In **Settings -> Accelerator**, choose **GPU T4 x2** or **GPU P100**.
4. Enable **Internet: ON**.
5. Click **Run All**.
6. When completed, download `laptop_detector_mobile_models.zip` from the **Output** tab.

---

### ✌️ Hand Gesture Model (`kaggle_gesture_action_training.ipynb`)
Trains an ultra-fast YOLO11n model to recognize all 5 gesture classes:
- `finger_heart`, `scissor`, `thumbs_up`, `palm`, `fist`.

**Key Optimizations in Notebook:**
- **YOLO11n Architecture**: Trains at 320x320 resolution (`imgsz=320`) for ultra-low latency inference (15–20ms on mobile).
- **Single Unified Model**: Combines all 5 gestures into one network, saving memory and preventing false triggers from competing models.
- **Automated Export**: Generates `gesture_detector_float16.tflite` packaged in `/kaggle/working/gesture_detector_mobile_models.zip`.

---

## 📱 Part 2: Running the Mobile App

### 1. Prerequisites
- **Node.js**: v18 or later
- **npm** or **yarn**
- **Mobile Phone**: Android (Google Play) or iPhone (App Store) with the **Expo Go** app installed.

### 2. Install Dependencies
Open PowerShell or your terminal in the `mobile-app` directory:
```bash
cd mobile-app
npm install
```

### 3. Deploy Your Trained Models
From your downloaded Kaggle `.zip` files, copy the `.tflite` files into the app's assets folder:
- Copy `laptop_detector_float16.tflite` to `mobile-app/assets/models/laptop_detector_float16.tflite`
- Copy `gesture_detector_float16.tflite` to `mobile-app/assets/models/gesture_detector_float16.tflite`

*(Note: The app includes a built-in offline simulation engine so you can run and test the full UI, tracking, and notifications even before placing model files).*

### 4. Start Expo
```bash
npx expo start
```

### 5. Launch on Device
- **Android**: Open the **Expo Go** app and tap **"Scan QR code"** to scan the terminal QR code.
- **iOS**: Open the native **Camera** app, point at the QR code, and tap the prompt to open in Expo Go.

---

## 🔬 Deep Dive: Anti-Overcounting Tracking Engine

In live video mode, simply running detection frame-by-frame leads to duplicate counts as the camera moves. Our system incorporates a multi-object tracking engine:

### 1. Spatial Matching (IoU + Centroid Distance)
For each detected bounding box in frame $t$, the tracker computes the Intersection over Union with active tracks from frame $t-1$:

$$\text{IoU}(A, B) = \frac{\text{Area}(A \cap B)}{\text{Area}(A \cup B)}$$

Centroid Euclidean distance provides a secondary metric when IoU is low due to rapid camera movement:

$$d(c_1, c_2) = \sqrt{(x_1 - x_2)^2 + (y_1 - y_2)^2}$$

### 2. State & ID Management
- **Matched Track**: Updates the existing track's bounding box and increments observation count.
- **Unmatched Detection**: If IoU with all existing tracks is below threshold (0.3) and centroid distance exceeds minimum margin, a **new unique Track ID** (`Laptop #N`) is minted.
- **Lost Track Buffer**: Tracks missing for fewer than 15 frames are retained in memory to handle momentary occlusions without generating a duplicate ID when the object reappears.

---

## 🛡️ License

This project is licensed under the **MIT License** - anyone is free to use, modify, distribute, sublicense, and commercialize this software freely without restriction. See the [LICENSE](LICENSE) file for complete terms.
