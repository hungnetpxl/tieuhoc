import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiEffectProps {
  active: boolean;
}

interface Particle {
  id: number;
  emoji: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color?: string;
}

const EMOJIS = ['🌟', '⭐', '🎉', '✨', '🎈', '🍭', '🍬', '🌸', '🦖', '🍎', '🍌'];
const COLORS = ['#ff4b4b', '#58cc02', '#1cb0f6', '#ffc800', '#ff9600', '#cc3380', '#24bfff'];

export const ConfettiEffect: React.FC<ConfettiEffectProps> = ({ active }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (active) {
      // Sinh 50 hạt pháo bông rực rỡ
      const newParticles = Array.from({ length: 45 }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 100 + Math.random() * 250;
        
        return {
          id: Date.now() + i,
          // 65% là Emojis dễ thương, 35% là các ngôi sao/vòng tròn màu pastel
          emoji: Math.random() > 0.4 
            ? EMOJIS[Math.floor(Math.random() * EMOJIS.length)] 
            : '',
          // Tọa độ bắn tung tóe từ trung tâm
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed - (100 + Math.random() * 150),
          rotation: Math.random() * 360,
          scale: 0.5 + Math.random() * 1.2,
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
        };
      });

      setParticles(newParticles);

      // Tự động làm sạch các hạt sau 2 giây để giải phóng bộ nhớ
      const timer = setTimeout(() => {
        setParticles([]);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [active]);

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden flex items-center justify-center">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: 0, y: 150, scale: 0, opacity: 1, rotate: 0 }}
            animate={{
              x: p.x,
              y: p.y,
              scale: p.scale,
              rotate: p.rotation + 720,
              opacity: [1, 1, 0.8, 0],
              // Trọng lực rơi nhẹ ở cuối
              transition: {
                duration: 1.6,
                ease: [0.1, 0.8, 0.25, 1], // easeOutExpo
              }
            }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute' }}
          >
            {p.emoji ? (
              <span style={{ fontSize: `${24 * p.scale}px` }}>{p.emoji}</span>
            ) : (
              // Nếu không phải emoji, vẽ hạt bụi màu lấp lánh
              <div 
                className="rounded-full shadow-lg"
                style={{
                  width: `${12 * p.scale}px`,
                  height: `${12 * p.scale}px`,
                  backgroundColor: p.color,
                  border: '2px solid white'
                }}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
export default ConfettiEffect;
