import { create } from 'zustand';
import type { ChildProfile, ParentProfile, PetShopItem } from '../types';
import { apiService } from '../services/apiService';

interface AuthState {
  parent: ParentProfile | null;
  children: ChildProfile[];
  currentChild: ChildProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string) => Promise<void>;
  signUp: (email: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  addChild: (name: string, avatar: string) => Promise<void>;
  selectChild: (childId: string) => void;
  updateChildStats: (xpGained: number, starsGained: number, updateLevel?: boolean) => Promise<void>;
  deductChildLife: () => Promise<void>;
  refillLives: (costStars: number) => Promise<boolean>;
  customizePet: (item: PetShopItem) => Promise<boolean>;
}

// Danh sách các avatar mặc định siêu dễ thương cho bé chọn
export const CUTE_AVATARS = [
  { id: 'dino', emoji: '🦖', label: 'Khủng Long Dino' },
  { id: 'unicorn', emoji: '🦄', label: 'Kỳ Lân Lấp Lánh' },
  { id: 'fox', emoji: '🦊', label: 'Cáo Thông Thái' },
  { id: 'rabbit', emoji: '🐰', label: 'Thỏ Bánh Bao' },
  { id: 'bear', emoji: '🐻', label: 'Gấu Nâu Ấm Áp' }
];

export const useAuthStore = create<AuthState>((set, get) => ({
  parent: null,
  children: [],
  currentChild: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      const parent = await apiService.getCurrentParent();
      if (parent) {
        const children = await apiService.getChildrenProfiles(parent.id);
        
        // Phục hồi lại bé đã chọn trước đó từ localStorage (nếu có)
        const savedChildId = localStorage.getItem('selected_child_id');
        let currentChild = children.find(c => c.id === savedChildId) || children[0] || null;

        set({
          parent,
          children,
          currentChild,
          isAuthenticated: true,
          isLoading: false
        });
      } else {
        set({ isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message || 'Lỗi khởi chạy hệ thống', isLoading: false });
    }
  },

  signIn: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      const parent = await apiService.signInParent(email);
      const children = await apiService.getChildrenProfiles(parent.id);
      const currentChild = children[0] || null;

      set({
        parent,
        children,
        currentChild,
        isAuthenticated: true,
        isLoading: false
      });

      if (currentChild) {
        localStorage.setItem('selected_child_id', currentChild.id);
      }
    } catch (err: any) {
      set({ error: err.message || 'Đăng nhập không thành công', isLoading: false });
      throw err;
    }
  },

  signUp: async (email: string, fullName: string) => {
    set({ isLoading: true, error: null });
    try {
      const parent = await apiService.signUpParent(email, fullName);
      set({
        parent,
        children: [],
        currentChild: null,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (err: any) {
      set({ error: err.message || 'Đăng ký không thành công', isLoading: false });
      throw err;
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await apiService.signOutParent();
      localStorage.removeItem('selected_child_id');
      set({
        parent: null,
        children: [],
        currentChild: null,
        isAuthenticated: false,
        isLoading: false
      });
    } catch (err) {
      set({ isLoading: false });
    }
  },

  addChild: async (name: string, avatar: string) => {
    const { parent, children } = get();
    if (!parent) return;

    set({ isLoading: true, error: null });
    try {
      const newChild = await apiService.createChildProfile(parent.id, name, avatar);
      const updatedChildren = [...children, newChild];
      
      set({
        children: updatedChildren,
        currentChild: get().currentChild || newChild,
        isLoading: false
      });

      if (!get().currentChild) {
        localStorage.setItem('selected_child_id', newChild.id);
      }
    } catch (err: any) {
      set({ error: err.message || 'Không thể tạo hồ sơ bé', isLoading: false });
      throw err;
    }
  },

  selectChild: (childId: string) => {
    const { children } = get();
    const child = children.find(c => c.id === childId) || null;
    if (child) {
      set({ currentChild: child });
      localStorage.setItem('selected_child_id', child.id);
    }
  },

  updateChildStats: async (xpGained: number, starsGained: number, updateLevel = false) => {
    const { currentChild, children } = get();
    if (!currentChild) return;

    try {
      let updatedXp = currentChild.experience_points + xpGained;
      let updatedStars = currentChild.stars + starsGained;
      let updatedLevel = currentChild.level;

      // Logic tăng level: Cứ mỗi 100 XP là thăng 1 cấp
      if (updateLevel) {
        // Hoặc tính toán tự động
        const potentialLevel = Math.floor(updatedXp / 100) + 1;
        if (potentialLevel > updatedLevel) {
          updatedLevel = potentialLevel;
        }
      }

      const updatedFields: Partial<ChildProfile> = {
        experience_points: updatedXp,
        stars: updatedStars,
        level: updatedLevel
      };

      const finalChild = await apiService.updateChildProfile(currentChild.id, updatedFields);
      
      // Đồng bộ danh sách con cái
      const updatedChildren = children.map(c => c.id === finalChild.id ? finalChild : c);
      set({
        currentChild: finalChild,
        children: updatedChildren
      });
    } catch (err) {
      console.error('Không thể cập nhật chỉ số của bé:', err);
    }
  },

  deductChildLife: async () => {
    const { currentChild, children } = get();
    if (!currentChild) return;

    try {
      const nextLives = Math.max(0, currentChild.lives - 1);
      const finalChild = await apiService.updateChildProfile(currentChild.id, { lives: nextLives });
      
      const updatedChildren = children.map(c => c.id === finalChild.id ? finalChild : c);
      set({
        currentChild: finalChild,
        children: updatedChildren
      });
    } catch (err) {
      console.error('Không thể trừ mạng của bé:', err);
    }
  },

  refillLives: async (costStars: number) => {
    const { currentChild, children } = get();
    if (!currentChild || currentChild.stars < costStars) return false;

    try {
      const updatedFields: Partial<ChildProfile> = {
        stars: currentChild.stars - costStars,
        lives: 5 // Hồi sinh đầy 5 tim
      };

      const finalChild = await apiService.updateChildProfile(currentChild.id, updatedFields);
      
      const updatedChildren = children.map(c => c.id === finalChild.id ? finalChild : c);
      set({
        currentChild: finalChild,
        children: updatedChildren
      });
      return true;
    } catch (err) {
      console.error('Không thể hồi phục tim:', err);
      return false;
    }
  },

  customizePet: async (item: PetShopItem) => {
    const { currentChild, children } = get();
    if (!currentChild) return false;

    // Nếu là đồ mất phí, bé phải có đủ sao
    if (!item.bought && currentChild.stars < item.cost) {
      return false;
    }

    try {
      const updatedFields: Partial<ChildProfile> = {};

      if (item.type === 'color') {
        updatedFields.pet_color = item.value;
      } else if (item.type === 'hat') {
        updatedFields.pet_hat = item.value;
      } else if (item.type === 'food') {
        // Thức ăn hồi 1 tim ngay lập tức
        if (currentChild.lives >= 5) return false; // Tim đã đầy
        updatedFields.lives = Math.min(5, currentChild.lives + parseInt(item.value));
      }

      // Trừ sao nếu đây là giao dịch mua lần đầu
      if (!item.bought) {
        updatedFields.stars = currentChild.stars - item.cost;
      }

      const finalChild = await apiService.updateChildProfile(currentChild.id, updatedFields);
      
      const updatedChildren = children.map(c => c.id === finalChild.id ? finalChild : c);
      set({
        currentChild: finalChild,
        children: updatedChildren
      });
      return true;
    } catch (err) {
      console.error('Lỗi tùy chỉnh pet cưng:', err);
      return false;
    }
  }
}));
