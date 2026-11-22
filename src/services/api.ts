import type {
  AccessibilityPreferences,
  AdaptiveAdjustment,
  CaregiverNote,
  ChildProfile,
  GameDefinition,
  GameRecommendation,
  GameSessionRecord,
  RewardRecord,
  UnlockedAchievement,
  UserRecord,
  UserRole,
} from '../../shared/types';

const TOKEN_KEY = 'neurobloom_jwt';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data as T;
}

export interface RewardsSummaryResponse {
  total_coins: number;
  total_xp: number;
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
  streak_days: number;
  daily_mission: {
    games_completed_today: number;
    games_target: number;
    coins_today: number;
    coins_target: number;
    minutes_today: number;
    minutes_target: number;
    bonus_claimed: boolean;
    eligible_to_claim: boolean;
  };
  unlocked_achievements: UnlockedAchievement[];
  history: RewardRecord[];
}

export interface AnalyticsResponse {
  disclaimer: string;
  overview: {
    total_sessions: number;
    total_practice_minutes: number;
    average_accuracy: number;
    current_streak: number;
    total_coins: number;
    level: number;
  };
  category_trends: Array<{
    category: string;
    sessions: number;
    avgAccuracy: number;
    avgDifficulty: number;
    totalMinutes: number;
  }>;
  game_wise: Array<{
    game_id: string;
    title: string;
    category: string;
    sessions: number;
    avgAccuracy: number;
    latestDifficulty: number;
  }>;
  recent_sessions: Array<GameSessionRecord & { game_title: string; category: string }>;
  insights: {
    enjoyed_area: string;
    additional_practice_area: string;
  };
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: UserRecord }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    displayName?: string;
    ageGroup?: string;
  }) =>
    request<{ token: string; user: UserRecord }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  me: () => request<{ user: UserRecord; children: ChildProfile[] }>('/auth/me'),

  getGames: (childId?: string) =>
    request<{
      games: Array<GameDefinition & { recommended_difficulty: number }>;
    }>(childId ? `/games?childId=${encodeURIComponent(childId)}` : '/games'),

  getChild: (childId: string) =>
    request<{ child: ChildProfile; accessibility: AccessibilityPreferences }>(`/children/${childId}`),

  createChild: (payload: { display_name: string; age_group: string; learning_preferences: string[] }) =>
    request<{ child: ChildProfile }>('/children', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  submitGameSession: (payload: {
    child_id: string;
    game_id: string;
    score: number;
    accuracy: number;
    attempts: number;
    duration: number;
    difficulty: number;
    hints_used: number;
    repeated_errors: number;
  }) =>
    request<{
      session: GameSessionRecord;
      adaptive_adjustment: AdaptiveAdjustment;
      reward_earned: RewardRecord;
      newly_unlocked_achievements: Array<{ id: string; title: string; description: string; coinsBonus: number }>;
      rewards_summary: RewardsSummaryResponse;
    }>('/games/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getRewards: (childId: string) => request<RewardsSummaryResponse>(`/rewards/${childId}`),

  claimReward: (child_id: string, reward_type: 'daily_mission' | 'weekly_streak_bonus') =>
    request<{ claimed: boolean; message: string; rewards_summary: RewardsSummaryResponse }>('/rewards/claim', {
      method: 'POST',
      body: JSON.stringify({ child_id, reward_type }),
    }),

  getRecommendations: (childId: string) =>
    request<{ primary: GameRecommendation; recommendations: GameRecommendation[] }>(`/recommendations/${childId}`),

  getAnalytics: (childId: string) => request<AnalyticsResponse>(`/analytics/${childId}`),

  getWeeklyAnalytics: (childId: string) =>
    request<{ weekly: Array<{ date: string; label: string; sessions: number; minutes: number; avgAccuracy: number }> }>(
      `/analytics/${childId}/weekly`
    ),

  getAccessibility: (childId: string) =>
    request<{ settings: AccessibilityPreferences }>(`/accessibility/${childId}`),

  updateAccessibility: (childId: string, settings: Partial<AccessibilityPreferences>) =>
    request<{ settings: AccessibilityPreferences; updated_at: string }>(`/accessibility/${childId}`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  getNotes: (childId: string) => request<{ notes: CaregiverNote[] }>(`/notes/${childId}`),

  addNote: (child_id: string, note: string) =>
    request<{ note: CaregiverNote }>('/notes', {
      method: 'POST',
      body: JSON.stringify({ child_id, note }),
    }),

  getReminders: (childId: string) =>
    request<{
      reminders: Array<{
        id: string;
        title: string;
        scheduled_time: string;
        days_of_week: string;
        email_recipient: string;
        notification_status: string;
      }>;
    }>(`/reminders/${childId}`),

  createReminder: (payload: {
    child_id: string;
    title: string;
    scheduled_time: string;
    days_of_week: string;
    email_recipient: string;
  }) =>
    request<{ reminder: Record<string, unknown> }>('/reminders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getDoctorChildren: () =>
    request<{
      children: Array<
        ChildProfile & { session_count: number; avg_accuracy: number; last_session_at: string | null }
      >;
    }>('/doctor/children'),

  addDoctorRecommendation: (payload: { child_id: string; game_id: string; reason: string; difficulty: number }) =>
    request<{ recommendation: Record<string, unknown> }>('/doctor/recommendations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getDoctorReport: (childId: string) =>
    request<{
      generated_at: string;
      disclaimer: string;
      child: ChildProfile;
      summary: { total_sessions: number; total_minutes: number; average_accuracy: number };
      sessions: Array<GameSessionRecord & { game_title: string; category: string }>;
      notes: CaregiverNote[];
      recommendations: Array<{ id: string; game_id: string; reason: string; difficulty: number; author_name: string; created_at: string }>;
    }>(`/doctor/report/${childId}`),

  getAdminOverview: () =>
    request<{
      users: Array<{ id: string; name: string; email: string; role: string; created_at: string }>;
      children: ChildProfile[];
      counts: { userCount: number; childCount: number; sessionCount: number; noteCount: number };
    }>('/admin/overview'),
};
