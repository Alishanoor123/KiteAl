export type ReflectionMode = 'reflect' | 'summary' | 'brainstorm' | 'action_items' | 'deep_inquiry';

export type EntryMood = 'Focused' | 'Reflective' | 'Anxious' | 'Creative' | 'Happy' | 'Reflected';

export interface JournalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  mode?: ReflectionMode;
  modelUsed?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  previewText?: string;
  messages: JournalMessage[];
  createdAt: number;
  updatedAt: number;
  tags?: string[];
  mood?: EntryMood;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

