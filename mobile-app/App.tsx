import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ControlHeader } from './src/components/ControlHeader';
import { LiveTrackingView } from './src/components/LiveTrackingView';
import { PhotoCountView } from './src/components/PhotoCountView';
import { useYoloDetector } from './src/hooks/useYoloDetector';
import { DetectionMode, DetectedObject } from './src/types/detection';

export default function App() {
  const [mode, setMode] = useState<DetectionMode>('live');
  const [photoDetectionCount, setPhotoDetectionCount] = useState<number>(0);

  const {
    confidenceThreshold,
    setConfidenceThreshold,
    activeTracks,
    activeGestureDetections,
    trackingStats,
    gestureResult,
    metrics,
    isProcessing,
    resetTracker,
    simulateGesture,
    runPhotoInference,
    processLiveFrame,
  } = useYoloDetector();

  const handlePhotoInference = async (
    imageUri: string,
    viewWidth: number,
    viewHeight: number
  ) => {
    const results = await runPhotoInference(imageUri, viewWidth, viewHeight);
    const laptopCount = results.filter(
      (d: DetectedObject) => d.className === 'laptop' || d.classId === 0
    ).length;
    setPhotoDetectionCount(laptopCount);
    return results;
  };

  return (
    <SafeAreaView style={styles.rootContainer}>
      <StatusBar style="light" backgroundColor="#0F141C" />

      {/* Unified Option A Header & Status HUD */}
      <ControlHeader
        mode={mode}
        onModeChange={setMode}
        trackingStats={trackingStats}
        photoCount={photoDetectionCount}
        onResetTracker={resetTracker}
        confidenceThreshold={confidenceThreshold}
        onConfidenceChange={setConfidenceThreshold}
        metrics={metrics}
        gestureResult={gestureResult}
        onSimulateGesture={simulateGesture}
      />

      {/* Main View Area: Option A Simultaneous Live View or Photo Analysis */}
      <View style={styles.bodyContainer}>
        {mode === 'live' ? (
          <LiveTrackingView
            activeTracks={activeTracks}
            activeGestureDetections={activeGestureDetections}
            trackingStats={trackingStats}
            gestureResult={gestureResult}
            isProcessing={isProcessing}
            onCaptureFrame={processLiveFrame}
            onResetTracker={resetTracker}
          />
        ) : (
          <PhotoCountView
            onRunPhotoInference={handlePhotoInference}
            confidenceThreshold={confidenceThreshold}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  bodyContainer: {
    flex: 1,
    backgroundColor: '#070A0F',
  },
});
