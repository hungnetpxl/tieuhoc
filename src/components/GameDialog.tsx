import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { popInVariants } from '../animations/presets';
import { Button3D } from './Button3D';
import { DinoPet } from './DinoPet';
import type { Badge } from '../types';

interface GameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'level_up' | 'badge_unlocked' | 'lives_empty' | 'victory';
  badge?: Badge;
  childName?: string;
  level?: number;
  starsEarned?: number;
  xpEarned?: number;
  onAction?: () => void;
}

export const GameDialog: React.FC<GameDialogProps> = ({
  isOpen,
  onClose,
  type,
  badge,
  childName = 'Bé',
  level = 1,
  starsEarned = 0,
  xpEarned = 0,
  onAction
}) => {
  
  const contentMap = {
    level_up: {
      title: '🌟 THĂNG CẤP VÙ TIẾN! 🌟',
      subtitle: `Chúc mừng ${childName} đã đạt Cấp độ ${level}!`,
      buttonText: 'Học tiếp thôi! 🚀',
      buttonVariant: 'yellow' as const,
      petState: 'cheering' as const
    },
    badge_unlocked: {
      title: '🏆 HUY HIỆU MỚI TINH! 🏆',
      subtitle: `Bé siêu quá! Đã mở khóa huy hiệu:`,
      buttonText: 'Nhận phần thưởng ⭐',
      buttonVariant: 'orange' as const,
      petState: 'cheering' as const
    },
    lives_empty: {
      title: '❤️ ÚI, HẾT TIM MẤT RỒI! ❤️',
      subtitle: 'Đừng lo lắng nhé! Bé có muốn dùng 20 ⭐ để đổi lấy 5 tim ❤️ mới và tiếp tục học không?',
      buttonText: 'Đổi 5 tim ❤️ (20 Sao)',
      buttonVariant: 'danger' as const,
      petState: 'sad' as const
    },
    victory: {
      title: '🎉 CHIẾN THẮNG RỰC RỠ! 🎉',
      subtitle: 'Bé đã hoàn thành xuất sắc bài học hôm nay!',
      buttonText: 'Về Bản Đồ 🗺️',
      buttonVariant: 'primary' as const,
      petState: 'cheering' as const
    }
  };

  const current = contentMap[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Lớp nền tối mờ phía sau */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={type === 'lives_empty' ? undefined : onClose}
            className="absolute inset-0 bg-[#4b4b4b]/60 backdrop-blur-sm"
          />

          {/* Hộp thoại chính với bo góc lớn tròn 3D */}
          <motion.div
            variants={popInVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative bg-white rounded-[2.5rem] border-[8px] border-[#e5e5e5] shadow-[0_16px_0_0_#d5d5d5] max-w-md w-full p-8 flex flex-col items-center text-center z-10 overflow-hidden"
          >
            
            {/* Vùng tia sáng nền xoay cho lễ ăn mừng */}
            {(type === 'victory' || type === 'level_up' || type === 'badge_unlocked') && (
              <div className="absolute top-[-80px] w-[350px] h-[350px] bg-yellow-100/40 rounded-full filter blur-xl animate-pulse pointer-events-none" />
            )}

            {/* Mascot Dino Pet thể hiện cảm xúc tương thích */}
            <div className="mb-4">
              <DinoPet state={current.petState} size={150} />
            </div>

            {/* Tiêu đề chữ hoa to đậm */}
            <h2 className="text-2xl md:text-3xl font-black text-[#3c3c3c] tracking-wide mb-3 leading-tight drop-shadow-sm">
              {current.title}
            </h2>

            {/* Nội dung chi tiết */}
            <p className="text-lg font-bold text-[#777] mb-6 px-2 leading-relaxed">
              {current.subtitle}
            </p>

            {/* Khối hiển thị Huy hiệu cụ thể nếu là Badge Unlocked */}
            {type === 'badge_unlocked' && badge && (
              <div className="mb-6 bg-orange-50 border-4 border-dashed border-orange-200 rounded-3xl p-4 flex flex-col items-center w-full">
                <span className="text-5xl mb-2 filter drop-shadow">{badge.icon_emoji}</span>
                <h4 className="text-xl font-extrabold text-[#ff9600]">{badge.title}</h4>
                <p className="text-sm font-semibold text-[#888]">{badge.description}</p>
                <div className="mt-2 bg-[#ff9600] text-white text-xs px-3 py-1.5 rounded-full font-black flex items-center gap-1 shadow-sm">
                  Thưởng: +{badge.reward_stars} ⭐
                </div>
              </div>
            )}

            {/* Khối hiển thị kết quả sao & XP nếu là Victory */}
            {type === 'victory' && (
              <div className="grid grid-cols-2 gap-4 w-full mb-6">
                <div className="bg-yellow-50 border-4 border-yellow-200 rounded-3xl p-3 flex flex-col items-center shadow-sm">
                  <span className="text-3xl mb-1">⭐</span>
                  <span className="text-2xl font-black text-yellow-600">+{starsEarned}</span>
                  <span className="text-xs font-bold text-yellow-500 uppercase">Ngôi sao</span>
                </div>
                <div className="bg-green-50 border-4 border-green-200 rounded-3xl p-3 flex flex-col items-center shadow-sm">
                  <span className="text-3xl mb-1">⚡</span>
                  <span className="text-2xl font-black text-green-600">+{xpEarned}</span>
                  <span className="text-xs font-bold text-green-500 uppercase">Kinh nghiệm</span>
                </div>
              </div>
            )}

            {/* Các nút hành động lớn 3D */}
            <div className="flex flex-col gap-3 w-full">
              <Button3D
                variant={current.buttonVariant}
                size="lg"
                className="w-full text-lg"
                onClick={onAction || onClose}
              >
                {current.buttonText}
              </Button3D>

              {/* Nút thoát phụ nếu là kết thúc tim */}
              {type === 'lives_empty' && (
                <Button3D
                  variant="ghost"
                  size="md"
                  onClick={onClose}
                  className="w-full text-base"
                >
                  Dừng chơi để nghỉ ngơi 💤
                </Button3D>
              )}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default GameDialog;
