import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ControlHeader } from './src/components/ControlHeader';
import { LiveTrackingView } from './src/components/LiveTrackingView';
import { PhotoCountView } from './src/components/PhotoCountView';
import { GestureActionView } from './src/components/GestureActionView';
import { useYoloDetector } from './src/hooks/useYoloDetector';
import { DetectionMode } from './src/types/detection';

export default function App() {
  const [mode, setMode] = useState<DetectionMode>('live');
  const [photoDetectionCount, setPhotoDetectionCount] = useState<number>(0);

  const {
    appDomain,
    setAppDomain,
    confidenceThreshold,
    setConfidenceThreshold,
    activeTracks,
    trackingStats,
    gestureResult,
    metrics,
    isProcessing,
    resetTracker,
    simulateGesture,
    runPhotoInference,
    processLiveFrame,
    processGestureFrame,
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

      {/* Top Header & Option B Domain Switcher */}
      <ControlHeader
        appDomain={appDomain}
        onAppDomainChange={setAppDomain}
        mode={mode}
        onModeChange={setMode}
        trackingStats={trackingStats}
        photoCount={photoDetectionCount}
        onResetTracker={resetTracker}
        confidenceThreshold={confidenceThreshold}
        onConfidenceChange={setConfidenceThreshold}
        metrics={metrics}
        gestureResult={gestureResult}
      />

      {/* Main View Area: Option B Modular Views */}
      <View style={styles.bodyContainer}>
        {appDomain === 'laptop' ? (
          mode === 'live' ? (
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
          )
        ) : (
          /* Hand Gesture Mode */
          <GestureActionView
            gestureResult={gestureResult}
            onSimulateGesture={simulateGesture}
            onCaptureFrame={processGestureFrame}
            isProcessing={isProcessing}
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
