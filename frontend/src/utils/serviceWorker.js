// Service Worker Registration and Management
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

const SW_URL = '/sw.js';
const UPDATE_CHECK_INTERVAL = 60000; // Check for updates every minute

class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.updateCheckInterval = null;
    this.onUpdateAvailable = null;
    this.onOffline = null;
    this.onOnline = null;
  }

  // Register service worker
  async register() {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return false;
    }

    try {
      console.log('Registering Service Worker...');
      
      this.registration = await navigator.serviceWorker.register(SW_URL, {
        scope: '/',
      });

      console.log('Service Worker registered successfully');

      // Set up event listeners
      this.setupEventListeners();
      
      // Start checking for updates
      this.startUpdateChecking();

      // Handle initial installation
      if (this.registration.installing) {
        this.handleInstalling(this.registration.installing);
      }

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  // Set up event listeners
  setupEventListeners() {
    if (!this.registration) return;

    // Listen for updates
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration.installing;
      if (newWorker) {
        this.handleInstalling(newWorker);
      }
    });

    // Listen for controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker controller changed - reloading page');
      window.location.reload();
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleMessage(event.data);
    });

    // Network status listeners
    window.addEventListener('online', () => {
      console.log('Network: Back online');
      if (this.onOnline) this.onOnline();
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      console.log('Network: Gone offline');
      if (this.onOffline) this.onOffline();
    });
  }

  // Handle service worker installation
  handleInstalling(worker) {
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          // New update available
          console.log('New service worker update available');
          if (this.onUpdateAvailable) {
            this.onUpdateAvailable();
          }
        } else {
          // First installation
          console.log('Service worker installed for the first time');
        }
      }
    });
  }

  // Handle messages from service worker
  handleMessage(data) {
    const { type, payload } = data;

    switch (type) {
      case 'CACHE_UPDATED':
        console.log('Cache updated:', payload);
        break;
      case 'OFFLINE_READY':
        console.log('App ready for offline use');
        break;
      case 'UPDATE_AVAILABLE':
        if (this.onUpdateAvailable) {
          this.onUpdateAvailable();
        }
        break;
    }
  }

  // Start checking for updates periodically
  startUpdateChecking() {
    if (isLocalhost) return; // Skip in development

    this.updateCheckInterval = setInterval(() => {
      this.checkForUpdates();
    }, UPDATE_CHECK_INTERVAL);
  }

  // Check for service worker updates
  async checkForUpdates() {
    if (!this.registration) return;

    try {
      await this.registration.update();
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  }

  // Update service worker (skip waiting)
  updateServiceWorker() {
    if (!this.registration || !this.registration.waiting) return;

    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  // Unregister service worker
  async unregister() {
    if (!this.registration) return false;

    try {
      const result = await this.registration.unregister();
      console.log('Service Worker unregistered:', result);
      
      // Clear update interval
      if (this.updateCheckInterval) {
        clearInterval(this.updateCheckInterval);
      }

      return result;
    } catch (error) {
      console.error('Failed to unregister Service Worker:', error);
      return false;
    }
  }

  // Cache specific URLs
  cacheUrls(urls) {
    if (!this.registration || !this.registration.active) return;

    this.registration.active.postMessage({
      type: 'CACHE_URLS',
      payload: { urls }
    });
  }

  // Clear specific cache
  clearCache(cacheName) {
    if (!this.registration || !this.registration.active) return;

    this.registration.active.postMessage({
      type: 'CLEAR_CACHE',
      payload: { cacheName }
    });
  }

  // Sync offline data when back online
  async syncOfflineData() {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      return;
    }

    try {
      // Trigger background sync for cart data
      if ('sync' in window.ServiceWorkerRegistration.prototype) {
        await this.registration.sync.register('cart-sync');
        await this.registration.sync.register('order-sync');
      }
    } catch (error) {
      console.error('Background sync failed:', error);
    }
  }

  // Get cache storage usage
  async getCacheStorageUsage() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage,
          available: estimate.quota,
          percentage: (estimate.usage / estimate.quota) * 100
        };
      } catch (error) {
        console.error('Failed to get storage estimate:', error);
      }
    }
    return null;
  }

  // Set callback functions
  setCallbacks({ onUpdateAvailable, onOffline, onOnline }) {
    this.onUpdateAvailable = onUpdateAvailable;
    this.onOffline = onOffline;
    this.onOnline = onOnline;
  }

  // Check if app is running offline
  isOffline() {
    return !navigator.onLine;
  }

  // Get registration info
  getRegistrationInfo() {
    if (!this.registration) return null;

    return {
      scope: this.registration.scope,
      active: !!this.registration.active,
      installing: !!this.registration.installing,
      waiting: !!this.registration.waiting
    };
  }
}

// Create singleton instance
const serviceWorkerManager = new ServiceWorkerManager();

// Export functions for easy use
export const registerSW = () => serviceWorkerManager.register();
export const unregisterSW = () => serviceWorkerManager.unregister();
export const updateSW = () => serviceWorkerManager.updateServiceWorker();
export const cacheUrls = (urls) => serviceWorkerManager.cacheUrls(urls);
export const clearCache = (cacheName) => serviceWorkerManager.clearCache(cacheName);
export const getCacheUsage = () => serviceWorkerManager.getCacheStorageUsage();
export const setCallbacks = (callbacks) => serviceWorkerManager.setCallbacks(callbacks);
export const isOffline = () => serviceWorkerManager.isOffline();
export const getRegistrationInfo = () => serviceWorkerManager.getRegistrationInfo();

export default serviceWorkerManager;