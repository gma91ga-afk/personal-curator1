// API configuration and service layer
// All methods are safe to call when backend is unreachable.
// They return default/empty data and never throw.

// On a physical device, use your computer's LAN IP (e.g. 192.168.x.x:8000)
// On Android emulator, 10.0.2.2 maps to host localhost

// Try multiple URLs in sequence so the app works on physical devices too
const POSSIBLE_URLS = [
    'http://192.168.100.166:8000', // Primary: your backend server
    'http://10.0.2.2:8000',        // Fallback: Android emulator -> host
    'http://localhost:8000',       // Fallback: local server or WSL
];

const FETCH_TIMEOUT_MS = 15000; // 15 second timeout (content fetching is slow)

// ---- Type definitions ----

export interface OnboardingQuestions {
  categories: QuestionCategory[];
}

export interface QuestionCategory {
  id: string;
  title: string;
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'multi_select' | 'scale' | 'text';
  options: string[];
}

export interface OnboardingProfile {
  device_id: string;
  topics: string[];
  personality: Record<string, string>;
  content_preferences: Record<string, any>;
  notification_times: string[];
}

export interface DigestItem {
  id: number;
  title: string;
  summary: string;
  source: string;
  author: string | null;
  published_at: string | null;
  relevance_score: number;
  bookmarked: boolean;
  read: boolean;
}

export interface DigestResponse {
  items: DigestItem[];
  generated_at: string;
}

export interface ArticleRead {
  id: number;
  title: string;
  content: string;
  summary: string;
  source: string;
  author: string | null;
  published_at: string | null;
  external_url: string | null;
}

// ---- Offline fallback data ----

const OFFLINE_QUESTIONS = {
  categories: [
    {
      id: 'topics',
      title: 'Your Interests',
      questions: [
        {
          id: 'topics_interested',
          text: 'Which topics excite you most? (Pick 3-5)',
          type: 'multi_select' as const,
          options: [
            'Artificial Intelligence & ML', 'Startups & Business',
            'Science & Technology', 'Programming & DevTools',
            'Philosophy & Psychology', 'Health & Biohacking',
            'Finance & Investing', 'Design & UX',
            'Climate & Energy', 'Culture & Society',
            'Gaming & Entertainment', 'Politics & Policy',
          ],
        },
        {
          id: 'content_tone',
          text: 'What tone do you prefer in your reading?',
          type: 'multiple_choice' as const,
          options: ['Analytical & Deep', 'Casual & Conversational', 'Concise & Practical', 'Storytelling & Narrative'],
        },
      ],
    },
    {
      id: 'depth',
      title: 'Reading Depth',
      questions: [
        {
          id: 'reading_depth',
          text: 'How deep should your daily reads go?',
          type: 'multiple_choice' as const,
          options: ['Quick summaries', 'Balanced', 'Deep dives', 'Mixed'],
        },
        {
          id: 'content_types',
          text: 'What types of content do you enjoy?',
          type: 'multi_select' as const,
          options: ['News & Current Events', 'Long-form Essays', 'Tutorials', 'Opinion & Analysis', 'Research Papers'],
        },
      ],
    },
    {
      id: 'sources',
      title: 'Content Sources',
      questions: [
        {
          id: 'source_preference',
          text: 'Where should we find content?',
          type: 'multi_select' as const,
          options: ['HackerNews', 'Reddit', 'RSS Feeds', 'Twitter/X'],
        },
        {
          id: 'content_volume',
          text: 'How much per digest?',
          type: 'multiple_choice' as const,
          options: ['Light (3-5)', 'Moderate (6-10)', 'Generous (11-15)', 'Deep (16-20)'],
        },
      ],
    },
  ],
};

// ---- API Service ----

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = POSSIBLE_URLS[0];
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  /**
   * Try to reach the backend. Returns the first working URL or null.
   * Called on app startup to find a live backend.
   */
  async probeBackend(): Promise<string | null> {
    for (const url of POSSIBLE_URLS) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2000);
        const resp = await fetch(`${url}/health`, { signal: controller.signal });
        clearTimeout(timer);
        if (resp.ok) {
          this.baseUrl = url;
          return url;
        }
      } catch {
        // Try next URL
      }
    }
    return null;
  }

  get isOnline(): boolean {
    return this.baseUrl !== POSSIBLE_URLS[0] || false;
  }

  private async safeRequest<T>(
    path: string,
    options: RequestInit = {},
    fallback: T,
  ): Promise<T> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const url = `${this.baseUrl}${path}`;
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      clearTimeout(timer);
      if (!response.ok) {
        return fallback;
      }
      return response.json();
    } catch {
      return fallback;
    }
  }

  // ---- Onboarding ----

  async getQuestions(): Promise<OnboardingQuestions> {
    return this.safeRequest<OnboardingQuestions>(
      '/api/onboarding/questions',
      {},
      OFFLINE_QUESTIONS,
    );
  }

  async saveProfile(profile: OnboardingProfile): Promise<{ status?: string; user_id?: number } | null> {
    return this.safeRequest<{ status?: string; user_id?: number } | null>(
      '/api/onboarding/profile',
      { method: 'POST', body: JSON.stringify(profile) },
      null, // null means offline — caller handles this
    );
  }

  async getOnboardingStatus(deviceId: string): Promise<{ onboarded: boolean }> {
    return this.safeRequest<{ onboarded: boolean }>(
      `/api/onboarding/status/${deviceId}`,
      {},
      { onboarded: false },
    );
  }

  // ---- Digest ----

  /** Generate a fresh digest with a 5-minute timeout.
   *  On first load, the backend fetches from multiple sources (RSS, HN, Reddit)
   *  and runs AI summarization — this takes 3-4 minutes.
   */
  async generateDigest(deviceId: string, forceRefresh = false): Promise<DigestResponse> {
    // Use AbortController with 5-minute timeout for the long generation
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 300_000); // 5 minutes

    try {
      const url = `${this.baseUrl}/api/digest/generate`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: deviceId, force_refresh: forceRefresh }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (response.ok) {
        const data = await response.json();
        if (data && data.items && data.items.length > 0) {
          return data;
        }
        return { items: [], generated_at: new Date().toISOString() };
      }
      // Server returned an error — try reading from GET endpoint as fallback
      console.log('[API] generateDigest: server error', response.status);
      return this.getLatestDigest(deviceId);
    } catch (err) {
      clearTimeout(timer);
      console.log('[API] generateDigest: fetch failed', err);
      // If the POST failed, try GET (cached articles) as fallback
      return this.getLatestDigest(deviceId);
    }
  }

  /** Get latest cached digest (fast — no generation). */
  async getLatestDigest(deviceId: string): Promise<DigestResponse> {
    return this.safeRequest<DigestResponse>(
      `/api/digest/${deviceId}`,
      {},
      { items: [], generated_at: new Date().toISOString() },
    );
  }

  // ---- Articles ----

  async getArticle(articleId: number): Promise<ArticleRead | null> {
    return this.safeRequest<ArticleRead | null>(
      `/api/articles/${articleId}`,
      {},
      null,
    );
  }

  async bookmarkArticle(articleId: number, userId: number): Promise<void> {
    await this.safeRequest(
      `/api/articles/${articleId}/bookmark?user_id=${userId}`,
      { method: 'POST' },
      null,
    );
  }

  async markRead(articleId: number, userId: number): Promise<void> {
    await this.safeRequest(
      `/api/articles/${articleId}/read?user_id=${userId}`,
      { method: 'POST' },
      null,
    );
  }
}

export const api = new ApiService();
export default api;
