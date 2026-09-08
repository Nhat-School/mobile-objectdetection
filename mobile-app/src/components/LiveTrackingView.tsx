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
import { BoundingBoxOverlay } from './BoundingBoxOverlay';
import {
  DetectedObject,
  TrackedObject,
  TrackingStats,
  GestureDetectionResult,
} from '../types/detection';
import { GESTURE_EMOJIS } from '../constants/modelConfig';

interface LiveTrackingViewProps {
  activeTracks: TrackedObject[];
  activeGestureDetections: DetectedObject[];
  trackingStats: TrackingStats;
  gestureResult: GestureDetectionResult;
  isProcessing: boolean;
  onCaptureFrame: (uri: string, width: number, height: number) => Promise<void>;
  onResetTracker: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CAMERA_HEIGHT = SCREEN_HEIGHT * 0.65;

export const LiveTrackingView: React.FC<LiveTrackingViewProps> = ({
  activeTracks,
  activeGestureDetections,
  trackingStats,
  gestureResult,
  isProcessing,
  onCaptureFrame,
  onResetTracker,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const cameraRef = useRef<CameraView>(null);
  const isLoopRunning = useRef<boolean>(false);

  // Floating reaction animation when gesture is triggered
  const reactionAnim = useRef(new Animated.Value(0)).current;
  const [reactionEmoji, setReactionEmoji] = useState<string>('✨');

  useEffect(() => {
    if (gestureResult.isTriggered && gestureResult.gesture !== 'none') {
      const emojiMap: Record<string, string> = {
        finger_heart: '❤️',
        scissor: '✌️',
        thumbs_up: '👍',
        palm: '👋',
        fist: '✊',
      };
      setReactionEmoji(emojiMap[gestureResult.gesture] || '✨');

      reactionAnim.setValue(0);
      Animated.sequence([
        Animated.spring(reactionAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 4,
        }),
        Animated.delay(1200),
        Animated.timing(reactionAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [gestureResult.isTriggered, gestureResult.gesture, reactionAnim]);

  // Background frame capture loop for simultaneous live inference
  useEffect(() => {
    isLoopRunning.current = isScanning;

    const captureLoop = async () => {
      while (isLoopRunning.current) {
        if (cameraRef.current && !isProcessing) {
          try {
            const photo = await cameraRef.current.takePictureAsync({
              quality: 0.5,
              skipProcessing: true,
            });
            if (photo && photo.uri) {
              await onCaptureFrame(photo.uri, SCREEN_WIDTH, CAMERA_HEIGHT);
            }
          } catch (e) {
            // Frame skip during fast camera focus or panning
          }
        }
        // Frame interval for responsive mobile real-time tracking
        await new Promise((resolve) => setTimeout(resolve, 650));
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
        <ActivityIndicator size="large" color="#00F0FF" />
        <Text style={styles.permissionSubtitle}>Checking camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionSubtitle}>
          Expo Go needs camera access to simultaneously detect laptops and hand gestures in live video.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Allow Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleFacing = () => {
    setFacing((prev: 'back' | 'front') => (prev === 'back' ? 'front' : 'back'));
  };

  const toggleScanning = () => {
    setIsScanning((prev: boolean) => !prev);
  };

  // Combine laptop tracks and active gesture detections into one overlay
  const combinedDetections = [...activeTracks, ...activeGestureDetections];

  return (
    <View style={styles.container}>
      {/* Live Camera Viewfinder */}
      <View style={[styles.cameraWrapper, { height: CAMERA_HEIGHT }]}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          facing={facing}
        >
          {/* Simultaneous Bounding Box Overlay for Laptops & Gestures */}
          <BoundingBoxOverlay detections={combinedDetections} isLiveTracking />

          {/* Top Live Pill: Simultaneous Detection Status */}
          <View style={styles.liveStatusRow}>
            <View style={styles.statusPill}>
              <View style={[styles.statusDot, isScanning && styles.statusDotActive]} />
              <Text style={styles.statusPillText}>
                {isScanning ? 'LIVE OPTION A' : 'PAUSED'}
              </Text>
            </View>

            {gestureResult.gesture !== 'none' && (
              <View style={styles.gestureActivePill}>
                <Text style={styles.gesturePillText}>
                  {GESTURE_EMOJIS[gestureResult.gesture] || gestureResult.gesture} (
                  {Math.round(gestureResult.confidence * 100)}%)
                </Text>
              </View>
            )}
          </View>

          {/* Floating Emoji Reaction Bubble on Trigger */}
          <Animated.View
            style={[
              styles.reactionBubble,
              {
                opacity: reactionAnim,
                transform: [
                  {
                    scale: reactionAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1.4],
                    }),
                  },
                  {
                    translateY: reactionAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, -40],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.reactionText}>{reactionEmoji}</Text>
          </Animated.View>

          {/* Camera Viewfinder Reticle */}
          <View style={styles.reticleContainer} pointerEvents="none">
            <View style={[styles.reticleCorner, styles.reticleTL]} />
            <View style={[styles.reticleCorner, styles.reticleTR]} />
            <View style={[styles.reticleCorner, styles.reticleBL]} />
            <View style={[styles.reticleCorner, styles.reticleBR]} />
          </View>
        </CameraView>
      </View>

      {/* Camera Bottom Controls */}
      <View style={styles.controlsBar}>
        <TouchableOpacity style={styles.controlButton} onPress={toggleFacing}>
          <Text style={styles.controlButtonText}>
            🔄 Flip ({facing === 'back' ? 'Rear' : 'Front'})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, isScanning && styles.controlButtonScanning]}
          onPress={toggleScanning}
        >
          <Text style={styles.controlButtonText}>
            {isScanning ? '⏸️ Pause' : '▶️ Resume'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetButton} onPress={onResetTracker}>
          <Text style={styles.resetButtonText}>🔄 Reset IDs</Text>
        </TouchableOpacity>
      </View>

      {/* Tracking Summary Info */}
      <View style={styles.infoFooter}>
        <Text style={styles.infoText}>
          💻 Tracking {trackingStats.currentlyInView} laptop(s) in view • Anti-overcounting active
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070A0F',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#070A0F',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F0F6FC',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionSubtitle: {
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: '#00F0FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#070A0F',
    fontWeight: '700',
    fontSize: 15,
  },
  cameraWrapper: {
    width: SCREEN_WIDTH,
    backgroundColor: '#000000',
    overflow: 'hidden',
    position: 'relative',
  },
  liveStatusRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 10, 15, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B949E',
    marginRight: 6,
  },
  statusDotActive: {
    backgroundColor: '#39FF14',
  },
  statusPillText: {
    color: '#F0F6FC',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  gestureActivePill: {
    backgroundColor: 'rgba(255, 20, 147, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  gesturePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  reactionBubble: {
    position: 'absolute',
    alignSelf: 'center',
    top: '40%',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#FF1493',
  },
  reactionText: {
    fontSize: 54,
  },
  reticleContainer: {
    ...StyleSheet.absoluteFillObject,
    margin: 30,
  },
  reticleCorner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: 'rgba(0, 240, 255, 0.35)',
  },
  reticleTL: {
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  reticleTR: {
    top: 0,
    right: 0,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  reticleBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  reticleBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0F141C',
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  controlButton: {
    backgroundColor: '#1E2633',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  controlButtonScanning: {
    borderColor: '#00F0FF',
  },
  controlButtonText: {
    color: '#F0F6FC',
    fontSize: 12,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: 'rgba(255, 87, 34, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF5722',
  },
  resetButtonText: {
    color: '#FF5722',
    fontSize: 12,
    fontWeight: '700',
  },
  infoFooter: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0B0F17',
    alignItems: 'center',
  },
  infoText: {
    color: '#8B949E',
    fontSize: 12,
  },
});
