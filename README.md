# 📸 Smart Camera: Computer Detection, 21-Point Hand Tracking & Gesture VFX 🪄

A clean, single-file computer vision application that turns your webcam into an intelligent camera capable of:
1. **Detecting Computers & Laptops**: Bounding box with persistent unique ID (e.g. `#1 Laptop`), confidence rate labeled above each box (e.g. `Conf: 94.2%`), and real-time counter showing how many computers are in view.
2. **Smooth 21-Point Hand Tracking**: Tracks all 21 points on your hands using MediaPipe with Exponential Moving Average (EMA) smoothing for zero-jitter, fluid tracking.
3. **Motion Gesture Visual Effects (OpenCV Particle Engine)**:
   - ⭕ **Vẽ đường tròn trong không khí = Phép thuật lửa (Fire Magic)**: Swirling fire particle burst and flaming projectile!
   - 🛡️ **Gạt tay sang trái = Khiên bảo vệ (Shield Barrier)**: Radiant glowing cyan energy shield appears in front of your hand!
   - 🥊 **Đấm tới trước = Đấm bốc ma thuật (Shockwave)**: Expanding sonic shockwaves.
   - 👃⚡ **Ngoáy mũi = Bắn tia la-ze (Booger Laser)**: Screen shake, electric charge sparks, and colossal rainbow laser beam!
   - 🏳️💖 **Giơ 2 tay đầu hàng = Hồi máu (Golden Aura)**: Golden halo rings & restorative sparkles.

Everything is consolidated into **one single, self-contained Python script**: [`app.py`](app.py).

---

## 📦 1. Installed Packages (`requirements.txt`) Explained

The exact dependencies are pinned in [`requirements.txt`](requirements.txt):

```text
# Core Computer Vision & Video Processing
opencv-python>=4.8.0

# 21-Point Hand & Pose Landmark Tracking (Google MediaPipe)
mediapipe==0.10.21

# Critical Compatibility Dependencies for MediaPipe on Python 3.11+
numpy<2.0.0,>=1.26.0
protobuf>=4.25.3,<5.0.0

# Real-Time Computer & Laptop Detection Model (YOLO11)
ultralytics>=8.0.0

# Neural Network Backing for Ultralytics
torch>=2.0.0
torchvision>=0.15.0
```

### Why each dependency is installed:
- **`opencv-python`**: Captures the live webcam feed at 60 FPS, renders the high-tech neon bounding boxes, particle emitters, glowing wand trails, laser beams, and screen shake.
- **`mediapipe==0.10.21`**: Google's high-speed perception pipeline. Tracks all 21 points on your hands and 33 body pose landmarks (including nose and shoulders). Pinned to `0.10.21` to guarantee native compatibility.
- **`numpy<2.0.0, >=1.26.0`**: **Critical requirement**: MediaPipe's C++ binary extensions require the NumPy 1.x ABI. This prevents runtime symbol import crashes on Python 3.11+.
- **`protobuf>=4.25.3, <5.0.0`**: **Critical requirement**: Prevents Protobuf v5 schema breaking changes with MediaPipe graph definitions.
- **`ultralytics`**: Ultralytics YOLO11 engine (`yolo11n.pt`) used for real-time computer and laptop localization.
- **`torch` & `torchvision`**: Required backend runtime for the Ultralytics detector.

---

## 🚀 2. How to Set Up & Run the Camera

### Step 1: Install Dependencies
Open PowerShell or your terminal in this directory:
```powershell
pip install -r requirements.txt
```
*(Or with Windows Python directly: `& "C:\Users\Admin\AppData\Local\Microsoft\WindowsApps\python.exe" -m pip install -r requirements.txt`)*

### Step 2: Open the Camera
Run the single application script:
```powershell
python app.py
```
*(Or with Windows Python: `& "C:\Users\Admin\AppData\Local\Microsoft\WindowsApps\python.exe" app.py`)*

---

## 🎮 3. How to Use the Camera & Trigger Gestures

When the camera opens, you will see a clean live feed with:
- **Top HUD**: Shows total computers currently visible and hand tracking status.
- **Computer Boxes**: Every computer/laptop in frame has a bounding box with `#ID Label | Conf: XX%`.
- **21 Hand Points**: Neon glowing skeletal bones and joint nodes tracking your fingers smoothly.

### Movement & Gesture Guide:
| Movement / Gesture | How to Perform | On-Camera Visual Effect |
|:---|:---|:---|
| ⭕🔥 **Vẽ đường tròn (Circle)** | Draw a complete circle in the air with your index finger | **Phép thuật lửa**: A blazing fireball launches with swirling flame particles! |
| 🛡️ **Gạt tay sang trái (Swipe Left)** | Make a swift horizontal swipe to the left with your hand | **Khiên bảo vệ**: A glowing cyan hexagonal energy barrier appears! |
| 🥊 **Đấm tới trước (Punch)** | Swift forward punch towards the camera | **Sóng xung kích**: Sonic shockwave rings ripple outward! |
| 👃⚡ **Ngoáy mũi (Nose Touch)** | Touch your index finger to your nose for $\sim 0.7$s | **Bắn tia la-ze**: Screen shakes, electric sparks charge, and a giant rainbow laser beam fires! |
| 🏳️💖 **Giơ 2 tay đầu hàng** | Raise both hands high above your head | **Vòng hào quang**: Golden healing rings and sparkles rise up! |

### In-App Keyboard Shortcuts:
| Key | Action |
|:---:|:---|
| **`Q`** / **`ESC`** | Close the camera |
| **`C`** | Toggle computer bounding boxes ON / OFF |
| **`H`** | Toggle 21-point hand skeleton overlay ON / OFF |
| **`V`** | Toggle visual effects (VFX) ON / OFF |
| **`1` - `5`** | **Manual instant effect triggers** (`1`: Fireball, `2`: Shield, `3`: Punch, `4`: Laser, `5`: Heal) |

---

## 📁 4. Project Files

```text
mobile-objectdetection/
├── app.py                 # The complete, self-contained smart camera application
├── requirements.txt       # Tested, compatible package dependencies
├── README.md              # This guide
└── yolo11n.pt             # Ultralytics model weights (auto-downloaded)
```

---

## 🛡️ License
Released under the **MIT License** for unrestricted open use.
