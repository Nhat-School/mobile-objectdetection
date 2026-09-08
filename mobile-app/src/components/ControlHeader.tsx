import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { DetectionMode, TrackingStats, InferenceMetrics } from '../types/detection';

interface ControlHeaderProps {
  mode: DetectionMode;
  onModeChange: (mode: DetectionMode) => void;
  trackingStats: TrackingStats;
  photoCount: number;
  onResetTracker: () => void;
  confidenceThreshold: number;
  onConfidenceChange: (val: number) => void;
  metrics: InferenceMetrics;
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
}) => {
  return (
    <View style={styles.container}>
      {/* App Bar Title & Mode Switcher */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.appTitle}>💻 LAPTOP DETECTOR</Text>
          <Text style={styles.subtitle}>
            {mode === 'live' ? 'Live Video Tracking' : 'Photo Counter'}
          </Text>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, mode === 'live' && styles.tabButtonActive]}
            onPress={() => onModeChange('live')}
          >
            <Text style={[styles.tabText, mode === 'live' && styles.tabTextActive]}>
              🎥 Live Video
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

      {/* Dynamic Counter & Status HUD */}
      <View style={styles.hudCard}>
        {mode === 'live' ? (
          <View style={styles.statsRow}>
            {/* Active in View */}
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>IN VIEW NOW</Text>
              <Text style={[styles.statValue, { color: '#00F0FF' }]}>
                {trackingStats.currentlyInView}
              </Text>
            </View>

            <View style={styles.statDivider} />

            {/* Total Unique Laptops Counted */}
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>TOTAL UNIQUE LAPTOPS</Text>
              <Text style={[styles.statValue, { color: '#39FF14' }]}>
                {trackingStats.totalUniqueCounted}
              </Text>
              <Text style={styles.antiOvercountHint}>Anti-Overcount Active</Text>
            </View>

            {/* Reset Tracker Button */}
            <TouchableOpacity style={styles.resetButton} onPress={onResetTracker}>
              <Text style={styles.resetButtonText}>🔄 Reset</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>LAPTOPS DETECTED IN PHOTO</Text>
              <Text style={[styles.statValue, { color: '#FFD700' }]}>
                {photoCount}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Metrics & Confidence Controls */}
      <View style={styles.bottomRow}>
        <View style={styles.metricsGroup}>
          <Text style={styles.metricText}>
            ⚡ {metrics.inferenceTimeMs > 0 ? `${metrics.inferenceTimeMs}ms` : '--'}
          </Text>
          <Text style={styles.metricDivider}>|</Text>
          <Text style={styles.metricText}>
            🎯 {metrics.fps > 0 ? `${metrics.fps} FPS` : '--'}
          </Text>
        </View>

        {/* Confidence Threshold Selectors */}
        <View style={styles.thresholdGroup}>
          <Text style={styles.thresholdLabel}>Min Conf:</Text>
          {[0.3, 0.45, 0.6].map((thresh) => (
            <TouchableOpacity
              key={thresh}
              style={[
                styles.threshBadge,
                confidenceThreshold === thresh && styles.threshBadgeActive,
              ]}
              onPress={() => onConfidenceChange(thresh)}
            >
              <Text
                style={[
                  styles.threshText,
                  confidenceThreshold === thresh && styles.threshTextActive,
                ]}
              >
                {Math.round(thresh * 100)}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F141C',
    paddingTop: 44,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  appTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 3,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: '#38BDF8',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#0F172A',
  },
  hudCard: {
    backgroundColor: '#161F2E',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#243247',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 2,
  },
  antiOvercountHint: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#243247',
  },
  resetButton: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  resetButtonText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  metricDivider: {
    color: '#475569',
    marginHorizontal: 6,
    fontSize: 11,
  },
  thresholdGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thresholdLabel: {
    color: '#64748B',
    fontSize: 11,
    marginRight: 6,
  },
  threshBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#1E293B',
    marginLeft: 4,
  },
  threshBadgeActive: {
    backgroundColor: '#38BDF8',
  },
  threshText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  threshTextActive: {
    color: '#0F172A',
  },
});
