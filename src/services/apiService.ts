import { createClient } from '@supabase/supabase-js';
import type { ParentProfile, ChildProfile, LearningSession, QuestionHistoryEntry, ChildMistake, ChildBadge, ChildStatistics, MathType } from '../types';
import { AnalyticsEngine } from '../engine/analytics';
import { RewardEngine } from '../engine/reward';

// 1. KHỞI TẠO SUPABASE CLIENT
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Kiểm tra chi tiết và loại bỏ các giá trị placeholder hoặc chuỗi "undefined" do bundler tạo ra
const isSupabaseConfigured = 
  supabaseUrl !== '' && 
  supabaseAnonKey !== '' && 
  supabaseUrl !== 'undefined' && 
  supabaseAnonKey !== 'undefined' &&
  !supabaseUrl.includes('your-supabase-url') &&
  !supabaseAnonKey.includes('your-supabase-anon-key');

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Biến trạng thái có thể thay đổi động trong phiên hoạt động
export let isSupabaseActive = isSupabaseConfigured;

// Tập hợp các listener để cập nhật giao diện khi chuyển đổi trạng thái cơ sở dữ liệu
const dbModeListeners = new Set<(active: boolean) => void>();

export const addDbModeListener = (listener: (active: boolean) => void) => {
  dbModeListeners.add(listener);
  // Gọi ngay lập tức với giá trị hiện tại để khởi tạo đồng bộ
  listener(isSupabaseActive);
  return () => {
    dbModeListeners.delete(listener);
  };
};

export const setSupabaseActive = (active: boolean) => {
  isSupabaseActive = active;
  console.log(`🔌 Chế độ hoạt động đã được chuyển sang: ${active ? '🟢 Supabase Online' : '💾 Local Mock Offline'}`);
  dbModeListeners.forEach(l => l(active));
};

console.log(
  isSupabaseActive 
    ? '🟢 Supabase đã được kết nối thành công!' 
    : '🟡 Đang chạy chế độ Local Mock (Lưu trữ bằng Trình duyệt LocalStorage)'
);

// Wrapper an toàn giúp dự phòng tự động chuyển sang Local Mock nếu Supabase nổ lỗi runtime
async function runWithFallback<T>(
  supabaseCall: () => Promise<T>,
  localFallback: () => Promise<T> | T,
  methodName: string
): Promise<T> {
  if (supabase && isSupabaseActive) {
    try {
      return await supabaseCall();
    } catch (err: any) {
      console.warn(`⚠️ Supabase error in apiService.${methodName}, switching to Local Mock:`, err);
      // Vô hiệu hóa Supabase cho phần còn lại của phiên làm việc này để tăng hiệu năng và tránh lặp lỗi và kích hoạt listeners
      setSupabaseActive(false);
      return await localFallback();
    }
  }
  return await localFallback();
}

// 2. PHẦN MOCK DATABASE TRONG LOCALSTORAGE
class LocalStorageMockDb {
  private get(key: string): any[] {
    const data = localStorage.getItem(`dt_${key}`);
    return data ? JSON.parse(data) : [];
  }

  private set(key: string, data: any[]): void {
    localStorage.setItem(`dt_${key}`, JSON.stringify(data));
  }

  // --- Profiles ---
  public getParent(): ParentProfile | null {
    const parent = localStorage.getItem('dt_parent');
    return parent ? JSON.parse(parent) : null;
  }

  public setParent(parent: ParentProfile | null): void {
    if (parent) {
      localStorage.setItem('dt_parent', JSON.stringify(parent));
    } else {
      localStorage.removeItem('dt_parent');
    }
  }

  // --- Children Profiles ---
  public getChildren(parentId: string): ChildProfile[] {
    return this.get('children').filter(c => c.parent_id === parentId);
  }

  public addChild(child: ChildProfile): void {
    const list = this.get('children');
    list.push(child);
    this.set('children', list);
  }

  public updateChild(childId: string, fields: Partial<ChildProfile>): ChildProfile {
    const list = this.get('children');
    const idx = list.findIndex(c => c.id === childId);
    if (idx === -1) throw new Error('Không tìm thấy bé');
    
    const updated = { ...list[idx], ...fields, last_active_at: new Date().toISOString() };
    list[idx] = updated;
    this.set('children', list);
    return updated;
  }

  // --- Sessions ---
  public getSessions(childId: string): LearningSession[] {
    return this.get('sessions').filter(s => s.child_id === childId);
  }

