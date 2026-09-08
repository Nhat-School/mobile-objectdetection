import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { GestureClass, GestureDetectionResult } from '../types/detection';
import { notificationService } from '../services/notificationService';

interface GestureActionViewProps {
  gestureResult: GestureDetectionResult;
  onSimulateGesture: (gesture: GestureClass) => void;
  onCaptureFrame: (uri: string, width: number, height: number) => Promise<void>;
  isProcessing: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CAMERA_HEIGHT = SCREEN_HEIGHT * 0.62;

export const GestureActionView: React.FC<GestureActionViewProps> = ({
  gestureResult,
  onSimulateGesture,
  onCaptureFrame,
  isProcessing,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('front'); // Front camera is natural for gestures!
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const cameraRef = useRef<CameraView>(null);
  const isLoopRunning = useRef<boolean>(false);

  // Animated reaction scale
  const reactionScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (gestureResult.isTriggered) {
      reactionScale.setValue(0);
      Animated.spring(reactionScale, {
        toValue: 1.2,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          Animated.timing(reactionScale, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }, 1200);
      });
    }
  }, [gestureResult.isTriggered]);

  // Frame capture loop for live gesture processing
  useEffect(() => {
    isLoopRunning.current = isScanning;

    const captureLoop = async () => {
      while (isLoopRunning.current) {
        if (cameraRef.current && !isProcessing) {
          try {
            const photo = await cameraRef.current.takePictureAsync({
              quality: 0.4,
              skipProcessing: true,
            });
            if (photo && photo.uri) {
              await onCaptureFrame(photo.uri, SCREEN_WIDTH, CAMERA_HEIGHT);
            }
          } catch (e) {}
        }
        await new Promise((resolve) => setTimeout(resolve, 600)); // ~1.5 FPS frame sampling for battery efficiency
      }
    };

    if (isScanning && permission?.granted) {
      captureLoop();
    }

    return () => {
      isLoopRunning.current = false;
    };
  }, [isScanning, permission?.granted, isProcessing, onCaptureFrame]);

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#FF2366" />
        <Text style={styles.permissionSubtitle}>Checking camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionSubtitle}>
          Camera access is required to recognize hand gestures and send notifications.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Allow Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getGestureDetails = (g: GestureClass) => {
    switch (g) {
      case 'finger_heart':
        return { emoji: '❤️', label: 'FINGER HEART', color: '#FF2366' };
      case 'scissor':
        return { emoji: '✂️', label: 'SCISSORS / VICTORY', color: '#00F0FF' };
      case 'thumbs_up':
        return { emoji: '👍', label: 'THUMBS UP', color: '#39FF14' };
      case 'palm':
        return { emoji: '👋', label: 'OPEN PALM / WAVE', color: '#FFD700' };
      case 'fist':
        return { emoji: '✊', label: 'ROCK / FIST', color: '#A855F7' };
      default:
        return { emoji: '✋', label: 'SHOW GESTURE', color: '#64748B' };
    }
  };

  const currentDetails = getGestureDetails(gestureResult.gesture);

  return (
    <View style={styles.container}>
      {/* Live Front/Back Camera */}
      <View style={[styles.cameraWrapper, { width: SCREEN_WIDTH, height: CAMERA_HEIGHT }]}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          animateShutter={false}
        />

        {/* Top Active Gesture HUD */}
        <View style={styles.topHud}>
          <View style={[styles.gesturePill, { borderColor: currentDetails.color }]}>
            <Text style={styles.gesturePillEmoji}>{currentDetails.emoji}</Text>
            <View>
              <Text style={styles.gesturePillLabel}>{currentDetails.label}</Text>
              {gestureResult.confidence > 0 && (
                <Text style={[styles.gesturePillConf, { color: currentDetails.color }]}>
                  {Math.round(gestureResult.confidence * 100)}% Confidence
                </Text>
              )}
            </View>
          </View>

          {/* Cooldown meter */}
          {gestureResult.cooldownRemainingMs > 0 && (
            <View style={styles.cooldownBadge}>
              <Text style={styles.cooldownText}>
                ⏱️ Cooldown: {(gestureResult.cooldownRemainingMs / 1000).toFixed(1)}s
              </Text>
            </View>
          )}
        </View>

        {/* Center Animated Reaction Reaction */}
        <Animated.View
          style={[
            styles.reactionContainer,
            {
              transform: [{ scale: reactionScale }],
              opacity: reactionScale.interpolate({
                inputRange: [0, 0.5, 1, 1.2],
                outputRange: [0, 0.8, 1, 1],
              }),
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.reactionEmoji}>{currentDetails.emoji}</Text>
          <Text style={styles.reactionText}>{currentDetails.label} TRIGGERED!</Text>
        </Animated.View>

        {/* Flip camera button */}
        <TouchableOpacity
          style={styles.flipBtn}
          onPress={() => setFacing((prev) => (prev === 'front' ? 'back' : 'front'))}
        >
          <Text style={styles.flipBtnText}>🔄 Flip Camera</Text>
        </TouchableOpacity>
      </View>

      {/* Interactive Quick-Test Simulation Bar */}
      <View style={styles.bottomControls}>
        <Text style={styles.sectionTitle}>QUICK GESTURE ACTION TRIGGERS</Text>
        <Text style={styles.sectionHint}>
          Point hand at camera, or tap any gesture below to trigger instant local notification & haptics:
        </Text>

        <View style={styles.gestureButtonGrid}>
          <TouchableOpacity
            style={[styles.gestureBtn, { borderColor: '#FF2366' }]}
            onPress={() => onSimulateGesture('finger_heart')}
          >
            <Text style={styles.gestureBtnEmoji}>❤️</Text>
            <Text style={styles.gestureBtnText}>Finger Heart</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gestureBtn, { borderColor: '#00F0FF' }]}
            onPress={() => onSimulateGesture('scissor')}
          >
            <Text style={styles.gestureBtnEmoji}>✂️</Text>
            <Text style={styles.gestureBtnText}>Scissors</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gestureBtn, { borderColor: '#39FF14' }]}
            onPress={() => onSimulateGesture('thumbs_up')}
          >
            <Text style={styles.gestureBtnEmoji}>👍</Text>
            <Text style={styles.gestureBtnText}>Thumbs Up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gestureBtn, { borderColor: '#FFD700' }]}
            onPress={() => onSimulateGesture('palm')}
          >
            <Text style={styles.gestureBtnEmoji}>👋</Text>
            <Text style={styles.gestureBtnText}>Wave / Palm</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gestureBtn, { borderColor: '#A855F7' }]}
            onPress={() => onSimulateGesture('fist')}
          >
            <Text style={styles.gestureBtnEmoji}>✊</Text>
            <Text style={styles.gestureBtnText}>Rock / Fist</Text>
          </TouchableOpacity>
        </View>

        {/* Notification Status Footer */}
        <View style={styles.footerStatus}>
          <Text style={styles.footerStatusText}>
            🔔 Total Notifications Sent: <Text style={styles.boldText}>{gestureResult.totalTriggerCount}</Text>
          </Text>
          <Text style={styles.antiSpamText}>🛡️ 5-Frame Debounce & 3s Cooldown Active</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070A0F',
  },
  cameraWrapper: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1E293B',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  permissionSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: '#FF2366',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  topHud: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gesturePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 2,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  gesturePillEmoji: {
    fontSize: 22,
    marginRight: 8,
  },
  gesturePillLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  gesturePillConf: {
    fontSize: 11,
    fontWeight: '700',
  },
  cooldownBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  cooldownText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  reactionContainer: {
    position: 'absolute',
    alignSelf: 'center',
    top: '35%',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FF2366',
  },
  reactionEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  reactionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  flipBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  flipBtnText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomControls: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionHint: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 10,
  },
  gestureButtonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gestureBtn: {
    width: '31%',
    backgroundColor: '#161F2E',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  gestureBtnEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  gestureBtnText: {
    color: '#F1F5F9',
    fontSize: 11,
    fontWeight: '700',
  },
  footerStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  footerStatusText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  boldText: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  antiSpamText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
});
