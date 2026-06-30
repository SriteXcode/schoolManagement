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
        // Parse data if it is a string representation of JSON
        let requestData = item.data;
        if (typeof requestData === 'string') {
          try {
            requestData = JSON.parse(requestData);
          } catch (_) {}
        }

        await axios({
          url: item.url,
          method: item.method,
          data: requestData
        });
        await removeFromSyncQueue(item.id);
        successCount++;
      } catch (err) {
        console.error("Failed to sync item", item, err);
        // If it fails with a 4xx error (permanent client validation/auth error), discard it to avoid blocking the queue
        if (err.response && err.response.status >= 400 && err.response.status < 500) {
          await removeFromSyncQueue(item.id);
          toast.error(`Removed invalid action (${err.response.status}) from offline sync queue.`, { id: `sync-err-${item.id}` });
        }
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
