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
    // High-resolution sample desk with laptops for instant validation
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
                <Text style={styles.loadingText}>Analyzing photo with Roboflow API...</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>💻 📷</Text>
            <Text style={styles.placeholderTitle}>No Photo Selected</Text>
            <Text style={styles.placeholderSubtitle}>
              Snap a photo or pick one from your gallery to count how many laptops are in it.
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
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {detections.length} {detections.length === 1 ? 'Laptop' : 'Laptops'} Found
              </Text>
            </View>
          </View>

          {detections.length === 0 && !isProcessing ? (
            <Text style={styles.noDetectionsText}>
              No laptops detected in this image. Ensure the laptop is clearly visible.
            </Text>
          ) : (
            detections.map((item, index) => (
              <View key={item.id || index} style={styles.resultItem}>
                <View style={styles.resultItemLeft}>
                  <Text style={styles.itemIndex}>#{index + 1}</Text>
                  <Text style={styles.itemName}>LAPTOP</Text>
                </View>
                <Text style={styles.itemConfidence}>
                  {Math.round(item.confidence * 100)}% Confidence
                </Text>
              </View>
            ))
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
  placeholderContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  placeholderTitle: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  placeholderSubtitle: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 15, 23, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#00F0FF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#0F141C',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  actionButton: {
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionButtonText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  demoButton: {
    backgroundColor: '#0369A1',
    borderColor: '#38BDF8',
  },
  demoButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  resultsCard: {
    margin: 16,
    backgroundColor: '#161F2E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#243247',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: '#00F0FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
  },
  noDetectionsText: {
    color: '#94A3B8',
    fontSize: 13,
    fontStyle: 'italic',
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  resultItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIndex: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
    width: 28,
  },
  itemName: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '600',
  },
  itemConfidence: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
