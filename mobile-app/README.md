# 📱 Laptop Detector & Tracker for Expo Go (React Native)

A cross-platform mobile application designed to run **directly in Expo Go** (Android & iOS) for detecting, counting, and tracking laptops.

---

## 🌟 Two Core Functions

### 1. 📷 Photo Laptop Counter
- Take a photo with the camera or pick an image from your photo library.
- Performs YOLO laptop detection.
- Displays bounding boxes with confidence scores.
- Tally HUD: **"Total Laptops Detected in Photo: N"**.

### 2. 🎥 Live Video Tracking & Anti-Overcounting (Unique ID Assignment)
- Live camera feed powered by `expo-camera`.
- **Unique Object Tracking Engine**: Each detected laptop is assigned a persistent identifier (`Laptop #1`, `Laptop #2`, `Laptop #3`, etc.).
- **Anti-Overcount Protection**:
  - Implements **IoU + Centroid Distance Tracking** across frames.
  - Moving the camera around the room or holding it on the laptops will **never overcount the same laptop twice**!
  - A new ID is minted only when a distinct, previously unseen laptop enters the view.
- **Dual Live Metrics**:
  - **In View Now**: Laptops currently visible in the active camera frame.
  - **Total Unique Laptops Counted**: Cumulative count of unique physical laptops seen during the session.
- **One-Click Session Reset**: Tap `🔄 Reset` to clear all tracking memory and start a new scan.

---

## 🚀 How to Run in Expo Go (Fast & Easy)

### Step 1: Install Expo Go on your smartphone
- **Android**: Download [Expo Go on Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS**: Download [Expo Go on App Store](https://apps.apple.com/app/expo-go/id982107779)

### Step 2: Install project dependencies
Inside the `mobile-app` directory:
```bash
npm install
```

### Step 3: Start Expo
```bash
npx expo start
```

### Step 4: Scan the QR Code
- **On Android**: Open the Expo Go app and tap **"Scan QR code"**.
- **On iOS**: Open the native **Camera** app, scan the terminal QR code, and tap the notification to open in Expo Go.

---

## 🔑 Roboflow API Integration
The app is pre-configured with your Roboflow API key:
- **API Key**: `rf_7K59kT4qEcfJlx3rI4nhZQz7pXT2` (configured in [`src/services/roboflowService.ts`](./src/services/roboflowService.ts)).
- When connected to the internet, predictions are streamed from Roboflow detection endpoints.
- If offline or testing in airplane mode, a local fallback detector activates automatically so you can test the UI and tracking engine without network errors.
