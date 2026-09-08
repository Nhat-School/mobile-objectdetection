# 📱 Option A Mobile App: Universal Laptop Tracker & 5-Gesture Actions (Expo)

A 100% **offline, on-device** mobile application built with React Native and Expo SDK 51. Simultaneously detects laptops, tracks unique laptop IDs with anti-overcounting, and recognizes all 5 hand gestures to trigger local device notifications and haptic feedback in the same camera view.

---

## 🔒 100% Offline Edge Architecture
- **Zero Cloud Runtime Calls**: Roboflow is **never called during mobile execution**. Your API key was strictly used on Kaggle for dataset downloads.
- **On-Device Inference**: Models are loaded directly from `assets/models/universal_detector_float16.tflite`.
- **Works in Airplane Mode**: Zero internet connection needed.

---

## 🌟 Simultaneous Features (Option A)

### 🎥 1. Live Simultaneous Camera View
- **Simultaneous Detection**: Both laptops and hand gestures are detected in the same frame.
- **Anti-Overcounting Laptop Tracker**:
  - Employs spatial IoU + Centroid tracking exclusively for laptops.
  - Assigns persistent unique IDs (`Laptop #1`, `Laptop #2`) that persist across camera pans.
  - Displays dual metrics: **Laptops In View** and **Total Unique Laptops Counted**.
- **Hand Gesture Recognition & Device Actions**:
  - Recognizes: 🫰 `finger_heart`, ✌️ `scissor`, 👍 `thumbs_up`, 👋 `palm`, ✊ `fist`.
  - 5-frame hold verification (~0.35s continuous gesture) prevents accidental false positives.
  - 3.0s cooldown timer prevents notification flooding.
  - Fires localized push notifications and custom haptic vibrations.
  - Displays a floating reaction emoji animation on the viewfinder.
- **Simulation Bar**: Quick-tap buttons on the HUD to immediately preview all 5 vibrations and notifications without camera feed.

---

### 📷 2. Photo Analysis Mode
- Snaps or picks a photo from your gallery.
- Detects all laptops and hand gestures in the picture.
- Color-coded bounding box overlays with class badges and confidence scores.
- Full summary breakdown card with laptop and gesture tallies.

---

## 🔌 Deploying Your Trained Model

Copy your exported `.tflite` model from Kaggle into:
```text
mobile-app/assets/models/universal_detector_float16.tflite
```
*(or `laptop_detector_float16.tflite`).*

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
