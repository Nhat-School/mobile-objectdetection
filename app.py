"""
========================================================================================
📸 SMART CAMERA: Computer Detection, 21-Point Hand Tracking & Gesture VFX 🪄
========================================================================================
Single self-contained camera application:
1. Computer / Laptop Detection:
   - Detects laptops and computer screens in real-time with YOLO.
   - High-visibility bounding boxes with persistent unique IDs (e.g., "#1 Laptop").
   - Floating label banner displaying confidence rate (e.g., "Conf: 94.2%").
   - Live counter on the top HUD showing total computers in view.
2. Smooth 21-Point Hand Landmark Tracking:
   - Tracks all 21 points on hands with Exponential Moving Average (EMA) smoothing.
   - Renders glowing joints, skeletal bones, and fingertip highlights.
3. Special Gesture Motion Effects (OpenCV Particle Engine):
   - Ve duong tron trong khong khi (Circle)  -> Phep thuat lua (Fireball & Flame Burst)
   - Gat tay sang trai (Swipe Left)          -> Khien bao ve (Glowing Energy Shield)
   - Dam toi truoc (Punch)                  -> Song xung kich (Sonic Shockwave)
   - Ngoay mui (Finger to nose)             -> Ban tia la-ze (Rainbow Laser Beam)
   - Gio 2 tay (Hands up)                   -> Vong hao quang hoi mau (Golden Aura)
========================================================================================
"""

import cv2
import time
import math
import random
import numpy as np
from collections import deque
import mediapipe as mp
from ultralytics import YOLO

# -------------------------------------------------------------------------
# 1. Computer & Laptop Spatial Tracker
# -------------------------------------------------------------------------
class ComputerTracker:
    def __init__(self, iou_thresh=0.3, max_disappeared=20, smooth_alpha=0.65):
        self.next_id = 1
        self.tracks = {}
        self.iou_thresh = iou_thresh
        self.max_disappeared = max_disappeared
        self.smooth_alpha = smooth_alpha
        self.total_seen = 0

    def compute_iou(self, boxA, boxB):
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[2], boxB[2])
        yB = min(boxA[3], boxB[3])
        inter = max(0, xB - xA) * max(0, yB - yA)
        areaA = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
        areaB = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])
        return inter / float(areaA + areaB - inter + 1e-6)

    def update(self, detections):
        """detections: list of [x1, y1, x2, y2, conf, label]"""
        if len(detections) == 0:
            for tid in list(self.tracks.keys()):
                self.tracks[tid]['disappeared'] += 1
                if self.tracks[tid]['disappeared'] > self.max_disappeared:
                    del self.tracks[tid]
            return self.tracks

        if len(self.tracks) == 0:
            for d in detections:
                label_str = str(d[5]) if len(d) > 5 else "Computer"
                self.tracks[self.next_id] = {
                    'bbox': [float(v) for v in d[:4]],
                    'conf': float(d[4]),
                    'label': label_str,
                    'disappeared': 0
                }
                self.next_id += 1
                self.total_seen += 1
            return self.tracks

        t_ids = list(self.tracks.keys())
        t_boxes = [self.tracks[t]['bbox'] for t in t_ids]
        used_t = set()
        used_d = set()

        for d_idx, d in enumerate(detections):
            best_iou = 0.0
            best_t_idx = -1
            for t_idx, t_box in enumerate(t_boxes):
                if t_idx in used_t:
                    continue
                iou = self.compute_iou(d[:4], t_box)
                if iou > best_iou:
                    best_iou = iou
                    best_t_idx = t_idx

            if best_iou > self.iou_thresh:
                tid = t_ids[best_t_idx]
                prev = self.tracks[tid]['bbox']
                smoothed = [self.smooth_alpha * d[i] + (1.0 - self.smooth_alpha) * prev[i] for i in range(4)]
                self.tracks[tid]['bbox'] = smoothed
                self.tracks[tid]['conf'] = 0.7 * float(d[4]) + 0.3 * self.tracks[tid]['conf']
                if len(d) > 5:
                    self.tracks[tid]['label'] = str(d[5])
                self.tracks[tid]['disappeared'] = 0
                used_t.add(best_t_idx)
                used_d.add(d_idx)

        for t_idx, tid in enumerate(t_ids):
            if t_idx not in used_t:
                self.tracks[tid]['disappeared'] += 1
                if self.tracks[tid]['disappeared'] > self.max_disappeared:
                    del self.tracks[tid]

        for d_idx, d in enumerate(detections):
            if d_idx not in used_d:
                label_str = str(d[5]) if len(d) > 5 else "Computer"
                self.tracks[self.next_id] = {
                    'bbox': [float(v) for v in d[:4]],
                    'conf': float(d[4]),
                    'label': label_str,
                    'disappeared': 0
                }
                self.next_id += 1
                self.total_seen += 1

        return self.tracks


