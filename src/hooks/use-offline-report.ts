import { useState, useCallback } from 'react';
import { offlineSyncService } from '@/services/offline-sync';

export const useOfflineReport = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isOfflineSyncing, setIsOfflineSyncing] = useState(false);

  // Monitor online/offline status
  useState(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  });

  /**
   * Save complaint for offline submission
   */
  const saveOfflineComplaint = useCallback(
    async (
      latitude: number,
      longitude: number,
      description: string | undefined,
      name: string | undefined,
      phone: string | undefined,
      email: string | undefined,
      imageFile: File
    ) => {
      try {
        // Convert image to base64
        const reader = new FileReader();
        return new Promise<string>((resolve, reject) => {
          reader.onload = async () => {
            try {
              const complaintId = await offlineSyncService.savePendingComplaint({
                latitude,
                longitude,
                description,
                name,
                phone,
                email,
                imageData: reader.result as string,
                imageName: imageFile.name,
              });
              resolve(complaintId);
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(imageFile);
        });
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : 'Failed to save offline complaint'
        );
      }
    },
    []
  );

  /**
   * Manually sync pending complaints
   */
  const syncComplaints = useCallback(async () => {
    if (!isOnline) {
      throw new Error('No internet connection available');
    }

    setIsOfflineSyncing(true);
    try {
      const baseURL = window.location.origin;
      const result = await offlineSyncService.syncPendingComplaints(baseURL);
      return result;
    } finally {
      setIsOfflineSyncing(false);
    }
  }, [isOnline]);

  /**
   * Get offline stats
   */
  const getOfflineStats = useCallback(async () => {
    return offlineSyncService.getOfflineStats();
  }, []);

  return {
    isOnline,
    isOfflineSyncing,
    saveOfflineComplaint,
    syncComplaints,
    getOfflineStats,
  };
};
