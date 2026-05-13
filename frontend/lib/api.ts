import { createClient } from './supabase';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Types
export interface SkillRequest {
  user_id: string;
  title: string;
  description: string;
}

export interface MatchResponse {
  id: string;
  teacher_id: string;
  learner_id: string;
  skill_offered_id: string;
  skill_needed_id: string;
  score: number;
  status: string;
  created_at: string;
}

export interface ChatMessage {
  sender_id: string;
  content: string;
}

export interface AiCoachRequest {
  session_id: string;
  messages: ChatMessage[];
  message_count: number;
}

/**
 * Helper to get the auth token and make an authenticated request
 */
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  const token = session?.access_token;
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
    } catch (e) {
      // Ignore if not json
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Skills
  offerSkill: (data: SkillRequest) => 
    fetchWithAuth('/api/v1/skills/offer', { method: 'POST', body: JSON.stringify(data) }),
  
  needSkill: (data: SkillRequest) => 
    fetchWithAuth('/api/v1/skills/need', { method: 'POST', body: JSON.stringify(data) }),

  // Matches
  getMatches: (userId: string) => 
    fetchWithAuth(`/api/v1/matches/${userId}`, { method: 'GET' }),

  // AI Coach Stream (SSE)
  streamCoachResponse: async function* (data: AiCoachRequest) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(`${API_BASE}/api/v1/chat/coach`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    });

    if (response.status === 204) {
      return; // No AI response needed
    }

    if (!response.ok || !response.body) {
      throw new Error('Failed to stream AI coach response');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const content = line.slice(6);
          if (content === '[DONE]') {
            return;
          }
          yield content;
        }
      }
    }
  }
};
