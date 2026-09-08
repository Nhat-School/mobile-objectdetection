import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { BoundingBoxOverlay } from './BoundingBoxOverlay';
import { TrackedObject, TrackingStats } from '../types/detection';

interface LiveTrackingViewProps {
  activeTracks: TrackedObject[];
  trackingStats: TrackingStats;
  isModelReady: boolean;
  onFrameDetectionsUpdate?: (tracks: TrackedObject[]) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const LiveTrackingView: React.FC<LiveTrackingViewProps> = ({
  activeTracks,
  trackingStats,
  isModelReady,
}) => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [cameraPosition, setCameraPosition] = useState<'back' | 'front'>('back');
  const device = useCameraDevice(cameraPosition);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const toggleCamera = () => {
    setCameraPosition((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionSubtitle}>
          Please grant camera access to detect and track laptops in real time.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#00F0FF" />
        <Text style={styles.permissionSubtitle}>Searching for camera device...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Live Camera Feed */}
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        enableFpsGraph={false}
      />

      {/* Real-time Bounding Box & Unique Track ID Overlay */}
      <BoundingBoxOverlay detections={activeTracks} isLiveTracking={true} />

      {/* Floating Camera Controls & Active Track Chips */}
      <View style={styles.bottomControls}>
        {/* Active Track ID Indicators */}
        <View style={styles.trackChipsContainer}>
          {activeTracks.map((track) => (
            <View
              key={track.trackId}
              style={[styles.trackChip, { borderColor: track.color }]}
            >
              <View style={[styles.trackDot, { backgroundColor: track.color }]} />
              <Text style={styles.trackChipText}>
                ID #{track.trackId}
              </Text>
            </View>
          ))}
          {activeTracks.length === 0 && (
            <Text style={styles.emptyTrackingText}>
              Point camera at laptops to assign unique tracking IDs...
            </Text>
          )}
        </View>

        {/* Flip Camera Button */}
        <TouchableOpacity style={styles.flipButton} onPress={toggleCamera}>
          <Text style={styles.flipButtonText}>🔄 Flip Camera</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
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
  bottomControls: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackChipsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginRight: 12,
  },
  trackChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  trackDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  trackChipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyTrackingText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
    fontStyle: 'italic',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  flipButton: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  flipButtonText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
});
