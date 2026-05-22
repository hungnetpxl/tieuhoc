import React from 'react';
import { motion } from 'framer-motion';

interface Button3DProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'yellow' | 'orange' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  className?: string;
}

export const Button3D: React.FC<Button3DProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = ''
}) => {
  
  // Màu sắc 3D phong cách Duolingo
  const variants = {
    // Xanh lá Duolingo
    primary: {
      bg: 'bg-[#58cc02]',
      border: 'border-b-[6px] border-[#46a302]',
      text: 'text-white',
      hover: 'hover:bg-[#61e002]',
      active: 'active:border-b-0 active:translate-y-[6px]'
    },
    // Xanh dương ngọc
    secondary: {
      bg: 'bg-[#1cb0f6]',
      border: 'border-b-[6px] border-[#1899d6]',
      text: 'text-white',
      hover: 'hover:bg-[#24bfff]',
      active: 'active:border-b-0 active:translate-y-[6px]'
    },
    // Vàng chuối
    yellow: {
      bg: 'bg-[#ffc800]',
      border: 'border-b-[6px] border-[#e6b400]',
      text: 'text-[#4b4b4b]',
      hover: 'hover:bg-[#ffd01a]',
      active: 'active:border-b-0 active:translate-y-[6px]'
    },
    // Cam pastel
    orange: {
      bg: 'bg-[#ff9600]',
      border: 'border-b-[6px] border-[#e68000]',
      text: 'text-white',
      hover: 'hover:bg-[#ffa31a]',
      active: 'active:border-b-0 active:translate-y-[6px]'
    },
    // Đỏ tim sinh mạng
    danger: {
      bg: 'bg-[#ff4b4b]',
      border: 'border-b-[6px] border-[#ea2b2b]',
      text: 'text-white',
      hover: 'hover:bg-[#ff5f5f]',
      active: 'active:border-b-0 active:translate-y-[6px]'
    },
    // Màu trong suốt / tối giản
    ghost: {
      bg: 'bg-transparent',
      border: 'border-b-0',
      text: 'text-[#afafaf] hover:text-[#4b4b4b]',
      hover: 'hover:bg-[#e5e5e5]/40',
      active: 'active:translate-y-[2px]'
    }
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-xl',
    md: 'px-6 py-3 text-base font-bold rounded-2xl',
    lg: 'px-8 py-4 text-xl font-bold rounded-2xl tracking-wider',
    xl: 'px-10 py-5 text-2xl font-black rounded-3xl tracking-widest'
  };

  const activeStyles = disabled
    ? 'opacity-50 cursor-not-allowed'
    : `${variants[variant].bg} ${variants[variant].border} ${variants[variant].hover} ${variants[variant].active} transition-all duration-100 ease-out cursor-pointer`;

  return (
    <motion.button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { y: 6 }}
      className={`
        inline-flex items-center justify-center font-bold text-center select-none outline-none
        ${variants[variant].text}
        ${sizes[size]}
        ${activeStyles}
        ${className}
      `}
      style={{
        boxShadow: variant !== 'ghost' && !disabled ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : undefined
      }}
    >
      <span className="flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};
export default Button3D;
