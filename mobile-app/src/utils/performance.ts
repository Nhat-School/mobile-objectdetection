export class PerformanceTracker {
  private frameTimestamps: number[] = [];
  private latencySamples: number[] = [];
  private maxSamples: number = 20;

  public recordFrame(inferenceTimeMs: number): { fps: number; avgLatencyMs: number } {
    const now = Date.now();
    this.frameTimestamps.push(now);
    this.latencySamples.push(inferenceTimeMs);

    // Keep only recent samples
    if (this.frameTimestamps.length > this.maxSamples) {
      this.frameTimestamps.shift();
    }
    if (this.latencySamples.length > this.maxSamples) {
      this.latencySamples.shift();
    }

    // Calculate FPS
    let fps = 0;
    if (this.frameTimestamps.length > 1) {
      const timeSpan = (now - this.frameTimestamps[0]) / 1000;
      if (timeSpan > 0) {
        fps = Math.round((this.frameTimestamps.length - 1) / timeSpan);
      }
    }

    // Calculate average latency
    const avgLatencyMs = Math.round(
      this.latencySamples.reduce((sum, val) => sum + val, 0) / (this.latencySamples.length || 1)
    );

    return { fps, avgLatencyMs };
  }

  public reset(): void {
    this.frameTimestamps = [];
    this.latencySamples = [];
  }
}
