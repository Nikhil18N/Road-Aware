/**
 * Offline Sync Service
 * Handles storing and syncing complaint data when the user is offline
 */

const DB_NAME = 'RoadAwareDB';
const STORE_NAME = 'pending_complaints';
const DB_VERSION = 1;

interface PendingComplaint {
  id: string;
  latitude: number;
  longitude: number;
  description?: string;
  name?: string;
  phone?: string;
  email?: string;
  imageData: string; // Base64 encoded image
  imageName: string;
  timestamp: number;
  synced: boolean;
}

class OfflineSyncService {
  private db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB
   */
  async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('synced', 'synced', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Get or initialize database
   */
  async getDB(): Promise<IDBDatabase> {
    if (!this.db) {
      this.db = await this.initDB();
    }
    return this.db;
  }

  /**
   * Save a pending complaint
   */
  async savePendingComplaint(complaint: Omit<PendingComplaint, 'id' | 'timestamp' | 'synced'>): Promise<string> {
    const db = await this.getDB();
    const id = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const complaintData: PendingComplaint = {
      ...complaint,
      id,
      timestamp: Date.now(),
      synced: false,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(complaintData);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(`✓ Complaint ${id} saved to offline storage`);
        resolve(id);
      };
    });
  }

  /**
   * Get all pending complaints
   */
  async getPendingComplaints(): Promise<PendingComplaint[]> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('synced');
      const request = index.getAll(false);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Mark complaint as synced
   */
  async markAsSynced(complaintId: string): Promise<void> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(complaintId);

      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => {
        const complaint = getRequest.result;
        if (complaint) {
          complaint.synced = true;
          const updateRequest = store.put(complaint);

          updateRequest.onerror = () => reject(updateRequest.error);
          updateRequest.onsuccess = () => {
            console.log(`✓ Complaint ${complaintId} marked as synced`);
            resolve();
          };
        } else {
          resolve();
        }
      };
    });
  }

  /**
   * Delete synced complaint
   */
  async deleteSyncedComplaint(complaintId: string): Promise<void> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(complaintId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(`✓ Complaint ${complaintId} deleted from offline storage`);
        resolve();
      };
    });
  }

  /**
   * Sync pending complaints when online
   */
  async syncPendingComplaints(apiBaseURL: string): Promise<{ success: number; failed: number }> {
    const pendingComplaints = await this.getPendingComplaints();

    if (pendingComplaints.length === 0) {
      console.log('No pending complaints to sync');
      return { success: 0, failed: 0 };
    }

    console.log(`Syncing ${pendingComplaints.length} offline complaints...`);

    let successCount = 0;
    let failureCount = 0;

    for (const complaint of pendingComplaints) {
      try {
        // Convert base64 to blob
        const response = await fetch(complaint.imageData);
        const blob = await response.blob();

        // Create form data
        const formData = new FormData();
        formData.append('latitude', complaint.latitude.toString());
        formData.append('longitude', complaint.longitude.toString());
        formData.append('description', complaint.description || '');
        formData.append('name', complaint.name || '');
        formData.append('phone', complaint.phone || '');
        formData.append('email', complaint.email || '');
        formData.append('image', blob, complaint.imageName);

        // Submit to server
        const submitResponse = await fetch(`${apiBaseURL}/api/complaints`, {
          method: 'POST',
          body: formData,
        });

        if (submitResponse.ok) {
          await this.deleteSyncedComplaint(complaint.id);
          successCount++;
          console.log(`✓ Synced complaint: ${complaint.id}`);

          // Notify user
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Report Synced', {
              body: `Your offline report has been successfully submitted to the server.`,
            });
          }
        } else {
          failureCount++;
          console.error(`✗ Failed to sync complaint: ${complaint.id}`);
        }
      } catch (error) {
        failureCount++;
        console.error(`Error syncing complaint ${complaint.id}:`, error);
      }
    }

    console.log(`Sync complete: ${successCount} succeeded, ${failureCount} failed`);
    return { success: successCount, failed: failureCount };
  }

  /**
   * Get summary of offline data
   */
  async getOfflineStats(): Promise<{ totalPending: number; totalSize: string }> {
    const complaints = await this.getPendingComplaints();
    let totalSize = 0;

    for (const complaint of complaints) {
      totalSize += complaint.imageData.length;
    }

    return {
      totalPending: complaints.length,
      totalSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
    };
  }
}

// Export singleton instance
export const offlineSyncService = new OfflineSyncService();

// Auto-sync when connection is restored
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    console.log('✓ Connection restored. Syncing offline complaints...');
    try {
      const baseURL = window.location.origin;
      const result = await offlineSyncService.syncPendingComplaints(baseURL);

      if (result.success > 0) {
        console.log(`✓ Successfully synced ${result.success} complaints`);
      }
      if (result.failed > 0) {
        console.warn(`⚠ Failed to sync ${result.failed} complaints. Will retry later.`);
      }
    } catch (error) {
      console.error('Error during auto-sync:', error);
    }
  });
}
