// Push Notification Utility for Passenger Application

export class PushNotificationService {
  private static instance: PushNotificationService;
  private swRegistration: ServiceWorkerRegistration | null = null;

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  // Check if push notifications are supported
  static isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  // Get current permission status
  static getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!PushNotificationService.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  // Register service worker
  async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported');
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      this.swRegistration = registration;
      console.log('Service Worker registered successfully');
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  // Subscribe to push notifications
  async subscribe(userId: string): Promise<PushSubscription | null> {
    try {
      // Register service worker if not already registered
      if (!this.swRegistration) {
        this.swRegistration = await this.registerServiceWorker();
      }

      // Request permission if not granted
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Push notification permission denied');
      }

      // Check if already subscribed
      const existingSubscription = await this.swRegistration.pushManager.getSubscription();
      if (existingSubscription) {
        // Send existing subscription to server
        await this.sendSubscriptionToServer(existingSubscription, userId);
        return existingSubscription;
      }

      // Create new subscription
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        )
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription, userId);

      console.log('Push subscription successful');
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(userId: string): Promise<void> {
    try {
      if (!this.swRegistration) {
        this.swRegistration = await navigator.serviceWorker.getRegistration('/sw.js') || null;
      }

      if (!this.swRegistration) {
        console.log('No service worker registration found');
        return;
      }

      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscriptionFromServer(userId, subscription.endpoint);
        console.log('Push unsubscription successful');
      }
    } catch (error) {
      console.error('Push unsubscription failed:', error);
      throw error;
    }
  }

  // Send subscription to server
  private async sendSubscriptionToServer(subscription: PushSubscription, userId: string): Promise<void> {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
              auth: this.arrayBufferToBase64(subscription.getKey('auth'))
            }
          },
          userId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }

      console.log('Subscription sent to server successfully');
    } catch (error) {
      console.error('Error sending subscription to server:', error);
      throw error;
    }
  }

  // Remove subscription from server
  private async removeSubscriptionFromServer(userId: string, endpoint: string): Promise<void> {
    try {
      const response = await fetch(`/api/push/subscribe?userId=${userId}&endpoint=${encodeURIComponent(endpoint)}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to remove subscription from server');
      }

      console.log('Subscription removed from server successfully');
    } catch (error) {
      console.error('Error removing subscription from server:', error);
      throw error;
    }
  }

  // Utility function to convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Utility function to convert ArrayBuffer to base64
  private arrayBufferToBase64(buffer: ArrayBuffer | null): string {
    if (!buffer) return '';
    
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Check subscription status
  async getSubscriptionStatus(): Promise<{
    isSubscribed: boolean;
    subscription: PushSubscription | null;
  }> {
    try {
      if (!this.swRegistration) {
        this.swRegistration = await navigator.serviceWorker.getRegistration('/sw.js') || null;
      }

      if (!this.swRegistration) {
        return { isSubscribed: false, subscription: null };
      }

      const subscription = await this.swRegistration.pushManager.getSubscription();
      return {
        isSubscribed: !!subscription,
        subscription
      };
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return { isSubscribed: false, subscription: null };
    }
  }

  // Show a test notification
  async showTestNotification(): Promise<void> {
    if (!('Notification' in window)) {
      throw new Error('Notifications are not supported');
    }

    if (Notification.permission === 'granted') {
      new Notification('TMS Test Notification', {
        body: 'Push notifications are working correctly!',
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    } else {
      throw new Error('Notification permission not granted');
    }
  }
}

// Singleton instance
export const pushNotificationService = PushNotificationService.getInstance(); 