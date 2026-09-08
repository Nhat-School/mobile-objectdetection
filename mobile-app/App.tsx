import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ControlHeader } from './src/components/ControlHeader';
import { LiveTrackingView } from './src/components/LiveTrackingView';
import { PhotoCountView } from './src/components/PhotoCountView';
import { useYoloDetector } from './src/hooks/useYoloDetector';
import { DetectionMode } from './src/types/detection';

export default function App() {
  const [mode, setMode] = useState<DetectionMode>('live');
  const [photoDetectionCount, setPhotoDetectionCount] = useState<number>(0);

  const {
    confidenceThreshold,
    setConfidenceThreshold,
    activeTracks,
    trackingStats,
    metrics,
    isProcessing,
    resetTracker,
    runPhotoInference,
    processLiveFrame,
  } = useYoloDetector();

  const handlePhotoInference = async (
    imageUri: string,
    viewWidth: number,
    viewHeight: number
  ) => {
    const results = await runPhotoInference(imageUri, viewWidth, viewHeight);
    setPhotoDetectionCount(results.length);
    return results;
  };

  return (
    <SafeAreaView style={styles.rootContainer}>
      <StatusBar style="light" backgroundColor="#0F141C" />

      {/* Control Header & Live Statistics HUD */}
      <ControlHeader
        mode={mode}
        onModeChange={setMode}
        trackingStats={trackingStats}
        photoCount={photoDetectionCount}
        onResetTracker={resetTracker}
        confidenceThreshold={confidenceThreshold}
        onConfidenceChange={setConfidenceThreshold}
        metrics={metrics}
      />

      {/* Main View Area (Live Video Tracking vs Photo Counter) */}
      <View style={styles.bodyContainer}>
        {mode === 'live' ? (
          <LiveTrackingView
            activeTracks={activeTracks}
            trackingStats={trackingStats}
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