  public addSession(session: LearningSession): void {
    const list = this.get('sessions');
    list.push(session);
    this.set('sessions', list);
  }

  public updateSession(sessionId: string, fields: Partial<LearningSession>): LearningSession {
    const list = this.get('sessions');
    const idx = list.findIndex(s => s.id === sessionId);
    if (idx === -1) throw new Error('Không tìm thấy phiên học');

    const updated = { ...list[idx], ...fields };
    list[idx] = updated;
    this.set('sessions', list);
    return updated;
  }

  // --- Question History ---
  public getHistory(childId: string): QuestionHistoryEntry[] {
    return this.get('history').filter(h => h.child_id === childId);
  }

  public addHistory(entry: QuestionHistoryEntry): void {
    const list = this.get('history');
    list.push(entry);
    this.set('history', list);
  }

  // --- Mistakes ---
  public getMistakes(childId: string): ChildMistake[] {
    return this.get('mistakes').filter(m => m.child_id === childId);
  }

  public addOrUpdateMistake(childId: string, mathType: string, numA: number, numB: number, op: string): void {
    const list = this.get('mistakes') as ChildMistake[];
    const idx = list.findIndex(m => m.child_id === childId && m.math_type === mathType && m.number_a === numA && m.number_b === numB && m.operator === op);
    
    if (idx !== -1) {
      list[idx].wrong_count += 1;
      list[idx].last_attempt_correct = false;
      list[idx].updated_at = new Date().toISOString();
    } else {
      list.push({
        id: Math.random().toString(36).substring(2, 11),
        child_id: childId,
        math_type: mathType as any,
        number_a: numA,
        number_b: numB,
        operator: op,
        wrong_count: 1,
        last_attempt_correct: false,
        updated_at: new Date().toISOString()
      });
    }
    this.set('mistakes', list);
  }

  public resolveMistake(childId: string, mathType: string, numA: number, numB: number, op: string): void {
    const list = this.get('mistakes') as ChildMistake[];
    const idx = list.findIndex(m => m.child_id === childId && m.math_type === mathType && m.number_a === numA && m.number_b === numB && m.operator === op);
    
    if (idx !== -1) {
      list[idx].last_attempt_correct = true;
      list[idx].updated_at = new Date().toISOString();
      this.set('mistakes', list);
    }
  }

  public clearMistakes(childId: string): void {
    const list = this.get('mistakes').filter(m => m.child_id !== childId);
    this.set('mistakes', list);
  }

  // --- Badges ---
  public getBadges(childId: string): ChildBadge[] {
    const childBadges = this.get('child_badges').filter(cb => cb.child_id === childId);
    return childBadges.map(cb => {
      const badgeDetail = RewardEngine.SYSTEM_BADGES.find(b => b.id === cb.badge_id);
      return {
        ...cb,
        badge: badgeDetail
      };
    });
  }

  public unlockBadge(childId: string, badgeId: string): ChildBadge {
    const list = this.get('child_badges');
    const exists = list.some(cb => cb.child_id === childId && cb.badge_id === badgeId);
    
    const newUnlock = {
      id: Math.random().toString(36).substring(2, 11),
      child_id: childId,
      badge_id: badgeId,
      unlocked_at: new Date().toISOString()
    };

    if (!exists) {
      list.push(newUnlock);
      this.set('child_badges', list);
    }
    return newUnlock;
  }

  // --- Statistics ---
  public getStats(childId: string): ChildStatistics {
    const list = this.get('statistics');
    const stats = list.find(s => s.child_id === childId);
    
    if (stats) return stats;

    const newStats: ChildStatistics = {
      child_id: childId,
      total_sessions: 0,
      total_questions: 0,
      correct_count: 0,
      accuracy_rate: 0.0,
      avg_time_per_question: 0.0,
      strongest_topic: 'Chưa học nhiều 🦖',
      weakest_topic: 'Chưa học nhiều 🦖',
      updated_at: new Date().toISOString()
    };
    
    list.push(newStats);
    this.set('statistics', list);
    return newStats;
  }

  public saveStats(stats: ChildStatistics): void {
    const list = this.get('statistics');
    const idx = list.findIndex(s => s.child_id === stats.child_id);
    if (idx !== -1) {
      list[idx] = stats;
    } else {
      list.push(stats);
    }
    this.set('statistics', list);
  }
}

const mockDb = new LocalStorageMockDb();

