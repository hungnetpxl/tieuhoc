import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress?: number; // 0 to 100
  current?: number;
  total?: number;
  color?: 'green' | 'blue' | 'yellow' | 'orange';
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  current = 0,
  total = 0,
  color = 'green',
  size = 'md'
}) => {
  // Tính tỷ lệ phần trăm tiến trình
  const percentage = progress !== undefined
    ? Math.max(0, Math.min(100, progress))
    : total > 0 ? Math.max(0, Math.min(100, (current / total) * 100)) : 0;

  const colors = {
    green: 'bg-[#58cc02]',
    blue: 'bg-[#1cb0f6]',
    yellow: 'bg-[#ffc800]',
    orange: 'bg-[#ff9600]'
  };

  const sizes = {
    sm: 'h-3 rounded-full',
    md: 'h-5 rounded-full',
    lg: 'h-7 rounded-[1rem]'
  };

  return (
    <div className={`w-full bg-[#e5e5e5] ${sizes[size]} relative overflow-hidden shadow-inner`}>
      {/* Thanh tiến độ chuyển động mượt */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ type: 'spring', stiffness: 80, damping: 15 }}
        className={`h-full ${colors[color]} relative rounded-full`}
      >
        {/* Phủ bóng sáng 3D bóng bẩy phía trên (Glossy effect) */}
        <div className="absolute top-1 left-2 right-2 h-1 bg-white/30 rounded-full" />
      </motion.div>
    </div>
  );
};
export default ProgressBar;
