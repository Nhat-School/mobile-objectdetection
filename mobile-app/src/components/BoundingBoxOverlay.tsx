import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { DetectedObject, TrackedObject } from '../types/detection';

interface BoundingBoxOverlayProps {
  /** Detections (can be TrackedObject with trackId or regular DetectedObject) */
  detections: (DetectedObject | TrackedObject)[];
  /** Whether the overlay is in live tracking mode */
  isLiveTracking?: boolean;
}

export const BoundingBoxOverlay: React.FC<BoundingBoxOverlayProps> = ({
  detections,
  isLiveTracking = false,
}) => {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {detections.map((item, index) => {
        const isTracked = 'trackId' in item;
        const color = isTracked ? (item as TrackedObject).color : '#00F0FF';
        const label = isTracked
          ? `Laptop #${(item as TrackedObject).trackId}`
          : `Laptop ${index + 1}`;
        const confidencePct = Math.round(item.confidence * 100);

        return (
          <View
            key={item.id || `box_${index}`}
            style={[
              styles.box,
              {
                left: item.box.x,
                top: item.box.y,
                width: item.box.width,
                height: item.box.height,
                borderColor: color,
              },
            ]}
          >
            {/* Top Label Badge */}
            <View style={[styles.badge, { backgroundColor: color }]}>
              <Text style={styles.badgeText}>
                {label} ({confidencePct}%)
              </Text>
            </View>

            {/* Corner styling accents */}
            <View style={[styles.cornerTL, { borderColor: color }]} />
            <View style={[styles.cornerTR, { borderColor: color }]} />
            <View style={[styles.cornerBL, { borderColor: color }]} />
            <View style={[styles.cornerBR, { borderColor: color }]} />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
  },
  badge: {
    position: 'absolute',
    top: -24,
    left: -2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  badgeText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cornerTL: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 12,
    height: 12,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTR: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBL: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 12,
    height: 12,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBR: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
});
