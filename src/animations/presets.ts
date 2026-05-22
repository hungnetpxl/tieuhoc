import type { Variants } from 'framer-motion';

// 1. Hiệu ứng Nảy Bouncin' cực kì vui nhộn
export const bounceVariants: Variants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 15
    }
  },
  hover: { 
    scale: 1.05,
    transition: { type: "spring", stiffness: 400, damping: 10 }
  },
  tap: { 
    scale: 0.95,
    transition: { type: "spring", stiffness: 400, damping: 10 }
  }
};

// 2. Hiệu ứng rung lắc (Shake) khi bé làm sai phép tính để báo hiệu trực quan
export const shakeVariants: Variants = {
  shake: {
    x: [0, -10, 10, -10, 10, -5, 5, 0],
    transition: {
      duration: 0.5,
      ease: "easeInOut"
    }
  }
};

// 3. Hiệu ứng phóng to pop-up (Pop In Scale) cho Cup, Huy chương và Thú cưng
export const popInVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
      delayChildren: 0.2,
      staggerChildren: 0.1
    }
  },
  exit: {
    scale: 0.5,
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

// 4. Hiệu ứng nhịp đập liên tục (Continuous Pulse) tạo cảm giác thở cho Đảo học tập hiện tại
export const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.08, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// 5. Trượt mượt từ dưới lên (Slide Up Entry) cho Bottom Sheet và Thanh trả lời
export const slideUpVariants: Variants = {
  hidden: { y: 100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 250,
      damping: 25
    }
  },
  exit: {
    y: 100,
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

// 6. Hiệu ứng xuất hiện dần dần từng chữ/từng hình (Stagger Fade)
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

export const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  }
};
