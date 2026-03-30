import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { Search, X, Calendar, Tag, Maximize2 } from 'lucide-react';

const Gallery = () => {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialCategory);
  const [selectedImg, setSelectedImg] = useState(null);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await api.get('/management/gallery/all');
        setItems(res.data);
      } catch (e) {} finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(filter.toLowerCase()) ||
    item.category.toLowerCase().includes(filter.toLowerCase())
  );

  const allImages = filteredItems.reduce((acc, item) => {
      const itemImages = item.images.map(url => ({
          url,
          title: item.title,
          category: item.category,
          date: item.date
      }));
      return [...acc, ...itemImages];
  }, []);

  if (loading) return <div className="p-20 text-center font-black text-gray-300 animate-pulse">DEVELOPING VISUAL ARCHIVES...</div>;

  return (
    <div className="min-h-screen bg-white p-4 md:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
            <h1 className="text-5xl font-black text-slate-900 tracking-tight">School Gallery</h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Capture • Commemorate • Celebrate</p>
        </div>

        <div className="max-w-xl mx-auto relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input 
                type="text" 
                placeholder="Search by event or category..."
                className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-[2rem] font-bold text-slate-700 focus:ring-4 focus:ring-indigo-50 transition-all outline-none shadow-sm"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
            />
            {filter && (
                <button onClick={() => setFilter('')} className="absolute right-5 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full text-slate-400">
                    <X size={16} />
                </button>
            )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {allImages.map((img, index) => (
            <motion.div 
              key={index}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -5 }}
              className="relative group cursor-pointer"
              onClick={() => setSelectedImg(img)}
            >
              <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-soft-xl border border-slate-100">
                <img src={img.url} alt={img.title} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-8">
                    <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-2">
                        <Tag size={12} /> {img.category}
                    </div>
                    <p className="text-white text-xl font-black leading-tight mb-4">{img.title}</p>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white/60 text-[10px] font-bold">
                            <Calendar size={12} /> {new Date(img.date).toLocaleDateString()}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                            <Maximize2 size={18} />
                        </div>
                    </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {allImages.length === 0 && (
            <div className="py-20 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                    <Maximize2 size={40} />
                </div>
                <p className="text-slate-400 font-bold italic">No snapshots found matching your search...</p>
            </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
          {selectedImg && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12"
                onClick={() => setSelectedImg(null)}
              >
                  <button className="absolute top-8 right-8 p-4 text-white/50 hover:text-white transition-colors">
                      <X size={32} />
                  </button>
                  
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="max-w-5xl w-full flex flex-col md:flex-row gap-8 items-center"
                    onClick={e => e.stopPropagation()}
                  >
                      <div className="flex-1 rounded-[3rem] overflow-hidden shadow-2xl">
                          <img src={selectedImg.url} alt={selectedImg.title} className="w-full max-h-[70vh] object-contain bg-black/20" />
                      </div>
                      <div className="md:w-80 text-left space-y-6">
                          <div>
                              <span className="px-3 py-1 bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">{selectedImg.category}</span>
                              <h2 className="text-3xl font-black text-white mt-4 tracking-tight">{selectedImg.title}</h2>
                          </div>
                          <div className="space-y-4">
                              <div className="flex items-center gap-3 text-white/60">
                                  <Calendar size={18} className="text-indigo-400" />
                                  <span className="font-bold text-sm">{new Date(selectedImg.date).toDateString()}</span>
                              </div>
                              <p className="text-white/40 text-sm leading-relaxed font-medium">This visual record is part of our official institutional archives.</p>
                          </div>
                          <button onClick={() => setSelectedImg(null)} className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all">Close Viewer</button>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
