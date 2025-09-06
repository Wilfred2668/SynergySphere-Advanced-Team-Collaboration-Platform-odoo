import React from 'react';
import { motion } from 'framer-motion';

export const ProjectDetail: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold text-gray-900">Project Detail</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Detail Coming Soon</h2>
        <p className="text-gray-600">Detailed project view will be available here.</p>
      </div>
    </motion.div>
  );
};
