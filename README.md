# 💻 Mobile Laptop Detection & Tracking System (YOLO + React Native)

An end-to-end computer vision and mobile application solution for detecting and tracking laptops on smartphones.

---

## 📁 Repository Overview

```
mobile-objectdetection/
├── spatial-temporal-hyperspectral-tracking-framework.ipynb  # End-to-end Kaggle training notebook
├── mobile-app/                                              # React Native on-device mobile application
│   ├── App.tsx                                              # App entry uniting Live Video & Photo modes
│   ├── package.json                                         # App dependencies & scripts
│   ├── metro.config.js                                      # Metro bundler config with .tflite support
│   ├── babel.config.js                                      # Worklet plugin configuration
│   ├── src/
│   │   ├── components/
│   │   │   ├── BoundingBoxOverlay.tsx                       # HUD bounding boxes with unique ID tags
│   │   │   ├── ControlHeader.tsx                            # Dynamic HUD, counter stats, and mode switcher
│   │   │   ├── LiveTrackingView.tsx                         # Real-time camera feed & tracking view
│   │   │   └── PhotoCountView.tsx                           # Single photo detection & laptop tally
│   │   ├── hooks/
│   │   │   └── useYoloDetector.ts                           # TFLite inference & state coordinator
│   │   ├── utils/
│   │   │   ├── objectTracker.ts                             # Multi-object tracker preventing overcounting
│   │   │   ├── yoloPostProcess.ts                           # NMS & coordinate scaling
│   │   │   └── performance.ts                               # FPS & latency tracker
│   │   ├── constants/
│   │   │   └── modelConfig.ts                               # Input sizes, thresholds & color palettes
│   │   └── types/
│   │       └── detection.ts                                 # TypeScript data models
│   └── assets/
│       └── models/                                          # Location for exported .tflite models
└── README.md
```

---

## ⚡ 1. Training on Kaggle (`spatial-temporal-hyperspectral-tracking-framework.ipynb`)

The training notebook is configured for Kaggle environments (`/kaggle/working`, GPU accelerator P100/T4):
- **Accuracy First Architecture**: Trains **YOLO11s** at **640x640 resolution** (`imgsz=640`) for sharp edge localization and multi-laptop scene comprehension.
- **Roboflow Dataset**: Direct Roboflow API download or one-click public laptop detection dataset fallback.
- **Data Augmentations**: Mosaic (1.0), Mixup (0.15), Scale jittering (0.5), and HSV variance.
- **Mobile Model Export**: Automatically exports:
  - `laptop_detector_float16.tflite` (High precision with 50% size reduction)
  - `laptop_detector_float32.tflite`
  - `laptop_detector.onnx`
- **1-Click Packaging**: Creates `/kaggle/working/laptop_detector_mobile_models.zip` ready to download and drop into the mobile app.

### How to Run on Kaggle:
1. Open [Kaggle](https://www.kaggle.com/) -> **New Notebook**.
2. Go to **File -> Upload Notebook** and select `spatial-temporal-hyperspectral-tracking-framework.ipynb`.
3. In the Kaggle sidebar under **Settings -> Accelerator**, choose **GPU T4 x2** or **GPU P100**.
4. Turn **Internet** ON in notebook settings.
5. Click **Run All**.
6. Download `laptop_detector_mobile_models.zip` from the **Output** tab.

---

## 📱 2. Mobile App (`mobile-app/`)

Built with React Native and JavaScript/TypeScript for on-device execution.

### Two Core Operational Modes:
1. **📷 Photo Laptop Counter**:
   - Analyzes photos from camera or gallery.
   - Calculates exact total count: **"Total Laptops Detected in Photo: N"**.
   - Draws labeled bounding boxes with confidence ratings.
2. **🎥 Live Video Tracking & Anti-Overcounting**:
   - Real-time camera feed.
   - **Unique ID Assignment**: Each laptop is assigned a distinct track ID (e.g. `Laptop #1`, `Laptop #2`).
   - **Anti-Overcount Engine**: Uses **IoU + Centroid Distance Tracking** across frames. Moving the camera or recording live video will **never overcount the same laptop twice**.
   - Displays **In View Now** and **Total Unique Laptops Counted**.
   - One-tap session reset (`🔄 Reset`).

### Quick Start:
```bash
cd mobile-app
npm install
# Place your laptop_detector_float16.tflite inside assets/models/
npm run android   # For Android
npm run ios       # For iOS
```
