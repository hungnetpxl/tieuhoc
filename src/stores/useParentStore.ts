import { create } from 'zustand';
import type { ChildStatistics, QuestionHistoryEntry, ChildMistake } from '../types';
import { apiService } from '../services/apiService';

interface ParentState {
  selectedChildId: string | null;
  statistics: ChildStatistics | null;
  history: QuestionHistoryEntry[];
  mistakes: ChildMistake[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setSelectedChildId: (childId: string) => void;
  loadChildData: (childId: string) => Promise<void>;
  clearChildMistakes: (childId: string) => Promise<void>;
}

export const useParentStore = create<ParentState>((set, get) => ({
  selectedChildId: null,
  statistics: null,
  history: [],
  mistakes: [],
  isLoading: false,
  error: null,

  setSelectedChildId: (childId: string) => {
    set({ selectedChildId: childId });
    get().loadChildData(childId);
  },

  loadChildData: async (childId: string) => {
    set({ isLoading: true, error: null });
    try {
      const statistics = await apiService.getStatistics(childId);
      const history = await apiService.getQuestionHistory(childId);
      const mistakes = await apiService.getMistakes(childId);

      set({
        statistics,
        history,
        mistakes,
        isLoading: false
      });
    } catch (err: any) {
      set({
        error: err.message || 'Không thể tải dữ liệu học tập của bé',
        isLoading: false
      });
    }
  },

  clearChildMistakes: async (childId: string) => {
    set({ isLoading: true });
    try {
      await apiService.clearMistakes(childId);
      set({
        mistakes: [],
        isLoading: false
      });
    } catch (err: any) {
      set({
        error: err.message || 'Không thể làm sạch lịch sử lỗi sai',
        isLoading: false
      });
    }
  }
}));
