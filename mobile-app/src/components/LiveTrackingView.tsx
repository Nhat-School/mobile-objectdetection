import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BoundingBoxOverlay } from './BoundingBoxOverlay';
import { DetectedObject, TrackedObject, TrackingStats } from '../types/detection';

interface LiveTrackingViewProps {
  activeTracks: TrackedObject[];
  trackingStats: TrackingStats;
  isProcessing: boolean;
  onCaptureFrame: (uri: string, width: number, height: number) => Promise<void>;
  onResetTracker: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CAMERA_HEIGHT = SCREEN_HEIGHT * 0.68;

export const LiveTrackingView: React.FC<LiveTrackingViewProps> = ({
  activeTracks,
  trackingStats,
  isProcessing,
  onCaptureFrame,
  onResetTracker,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const cameraRef = useRef<CameraView>(null);
  const isLoopRunning = useRef<boolean>(false);

  // Background frame capture loop for live tracking
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
            // Frame skip during fast motion or camera focus
          }
        }
        // Throttle interval between live frames to prevent battery drain
        await new Promise((resolve) => setTimeout(resolve, 800));
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
          Expo Go needs camera access to detect and track laptops in live video.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Allow Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleFacing = () => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const toggleScanning = () => {
    setIsScanning((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      {/* Live Camera View from Expo-Camera */}
      <View style={[styles.cameraWrapper, { width: SCREEN_WIDTH, height: CAMERA_HEIGHT }]}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          animateShutter={false}
        />

        {/* Bounding Box & Unique ID Overlay */}
        <BoundingBoxOverlay detections={activeTracks} isLiveTracking={true} />

        {/* Live scanning status pulse */}
        <View style={styles.scannerBadge}>
          <View
            style={[
              styles.pulseDot,
              { backgroundColor: isScanning ? '#39FF14' : '#EF4444' },
            ]}
          />
          <Text style={styles.scannerBadgeText}>
            {isScanning ? (isProcessing ? 'SCANNING...' : 'LIVE TRACKING') : 'PAUSED'}
          </Text>
        </View>
      </View>

      {/* Floating Controls & Active Track Chips */}
      <View style={styles.controlsContainer}>
        {/* Track Chips Row */}
        <View style={styles.chipsRow}>
          {activeTracks.map((track) => (
            <View
              key={track.trackId}
              style={[styles.trackChip, { borderColor: track.color }]}
            >
              <View style={[styles.trackDot, { backgroundColor: track.color }]} />
              <Text style={styles.trackChipText}>
                ID #{track.trackId} ({Math.round(track.confidence * 100)}%)
              </Text>
            </View>
          ))}
          {activeTracks.length === 0 && (
            <Text style={styles.emptyTrackingText}>
              Point camera at laptops to assign unique tracking IDs...
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.controlBtn, isScanning ? styles.pauseBtn : styles.resumeBtn]}
            onPress={toggleScanning}
          >
            <Text style={styles.controlBtnText}>
              {isScanning ? '⏸️ Pause' : '▶️ Resume'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtn} onPress={toggleFacing}>
            <Text style={styles.controlBtnText}>🔄 Flip Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.controlBtn, styles.resetBtn]} onPress={onResetTracker}>
            <Text style={styles.resetBtnText}>🔄 Reset IDs</Text>
          </TouchableOpacity>
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
    backgroundColor: '#38BDF8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  scannerBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  scannerBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  controlsContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  trackChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161F2E',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  trackDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  trackChipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyTrackingText: {
    color: '#64748B',
    fontSize: 13,
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controlBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  controlBtnText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  pauseBtn: {
    backgroundColor: '#1E293B',
  },
  resumeBtn: {
    backgroundColor: '#065F46',
    borderColor: '#10B981',
  },
  resetBtn: {
    backgroundColor: '#334155',
  },
  resetBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
});
