import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BoundingBoxOverlay } from './BoundingBoxOverlay';
import { DetectedObject } from '../types/detection';
import { getColorForObject, getLabelForObject } from '../constants/modelConfig';

interface PhotoCountViewProps {
  onRunPhotoInference: (
    imageUri: string,
    viewWidth: number,
    viewHeight: number
  ) => Promise<DetectedObject[]>;
  confidenceThreshold: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_VIEW_HEIGHT = Math.round(SCREEN_WIDTH * (4 / 3));

export const PhotoCountView: React.FC<PhotoCountViewProps> = ({
  onRunPhotoInference,
}) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [detections, setDetections] = useState<DetectedObject[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleSelectFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert('Photo library permission is required to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        processImage(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Gallery picker error:', err);
    }
  };

  const handleCapturePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        alert('Camera permission is required to capture photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        processImage(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Camera capture error:', err);
    }
  };

  const handleDemoTest = () => {
    const demoUri =
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80';
    processImage(demoUri);
  };

  const processImage = async (uri: string) => {
    setImageUri(uri);
    setIsProcessing(true);
    setDetections([]);

    try {
      const results = await onRunPhotoInference(uri, SCREEN_WIDTH, PHOTO_VIEW_HEIGHT);
      setDetections(results);
    } catch (error) {
      console.error('Inference error on photo:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const laptopCount = detections.filter((d: DetectedObject) => d.className === 'laptop' || d.classId === 0).length;
  const gestureCount = detections.filter((d: DetectedObject) => d.className !== 'laptop' && d.classId !== 0).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Image Preview Canvas */}
      <View style={[styles.canvasContainer, { width: SCREEN_WIDTH, height: PHOTO_VIEW_HEIGHT }]}>
        {imageUri ? (
          <>
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="contain"
            />
            <BoundingBoxOverlay detections={detections} isLiveTracking={false} />
            {isProcessing && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#00F0FF" />
                <Text style={styles.loadingText}>Analyzing photo with offline universal model...</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>💻 ✌️</Text>
            <Text style={styles.placeholderTitle}>Universal Detection Canvas</Text>
            <Text style={styles.placeholderSubtitle}>
              Snap a photo or choose from your gallery to simultaneously detect and count laptops and recognize hand gestures.
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.actionButton} onPress={handleCapturePhoto}>
          <Text style={styles.actionButtonText}>📸 Snap Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleSelectFromGallery}>
          <Text style={styles.actionButtonText}>🖼️ Choose Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.demoButton]} onPress={handleDemoTest}>
          <Text style={styles.demoButtonText}>⚡ Demo Image</Text>
        </TouchableOpacity>
      </View>

      {/* Detection Results Summary */}
      {imageUri && (
        <View style={styles.resultsCard}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>Detection Summary</Text>
            <View style={styles.badgesRow}>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  💻 {laptopCount} {laptopCount === 1 ? 'Laptop' : 'Laptops'}
                </Text>
              </View>
              {gestureCount > 0 && (
                <View style={[styles.countBadge, styles.gestureBadge]}>
                  <Text style={styles.gestureBadgeText}>
                    ✌️ {gestureCount} {gestureCount === 1 ? 'Gesture' : 'Gestures'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {detections.length === 0 && !isProcessing ? (
            <Text style={styles.noDetectionsText}>
              No laptops or hand gestures detected in this image.
            </Text>
          ) : (
            detections.map((item: DetectedObject, index: number) => {
              const itemColor = getColorForObject(item);
              const label = getLabelForObject(item, index);
              return (
                <View key={item.id || index} style={styles.resultItem}>
                  <View style={styles.resultItemLeft}>
                    <View style={[styles.itemDot, { backgroundColor: itemColor }]} />
                    <Text style={[styles.itemIndex, { color: itemColor }]}>#{index + 1}</Text>
                    <Text style={styles.itemName}>{label}</Text>
                  </View>
                  <Text style={[styles.itemConfidence, { color: itemColor }]}>
                    {Math.round(item.confidence * 100)}% Confidence
                  </Text>
                </View>
              );
            })
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070A0F',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  canvasContainer: {
    backgroundColor: '#111827',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 10, 15, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#00F0FF',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  placeholderTitle: {
    color: '#F0F6FC',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  placeholderSubtitle: {
    color: '#8B949E',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0F141C',
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1E2633',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  actionButtonText: {
    color: '#F0F6FC',
    fontSize: 12,
    fontWeight: '700',
  },
  demoButton: {
    borderColor: '#00F0FF',
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
  },
  demoButtonText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '700',
  },
  resultsCard: {
    margin: 16,
    backgroundColor: '#0F141C',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  resultsTitle: {
    color: '#F0F6FC',
    fontSize: 16,
    fontWeight: '700',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00F0FF',
    marginRight: 6,
  },
  countBadgeText: {
    color: '#00F0FF',
    fontSize: 12,
    fontWeight: '700',
  },
  gestureBadge: {
    backgroundColor: 'rgba(255, 20, 147, 0.15)',
    borderColor: '#FF1493',
    marginRight: 0,
  },
  gestureBadgeText: {
    color: '#FF1493',
    fontSize: 12,
    fontWeight: '700',
  },
  noDetectionsText: {
    color: '#8B949E',
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1B2230',
  },
  resultItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  itemIndex: {
    fontSize: 12,
    fontWeight: '700',
    marginRight: 6,
  },
  itemName: {
    color: '#F0F6FC',
    fontSize: 13,
    fontWeight: '600',
  },
  itemConfidence: {
    fontSize: 12,
    fontWeight: '600',
  },
});
