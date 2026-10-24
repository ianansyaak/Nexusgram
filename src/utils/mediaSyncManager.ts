// Media Sync & Background Recovery Manager for NexusGram

export interface PendingMediaItem {
  id: string;
  url: string;
  name: string;
  type: "photo" | "voice" | "video" | "document" | "avatar";
  totalBytes: number;
  loadedBytes: number;
  status: "pending" | "downloading" | "completed" | "failed";
  error?: string;
  timestamp: number;
  interruptedFromPreviousSession?: boolean;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

class MediaSyncManager {
  private queue: Map<string, PendingMediaItem> = new Map();
  private listeners: Set<(state: MediaSyncState) => void> = new Set();
  private isProcessing = false;
  private maxConcurrent = 2;
  private activeDownloads = 0;

  constructor() {
    this.restoreFromStorage();
  }

  private restoreFromStorage() {
    try {
      const raw = localStorage.getItem("nexus_pending_media_queue");
      if (raw) {
        const items: PendingMediaItem[] = JSON.parse(raw);
        items.forEach(item => {
          if (item.status === "downloading" || item.status === "pending") {
            // Interrupted download from previous session when user exited the app!
            item.status = "pending";
            item.interruptedFromPreviousSession = true;
          }
          if (item.status === "pending" || item.status === "failed") {
            this.queue.set(item.id, item);
          }
        });
      }
    } catch (e) {}
    this.notify();
    setTimeout(() => this.processQueue(), 1500);
  }

  private saveToStorage() {
    try {
      const items = Array.from(this.queue.values());
      localStorage.setItem("nexus_pending_media_queue", JSON.stringify(items));
    } catch (e) {}
  }

  public enqueueMedia(item: {
    id: string;
    url: string;
    name: string;
    type: "photo" | "voice" | "video" | "document" | "avatar";
    sizeEstimate?: number;
  }) {
    if (this.queue.has(item.id)) return;

    this.queue.set(item.id, {
      id: item.id,
      url: item.url,
      name: item.name,
      type: item.type,
      totalBytes: item.sizeEstimate || 1024 * 350,
      loadedBytes: 0,
      status: "pending",
      timestamp: Date.now()
    });

    this.saveToStorage();
    this.notify();
    this.processQueue();
  }

  public retryFailed() {
    this.queue.forEach(item => {
      if (item.status === "failed") {
        item.status = "pending";
      }
    });
    this.saveToStorage();
    this.notify();
    this.processQueue();
  }

  public clearCompleted() {
    for (const [id, item] of this.queue.entries()) {
      if (item.status === "completed") {
        this.queue.delete(id);
      }
    }
    this.saveToStorage();
    this.notify();
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const pendingItems = Array.from(this.queue.values()).filter(
        item => item.status === "pending"
      );

      for (const item of pendingItems) {
        if (this.activeDownloads >= this.maxConcurrent) break;

        this.activeDownloads++;
        item.status = "downloading";
        this.notify();

        this.downloadItem(item).finally(() => {
          this.activeDownloads--;
          this.notify();
          this.processQueue();
        });
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async downloadItem(item: PendingMediaItem) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);

      const response = await fetch(item.url, {
        signal: controller.signal,
        cache: "force-cache"
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentLength = response.headers.get("content-length");
      if (contentLength) {
        item.totalBytes = parseInt(contentLength, 10);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        const blob = await response.blob();
        item.loadedBytes = blob.size;
        item.totalBytes = blob.size;
      } else {
        let receivedBytes = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          receivedBytes += value.length;
          item.loadedBytes = receivedBytes;
          this.notify();
        }
      }

      item.status = "completed";
      this.saveToStorage();
      // Remove completed item after 4 seconds to clean up
      setTimeout(() => {
        this.queue.delete(item.id);
        this.saveToStorage();
        this.notify();
      }, 4000);
    } catch (err: any) {
      item.status = "failed";
      item.error = err.message || "Ошибка загрузки";
      this.saveToStorage();
    }
  }

  public getState(): MediaSyncState {
    const all = Array.from(this.queue.values());
    const active = all.filter(i => i.status === "downloading");
    const pending = all.filter(i => i.status === "pending" || i.status === "downloading");
    const failed = all.filter(i => i.status === "failed");
    const interrupted = all.filter(i => i.interruptedFromPreviousSession);

    const totalBytes = pending.reduce((acc, i) => acc + i.totalBytes, 0);
    const loadedBytes = pending.reduce((acc, i) => acc + i.loadedBytes, 0);
    const progressPercent = totalBytes > 0 ? Math.min(100, Math.round((loadedBytes / totalBytes) * 100)) : 0;

    return {
      isDownloading: active.length > 0,
      activeCount: active.length,
      pendingCount: pending.length,
      failedCount: failed.length,
      interruptedCount: interrupted.length,
      totalBytes,
      loadedBytes,
      progressPercent,
      items: all
    };
  }

  public subscribe(listener: (state: MediaSyncState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach(fn => fn(state));
  }
}

export interface MediaSyncState {
  isDownloading: boolean;
  activeCount: number;
  pendingCount: number;
  failedCount: number;
  interruptedCount: number;
  totalBytes: number;
  loadedBytes: number;
  progressPercent: number;
  items: PendingMediaItem[];
}

export const mediaSync = new MediaSyncManager();
