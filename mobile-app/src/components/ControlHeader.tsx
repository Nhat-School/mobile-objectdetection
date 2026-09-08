import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import {
  DetectionMode,
  TrackingStats,
  InferenceMetrics,
  GestureDetectionResult,
  GestureClass,
} from '../types/detection';
import { GESTURE_EMOJIS } from '../constants/modelConfig';

interface ControlHeaderProps {
  mode: DetectionMode;
  onModeChange: (mode: DetectionMode) => void;
  trackingStats: TrackingStats;
  photoCount: number;
  onResetTracker: () => void;
  confidenceThreshold: number;
  onConfidenceChange: (val: number) => void;
  metrics: InferenceMetrics;
  gestureResult?: GestureDetectionResult;
  onSimulateGesture?: (gesture: GestureClass) => void;
}

export const ControlHeader: React.FC<ControlHeaderProps> = ({
  mode,
  onModeChange,
  trackingStats,
  photoCount,
  onResetTracker,
  confidenceThreshold,
  onConfidenceChange,
  metrics,
  gestureResult,
  onSimulateGesture,
}) => {
  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.bannerRow}>
        <View>
          <Text style={styles.title}>🚀 Option A: Universal Model</Text>
          <Text style={styles.subtitle}>Simultaneous Laptop Tracking & 5 Gestures</Text>
        </View>

        {/* Tab Switcher: Live vs Photo */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, mode === 'live' && styles.tabButtonActive]}
            onPress={() => onModeChange('live')}
          >
            <Text style={[styles.tabText, mode === 'live' && styles.tabTextActive]}>
              🎥 Live
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, mode === 'photo' && styles.tabButtonActive]}
            onPress={() => onModeChange('photo')}
          >
            <Text style={[styles.tabText, mode === 'photo' && styles.tabTextActive]}>
              📷 Photo
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dynamic Status HUD */}
      <View style={styles.hudCard}>
        {mode === 'live' ? (
          <View style={styles.statsRow}>
            {/* Laptops In View */}
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>IN VIEW</Text>
              <Text style={[styles.statValue, { color: '#00F0FF' }]}>
                {trackingStats.currentlyInView}
              </Text>
            </View>

            <View style={styles.statDivider} />

            {/* Total Unique Laptops Counted */}
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>UNIQUE LAPS</Text>
              <Text style={[styles.statValue, { color: '#39FF14' }]}>
                {trackingStats.totalUniqueCounted}
              </Text>
            </View>

            <View style={styles.statDivider} />

            {/* Current Detected Gesture */}
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>ACTIVE GESTURE</Text>
              <Text style={[styles.statValue, { color: '#FF1493' }]}>
                {gestureResult && gestureResult.gesture !== 'none'
                  ? GESTURE_EMOJIS[gestureResult.gesture] || gestureResult.gesture
                  : '—'}
              </Text>
            </View>

            <View style={styles.statDivider} />

            {/* Live Telemetry */}
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>FPS / MS</Text>
              <Text style={styles.statSubValue}>
                {metrics.fps > 0 ? `${metrics.fps} FPS` : 'Ready'}
              </Text>
              <Text style={styles.latencyText}>
                {metrics.inferenceTimeMs > 0 ? `${metrics.inferenceTimeMs}ms` : '100% Offline'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.photoHudRow}>
            <View>
              <Text style={styles.photoCountTitle}>Total Laptops Detected in Photo</Text>
              <Text style={styles.photoCountSubtitle}>
                Run inference to count laptops & detect hand signs
              </Text>
            </View>
            <View style={styles.photoCountBubble}>
              <Text style={styles.photoCountNumber}>{photoCount}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Quick Test Bar: Instant Gesture Simulation & Haptic Feedback */}
      {onSimulateGesture && (
        <View style={styles.simulationBar}>
          <Text style={styles.simLabel}>Test Gestures:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.simScroll}>
            {(['finger_heart', 'scissor', 'thumbs_up', 'palm', 'fist'] as GestureClass[]).map((g) => (
              <TouchableOpacity
                key={g}
                style={styles.simChip}
                onPress={() => onSimulateGesture(g)}
              >
                <Text style={styles.simChipText}>{GESTURE_EMOJIS[g] || g}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F141C',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    color: '#F0F6FC',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: '#8B949E',
    fontSize: 11,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E2633',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: '#00F0FF',
  },
  tabText: {
    color: '#8B949E',
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#070A0F',
  },
  hudCard: {
    backgroundColor: '#161B22',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#30363D',
  },
  statLabel: {
    color: '#8B949E',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  statSubValue: {
    color: '#F0F6FC',
    fontSize: 11,
    fontWeight: '700',
  },
  latencyText: {
    color: '#8B949E',
    fontSize: 9,
  },
  photoHudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  photoCountTitle: {
    color: '#F0F6FC',
    fontSize: 13,
    fontWeight: '700',
  },
  photoCountSubtitle: {
    color: '#8B949E',
    fontSize: 11,
  },
  photoCountBubble: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#00F0FF',
  },
  photoCountNumber: {
    color: '#00F0FF',
    fontSize: 18,
    fontWeight: '800',
  },
  simulationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#21262D',
  },
  simLabel: {
    color: '#8B949E',
    fontSize: 11,
    fontWeight: '600',
    marginRight: 8,
  },
  simScroll: {
    alignItems: 'center',
  },
  simChip: {
    backgroundColor: '#1E2633',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  simChipText: {
    color: '#F0F6FC',
    fontSize: 11,
    fontWeight: '600',
  },
});
