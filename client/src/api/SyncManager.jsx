import React, { useEffect, useState } from 'react';
import axios from './axios'; // Using our intercepted api instance
import { getSyncQueue, removeFromSyncQueue } from './offlineStore';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudLightning, RefreshCw, Wifi, WifiOff } from 'lucide-react';

const SyncManager = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkQueue = async () => {
    const queue = await getSyncQueue();
    setPendingCount(queue.length);
  };

  const processQueue = async () => {
    const queue = await getSyncQueue();
    if (queue.length === 0) return;

    setIsSyncing(true);
    let successCount = 0;
    
    toast.loading(`Syncing ${queue.length} offline actions...`, { id: 'sync-status' });

    for (const item of queue) {
      try {
        // Use raw axios to avoid infinite loop or use the instance but skip the interceptor logic if possible
        // Actually, our instance is fine as long as it's online.
        await axios({
          url: item.url,
          method: item.method,
          data: item.data
        });
        await removeFromSyncQueue(item.id);
        successCount++;
      } catch (err) {
        console.error("Failed to sync item", item, err);
        // If it fails while online, it might be a validation error. 
        // We might want to remove it anyway or keep it. For now, keep it to retry.
      }
    }

    setIsSyncing(false);
    checkQueue();
    
    if (successCount > 0) {
      toast.success(`Successfully synced ${successCount} actions!`, { id: 'sync-status' });
      // Refresh the page or trigger a global state update to show new data
      setTimeout(() => window.location.reload(), 1500);
    } else {
      toast.dismiss('sync-status');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-rose-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-white/20 backdrop-blur-md"
          >
            <WifiOff size={18} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">Offline Mode Active</span>
          </motion.div>
        )}

        {pendingCount > 0 && isOnline && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-white/20 pointer-events-auto cursor-pointer"
            onClick={processQueue}
          >
            {isSyncing ? <RefreshCw size={18} className="animate-spin" /> : <CloudLightning size={18} />}
            <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest leading-none">{isSyncing ? 'Syncing...' : 'Pending Actions'}</p>
                <p className="text-[8px] font-bold opacity-70 uppercase mt-1">{pendingCount} updates waiting to upload</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SyncManager;
