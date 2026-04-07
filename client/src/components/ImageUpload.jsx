import React, { useState, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FaUpload, FaLink, FaTimes, FaCloudUploadAlt, FaImage } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const ImageUpload = ({ 
    onUploadSuccess, 
    multiple = false, 
    label = "Upload Image",
    preview = null,
    className = "" 
}) => {
    const [isDragging, setIsSidebarDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [pastedUrl, setPastedUrl] = useState('');

    const handleFileUpload = async (files) => {
        if (!files || files.length === 0) return;
        
        setUploading(true);
        const uploadedUrls = [];

        try {
            for (const file of files) {
                const uploadData = new FormData();
                uploadData.append('image', file);
                
                const res = await api.post('/auth/upload', uploadData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                uploadedUrls.push(res.data.url);
            }

            if (multiple) {
                onUploadSuccess(uploadedUrls);
            } else {
                onUploadSuccess(uploadedUrls[0]);
            }
            toast.success(multiple ? `${uploadedUrls.length} images processed!` : "Photo optimized & uploaded!");
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Upload failed. Check your connection or file size.";
            toast.error(errorMsg);
            console.error("Upload error details:", error);
        } finally {
            setUploading(false);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsSidebarDragging(true);
        } else if (e.type === 'dragleave') {
            setIsSidebarDragging(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsSidebarDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files);
        }
    };

    const handleUrlSubmit = (e) => {
        e.preventDefault();
        if (!pastedUrl) return;
        if (multiple) {
            onUploadSuccess([pastedUrl]);
        } else {
            onUploadSuccess(pastedUrl);
        }
        setPastedUrl('');
        setShowUrlInput(false);
        toast.success("External link attached!");
    };

    return (
        <div className={`space-y-4 ${className}`}>
            <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative group border-2 border-dashed rounded-[2rem] transition-all duration-300 flex flex-col items-center justify-center p-8 min-h-[200px] text-center ${
                    isDragging 
                    ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]' 
                    : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-white'
                }`}
            >
                {uploading ? (
                    <div className="flex flex-col items-center gap-4 animate-pulse">
                        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Optimizing Assets...</p>
                    </div>
                ) : preview && !multiple ? (
                    <div className="relative group/preview">
                        <img src={preview} alt="Preview" className="w-32 h-32 rounded-2xl object-cover shadow-xl border-4 border-white" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                            <FaCloudUploadAlt className="text-white text-2xl" />
                        </div>
                        <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={(e) => handleFileUpload(e.target.files)}
                            accept="image/*"
                        />
                    </div>
                ) : (
                    <>
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-300 group-hover:text-indigo-500 group-hover:scale-110 transition-all mb-4">
                            <FaCloudUploadAlt size={32} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-600 uppercase tracking-widest">{label}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Drag & Drop or Click to Browse</p>
                        </div>
                        <input 
                            type="file" 
                            multiple={multiple}
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={(e) => handleFileUpload(e.target.files)}
                            accept="image/*"
                        />
                    </>
                )}
            </div>

            <div className="flex justify-center gap-4">
                <button 
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                >
                    <FaLink size={12} /> {showUrlInput ? 'Hide URL Input' : 'Paste Image Link'}
                </button>
            </div>

            <AnimatePresence>
                {showUrlInput && (
                    <motion.form 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onSubmit={handleUrlSubmit}
                        className="flex gap-2"
                    >
                        <input 
                            type="url" 
                            placeholder="https://images.unsplash.com/photo..."
                            className="flex-1 p-3 bg-slate-50 rounded-xl text-xs font-bold border-none focus:ring-2 focus:ring-indigo-100"
                            value={pastedUrl}
                            onChange={(e) => setPastedUrl(e.target.value)}
                            required
                        />
                        <button type="submit" className="p-3 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-colors">
                            <FaLink size={14} />
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ImageUpload;
