# 📱 Mobile Laptop Detector & Real-time Tracker (React Native)

A mobile application built in React Native (JavaScript / TypeScript) for detecting and counting laptops on-device.

---

## 🌟 Key Features

### 1. 📷 Photo Laptop Counter
- Take a photo with the camera or select an existing photo from the gallery.
- Performs YOLO inference to detect all laptops present in the scene.
- Overlays precision bounding boxes with confidence scores.
- Displays an exact tally: **"Total Laptops Detected in Photo: N"**.
- Lists individual detected laptops with coordinates and confidence ratings.

### 2. 🎥 Live Video Tracking & Anti-Overcounting (Unique ID Assignment)
- Real-time camera feed running on-device inference.
- **Unique Object Tracking Engine**: Each detected laptop is assigned a persistent identifier (`Laptop #1`, `Laptop #2`, `Laptop #3`, etc.).
- **Anti-Overcounting Protection**:
  - Implements **IoU + Centroid Distance Tracking** across video frames.
  - When the camera moves or frames change, existing laptops maintain their identity and are **never double-counted**.
  - A new ID is minted only when a distinct, previously unseen laptop enters the field of view.
- **Dual Live Metrics**:
  - **In View Now**: Number of laptops currently visible in the active frame.
  - **Total Unique Laptops Counted**: Cumulative count of unique physical laptops seen during the session.
- **One-Click Session Reset**: Tap `🔄 Reset` to clear all tracking memory and start a new scan.

---

## 🏗️ Architecture & How It Works

```
                        +----------------------------------+
                        | Camera Frame / Image Input       |
                        +-----------------+----------------+
                                          |
                                          v
                        +----------------------------------+
                        | YOLO On-Device Inference         |
                        | (TFLite Float16 / Float32)       |
                        +-----------------+----------------+
                                          |
                                          v
                        +----------------------------------+
                        | Non-Maximum Suppression (NMS)    |
                        +-----------------+----------------+
                                          |
                         +----------------+----------------+
                         |                                 |
                 (Photo Mode)                      (Live Video Mode)
                         |                                 |
                         v                                 v
          +-----------------------------+   +-----------------------------+
          | Single-Frame Count &        |   | ObjectTracker Engine        |
          | Bounding Box Overlay        |   | - IoU & Centroid Matching   |
          +-----------------------------+   | - Persistent ID Assignment  |
                                            | - Anti-Overcounting Memory  |
                                            +--------------+--------------+
                                                           |
                                                           v
                                            +-----------------------------+
                                            | Live HUD:                   |
                                            | - In View: N                |
                                            | - Total Unique: M           |
                                            | - IDs: [#1 Cyan, #2 Lime...] |
                                            +-----------------------------+
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js >= 18
- React Native CLI or Expo Prebuild
- Android Studio (for Android builds) or Xcode (for iOS builds)

### 1. Install Dependencies
Inside the `mobile-app` directory:
```bash
npm install
```

### 2. Model Placement
Export the trained `.tflite` model from the Kaggle notebook and place it into:
```
mobile-app/assets/models/laptop_detector_float16.tflite
```

### 3. Android Setup & Permissions
Ensure `android/app/src/main/AndroidManifest.xml` includes camera permissions:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" />
<uses-feature android:name="android.hardware.camera.autofocus" />
```

### 4. iOS Setup
Inside `mobile-app/ios`:
```bash
pod install
```
Add camera permission to `Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>Camera access is required for real-time laptop detection and tracking.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Photo library access is required to count laptops in existing photos.</string>
```

---

## 📲 Running the App

### Android Device / Emulator:
```bash
npm run android
```

### iOS Simulator / Device:
```bash
npm run ios
```

---

## ⚙️ Configuration & Fine-Tuning

Edit [`src/constants/modelConfig.ts`](./src/constants/modelConfig.ts) to customize:
- `defaultConfidenceThreshold`: Minimum confidence threshold (default: `0.45`).
- `defaultIouThreshold`: NMS overlap threshold (default: `0.45`).
- `maxDisappearedFrames`: Frames to hold lost object track in memory before retiring it (default: `18` frames).
- `maxCentroidDistance`: Maximum pixel distance to associate object across frames during fast movement (default: `120px`).
