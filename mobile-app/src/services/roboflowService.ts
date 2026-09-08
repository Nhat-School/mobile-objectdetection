import * as FileSystem from 'expo-file-system';
import { DetectedObject, NormalizedBox, BoundingBox } from '../types/detection';

export const ROBOFLOW_CONFIG = {
  apiKey: 'rf_7K59kT4qEcfJlx3rI4nhZQz7pXT2',
  modelEndpoint: 'https://detect.roboflow.com/laptop-detection-yolo/1', // Default Roboflow laptop model
  fallbackEndpoint: 'https://detect.roboflow.com/laptop-detection/1',
};

interface RoboflowPrediction {
  x: number; // center X
  y: number; // center Y
  width: number;
  height: number;
  confidence: number;
  class: string;
}

interface RoboflowResponse {
  predictions: RoboflowPrediction[];
  image: {
    width: number;
    height: number;
  };
}

/**
 * Sends an image to the Roboflow Inference API and maps predictions into DetectedObjects.
 *
 * @param imageUri Local file URI from expo-camera or expo-image-picker
 * @param viewWidth Display view width for coordinate scaling
 * @param viewHeight Display view height for coordinate scaling
 * @param confThreshold Minimum confidence threshold
 */
export async function detectLaptopsWithRoboflow(
  imageUri: string,
  viewWidth: number,
  viewHeight: number,
  confThreshold: number = 0.4
): Promise<DetectedObject[]> {
  try {
    let base64Data = '';

    if (imageUri.startsWith('data:image')) {
      base64Data = imageUri.split(',')[1];
    } else if (imageUri.startsWith('file://') || imageUri.startsWith('/')) {
      base64Data = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    } else {
      // Remote URI fallback: fetch as blob and convert
      const response = await fetch(imageUri);
      const blob = await response.blob();
      base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.includes(',') ? result.split(',')[1] : result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    const apiUrl = `${ROBOFLOW_CONFIG.modelEndpoint}?api_key=${ROBOFLOW_CONFIG.apiKey}&confidence=${Math.round(
      confThreshold * 100
    )}`;

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: base64Data,
    });

    if (!res.ok) {
      console.warn(`Roboflow API returned status ${res.status}. Trying fallback model...`);
      // Try fallback public endpoint
      const fallbackUrl = `${ROBOFLOW_CONFIG.fallbackEndpoint}?api_key=${ROBOFLOW_CONFIG.apiKey}&confidence=${Math.round(
        confThreshold * 100
      )}`;
      const fallbackRes = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: base64Data,
      });

      if (!fallbackRes.ok) {
        throw new Error(`Roboflow API error: ${res.statusText}`);
      }

      const data: RoboflowResponse = await fallbackRes.json();
      return parseRoboflowPredictions(data, viewWidth, viewHeight, confThreshold);
    }

    const data: RoboflowResponse = await res.json();
    return parseRoboflowPredictions(data, viewWidth, viewHeight, confThreshold);
  } catch (error) {
    console.error('Roboflow Detection failed:', error);
    throw error;
  }
}

/**
 * Maps Roboflow API predictions to scaled screen BoundingBoxes.
 */
function parseRoboflowPredictions(
  data: RoboflowResponse,
  viewWidth: number,
  viewHeight: number,
  confThreshold: number
): DetectedObject[] {
  if (!data.predictions || data.predictions.length === 0) {
    return [];
  }

  const imgW = data.image?.width || 640;
  const imgH = data.image?.height || 640;
  const scaleX = viewWidth / imgW;
  const scaleY = viewHeight / imgH;

  return data.predictions
    .filter((p) => p.confidence >= confThreshold)
    .map((p, index) => {
      // Roboflow returns center (x, y) and box (width, height)
      const x1 = Math.max(0, p.x - p.width / 2);
      const y1 = Math.max(0, p.y - p.height / 2);

      const box: BoundingBox = {
        x: Math.round(x1 * scaleX),
        y: Math.round(y1 * scaleY),
        width: Math.round(p.width * scaleX),
        height: Math.round(p.height * scaleY),
      };

      const normalizedBox: NormalizedBox = {
        x1: x1 / imgW,
        y1: y1 / imgH,
        x2: (x1 + p.width) / imgW,
        y2: (y1 + p.height) / imgH,
      };

      return {
        id: `rf_${Date.now()}_${index}`,
        box,
        normalizedBox,
        confidence: p.confidence,
        classId: 0,
        className: p.class || 'laptop',
      };
    });
}
