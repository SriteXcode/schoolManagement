import React from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaStar, FaMedal } from 'react-icons/fa';

const WallOfFame = () => {
  const honors = [
    { name: "John Doe", achievement: "Highest Scorer in Math", year: "2025", icon: <FaTrophy className="text-yellow-500" /> },
    { name: "Jane Smith", achievement: "Best Athlete of the Year", year: "2025", icon: <FaMedal className="text-slate-400" /> },
    { name: "Sam Wilson", achievement: "Art Excellence Award", year: "2024", icon: <FaStar className="text-orange-400" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold text-indigo-900 mb-8 text-center">Wall of Fame</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {honors.map((honor, index) => (
            <motion.div 
              key={index}
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-indigo-500 flex flex-col items-center text-center"
            >
              <div className="text-5xl mb-4">{honor.icon}</div>
              <h3 className="text-2xl font-bold text-gray-800">{honor.name}</h3>
              <p className="text-indigo-600 font-semibold">{honor.achievement}</p>
              <p className="text-gray-400 mt-2">Class of {honor.year}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WallOfFame;
