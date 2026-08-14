export interface User {
  id: number;
  email: string;
  name?: string;
  profile_image_url?: string;
  auth_provider: string;
  created_at: string;
}

export interface UserSettings {
  id: number;
  user_id: number;
  theme: string;
  theme_preset: string;
  background_type: string;
  background_value: string;
  background_opacity: number;
  accent_color: string;
  glass_intensity: string;
  glass_opacity?: number;
  glass_blur?: number;
  default_model: string;
  system_prompt?: string;
  temperature?: number;
  enter_to_send: boolean;
  show_timestamps: boolean;
  stream_responses: boolean;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  created_at: string;
  isStreaming?: boolean;
}

export interface Conversation {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
