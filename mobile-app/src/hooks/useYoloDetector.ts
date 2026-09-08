import { useState, useRef, useCallback, useEffect } from 'react';
import { offlineModelService } from '../services/offlineModelService';
import { ObjectTracker } from '../utils/objectTracker';
import { PerformanceTracker } from '../utils/performance';
import {
  DetectedObject,
  TrackedObject,
  TrackingStats,
  InferenceMetrics,
} from '../types/detection';
import { DEFAULT_MODEL_CONFIG } from '../constants/modelConfig';

export function useYoloDetector() {
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(
    DEFAULT_MODEL_CONFIG.defaultConfidenceThreshold
  );
  const [activeTracks, setActiveTracks] = useState<TrackedObject[]>([]);
  const [trackingStats, setTrackingStats] = useState<TrackingStats>({
    currentlyInView: 0,
    totalUniqueCounted: 0,
    activeTrackIds: [],
  });
  const [metrics, setMetrics] = useState<InferenceMetrics>({
    inferenceTimeMs: 0,
    fps: 0,
  });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isModelReady, setIsModelReady] = useState<boolean>(false);

  // Client-side Object Tracker for unique ID assignment and anti-overcounting
  const trackerRef = useRef<ObjectTracker>(
    new ObjectTracker({
      iouThreshold: 0.25,
      maxCentroidDistance: 130,
      maxDisappearedFrames: 15,
    })
  );
  const perfTrackerRef = useRef<PerformanceTracker>(new PerformanceTracker());

  // Initialize offline model on mount
  useEffect(() => {
    async function init() {
      await offlineModelService.loadModel();
      setIsModelReady(true);
    }
    init();
  }, []);

  /**
   * Resets tracking session, active tracks, and cumulative counts.
   */
  const resetTracker = useCallback(() => {
    trackerRef.current.reset();
    setActiveTracks([]);
    setTrackingStats(trackerRef.current.getStats());
  }, []);

  /**
   * Runs offline detection on a static photo using the locally trained model.
   */
  const runPhotoInference = useCallback(
    async (
      imageUri: string,
      viewWidth: number,
      viewHeight: number
    ): Promise<DetectedObject[]> => {
      const startTime = Date.now();
      setIsProcessing(true);

      try {
        const detections = await offlineModelService.detectLaptops(
          imageUri,
          viewWidth,
          viewHeight,
          confidenceThreshold
        );

        const latency = Date.now() - startTime;
        const { fps, avgLatencyMs } = perfTrackerRef.current.recordFrame(latency);
        setMetrics({ inferenceTimeMs: avgLatencyMs, fps });
        return detections;
      } catch (err) {
        console.error('Offline inference error on photo:', err);
        return [];
      } finally {
        setIsProcessing(false);
      }
    },
    [confidenceThreshold]
  );

  /**
   * Processes a live frame from CameraView using the offline model,
   * updates the ObjectTracker to maintain unique IDs (Laptop #1, Laptop #2),
   * and prevents overcounting the same laptop more than once.
   */
  const processLiveFrame = useCallback(
    async (imageUri: string, viewWidth: number, viewHeight: number) => {
      if (isProcessing) return;

      const startTime = Date.now();
      setIsProcessing(true);

      try {
        const detections = await offlineModelService.detectLaptops(
          imageUri,
          viewWidth,
          viewHeight,
          confidenceThreshold
        );

        // Feed new detections into client-side Multi-Object Tracker
        const tracks = trackerRef.current.update(detections);
        const stats = trackerRef.current.getStats();

        setActiveTracks(tracks);
        setTrackingStats(stats);

        const latency = Date.now() - startTime;
        const { fps, avgLatencyMs } = perfTrackerRef.current.recordFrame(latency);
        setMetrics({ inferenceTimeMs: avgLatencyMs, fps });
      } catch (err) {
        console.warn('Live frame offline inference notice:', err);
      } finally {
        setIsProcessing(false);
      }
    },
    [confidenceThreshold, isProcessing]
  );

  return {
    isModelReady,
    confidenceThreshold,
    setConfidenceThreshold,
    activeTracks,
    trackingStats,
    metrics,
    isProcessing,
    resetTracker,
    runPhotoInference,
    processLiveFrame,
  };
}