# -------------------------------------------------------------------------
# 2. OpenCV Particle & VFX Engine
# -------------------------------------------------------------------------
class Particle:
    def __init__(self, x, y, vx, vy, color, size, life=1.0, decay=0.04):
        self.x, self.y = float(x), float(y)
        self.vx, self.vy = float(vx), float(vy)
        self.color = color
        self.size = float(size)
        self.life = float(life)
        self.decay = decay

    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.life -= self.decay
        self.size = max(1.0, self.size * 0.94)
        return self.life > 0

    def draw(self, frame):
        if self.life <= 0:
            return
        alpha = min(1.0, max(0.0, self.life))
        c = tuple(int(ch * alpha) for ch in self.color)
        cv2.circle(frame, (int(self.x), int(self.y)), int(self.size), c, -1)


class VFXEngine:
    def __init__(self):
        self.particles = []
        self.active_fireballs = []
        self.active_shields = []
        self.active_shockwaves = []
        self.active_lasers = []
        self.active_auras = []
        self.wand_trail = deque(maxlen=24)
        self.shake_timer = 0
        self.shake_intensity = 0

    def trigger_shake(self, frames=12, intensity=10):
        self.shake_timer = frames
        self.shake_intensity = intensity

    def spawn_fire_magic(self, origin):
        """Circle gesture effect: Flaming explosion + Fireball projectile"""
        ox, oy = origin
        self.active_fireballs.append({
            'x': float(ox), 'y': float(oy),
            'vx': random.uniform(-1.0, 1.0), 'vy': -14.0,
            'life': 1.0, 'radius': 22
        })
        for _ in range(50):
            ang = random.uniform(0, 2 * math.pi)
            spd = random.uniform(3, 10)
            self.particles.append(Particle(
                ox, oy, math.cos(ang) * spd, math.sin(ang) * spd,
                color=(0, random.randint(100, 220), 255),
                size=random.uniform(5, 12), life=1.0, decay=0.035
            ))

    def spawn_shield_magic(self, center):
        """Swipe Left gesture effect: Radiant glowing energy shield"""
        self.active_shields.append({
            'x': center[0], 'y': center[1],
            'life': 1.0, 'radius': 140, 'decay': 0.015
        })
        for _ in range(35):
            ang = random.uniform(0, 2 * math.pi)
            spd = random.uniform(2, 6)
            self.particles.append(Particle(
                center[0], center[1], math.cos(ang) * spd, math.sin(ang) * spd,
                color=(255, 230, 0), size=random.uniform(3, 7), life=1.0, decay=0.03
            ))

    def spawn_punch_shockwave(self, center):
        """Punch gesture effect: Expanding sonic ripple shockwave"""
        self.trigger_shake(8, 8)
        self.active_shockwaves.append({
            'x': center[0], 'y': center[1],
            'radius': 15, 'max_radius': 180, 'life': 1.0, 'decay': 0.06
        })

    def spawn_booger_laser(self, origin, target):
        """Nose touch gesture effect: Colossal rainbow laser beam"""
        self.trigger_shake(16, 14)
        self.active_lasers.append({
            'origin': origin, 'target': target,
            'life': 1.0, 'decay': 0.05
        })

    def spawn_surrender_heal(self, origin):
        """Hands up surrender gesture: Golden rings & healing aura"""
        self.active_auras.append({
            'x': origin[0], 'y': origin[1],
            'life': 1.0, 'decay': 0.025
        })
        for _ in range(40):
            self.particles.append(Particle(
                origin[0] + random.randint(-80, 80), origin[1] + random.randint(-40, 40),
                random.uniform(-1.5, 1.5), random.uniform(-4, -1),
                color=(0, 255, 180), size=random.uniform(4, 9), life=1.0, decay=0.02
            ))

    def render(self, frame, wand_tip=None):
        h, w = frame.shape[:2]
        overlay = frame.copy()

        # Screen shake
        if self.shake_timer > 0:
            dx = random.randint(-self.shake_intensity, self.shake_intensity)
            dy = random.randint(-self.shake_intensity, self.shake_intensity)
            M = np.float32([[1, 0, dx], [0, 1, dy]])
            frame = cv2.warpAffine(frame, M, (w, h))
            self.shake_timer -= 1

        # 1. Wand Tip Trail
        if wand_tip:
            self.wand_trail.append(wand_tip)
            if random.random() < 0.6:
                self.particles.append(Particle(
                    wand_tip[0], wand_tip[1], random.uniform(-1, 1), random.uniform(-1, 1),
                    color=(255, 255, 100), size=random.uniform(2, 5), life=0.8, decay=0.08
                ))
            if len(self.wand_trail) > 1:
                for i in range(1, len(self.wand_trail)):
                    pt1 = self.wand_trail[i-1]
                    pt2 = self.wand_trail[i]
                    alpha = i / len(self.wand_trail)
                    thickness = int(2 + 5 * alpha)
                    color = (int(255 * alpha), int(120 * alpha), int(255 * (1 - alpha * 0.5)))
                    cv2.line(frame, pt1, pt2, color, thickness, cv2.LINE_AA)
                    cv2.circle(frame, pt2, thickness + 1, (255, 255, 255), -1, cv2.LINE_AA)

        # 2. Fireballs
        surviving_fb = []
        for fb in self.active_fireballs:
            fb['life'] -= 0.025
            fb['x'] += fb['vx']
            fb['y'] += fb['vy']
            if fb['life'] > 0 and fb['y'] > -50:
                fx, fy = int(fb['x']), int(fb['y'])
                r = int(fb['radius'] * fb['life'])
                cv2.circle(frame, (fx, fy), r, (0, 100, 255), -1, cv2.LINE_AA)
                cv2.circle(frame, (fx, fy), max(2, r // 2), (0, 240, 255), -1, cv2.LINE_AA)
                cv2.circle(frame, (fx, fy), max(1, r // 4), (255, 255, 255), -1, cv2.LINE_AA)
                for _ in range(3):
                    self.particles.append(Particle(
                        fx, fy, random.uniform(-2, 2), random.uniform(1, 4),
                        color=(0, 80, 255), size=random.uniform(4, 9), life=0.5, decay=0.08
                    ))
                surviving_fb.append(fb)
        self.active_fireballs = surviving_fb

        # 3. Shield Barrier
        surviving_sh = []
        for s in self.active_shields:
            s['life'] -= s['decay']
            if s['life'] > 0:
                cx, cy = s['x'], s['y']
                rad = int(s['radius'] * min(1.0, 1.2 - s['life']))
                # Hexagonal shield / circle glow
                cv2.circle(overlay, (cx, cy), rad, (255, 230, 0), -1, cv2.LINE_AA)
                cv2.circle(frame, (cx, cy), rad, (255, 255, 180), 3, cv2.LINE_AA)
                cv2.putText(frame, "PROTEGO SHIELD ACTIVE", (cx - 110, cy - rad - 12),
                            cv2.FONT_HERSHEY_DUPLEX, 0.55, (255, 240, 0), 2, cv2.LINE_AA)
                surviving_sh.append(s)
        self.active_shields = surviving_sh

        # 4. Shockwaves
        surviving_sw = []
        for sw in self.active_shockwaves:
            sw['life'] -= sw['decay']
            sw['radius'] += int((sw['max_radius'] - sw['radius']) * 0.3)
            if sw['life'] > 0 and sw['radius'] < sw['max_radius']:
                cv2.circle(frame, (sw['x'], sw['y']), int(sw['radius']), (0, 220, 255), 4, cv2.LINE_AA)
                cv2.circle(frame, (sw['x'], sw['y']), max(1, int(sw['radius'] * 0.7)), (255, 255, 255), 2, cv2.LINE_AA)
                surviving_sw.append(sw)
        self.active_shockwaves = surviving_sw

        # 5. Rainbow Booger Laser
        surviving_ls = []
        for l in self.active_lasers:
            l['life'] -= l['decay']
            if l['life'] > 0:
                ox, oy = l['origin']
                tx, ty = l['target']
                bw = int(26 * l['life'])
                cv2.line(frame, (ox, oy), (tx, ty), (255, 0, 255), bw + 14, cv2.LINE_AA)
                cv2.line(frame, (ox, oy), (tx, ty), (0, 255, 255), bw + 4, cv2.LINE_AA)
                cv2.line(frame, (ox, oy), (tx, ty), (255, 255, 255), max(2, bw // 2), cv2.LINE_AA)
                cv2.circle(frame, (ox, oy), bw + 10, (0, 255, 255), -1, cv2.LINE_AA)
                surviving_ls.append(l)
        self.active_lasers = surviving_ls

        # 6. Golden Healing Aura
        surviving_au = []
        for au in self.active_auras:
            au['life'] -= au['decay']
            if au['life'] > 0:
                ring_r = int(190 * (1.0 - au['life']))
                cv2.circle(frame, (au['x'], au['y']), ring_r, (0, 255, 200), 3, cv2.LINE_AA)
                cv2.putText(frame, "+HEAL HP RESTORED", (au['x'] - 90, au['y'] - ring_r - 10),
                            cv2.FONT_HERSHEY_DUPLEX, 0.6, (0, 255, 120), 2, cv2.LINE_AA)
                surviving_au.append(au)
        self.active_auras = surviving_au

        # 7. Particles
        self.particles = [p for p in self.particles if p.update()]
        for p in self.particles:
            p.draw(frame)

        # Alpha blend overlay for glowing translucency
        cv2.addWeighted(overlay, 0.25, frame, 0.75, 0, frame)
        return frame


# -------------------------------------------------------------------------
# 3. Main Camera Application
# -------------------------------------------------------------------------
HAND_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 4),        # Thumb
    (0, 5), (5, 6), (6, 7), (7, 8),        # Index finger
    (0, 9), (9, 10), (10, 11), (11, 12),   # Middle finger
    (0, 13), (13, 14), (14, 15), (15, 16), # Ring finger
    (0, 17), (17, 18), (18, 19), (19, 20), # Pinky
    (5, 9), (9, 13), (13, 17)              # Palm base
]

def run_camera():
    print("=" * 70)
    print("🚀 Opening Camera with 21-Point Hand Tracking & Computer Detection...")
    print("=" * 70)

    # 1. Initialize YOLO Model for Computers / Laptops
    print("[INIT] Loading YOLO11 model for computer/laptop detection...")
    try:
        yolo_model = YOLO("yolo11n.pt")
    except Exception as e:
        print(f"[WARN] YOLO load notice: {e}")
        yolo_model = None

    tracker = ComputerTracker()

    # 2. Initialize MediaPipe Hands & Pose
    print("[INIT] Initializing MediaPipe Hands & Pose...")
    mp_hands = mp.solutions.hands
    mp_pose = mp.solutions.pose
    hands = mp_hands.Hands(
        static_image_mode=False, max_num_hands=2,
        min_detection_confidence=0.6, min_tracking_confidence=0.6
    )
    pose = mp_pose.Pose(
        static_image_mode=False, model_complexity=1,
        min_detection_confidence=0.6, min_tracking_confidence=0.6
    )

    vfx = VFXEngine()

    # 3. Camera Setup
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[WARN] Camera index 0 not available. Trying camera 1...")
        cap = cv2.VideoCapture(1)
        if not cap.isOpened():
            print("[WARN] No webcam detected. Launching in Virtual Simulation Sandbox mode!")
            cap = None

    if cap:
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    # Landmark Exponential Moving Average smoothing store: {hand_idx: np.array(21, 3)}
    smoothed_hand_points = {}
    smooth_alpha = 0.65

    # Motion sequence buffer (30 frames)
    trajectory_pts = deque(maxlen=30)
    last_cast_time = {"fire": 0.0, "shield": 0.0, "punch": 0.0, "laser": 0.0, "heal": 0.0}
    nose_touch_count = 0
    surrender_count = 0

    # Notification banner state
    last_event_text = "READY - MOVE YOUR HANDS TO CAST SPELLS!"
    last_event_time = time.time()
    last_event_color = (0, 255, 255)

    fps_time = time.time()
    fps_count = 0
    fps = 30.0

    frame_idx = 0
    cached_tracks = {}

    print("\n[CAMERA CONTROLS]")
    print("  - [Q] or [ESC] : Quit Camera")
    print("  - [C]           : Toggle Computer Bounding Boxes")
    print("  - [H]           : Toggle Hand 21-Point Skeleton")
    print("  - [V]           : Toggle Visual Effects")
    print("  - [1-5]         : Instant Manual Spell Triggers (1:Fire, 2:Shield, 3:Punch, 4:Laser, 5:Heal)\n")

    show_comp = True
    show_hand = True
    show_effects = True

    while True:
        if cap and cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            frame = cv2.flip(frame, 1)  # Natural mirror view
        else:
            frame = np.zeros((720, 1280, 3), dtype=np.uint8)
            cv2.putText(frame, "SIMULATION SANDBOX - Connect camera or press 1-5 to trigger effects",
                        (60, 360), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (120, 120, 255), 2)
            cv2.rectangle(frame, (820, 460), (1220, 680), (60, 60, 60), -1)

        h, w = frame.shape[:2]
        frame_idx += 1
        now = time.time()

        # =====================================================================
        # 1. Computer / Laptop Detection with Bounding Box & Unique ID
        # =====================================================================
        if show_comp and (frame_idx % 2 == 0) and yolo_model:
            detected_comps = []
            try:
                # Class 63: laptop, Class 62: tv / monitor
                res = yolo_model(frame, classes=[62, 63], conf=0.35, verbose=False)
                for r in res:
                    for box in r.boxes:
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
                        conf = float(box.conf[0].cpu().numpy())
                        cls_id = int(box.cls[0].cpu().numpy())
                        label = "Laptop" if cls_id == 63 else "Computer"
                        detected_comps.append([x1, y1, x2, y2, conf, label])
            except Exception:
                pass
            cached_tracks = tracker.update(detected_comps)

        # Draw Computer Bounding Boxes and Unique Labels with Confidence Rate
        visible_comps = 0
        if show_comp and cached_tracks:
            for tid, t in cached_tracks.items():
                if t['disappeared'] > 0:
                    continue
                visible_comps += 1
                bx1, by1, bx2, by2 = [int(v) for v in t['bbox']]
                conf = t['conf'] * 100.0
                label = t['label']
                box_color = (0, 240, 255) if 'Laptop' in label else (255, 180, 0)

                # High-Tech Corner Brackets
                cv2.rectangle(frame, (bx1, by1), (bx2, by2), box_color, 2, cv2.LINE_AA)
                bracket_len = min(22, (bx2 - bx1) // 5)
                for (cx, cy), (dx, dy) in [((bx1, by1), (bracket_len, bracket_len)),
                                           ((bx2, by1), (-bracket_len, bracket_len)),
                                           ((bx1, by2), (bracket_len, -bracket_len)),
                                           ((bx2, by2), (-bracket_len, -bracket_len))]:
                    cv2.line(frame, (cx, cy), (cx + dx, cy), (255, 255, 255), 4)
                    cv2.line(frame, (cx, cy), (cx, cy + dy), (255, 255, 255), 4)

                # Floating Label Banner Above Bounding Box showing Unique ID & Confidence
                banner = f"#{tid} {label} | Conf: {conf:.1f}%"
                (tw, th), _ = cv2.getTextSize(banner, cv2.FONT_HERSHEY_DUPLEX, 0.55, 1)
                cv2.rectangle(frame, (bx1, max(0, by1 - th - 12)), (min(w, bx1 + tw + 16), by1), box_color, -1)
                cv2.putText(frame, banner, (bx1 + 8, by1 - 5),
                            cv2.FONT_HERSHEY_DUPLEX, 0.55, (20, 20, 20), 1, cv2.LINE_AA)

        # =====================================================================
        # 2. Smooth 21-Point Hand Tracking & Pose Extraction
        # =====================================================================
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        hand_res = hands.process(frame_rgb)
        pose_res = pose.process(frame_rgb)

        dominant_wand_tip = None
        nose_px = None
        is_surrendering = False
        nose_finger_dist = 999.0

        # Pose for Nose and Surrender
        if pose_res.pose_landmarks:
            plm = pose_res.pose_landmarks.landmark
            nose = plm[mp_pose.PoseLandmark.NOSE]
            nose_px = (int(nose.x * w), int(nose.y * h))
            lw = plm[mp_pose.PoseLandmark.LEFT_WRIST]
            rw = plm[mp_pose.PoseLandmark.RIGHT_WRIST]
            ls = plm[mp_pose.PoseLandmark.LEFT_SHOULDER]
            rs = plm[mp_pose.PoseLandmark.RIGHT_SHOULDER]
            # Both hands raised above head
            is_surrendering = (lw.y < nose.y and rw.y < nose.y) and (lw.y < ls.y and rw.y < rs.y)

        # Process Hands (Smooth all 21 points)
        active_hands_count = 0
        if hand_res.multi_hand_landmarks:
            active_hands_count = len(hand_res.multi_hand_landmarks)
            for h_idx, h_lm in enumerate(hand_res.multi_hand_landmarks):
                raw_pts = np.array([[p.x, p.y, p.z] for p in h_lm.landmark], dtype=np.float32)

                # Apply Exponential Moving Average (EMA) smoothing to eliminate all jitter
                if h_idx not in smoothed_hand_points:
                    smoothed_hand_points[h_idx] = raw_pts.copy()
                else:
                    smoothed_hand_points[h_idx] = smooth_alpha * raw_pts + (1.0 - smooth_alpha) * smoothed_hand_points[h_idx]

                pts_px = [(int(p[0] * w), int(p[1] * h)) for p in smoothed_hand_points[h_idx]]

                # Primary wand tip (Point 8 = Index fingertip)
                if dominant_wand_tip is None:
                    dominant_wand_tip = pts_px[8]
                    trajectory_pts.append((smoothed_hand_points[h_idx][8, 0], smoothed_hand_points[h_idx][8, 1]))

                # Check distance to nose
                if nose_px:
                    nd = math.hypot(smoothed_hand_points[h_idx][8, 0] - nose.x,
                                    smoothed_hand_points[h_idx][8, 1] - nose.y)
                    if nd < nose_finger_dist:
                        nose_finger_dist = nd

                # Render Smooth 21 Points & Neon Skeleton
                if show_hand:
                    # Draw skeletal bones
                    for p1, p2 in HAND_CONNECTIONS:
                        cv2.line(frame, pts_px[p1], pts_px[p2], (255, 230, 0), 2, cv2.LINE_AA)
                    # Draw all 21 joints
                    for j_idx, pt in enumerate(pts_px):
                        if j_idx in [4, 8, 12, 16, 20]:  # Fingertips (glowing halo)
                            cv2.circle(frame, pt, 7, (0, 140, 255), -1, cv2.LINE_AA)
                            cv2.circle(frame, pt, 3, (255, 255, 255), -1, cv2.LINE_AA)
                        else:  # Knuckles
                            cv2.circle(frame, pt, 4, (0, 255, 180), -1, cv2.LINE_AA)

            # Cleanup missing hands
            stale_keys = [k for k in smoothed_hand_points.keys() if k >= active_hands_count]
            for k in stale_keys:
                del smoothed_hand_points[k]
        else:
            smoothed_hand_points.clear()

        # =====================================================================
        # 3. Special Motion Gesture Recognition & Visual Effects
        # =====================================================================
        # A. Ngoáy Mũi -> Bắn Tia Laser
        if nose_finger_dist < 0.075:
            nose_touch_count += 1
            if nose_touch_count >= 14 and (now - last_cast_time["laser"] > 2.5):
                last_cast_time["laser"] = now
                nose_touch_count = 0
                trajectory_pts.clear()
                laser_origin = nose_px if nose_px else dominant_wand_tip
                vfx.spawn_booger_laser(laser_origin, (w // 2, 0))
                last_event_text = "NGOAY MUI BAN TIA LA-ZE! (RAINBOW LASER)"
                last_event_time = now
                last_event_color = (255, 0, 255)
        else:
            nose_touch_count = max(0, nose_touch_count - 2)

        # B. Giơ 2 Tay Đầu Hàng -> Hồi Máu / Vòng Hào Quang
        if is_surrendering:
            surrender_count += 1
            if surrender_count >= 12 and (now - last_cast_time["heal"] > 3.0):
                last_cast_time["heal"] = now
                surrender_count = 0
                trajectory_pts.clear()
                heal_pos = nose_px if nose_px else (w // 2, h // 2)
                vfx.spawn_surrender_heal(heal_pos)
                last_event_text = "DAU HANG HOI MAU! (GOLDEN HEAL AURA)"
                last_event_time = now
                last_event_color = (0, 255, 150)
        else:
            surrender_count = max(0, surrender_count - 2)

        # C. Trajectory Gestures: Circle (Fire Magic) & Swipe Left (Shield)
        if len(trajectory_pts) >= 18:
            pts_arr = np.array(trajectory_pts)
            xs = pts_arr[:, 0]
            ys = pts_arr[:, 1]
            dx_total = xs[-1] - xs[0]
            x_span = np.max(xs) - np.min(xs)
            y_span = np.max(ys) - np.min(ys)

            # 1. Circle Check: Ve duong tron trong khong khi = Phep thuat lua
            if x_span > 0.12 and y_span > 0.12 and (now - last_cast_time["fire"] > 1.3):
                aspect = x_span / (y_span + 1e-5)
                if 0.55 <= aspect <= 1.7:
                    center = np.mean(pts_arr, axis=0)
                    diffs = pts_arr - center
                    angles = np.arctan2(diffs[:, 1], diffs[:, 0])
                    total_rotation = np.sum(np.diff(np.unwrap(angles)))
                    if abs(total_rotation) >= 1.6 * math.pi:  # Closed ~360 degree circle!
                        last_cast_time["fire"] = now
                        trajectory_pts.clear()
                        vfx.spawn_fire_magic(dominant_wand_tip or (w // 2, h // 2))
                        last_event_text = "VE DUONG TRON -> PHEP THUAT LUA (INCENDIO FIREBALL)!"
                        last_event_time = now
                        last_event_color = (0, 140, 255)

            # 2. Swipe Left Check: Gat tay sang trai = Khien bao ve
            if dx_total < -0.22 and y_span < 0.16 and (now - last_cast_time["shield"] > 1.4):
                last_cast_time["shield"] = now
                trajectory_pts.clear()
                vfx.spawn_shield_magic(dominant_wand_tip or (w // 2, h // 2))
                last_event_text = "GAT TAY SANG TRAI -> KHIEN BAO VE (PROTEGO SHIELD)!"
                last_event_time = now
                last_event_color = (255, 230, 0)

        # Keyboard Manual Testing
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q') or key == 27:
            break
        elif key == ord('c'):
            show_comp = not show_comp
        elif key == ord('h'):
            show_hand = not show_hand
        elif key == ord('v'):
            show_effects = not show_effects
        elif key == ord('1'):
            vfx.spawn_fire_magic(dominant_wand_tip or (w // 2, h // 2))
            last_event_text = "MANUAL TRIGGER: PHEP THUAT LUA (FIREBALL)!"
            last_event_time = now
            last_event_color = (0, 140, 255)
        elif key == ord('2'):
            vfx.spawn_shield_magic(dominant_wand_tip or (w // 2, h // 2))
            last_event_text = "MANUAL TRIGGER: KHIEN BAO VE (SHIELD)!"
            last_event_time = now
            last_event_color = (255, 230, 0)
        elif key == ord('3'):
            vfx.spawn_punch_shockwave(dominant_wand_tip or (w // 2, h // 2))
            last_event_text = "MANUAL TRIGGER: DAM BOC MA THUAT (SHOCKWAVE)!"
            last_event_time = now
            last_event_color = (0, 255, 255)
        elif key == ord('4'):
            vfx.spawn_booger_laser(nose_px or (w // 2, h // 2), (w // 2, 0))
            last_event_text = "MANUAL TRIGGER: NGOAY MUI BAN LASER!"
            last_event_time = now
            last_event_color = (255, 0, 255)
        elif key == ord('5'):
            vfx.spawn_surrender_heal(nose_px or (w // 2, h // 2))
            last_event_text = "MANUAL TRIGGER: DAU HANG HOI MAU!"
            last_event_time = now
            last_event_color = (0, 255, 150)

        # Render Visual Effects
        if show_effects:
            frame = vfx.render(frame, wand_tip=dominant_wand_tip)

        # =====================================================================
        # 4. Clean HUD Overlay
        # =====================================================================
        fps_count += 1
        if time.time() - fps_time >= 1.0:
            fps = fps_count / (time.time() - fps_time)
            fps_count = 0
            fps_time = time.time()

        # Top Information Banner
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (w, 50), (20, 20, 25), -1)
        cv2.addWeighted(overlay, 0.75, frame, 0.25, 0, frame)
        cv2.line(frame, (0, 50), (w, 50), (0, 240, 255), 2)

        # 1. Computer Counter (Left)
        comp_str = f"COMPUTERS: {visible_comps} IN VIEW | TOTAL SEEN: {tracker.total_seen}"
        cv2.putText(frame, comp_str, (20, 32), cv2.FONT_HERSHEY_DUPLEX, 0.55, (0, 240, 255), 2, cv2.LINE_AA)

        # 2. Hand Tracker Status (Center)
        hand_str = f"HANDS: {active_hands_count} (21 PTS SMOOTH)"
        cv2.putText(frame, hand_str, (w // 2 - 130, 32), cv2.FONT_HERSHEY_DUPLEX, 0.55, (0, 255, 180), 2, cv2.LINE_AA)

        # 3. FPS & Keybinds (Right)
        status_str = f"FPS: {fps:.1f} | [Q] Quit [C] Comp [H] Hand [V] VFX"
        cv2.putText(frame, status_str, (w - 460, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.50, (220, 220, 220), 1, cv2.LINE_AA)

        # Notification Banner for Triggered Gestures (Bottom)
        if now - last_event_time < 2.5:
            banner_overlay = frame.copy()
            cv2.rectangle(banner_overlay, (0, h - 45), (w, h), (15, 15, 20), -1)
            cv2.addWeighted(banner_overlay, 0.75, frame, 0.25, 0, frame)
            cv2.putText(frame, f">> {last_event_text}", (25, h - 15),
                        cv2.FONT_HERSHEY_DUPLEX, 0.65, last_event_color, 2, cv2.LINE_AA)

        cv2.imshow("Smart Camera: Computer Detection, 21-Point Hand Tracking & Gesture VFX", frame)

    if cap:
        cap.release()
    cv2.destroyAllWindows()
    print("\n[SUCCESS] Camera application closed cleanly.")

if __name__ == "__main__":
    run_camera()
