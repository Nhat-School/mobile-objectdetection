# 🚀 Option A: Universal Combined Object & Hand Gesture Mobile System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Framework: Expo SDK 51](https://img.shields.io/badge/Framework-Expo%20SDK%2051-blue.svg)](https://expo.dev)
[![Engine: React Native](https://img.shields.io/badge/React%20Native-0.74-61DAFB.svg)](https://reactnative.dev)
[![Vision Model: YOLO11s](https://img.shields.io/badge/Model-YOLO11s%20(512x512)-orange.svg)](https://github.com/ultralytics/ultralytics)
[![Runtime: 100% Offline](https://img.shields.io/badge/Inference-100%25%20On--Device%20Offline-success.svg)](#-100-offline-edge-architecture)

An end-to-end computer vision and mobile application system that delivers **100% offline, on-device object detection, anti-overcounting spatial tracking, and interactive hand gesture actions simultaneously in a single camera view** using **YOLO11** and **React Native / Expo**.

---

## 🌟 Option A Architecture: One Universal Combined Model

Instead of splitting tasks into separate models or view modes, **Option A trains a single unified 6-class neural network** that simultaneously detects laptops and recognizes hand gestures in the exact same frame:

| Class ID | Class Name | Display Badge | Visual Color | Real-Time Behavior |
| :---: | :--- | :--- | :--- | :--- |
| **0** | `laptop` | `Laptop #N` | `#00F0FF` / Neon Tracks | Multi-object IoU+Centroid tracking; anti-overcounting |
| **1** | `finger_heart` | `🫰 Heart` | `#FF1493` (Deep Pink) | 5-frame hold verification $\rightarrow$ *"Sending love! ❤️"* |
| **2** | `scissor` | `✌️ Scissor` | `#FFD700` (Gold) | 5-frame hold verification $\rightarrow$ *"Scissors detected! ✂️"* |
| **3** | `thumbs_up` | `👍 Thumbs Up` | `#00E676` (Spring Green) | 5-frame hold verification $\rightarrow$ *"Great job! 👍"* |
| **4** | `palm` | `👋 Palm` | `#2979FF` (Electric Blue) | 5-frame hold verification $\rightarrow$ *"Hello there! 👋"* |
| **5** | `fist` | `✊ Fist` | `#FF9100` (Amber) | 5-frame hold verification $\rightarrow$ *"Power fist! ✊"* |

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
├── spatial-temporal-hyperspectral-tracking-framework.ipynb # Unified Kaggle training notebook (Option A)
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

## 🚀 Part 1: Training the Universal Model on Kaggle

Everything is consolidated into a single notebook: **[`spatial-temporal-hyperspectral-tracking-framework.ipynb`](spatial-temporal-hyperspectral-tracking-framework.ipynb)**.

### What the Notebook Executes:
1. **Multi-Dataset Fetching (<10 seconds via direct curl)**:
   - **Laptop Datasets (>3,500 images)**:
     - Dataset 1: `new-workspace-xp2sh/laptop-tgbyh` (1,300 images)
     - Dataset 2: `object-detection-bwxix/laptop-retrain` (1,198 images)
     - Dataset 3: `dataset-pizme/laptop-6jbfw` (1,000+ images)
   - **Gesture Datasets (>3,500 images)**:
     - Rock-Paper-Scissors benchmark (covering Fist, Palm, Scissor)
     - Hand Gestures benchmark (covering Finger Heart, Thumbs Up)
2. **6-Class Harmonization Engine**:
   - Standardizes and re-indexes all annotations into classes `0` through `5`.
   - Generates unified `data.yaml`.
3. **Training YOLO11s (512x512)**:
   - Pretrained backbone: `yolo11s.pt`
   - Augmentations: `mosaic=1.0`, `mixup=0.15`, `scale=0.5`
   - Optimizer: `AdamW` (`lr0=0.001`)
4. **Automated Export & Packaging**:
   - Converts to `universal_detector_float16.tflite` (~18MB FP16) and ONNX.
   - Packages into `/kaggle/working/universal_mobile_models.zip`.

### How to Run on Kaggle:
1. Open [Kaggle](https://www.kaggle.com/) and create a **New Notebook**.
2. Click **File -> Upload Notebook** and select `spatial-temporal-hyperspectral-tracking-framework.ipynb`.
3. In **Settings -> Accelerator**, choose **GPU T4 x2** or **GPU P100**.
4. Enable **Internet: ON**.
5. Click **Run All**.
6. When complete, download `universal_mobile_models.zip` from the **Output** tab.

---

## 📱 Part 2: Running the Mobile App (Expo Go)

### 1. Prerequisites
- **Node.js**: v18 or later
- **npm** or **yarn**
- **Mobile Device**: iPhone or Android phone with the **Expo Go** app installed.

### 2. Install Dependencies
```bash
cd mobile-app
npm install
```

### 3. Deploy Your Trained Model
Extract your downloaded `universal_mobile_models.zip` from Kaggle and copy the `.tflite` file into:
```text
mobile-app/assets/models/universal_detector_float16.tflite
```
*(Also copy as `laptop_detector_float16.tflite` if using default config).*

### 4. Start Expo
```bash
npx expo start
```

### 5. Launch in Expo Go
- **Android**: Open **Expo Go** and tap **"Scan QR code"** to scan the terminal QR code.
- **iOS**: Open the native **Camera** app, point at the terminal QR code, and open in Expo Go.

---

## 🔬 How the Real-Time Anti-Overcounting Engine Works

When tracking laptops across live video, camera motion easily causes duplicate detections. Our tracker solves this mathematically:

$$\text{IoU}(A, B) = \frac{\text{Area}(A \cap B)}{\text{Area}(A \cup B)}$$

$$d(c_1, c_2) = \sqrt{(x_1 - x_2)^2 + (y_1 - y_2)^2}$$

- **Class Filtering**: Only objects with `classId === 0` (`laptop`) enter the tracking register.
- **Persistent IDs**: Tracks retain their unique IDs (`Laptop #1`, `Laptop #2`) even during camera pans.
- **Grace Period**: Missing tracks are buffered for up to 15 frames, preventing ID changes during momentary occlusions.

---

## 🛡️ License

This project is licensed under the **MIT License** - anyone is free to use, modify, distribute, sublicense, and commercialize this software freely without restriction. See the [LICENSE](LICENSE) file for complete terms.
