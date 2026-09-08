# 📱 Offline Mobile Detector & Interactive Gesture Tracker (Expo / React Native)

A 100% **offline, on-device** mobile application built with React Native and Expo SDK 51 for detecting, counting, and tracking laptops, plus interactive hand gesture recognition with local device notifications.

---

## 🔒 100% Offline Edge Architecture
- **Zero Cloud API Calls**: Roboflow is **never called during mobile runtime**. Your API key is strictly used on Kaggle for dataset downloads.
- **On-Device Inference**: Models are loaded directly from `assets/models/` as quantized `.tflite` binaries.
- **Works in Airplane Mode**: Zero internet connectivity required.

---

## 🌟 Dual-Domain Modes (Option B)

### 💻 1. Laptop Detector Domain
- **📷 Photo Mode**: 
  - Snap or pick an image to detect all laptops.
  - Multi-colored bounding boxes (`#00F0FF` Cyan, `#39FF14` Lime, `#FF5722` Orange, `#FFD700` Gold, etc.).
  - Overlaid top labels (`Laptop 1`, `Laptop 2`) and confidence percentages.
  - Summary count banner: **"Total Laptops Detected in Photo: N"**.
- **🎥 Live Video Mode**:
  - Real-time camera feed using `expo-camera`.
  - **IoU + Centroid Tracker**: Assigns persistent track IDs (`Laptop #1`, `Laptop #2`) preventing duplicate counts when moving the camera.
  - Dual metrics: **In View Now** and **Total Unique Laptops Counted**.

---

### ✌️ 2. Hand Gesture Domain
Recognizes 5 hand gestures completely offline:
1. 🫰 **Finger Heart** (`finger_heart`) -> Local notification: *"Sending love! ❤️"* + Double vibration
2. ✌️ **Scissors** (`scissor`) -> Local notification: *"Scissors detected! ✂️"* + Warning vibration
3. 👍 **Thumbs Up** (`thumbs_up`) -> Local notification: *"Great job! 👍"* + Success vibration
4. 👋 **Open Palm / Wave** (`palm`) -> Local notification: *"Hello there! 👋"* + Soft tap
5. ✊ **Rock / Fist** (`fist`) -> Local notification: *"Power fist! ✊"* + Heavy impact

- **5-Frame Hold Verification**: Requires 5 consecutive frames before triggering to eliminate accidental false positives.
- **3.0-Second Cooldown**: Prevents notification and vibration spam.
- **HUD Simulation**: Quick test buttons to preview vibrations and notifications immediately without camera feed.

---

## 🔌 Deploying Your Trained Models

Place your exported `.tflite` models into `assets/models/`:
- `mobile-app/assets/models/laptop_detector_float16.tflite`
- `mobile-app/assets/models/gesture_detector_float16.tflite`

---

## 🚀 How to Run the App

### 1. Install Dependencies
```bash
cd mobile-app
npm install
```

### 2. Start Expo
```bash
npx expo start
```

### 3. Open in Expo Go
- **Android**: Open **Expo Go** and scan the QR code.
- **iOS**: Open the native **Camera** app, point at the QR code, and open in Expo Go.
