import React from 'react';
import { motion } from 'framer-motion';

const Loader = ({ fullScreen = false, text = "Syncing Data..." }) => {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-6">
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-2 h-2 bg-indigo-600 rounded-full" />
        </motion.div>
      </div>
      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] animate-pulse">
        {text}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-[9999] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full py-20 flex items-center justify-center">
      {content}
    </div>
  );
};

export default Loader;
