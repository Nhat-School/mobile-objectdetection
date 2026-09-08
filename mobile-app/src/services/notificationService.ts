import { Platform } from 'react-native';

/**
 * Service for dispatching instant local notifications and tactile haptics
 * for recognized hand gestures (Finger Heart, Scissors, Thumbs Up, Wave/Palm, Fist).
 * Works 100% offline without remote servers.
 */
class NotificationService {
  private hasPermission: boolean = false;
  private notificationsModule: any = null;
  private hapticsModule: any = null;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      this.notificationsModule = require('expo-notifications');
      this.hapticsModule = require('expo-haptics');

      // Configure notification behavior when app is in foreground
      this.notificationsModule.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      const { status } = await this.notificationsModule.requestPermissionsAsync();
      this.hasPermission = status === 'granted';

      if (Platform.OS === 'android') {
        await this.notificationsModule.setNotificationChannelAsync('gestures', {
          name: 'Hand Gesture Alerts',
          importance: this.notificationsModule.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF2366',
        });
      }
    } catch (e) {
      console.log('expo-notifications / expo-haptics runtime notice:', e);
    }
  }

  private async dispatch(title: string, body: string, gesture: string, hapticStyle: 'success' | 'medium' | 'heavy' = 'medium') {
    console.log(`🎯 GESTURE ACTION: ${title}`);

    // Tactile Haptic Vibration
    try {
      if (this.hapticsModule) {
        if (hapticStyle === 'success') {
          await this.hapticsModule.notificationAsync(this.hapticsModule.NotificationFeedbackType.Success);
        } else if (hapticStyle === 'heavy') {
          await this.hapticsModule.impactAsync(this.hapticsModule.ImpactFeedbackStyle.Heavy);
        } else {
          await this.hapticsModule.impactAsync(this.hapticsModule.ImpactFeedbackStyle.Medium);
        }
      }
    } catch (e) {}

    // Offline System Banner Notification
    try {
      if (this.notificationsModule && this.hasPermission) {
        await this.notificationsModule.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: { gesture },
            sound: true,
          },
          trigger: null,
        });
      }
    } catch (e) {
      console.warn('Notification schedule error:', e);
    }
  }

  public async sendHeartNotification(): Promise<void> {
    await this.dispatch('❤️ Finger Heart Detected!', 'You sent love with a finger heart! 💕', 'finger_heart', 'success');
  }

  public async sendScissorNotification(): Promise<void> {
    await this.dispatch('✂️ Scissor Gesture Detected!', 'Scissor / Victory hand sign recognized! ✌️', 'scissor', 'medium');
  }

  public async sendThumbsUpNotification(): Promise<void> {
    await this.dispatch('👍 Thumbs Up Detected!', 'Awesome! Keep up the great work! ✨', 'thumbs_up', 'success');
  }

  public async sendPalmNotification(): Promise<void> {
    await this.dispatch('👋 Wave / Open Palm Detected!', 'Hello! Hand wave recognized! 🖐️', 'palm', 'medium');
  }

  public async sendFistNotification(): Promise<void> {
    await this.dispatch('✊ Rock / Fist Detected!', 'Power sign recognized! Stay strong! 💥', 'fist', 'heavy');
  }
}

export const notificationService = new NotificationService();
