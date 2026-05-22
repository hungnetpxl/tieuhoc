import type { Badge, ChildBadge, ChildStatistics, LearningSession } from '../types';

export class RewardEngine {
  /**
   * Danh sách toàn bộ Huy hiệu trong hệ thống
   */
  public static readonly SYSTEM_BADGES: Badge[] = [
    {
      id: 'first_victory',
      title: 'Chiến thắng đầu tiên',
      description: 'Hoàn thành bài học đầu tiên với số tim tối đa! ❤️',
      icon_emoji: '🏆',
      reward_stars: 10
    },
    {
      id: 'perfect_10',
      title: 'Điểm 10 tuyệt đối',
      description: 'Đạt 10/10 câu đúng trong một bài học! 💯',
      icon_emoji: '💯',
      reward_stars: 15
    },
    {
      id: 'addition_master',
      title: 'Thần đồng Phép Cộng',
      description: 'Hoàn thành 5 bài học phép cộng xuất sắc! ➕',
      icon_emoji: '➕',
      reward_stars: 20
    },
    {
      id: 'subtraction_master',
      title: 'Hiệp sĩ Phép Trừ',
      description: 'Hoàn thành 5 bài học phép trừ xuất sắc! ➖',
      icon_emoji: '➖',
      reward_stars: 20
    },
    {
      id: 'streak_3',
      title: 'Chăm chỉ vô địch',
      description: 'Giữ streak học tập liên tục trong 3 ngày! 🔥',
      icon_emoji: '🔥',
      reward_stars: 30
    },
    {
      id: 'speed_demon',
      title: 'Tốc độ tia chớp',
      description: 'Hoàn thành bài học dưới 60 giây! ⚡',
      icon_emoji: '⚡',
      reward_stars: 25
    }
  ];

  /**
   * Kiểm tra xem bé có đủ điều kiện mở khóa huy hiệu nào mới sau khi hoàn thành bài học không.
   * @param childBadges Danh sách huy hiệu hiện tại bé đã có
   * @param session Phiên học vừa hoàn thành
   * @param statistics Thống kê tích lũy của bé
   * @param streakDays Chuỗi ngày học liên tục hiện tại của bé
   * @param sessionTimeTakenSeconds Tổng thời gian làm bài của phiên vừa rồi
   * @returns Mảng các huy hiệu mới được mở khóa
   */
  public static checkNewUnlockedBadges(
    childBadges: ChildBadge[],
    session: LearningSession,
    statistics: ChildStatistics,
    streakDays: number,
    sessionTimeTakenSeconds: number
  ): Badge[] {
    const unlockedBadgeIds = new Set(childBadges.map(cb => cb.badge_id));
    const newlyUnlocked: Badge[] = [];

    // Lọc ra các huy hiệu bé chưa có để kiểm tra điều kiện
    const lockedBadges = this.SYSTEM_BADGES.filter(b => !unlockedBadgeIds.has(b.id));

    lockedBadges.forEach(badge => {
      let isEligible = false;

      switch (badge.id) {
        case 'first_victory':
          // Thắng bài học đầu tiên với 5 tim nguyên vẹn
          if (statistics.total_sessions === 1 && session.status === 'completed' && session.wrong_answers === 0) {
            isEligible = true;
          }
          break;

        case 'perfect_10':
          // 10 câu đúng, không sai câu nào
          if (session.correct_answers === 10 && session.wrong_answers === 0) {
            isEligible = true;
          }
          break;

        case 'addition_master':
          // Hoàn thành ít nhất 5 bài phép cộng (hoặc tổng số câu cộng đúng lớn hơn 20)
          if (session.math_types.includes('addition') && statistics.correct_count >= 20) {
            isEligible = true;
          }
          break;

        case 'subtraction_master':
          // Hoàn thành ít nhất 5 bài phép trừ
          if (session.math_types.includes('subtraction') && statistics.total_sessions >= 5) {
            isEligible = true;
          }
          break;

        case 'streak_3':
          // Học 3 ngày liên tiếp trở lên
          if (streakDays >= 3) {
            isEligible = true;
          }
          break;

        case 'speed_demon':
          // Làm xong bài dưới 60 giây và thắng cuộc
          if (session.status === 'completed' && sessionTimeTakenSeconds <= 60) {
            isEligible = true;
          }
          break;

        default:
          break;
      }

      if (isEligible) {
        newlyUnlocked.push(badge);
      }
    });

    return newlyUnlocked;
  }
}
