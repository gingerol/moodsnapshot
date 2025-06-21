export interface MoodEntry {
  id: string
  date: string // ISO date string
  mood: MoodValue
  tags: string[]
  notes?: string
  createdAt: string // ISO datetime string
  updatedAt: string // ISO datetime string
}

export type MoodValue = 1 | 2 | 3 | 4 | 5

export interface MoodConfig {
  labels: Record<MoodValue, string>
  colors: Record<MoodValue, string>
  emojis: Record<MoodValue, string>
}

export interface UserSettings {
  id: 'user-settings'
  moodConfig: MoodConfig
  reminderEnabled: boolean
  reminderTime?: string // HH:MM format
  theme: 'light' | 'dark' | 'auto'
  createdAt: string
  updatedAt: string
}

export interface AppData {
  version: number
  moods: MoodEntry[]
  settings: UserSettings
  tags: string[] // Frequently used tags for autocomplete
}

// Default configurations
export const DEFAULT_MOOD_CONFIG: MoodConfig = {
  labels: {
    1: 'Very Sad',
    2: 'Sad',
    3: 'Neutral',
    4: 'Happy',
    5: 'Very Happy',
  },
  colors: {
    1: '#dc2626', // red-600
    2: '#f97316', // orange-500
    3: '#6b7280', // gray-500
    4: '#16a34a', // green-600
    5: '#22c55e', // green-500
  },
  emojis: {
    1: '😢',
    2: '😞',
    3: '😐',
    4: '😊',
    5: '😄',
  },
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  id: 'user-settings',
  moodConfig: DEFAULT_MOOD_CONFIG,
  reminderEnabled: false,
  theme: 'auto',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}