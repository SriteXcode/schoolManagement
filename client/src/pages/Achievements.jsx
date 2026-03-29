import React from 'react';
import { motion } from 'framer-motion';
import { FaAward, FaCertificate, FaGlobe } from 'react-icons/fa';

const Achievements = () => {
  const achievements = [
    { title: "Inter-School Science Fair", desc: "First place in the regional science exhibition.", date: "March 2025", icon: <FaAward /> },
    { title: "National Level Debate", desc: "Runner up in the national debating championship.", date: "January 2025", icon: <FaCertificate /> },
    { title: "Green Campus Award", desc: "Recognized for our environmental sustainability efforts.", date: "December 2024", icon: <FaGlobe /> },
  ];

  return (
    <div className="min-h-screen bg-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-indigo-900 mb-12 text-center">Our Achievements</h1>
        <div className="space-y-6">
          {achievements.map((item, index) => (
            <motion.div 
              key={index}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-6 rounded-xl shadow-md flex items-start gap-6"
            >
              <div className="p-4 bg-indigo-100 rounded-full text-indigo-600 text-3xl">
                {item.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">{item.title}</h3>
                <p className="text-gray-600 mb-2">{item.desc}</p>
                <span className="text-sm font-semibold text-indigo-400">{item.date}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Achievements;
