import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db } from '../../src/utils/database'
import type { MoodValue } from '../../src/types/mood'

describe('Database', () => {
  beforeEach(async () => {
    await db.init()
  })

  afterEach(async () => {
    // Clean up test data
    const moods = await db.getAllMoods()
    for (const mood of moods) {
      await db.deleteMood(mood.id)
    }
  })

  describe('Mood operations', () => {
    it('should save and retrieve a mood', async () => {
      const today = new Date().toISOString().split('T')[0]
      const moodData = {
        date: today,
        mood: 4 as MoodValue,
        tags: ['happy', 'work'],
      }

      const savedMood = await db.saveMood(moodData)

      expect(savedMood.id).toBeDefined()
      expect(savedMood.date).toBe(today)
      expect(savedMood.mood).toBe(4)
      expect(savedMood.tags).toEqual(['happy', 'work'])
      expect(savedMood.createdAt).toBeDefined()
      expect(savedMood.updatedAt).toBeDefined()
    })

    it('should get mood by date', async () => {
      const today = new Date().toISOString().split('T')[0]
      const moodData = {
        date: today,
        mood: 3 as MoodValue,
        tags: ['neutral'],
      }

      await db.saveMood(moodData)
      const retrievedMood = await db.getMoodByDate(today)

      expect(retrievedMood).toBeDefined()
      expect(retrievedMood?.mood).toBe(3)
      expect(retrievedMood?.date).toBe(today)
    })

    it('should update an existing mood', async () => {
      const today = new Date().toISOString().split('T')[0]
      const moodData = {
        date: today,
        mood: 2 as MoodValue,
        tags: ['sad'],
      }

      const savedMood = await db.saveMood(moodData)
      const updatedMood = await db.updateMood(savedMood.id, {
        mood: 5 as MoodValue,
        tags: ['very-happy', 'improved'],
      })

      expect(updatedMood.mood).toBe(5)
      expect(updatedMood.tags).toEqual(['very-happy', 'improved'])
      expect(updatedMood.updatedAt).not.toBe(savedMood.updatedAt)
    })

    it('should get moods in date range', async () => {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const todayStr = today.toISOString().split('T')[0]
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      const tomorrowStr = tomorrow.toISOString().split('T')[0]

      // Save moods for different dates
      await db.saveMood({ date: yesterdayStr, mood: 2 as MoodValue, tags: [] })
      await db.saveMood({ date: todayStr, mood: 4 as MoodValue, tags: [] })
      await db.saveMood({ date: tomorrowStr, mood: 3 as MoodValue, tags: [] })

      const moodsInRange = await db.getMoodsInRange(yesterdayStr, todayStr)

      expect(moodsInRange).toHaveLength(2)
      expect(moodsInRange.some(m => m.date === yesterdayStr)).toBe(true)
      expect(moodsInRange.some(m => m.date === todayStr)).toBe(true)
      expect(moodsInRange.some(m => m.date === tomorrowStr)).toBe(false)
    })

    it('should delete a mood', async () => {
      const today = new Date().toISOString().split('T')[0]
      const moodData = {
        date: today,
        mood: 1 as MoodValue,
        tags: ['test'],
      }

      const savedMood = await db.saveMood(moodData)
      await db.deleteMood(savedMood.id)

      const retrievedMood = await db.getMood(savedMood.id)
      expect(retrievedMood).toBeUndefined()
    })
  })

  describe('Settings operations', () => {
    it('should get default settings', async () => {
      const settings = await db.getSettings()

      expect(settings.id).toBe('user-settings')
      expect(settings.moodConfig).toBeDefined()
      expect(settings.moodConfig.labels).toBeDefined()
      expect(settings.moodConfig.colors).toBeDefined()
      expect(settings.moodConfig.emojis).toBeDefined()
      expect(settings.reminderEnabled).toBe(false)
      expect(settings.theme).toBe('auto')
    })

    it('should update settings', async () => {
      const updatedSettings = await db.updateSettings({
        reminderEnabled: true,
        reminderTime: '09:00',
      })

      expect(updatedSettings.reminderEnabled).toBe(true)
      expect(updatedSettings.reminderTime).toBe('09:00')

      // Verify persistence
      const retrievedSettings = await db.getSettings()
      expect(retrievedSettings.reminderEnabled).toBe(true)
      expect(retrievedSettings.reminderTime).toBe('09:00')
    })
  })

  describe('Tag operations', () => {
    it('should track frequent tags', async () => {
      const today = new Date().toISOString().split('T')[0]

      // Create moods with various tags
      await db.saveMood({ date: today, mood: 4 as MoodValue, tags: ['work', 'happy'] })
      await db.saveMood({ date: `${today}T01:00:00`, mood: 3 as MoodValue, tags: ['work', 'stress'] })
      await db.saveMood({ date: `${today}T02:00:00`, mood: 5 as MoodValue, tags: ['exercise', 'happy'] })

      const frequentTags = await db.getFrequentTags(10)

      expect(frequentTags).toContain('work')
      expect(frequentTags).toContain('happy')
      expect(frequentTags).toContain('stress')
      expect(frequentTags).toContain('exercise')
    })
  })

  describe('Data export/import', () => {
    it('should export data as JSON', async () => {
      const today = new Date().toISOString().split('T')[0]
      await db.saveMood({ date: today, mood: 4 as MoodValue, tags: ['test-export'] })

      const exportedData = await db.exportData()
      const parsed = JSON.parse(exportedData)

      expect(parsed.version).toBeDefined()
      expect(parsed.exportDate).toBeDefined()
      expect(parsed.moods).toBeDefined()
      expect(parsed.settings).toBeDefined()
      expect(Array.isArray(parsed.moods)).toBe(true)
      expect(parsed.moods.some((m: any) => m.tags.includes('test-export'))).toBe(true)
    })

    it('should import data from JSON', async () => {
      const testData = {
        version: 1,
        exportDate: new Date().toISOString(),
        moods: [
          {
            id: 'test-import-1',
            date: '2024-01-01',
            mood: 4,
            tags: ['imported'],
            createdAt: '2024-01-01T10:00:00.000Z',
            updatedAt: '2024-01-01T10:00:00.000Z',
          }
        ],
        settings: {
          id: 'user-settings',
          reminderEnabled: true,
          reminderTime: '20:00',
          theme: 'light'
        }
      }

      await db.importData(JSON.stringify(testData))

      const importedMood = await db.getMood('test-import-1')
      expect(importedMood).toBeDefined()
      expect(importedMood?.tags).toContain('imported')

      const settings = await db.getSettings()
      expect(settings.reminderEnabled).toBe(true)
      expect(settings.reminderTime).toBe('20:00')
    })
  })
})