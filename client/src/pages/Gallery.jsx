import React from 'react';
import { motion } from 'framer-motion';

const Gallery = () => {
  const images = [
    { src: "https://images.unsplash.com/photo-1523050853063-9158a65d2057?auto=format&fit=crop&q=80&w=400", title: "Campus View" },
    { src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=400", title: "Classroom" },
    { src: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400", title: "Sports Day" },
    { src: "https://images.unsplash.com/photo-1577891729319-f4871c674d01?auto=format&fit=crop&q=80&w=400", title: "Lab Sessions" },
    { src: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=400", title: "Library" },
    { src: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&q=80&w=400", title: "Cultural Event" },
  ];

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold text-slate-800 mb-8 text-center">School Gallery</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {images.map((img, index) => (
            <motion.div 
              key={index}
              whileHover={{ scale: 1.02 }}
              className="relative group overflow-hidden rounded-2xl shadow-lg"
            >
              <img src={img.src} alt={img.title} className="w-full h-64 object-cover transition duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                <p className="text-white text-xl font-bold">{img.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Gallery;