// 3. ĐỊNH NGHĨA DỊCH VỤ API SERVICE CHUNG
export const apiService = {
  
  // --- AUTHENTICATION FLOW ---
  getCurrentParent: async (): Promise<ParentProfile | null> => {
    return runWithFallback<ParentProfile | null>(
      async (): Promise<ParentProfile | null> => {
        const { data: { user }, error } = await supabase!.auth.getUser();
        if (error) throw error;
        if (user) {
          return {
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || 'Phụ Huynh',
            created_at: user.created_at || new Date().toISOString()
          };
        }
        return null;
      },
      () => mockDb.getParent(),
      'getCurrentParent'
    );
  },

  signInParent: async (email: string): Promise<ParentProfile> => {
    return runWithFallback<ParentProfile>(
      async (): Promise<ParentProfile> => {
        const { data, error } = await supabase!.auth.signInWithPassword({
          email,
          password: 'Password123!' // Mật khẩu chung
        });

        if (error) {
          // Nếu lỗi do email chưa kích hoạt, nổ lỗi để chuyển sang Local Mock
          if (error.message?.includes('Email not confirmed') || error.message?.includes('confirm')) {
            throw new Error('Email chưa được xác nhận trên hệ thống đám mây.');
          }

          // Nếu chưa có tài khoản, tự động tạo mới
          const signUpRes = await supabase!.auth.signUp({
            email,
            password: 'Password123!',
            options: { data: { full_name: 'Phụ Huynh' } }
          });
          if (signUpRes.error) throw signUpRes.error;
          
          if (!signUpRes.data.user) {
            throw new Error('Email đã được đăng ký trên đám mây nhưng cần xác thực qua email kích hoạt.');
          }
          
          const newParent: ParentProfile = {
            id: signUpRes.data.user.id,
            email: signUpRes.data.user.email!,
            full_name: 'Phụ Huynh',
            created_at: signUpRes.data.user.created_at || new Date().toISOString()
          };

          // Đồng thời chèn dữ liệu vào bảng public.th_parent_profiles (cũng sẽ tự tạo qua Postgres Trigger nhưng chèn thêm để chắc chắn)
          try {
            await supabase!.from('th_parent_profiles').insert([newParent]);
          } catch (insertErr) {
            console.warn('Lỗi khi chèn profiles (có thể đã tồn tại hoặc do RLS):', insertErr);
          }
          
          return newParent;
        }

        if (!data.user) {
          throw new Error('Đăng nhập thành công nhưng không lấy được thông tin người dùng.');
        }

        return {
          id: data.user.id,
          email: data.user.email!,
          full_name: data.user.user_metadata?.full_name || 'Phụ Huynh',
          created_at: data.user.created_at || new Date().toISOString()
        };
      },
      (): ParentProfile => {
        const existingParent = mockDb.getParent();
        if (!existingParent || existingParent.email !== email) {
          const newParent: ParentProfile = {
            id: 'p_' + Math.random().toString(36).substring(2, 11),
            email,
            full_name: 'Phụ Huynh',
            created_at: new Date().toISOString()
          };
          mockDb.setParent(newParent);
          return newParent;
        }
        return existingParent;
      },
      'signInParent'
    );
  },

  signUpParent: async (email: string, fullName: string): Promise<ParentProfile> => {
    return runWithFallback<ParentProfile>(
      async (): Promise<ParentProfile> => {
        const { data, error } = await supabase!.auth.signUp({
          email,
          password: 'Password123!',
          options: { data: { full_name: fullName } }
        });
        if (error) throw error;
        
        if (!data.user) {
          throw new Error('Đăng ký thành công nhưng email đã tồn tại hoặc cần kích hoạt để sử dụng chế độ Đám mây.');
        }

        // Đồng thời chèn dữ liệu vào bảng public.th_parent_profiles
        const newParent: ParentProfile = {
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          created_at: data.user.created_at || new Date().toISOString()
        };

        try {
          await supabase!.from('th_parent_profiles').insert([newParent]);
        } catch (insertErr) {
          console.warn('Lỗi khi chèn profiles:', insertErr);
        }
        return newParent;
      },
      (): ParentProfile => {
        const parent: ParentProfile = {
          id: 'p_' + Math.random().toString(36).substring(2, 11),
          email,
          full_name: fullName,
          created_at: new Date().toISOString()
        };
        mockDb.setParent(parent);
        return parent;
      },
      'signUpParent'
    );
  },

  signOutParent: async (): Promise<void> => {
    return runWithFallback(
      async () => {
        await supabase!.auth.signOut();
      },
      () => {
        mockDb.setParent(null);
      },
      'signOutParent'
    );
  },


  // --- CHILDREN PROFILES MANAGEMENT ---
  getChildrenProfiles: async (parentId: string): Promise<ChildProfile[]> => {
    return runWithFallback(
      async () => {
          const { data, error } = await supabase!
            .from('th_children_profiles')
            .select('*')
            .eq('parent_id', parentId);
        if (error) throw error;
        return data || [];
      },
      () => mockDb.getChildren(parentId),
      'getChildrenProfiles'
    );
  },

  createChildProfile: async (parentId: string, name: string, avatar: string): Promise<ChildProfile> => {
    const newChild = {
      parent_id: parentId,
      name,
      avatar,
      level: 1,
      experience_points: 0,
      stars: 0,
      lives: 5,
      streak_days: 1,
      pet_name: 'Dino Cú',
      pet_color: 'green',
      pet_hat: 'none'
    };

    return runWithFallback(
      async () => {
          const { data, error } = await supabase!
            .from('th_children_profiles')
            .insert([newChild])
            .select()
            .single();
        if (error) throw error;
        return data;
      },
      () => {
        const childWithId: ChildProfile = {
          id: 'c_' + Math.random().toString(36).substring(2, 11),
          ...newChild,
          created_at: new Date().toISOString()
        };
        mockDb.addChild(childWithId);
        return childWithId;
      },
      'createChildProfile'
    );
  },

  updateChildProfile: async (childId: string, fields: Partial<ChildProfile>): Promise<ChildProfile> => {
    return runWithFallback(
      async () => {
          const { data, error } = await supabase!
            .from('th_children_profiles')
            .update(fields)
            .eq('id', childId)
            .select()
            .single();
        if (error) throw error;
        return data;
      },
      () => mockDb.updateChild(childId, fields),
      'updateChildProfile'
    );
  },


  // --- LEARNING SESSIONS ---
  createSession: async (childId: string, mathTypes: MathType[]): Promise<LearningSession> => {
    const newSession = {
      child_id: childId,
      status: 'active' as const,
      math_types: mathTypes,
      total_questions: 0,
      correct_answers: 0,
      wrong_answers: 0,
      stars_earned: 0
    };

    return runWithFallback(
      async () => {
          const { data, error } = await supabase!
            .from('th_sessions')
            .insert([newSession])
            .select()
            .single();
        if (error) throw error;
        return data;
      },
      () => {
        const sessionWithId: LearningSession = {
          id: 's_' + Math.random().toString(36).substring(2, 11),
          ...newSession,
          started_at: new Date().toISOString()
        };
        mockDb.addSession(sessionWithId);
        return sessionWithId;
      },
      'createSession'
    );
  },

  updateSession: async (sessionId: string, fields: Partial<LearningSession>): Promise<LearningSession> => {
    return runWithFallback(
      async () => {
          const { data, error } = await supabase!
            .from('th_sessions')
            .update(fields)
            .eq('id', sessionId)
            .select()
            .single();
        if (error) throw error;
        return data;
      },
      () => mockDb.updateSession(sessionId, fields),
      'updateSession'
    );
  },


  // --- QUESTION HISTORY ---
  recordQuestionHistory: async (entry: Omit<QuestionHistoryEntry, 'id' | 'created_at'>): Promise<void> => {
    return runWithFallback(
      async () => {
          const { error } = await supabase!
            .from('th_question_history')
            .insert([entry]);
        if (error) throw error;
      },
      () => {
        const record: QuestionHistoryEntry = {
          id: 'qh_' + Math.random().toString(36).substring(2, 11),
          ...entry,
          created_at: new Date().toISOString()
        };
        mockDb.addHistory(record);
      },
      'recordQuestionHistory'
    );
  },

  getQuestionHistory: async (childId: string): Promise<QuestionHistoryEntry[]> => {
    return runWithFallback(
      async () => {
          const { data, error } = await supabase!
            .from('th_question_history')
            .select('*')
            .eq('child_id', childId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      },
      () => mockDb.getHistory(childId),
      'getQuestionHistory'
    );
  },


  // --- MISTAKES (FOR ADAPTIVE LEARNING) ---
  getMistakes: async (childId: string): Promise<ChildMistake[]> => {
    return runWithFallback(
      async () => {
          const { data, error } = await supabase!
            .from('th_mistakes')
            .select('*')
            .eq('child_id', childId);
        if (error) throw error;
        return data || [];
      },
      () => mockDb.getMistakes(childId),
      'getMistakes'
    );
  },

  recordMistake: async (childId: string, mathType: MathType, numA: number, numB: number, op: string): Promise<void> => {
    return runWithFallback(
      async () => {
        // Logic UPSERT trong Postgres
        const { error } = await supabase!.rpc('record_mistake_upsert', {
          p_child_id: childId,
          p_math_type: mathType,
          p_num_a: numA,
          p_num_b: numB,
          p_op: op
        });
        
        // Nếu RPC chưa được định nghĩa trên Supabase, dùng API chuẩn:
        if (error) {
          const { data: existing } = await supabase!
            .from('th_mistakes')
            .select('*')
            .match({ child_id: childId, math_type: mathType, number_a: numA, number_b: numB, operator: op })
            .maybeSingle();

          if (existing) {
            await supabase!
              .from('th_mistakes')
              .update({ wrong_count: existing.wrong_count + 1, last_attempt_correct: false, updated_at: new Date().toISOString() })
              .eq('id', existing.id);
          } else {
            await supabase!
              .from('th_mistakes')
              .insert([{
                child_id: childId,
                math_type: mathType,
                number_a: numA,
                number_b: numB,
                operator: op,
                wrong_count: 1,
                last_attempt_correct: false
              }]);
          }
        }
      },
      () => {
        mockDb.addOrUpdateMistake(childId, mathType, numA, numB, op);
      },
      'recordMistake'
    );
  },

  resolveMistake: async (childId: string, mathType: MathType, numA: number, numB: number, op: string): Promise<void> => {
    return runWithFallback(
      async () => {
        await supabase!
          .from('th_mistakes')
          .update({ last_attempt_correct: true, updated_at: new Date().toISOString() })
          .match({ child_id: childId, math_type: mathType, number_a: numA, number_b: numB, operator: op });
      },
      () => {
        mockDb.resolveMistake(childId, mathType, numA, numB, op);
      },
      'resolveMistake'
    );
  },

  clearMistakes: async (childId: string): Promise<void> => {
    return runWithFallback(
      async () => {
        await supabase!
          .from('th_mistakes')
          .delete()
          .eq('child_id', childId);
      },
      () => {
        mockDb.clearMistakes(childId);
      },
      'clearMistakes'
    );
  },


  // --- BADGES ---
  getChildrenBadges: async (childId: string): Promise<ChildBadge[]> => {
    return runWithFallback(
      async () => {
        const { data, error } = await supabase!
          .from('th_children_badges')
          .select('*, badge:th_badges(*)')
          .eq('child_id', childId);
        if (error) throw error;
        return data || [];
      },
      () => mockDb.getBadges(childId),
      'getChildrenBadges'
    );
  },

  unlockBadge: async (childId: string, badgeId: string): Promise<ChildBadge> => {
    return runWithFallback(
      async () => {
        const { data, error } = await supabase!
          .from('th_children_badges')
          .insert([{ child_id: childId, badge_id: badgeId }])
          .select()
          .single();
        if (error) throw error;
        return data;
      },
      () => mockDb.unlockBadge(childId, badgeId),
      'unlockBadge'
    );
  },


  // --- STATISTICS ---
  getStatistics: async (childId: string): Promise<ChildStatistics> => {
    return runWithFallback(
      async () => {
        const { data, error } = await supabase!
          .from('th_statistics')
          .select('*')
          .eq('child_id', childId)
          .maybeSingle();
        
        if (error) throw error;
        if (data) return data;
        
        // Tạo mặc định nếu chưa có
        const history = await apiService.getQuestionHistory(childId);
        const nextStats = AnalyticsEngine.aggregateStatistics(childId, history);
        const insertRes = await supabase!
          .from('th_statistics')
          .insert([nextStats])
          .select()
          .single();
        return insertRes.data || nextStats;
      },
      () => mockDb.getStats(childId),
      'getStatistics'
    );
  },

  refreshStatistics: async (childId: string): Promise<ChildStatistics> => {
    const history = await apiService.getQuestionHistory(childId);
    const currentStats = await apiService.getStatistics(childId);
    const nextStats = AnalyticsEngine.aggregateStatistics(childId, history, currentStats);

    return runWithFallback(
      async () => {
        const { data, error } = await supabase!
          .from('th_statistics')
          .upsert([nextStats])
          .select()
          .single();
        if (error) throw error;
        return data;
      },
      () => {
        mockDb.saveStats(nextStats);
        return nextStats;
      },
      'refreshStatistics'
    );
  }
};
export default apiService;
