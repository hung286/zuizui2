import { LearningMaterial } from '../types';

const DB_NAME = 'EduAppV31DB';
const DB_VERSION = 1;
const STORE_MATERIALS = 'materials';

class IndexedDBManager {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryFallback: LearningMaterial[] = [];

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB không được hỗ trợ trên trình duyệt này.'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result as IDBDatabase;
        if (!db.objectStoreNames.contains(STORE_MATERIALS)) {
          db.createObjectStore(STORE_MATERIALS, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event: any) => {
        resolve(event.target.result);
      };

      request.onerror = (event: any) => {
        console.error('IndexedDB error:', event.target.error);
        reject(event.target.error);
      };
    });

    return this.dbPromise;
  }

  public async getAllMaterials(): Promise<LearningMaterial[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_MATERIALS, 'readonly');
        const store = tx.objectStore(STORE_MATERIALS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback from localStorage
      try {
        const raw = localStorage.getItem('edu_materials_fallback_v31');
        if (raw) return JSON.parse(raw);
      } catch {}
      return this.memoryFallback;
    }
  }

  public async saveMaterial(material: LearningMaterial): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_MATERIALS, 'readwrite');
        const store = tx.objectStore(STORE_MATERIALS);
        const req = store.put(material);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const idx = this.memoryFallback.findIndex(m => m.id === material.id);
      if (idx >= 0) this.memoryFallback[idx] = material;
      else this.memoryFallback.unshift(material);
      try {
        localStorage.setItem('edu_materials_fallback_v31', JSON.stringify(this.memoryFallback));
      } catch {}
    }
  }

  public async deleteMaterial(id: string): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_MATERIALS, 'readwrite');
        const store = tx.objectStore(STORE_MATERIALS);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      this.memoryFallback = this.memoryFallback.filter(m => m.id !== id);
      try {
        localStorage.setItem('edu_materials_fallback_v31', JSON.stringify(this.memoryFallback));
      } catch {}
    }
  }

  public async clearAll(): Promise<void> {
    try {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_MATERIALS, 'readwrite');
        const store = tx.objectStore(STORE_MATERIALS);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      this.memoryFallback = [];
      try {
        localStorage.removeItem('edu_materials_fallback_v31');
      } catch {}
    }
  }
}

export const indexedDBManager = new IndexedDBManager();
