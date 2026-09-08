# 📱 Offline Mobile Laptop Detector & Tracker (Expo / React Native)

A 100% **offline, on-device** mobile application designed to run with Expo for detecting, counting, and tracking laptops using your custom-trained YOLO model from Kaggle.

---

## 🔒 100% Offline Architecture (No Cloud Dependency)

This application executes inference **completely offline on your smartphone**:
- **Zero Cloud API calls**: Roboflow is **NOT** used during inference. Your Roboflow API key is only used on Kaggle to download the training datasets.
- **On-Device Model**: The app directly loads your trained model (`laptop_detector_float16.tflite`) from `assets/models/`.
- **Works with No Internet / Airplane Mode**: Everything runs locally on device memory and hardware.

---

## 🌟 Core Functions

### 1. 📷 Photo Laptop Counter
- Snap a photo or select an existing image from your phone gallery.
- Performs on-device YOLO inference to detect all laptops.
- Displays bounding boxes with confidence scores.
- Tally HUD: **"Total Laptops Detected in Photo: N"**.
- Full breakdown list of each detected laptop and coordinates.

### 2. 🎥 Live Video Tracking & Anti-Overcounting (Unique ID Assignment)
- Real-time camera feed using `expo-camera` (`CameraView`).
- **Unique Object Tracking Engine**: Each detected laptop is assigned a persistent unique identifier (`Laptop #1`, `Laptop #2`, `Laptop #3`, etc.).
- **Anti-Overcount Protection**:
  - Implements **IoU + Centroid Distance Tracking** across frames.
  - Moving the camera around the room or holding it on laptops **will never overcount the same laptop twice**!
  - A new ID is minted only when a distinct, previously unseen laptop enters the frame.
- **Dual Live Metrics**:
  - **In View Now**: Number of laptops currently visible in the active frame.
  - **Total Unique Laptops Counted**: Cumulative count of unique physical laptops seen during the session.
- **One-Click Session Reset**: Tap `🔄 Reset` to clear tracking memory and start a new scan.

---

## 🔌 Connecting Your Model from Kaggle to the App

After training finishes on Kaggle:
1. In the Kaggle notebook output, download **`laptop_detector_mobile_models.zip`**.
2. Extract the archive on your computer.
3. Copy **`laptop_detector_float16.tflite`** into:
   ```text
   mobile-app/assets/models/laptop_detector_float16.tflite
   ```

---

## 🚀 How to Run the App

### Step 1: Install Dependencies
```bash
cd mobile-app
npm install
```

### Step 2: Start Expo
```bash
npx expo start
```

### Step 3: Run on your Phone
- **Using Expo Go**:
  - Download **Expo Go** from Google Play (Android) or App Store (iOS).
  - Scan the terminal QR code to open the app.
- **Using Native Development Build (Fastest GPU inference)**:
  - For full hardware C++ GPU delegate acceleration:
    ```bash
    npx expo run:android   # Builds native Android APK
    npx expo run:ios       # Builds native iOS app
    ```
