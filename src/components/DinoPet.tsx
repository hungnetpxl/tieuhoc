import React from 'react';
import { motion } from 'framer-motion';

interface DinoPetProps {
  state?: 'normal' | 'cheering' | 'sad' | 'thinking';
  color?: string;
  hat?: string;
  size?: number;
  className?: string;
}

export const DinoPet: React.FC<DinoPetProps> = ({
  state = 'normal',
  color = 'green',
  hat = 'none',
  size = 180,
  className = ''
}) => {
  
  // Bản đồ màu sắc khủng long cực kỳ dễ thương
  const bodyColors: Record<string, string> = {
    green: '#58cc02', // Xanh lá
    blue: '#1cb0f6',  // Xanh dương
    pink: '#ff85c0',  // Hồng kẹo ngọt
    yellow: '#ffc800' // Vàng chuối
  };

  const bellyColors: Record<string, string> = {
    green: '#a0e75a',
    blue: '#82d7ff',
    pink: '#ffb3d9',
    yellow: '#ffe380'
  };

  const spikeColors: Record<string, string> = {
    green: '#46a302',
    blue: '#1899d6',
    pink: '#cc3380',
    yellow: '#e6b400'
  };

  const activeColor = bodyColors[color] || bodyColors.green;
  const activeBelly = bellyColors[color] || bellyColors.green;
  const activeSpike = spikeColors[color] || spikeColors.green;

  // Animation variants của Khủng long
  const petAnimations = {
    normal: {
      y: [0, -5, 0],
      rotate: [0, 1, -1, 0],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        ease: 'easeInOut' as const
      }
    },
    cheering: {
      y: [0, -25, 0, -20, 0],
      scaleY: [1, 0.85, 1.1, 0.95, 1],
      scaleX: [1, 1.1, 0.9, 1.05, 1],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: 'easeInOut' as const
      }
    },
    sad: {
      x: [0, -2, 2, -2, 2, 0],
      y: [0, 4, 0],
      rotate: [-2, 2, -2],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut' as const
      }
    },
    thinking: {
      rotate: [-5, 8, -5],
      y: [0, -2, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut' as const
      }
    }
  };

  // Vị trí vẽ mắt và biểu cảm miệng tương ứng
  const renderFace = () => {
    switch (state) {
      case 'cheering':
        return (
          <>
            {/* Hai mắt nhắm lại cười híp hình cong chữ V ngược */}
            <path d="M 60 70 Q 70 60 80 70" stroke="#3c3c3c" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M 100 70 Q 110 60 120 70" stroke="#3c3c3c" strokeWidth="6" fill="none" strokeLinecap="round" />
            {/* Miệng cười há cực to */}
            <path d="M 75 88 Q 90 108 105 88 Z" fill="#ff4b4b" stroke="#3c3c3c" strokeWidth="4" />
          </>
        );
      case 'sad':
        return (
          <>
            {/* Mắt buồn rưng lệ */}
            <circle cx="70" cy="70" r="8" fill="#3c3c3c" />
            <circle cx="110" cy="70" r="8" fill="#3c3c3c" />
            {/* Giọt nước mắt nhỏ */}
            <path d="M 64 74 Q 60 85 64 85 Q 68 85 66 74 Z" fill="#1cb0f6" />
            {/* Miệng mếu */}
            <path d="M 80 92 Q 90 82 100 92" stroke="#3c3c3c" strokeWidth="5" fill="none" strokeLinecap="round" />
          </>
        );
      case 'thinking':
        return (
          <>
            {/* Một mắt to một mắt nheo nghi ngờ */}
            <circle cx="70" cy="70" r="9" fill="#3c3c3c" />
            <line x1="102" y1="70" x2="118" y2="70" stroke="#3c3c3c" strokeWidth="6" strokeLinecap="round" />
            {/* Miệng suy nghĩ nghiêng một bên */}
            <path d="M 82 90 Q 92 88 98 94" stroke="#3c3c3c" strokeWidth="5" fill="none" strokeLinecap="round" />
          </>
        );
      case 'normal':
      default:
        return (
          <>
            {/* Hai mắt đen tròn lấp lánh */}
            <circle cx="70" cy="70" r="8" fill="#3c3c3c" />
            <circle cx="70" cy="67" r="2.5" fill="white" />
            <circle cx="110" cy="70" r="8" fill="#3c3c3c" />
            <circle cx="110" cy="67" r="2.5" fill="white" />
            {/* Miệng cười mỉm đáng yêu */}
            <path d="M 82 86 Q 90 94 98 86" stroke="#3c3c3c" strokeWidth="5" fill="none" strokeLinecap="round" />
          </>
        );
    }
  };

  // Vẽ phụ kiện nón (Hats)
  const renderHat = () => {
    switch (hat) {
      case 'cap': // Nón lưỡi trai đỏ cá tính
        return (
          <g transform="translate(45, 10)">
            <path d="M 10 30 Q 45 -5 80 30" fill="#ff4b4b" stroke="#3c3c3c" strokeWidth="4" />
            <path d="M 65 24 Q 105 18 105 32 Q 75 38 65 24 Z" fill="#ff4b4b" stroke="#3c3c3c" strokeWidth="4" />
            <circle cx="45" cy="4" r="5" fill="#ffc800" stroke="#3c3c3c" strokeWidth="3" />
          </g>
        );
      case 'crown': // Vương miện hoàng gia lấp lánh
        return (
          <g transform="translate(55, 0)">
            <path d="M 10 35 L 5 15 L 25 25 L 35 5 L 45 25 L 65 15 L 60 35 Z" fill="#ffc800" stroke="#3c3c3c" strokeWidth="4" strokeLinejoin="miter" />
            <circle cx="5" cy="12" r="3" fill="#ff4b4b" />
            <circle cx="35" cy="2" r="3" fill="#1cb0f6" />
            <circle cx="65" cy="12" r="3" fill="#ff4b4b" />
          </g>
        );
      case 'wizard': // Nón phù thủy ma thuật
        return (
          <g transform="translate(42, -10)">
            <path d="M 10 45 L 45 0 L 80 45 Z" fill="#4b4b8b" stroke="#3c3c3c" strokeWidth="4" />
            <ellipse cx="45" cy="45" rx="50" ry="10" fill="#4b4b8b" stroke="#3c3c3c" strokeWidth="4" />
            <path d="M 17 40 L 73 40" stroke="#ffc800" strokeWidth="6" />
            {/* Ngôi sao lấp lánh */}
            <text x="35" y="32" fill="#ffc800" fontSize="12">★</text>
          </g>
        );
      case 'cowboy': // Nón cowboy miền tây hoang dã
        return (
          <g transform="translate(40, 5)">
            <path d="M 15 30 Q 45 10 75 30 L 70 15 Q 45 -5 20 15 Z" fill="#c49a6c" stroke="#3c3c3c" strokeWidth="4" />
            <path d="M -5 32 Q 45 18 95 32 Q 45 42 -5 32 Z" fill="#a47a4c" stroke="#3c3c3c" strokeWidth="4" />
            <path d="M 18 24 Q 45 18 72 24" stroke="#ff4b4b" strokeWidth="3" />
          </g>
        );
      case 'none':
      default:
        return null;
    }
  };

  return (
    <div className={`relative select-none flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      
      {/* Vòng hào quang sáng phía sau khi Pet vui mừng */}
      {state === 'cheering' && (
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 bg-yellow-300/30 rounded-full blur-2xl"
        />
      )}

      {/* SVG Mascot chính */}
      <motion.svg
        viewBox="0 0 180 180"
        className="w-full h-full"
        animate={state}
        variants={petAnimations}
      >
        <g id="pet-shadow" transform="translate(0, 10)">
          {/* Bóng đổ dưới chân */}
          <ellipse cx="90" cy="165" rx="55" ry="12" fill="#e5e5e5" />
        </g>

        {/* Khúc đuôi */}
        <path d="M 125 125 Q 165 125 155 105 Q 145 95 120 115 Z" fill={activeColor} stroke="#3c3c3c" strokeWidth="5.5" />

        {/* Gai rồng trên đuôi */}
        <path d="M 148 102 L 158 92 L 152 110 Z" fill={activeSpike} stroke="#3c3c3c" strokeWidth="3.5" />

        {/* Gai rồng trên lưng (Spikes) */}
        <g id="spikes">
          <path d="M 115 50 L 128 40 L 125 60 Z" fill={activeSpike} stroke="#3c3c3c" strokeWidth="4" />
          <path d="M 125 75 L 140 68 L 133 88 Z" fill={activeSpike} stroke="#3c3c3c" strokeWidth="4" />
          <path d="M 128 100 L 143 95 L 134 110 Z" fill={activeSpike} stroke="#3c3c3c" strokeWidth="4" />
        </g>

        {/* Thân Khủng long tròn ú nu */}
        <rect x="40" y="45" width="90" height="110" rx="45" fill={activeColor} stroke="#3c3c3c" strokeWidth="5.5" />

        {/* Bụng tròn dễ thương màu pastel */}
        <ellipse cx="78" cy="115" rx="28" ry="34" fill={activeBelly} />

        {/* Tay trái nhỏ nhắn */}
        <motion.path
          animate={state === 'cheering' ? { rotate: [-10, 40, -10] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
          d="M 42 100 Q 22 95 32 88 Q 42 85 45 95 Z" 
          fill={activeColor} 
          stroke="#3c3c3c" 
          strokeWidth="4" 
        />

        {/* Tay phải */}
        <motion.path
          animate={state === 'cheering' ? { rotate: [10, -40, 10] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
          d="M 118 100 Q 138 95 128 88 Q 118 85 115 95 Z" 
          fill={activeColor} 
          stroke="#3c3c3c" 
          strokeWidth="4" 
        />

        {/* Chân trái */}
        <path d="M 52 145 Q 40 162 58 162 Q 70 162 65 145 Z" fill={activeColor} stroke="#3c3c3c" strokeWidth="5" />

        {/* Chân phải */}
        <path d="M 108 145 Q 120 162 102 162 Q 90 162 95 145 Z" fill={activeColor} stroke="#3c3c3c" strokeWidth="5" />

        {/* Mặt (Mắt, miệng nhấp nháy, biểu cảm) */}
        <g id="pet-face">
          {renderFace()}
        </g>

        {/* Má hồng hào rực rỡ */}
        <ellipse cx="58" cy="80" rx="7" ry="4" fill="#ff4b4b" opacity="0.35" />
        <ellipse cx="122" cy="80" rx="7" ry="4" fill="#ff4b4b" opacity="0.35" />

        {/* Mũ phụ kiện (Vương miện, nón phù thủy...) được render phía trên cùng */}
        <g id="pet-accessory">
          {renderHat()}
        </g>
      </motion.svg>
    </div>
  );
};
export default DinoPet;
