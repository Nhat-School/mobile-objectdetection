import { Platform } from 'react-native';

/**
 * Service for dispatching instant local notifications and tactile haptics
 * when hand gestures (Finger Heart, Scissors) are recognized.
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

  /**
   * Dispatches a notification for Finger Heart gesture
   */
  public async sendHeartNotification(): Promise<void> {
    console.log('❤️ TRIGGER: Finger Heart Notification');

    // Haptic vibration
    try {
      if (this.hapticsModule) {
        await this.hapticsModule.notificationAsync(
          this.hapticsModule.NotificationFeedbackType.Success
        );
      }
    } catch (e) {}

    // System Notification banner
    try {
      if (this.notificationsModule && this.hasPermission) {
        await this.notificationsModule.scheduleNotificationAsync({
          content: {
            title: '❤️ Finger Heart Detected!',
            body: 'You created a heart gesture with your fingers! 💕',
            data: { gesture: 'finger_heart' },
            sound: true,
          },
          trigger: null, // trigger immediately
        });
      }
    } catch (e) {
      console.warn('Notification schedule error:', e);
    }
  }

  /**
   * Dispatches a notification for Scissor gesture
   */
  public async sendScissorNotification(): Promise<void> {
    console.log('✂️ TRIGGER: Scissor Gesture Notification');

    // Haptic vibration
    try {
      if (this.hapticsModule) {
        await this.hapticsModule.impactAsync(
          this.hapticsModule.ImpactFeedbackStyle.Medium
        );
      }
    } catch (e) {}

    // System Notification banner
    try {
      if (this.notificationsModule && this.hasPermission) {
        await this.notificationsModule.scheduleNotificationAsync({
          content: {
            title: '✂️ Scissor Gesture Detected!',
            body: 'Scissor / Victory sign recognized! ✌️',
            data: { gesture: 'scissor' },
            sound: true,
          },
          trigger: null, // trigger immediately
        });
      }
    } catch (e) {
      console.warn('Notification schedule error:', e);
    }
  }
}

export const notificationService = new NotificationService();
