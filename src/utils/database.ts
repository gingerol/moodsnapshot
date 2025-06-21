import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { MoodEntry, UserSettings } from '../types/mood'
import { DEFAULT_USER_SETTINGS } from '../types/mood'

// Database schema definition
interface MoodSnapshotDB extends DBSchema {
  moods: {
    key: string
    value: MoodEntry
    indexes: {
      'by-date': string
      'by-mood': number
    }
  }
  settings: {
    key: string
    value: UserSettings
  }
  tags: {
    key: string
    value: {
      tag: string
      count: number
      lastUsed: string
    }
  }
}

class DatabaseManager {
  private db: IDBPDatabase<MoodSnapshotDB> | null = null
  private readonly dbName = 'mood-snapshot'
  private readonly version = 1

  async init(): Promise<void> {
    try {
      console.log('📀 Opening IndexedDB...')
      
      this.db = await openDB<MoodSnapshotDB>(this.dbName, this.version, {
        upgrade(db, oldVersion, newVersion) {
          console.log(
            `Upgrading database from version ${oldVersion} to ${newVersion}`
          )

          // Create moods store
          if (!db.objectStoreNames.contains('moods')) {
            console.log('Creating moods store...')
            const moodStore = db.createObjectStore('moods', { keyPath: 'id' })
            moodStore.createIndex('by-date', 'date')
            moodStore.createIndex('by-mood', 'mood')
          }

          // Create settings store
          if (!db.objectStoreNames.contains('settings')) {
            console.log('Creating settings store...')
            db.createObjectStore('settings', { keyPath: 'id' })
          }

          // Create tags store
          if (!db.objectStoreNames.contains('tags')) {
            console.log('Creating tags store...')
            db.createObjectStore('tags', { keyPath: 'tag' })
          }
        },
        blocked() {
          console.warn('Database upgrade blocked by another tab')
        },
        blocking() {
          console.warn('Database is blocking another upgrade')
        },
      })

      console.log('✓ IndexedDB opened successfully')

      // Initialize default settings if they don't exist
      console.log('🔧 Initializing default settings...')
      await this.initializeDefaultSettings()
      console.log('✓ Default settings initialized')
      
    } catch (error) {
      console.error('Failed to initialize database:', error)
      throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async initializeDefaultSettings(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    try {
      console.log('🔍 Checking for existing settings...')
      const existingSettings = await this.db.get('settings', 'user-settings')
      
      if (!existingSettings) {
        console.log('💾 Creating default settings...')
        await this.db.put('settings', { ...DEFAULT_USER_SETTINGS })
        console.log('✓ Default settings created')
      } else {
        console.log('✓ Existing settings found')
      }
    } catch (error) {
      console.error('Error initializing default settings:', error)
      throw new Error(`Failed to initialize default settings: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Mood operations
  async saveMood(mood: Omit<MoodEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<MoodEntry> {
    if (!this.db) throw new Error('Database not initialized')

    const now = new Date().toISOString()
    const moodEntry: MoodEntry = {
      ...mood,
      id: `mood-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    }

    await this.db.put('moods', moodEntry)

    // Update tag usage statistics
    await this.updateTagUsage(mood.tags)

    return moodEntry
  }

  async getMood(id: string): Promise<MoodEntry | undefined> {
    if (!this.db) throw new Error('Database not initialized')
    return this.db.get('moods', id)
  }

  async getMoodByDate(date: string): Promise<MoodEntry | undefined> {
    if (!this.db) throw new Error('Database not initialized')
    
    const tx = this.db.transaction('moods', 'readonly')
    const index = tx.store.index('by-date')
    const moods = await index.getAll(date)
    
    // Return the most recent mood for the date
    return moods.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  }

  async getMoodsInRange(startDate: string, endDate: string): Promise<MoodEntry[]> {
    if (!this.db) throw new Error('Database not initialized')
    
    const tx = this.db.transaction('moods', 'readonly')
    const index = tx.store.index('by-date')
    const range = IDBKeyRange.bound(startDate, endDate)
    
    return index.getAll(range)
  }

  async getAllMoods(): Promise<MoodEntry[]> {
    if (!this.db) throw new Error('Database not initialized')
    return this.db.getAll('moods')
  }

  async updateMood(id: string, updates: Partial<Omit<MoodEntry, 'id' | 'createdAt'>>): Promise<MoodEntry> {
    if (!this.db) throw new Error('Database not initialized')
    
    const existing = await this.getMood(id)
    if (!existing) {
      throw new Error('Mood entry not found')
    }

    const updated: MoodEntry = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    await this.db.put('moods', updated)

    // Update tag usage if tags changed
    if (updates.tags) {
      await this.updateTagUsage(updates.tags)
    }

    return updated
  }

  async deleteMood(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    await this.db.delete('moods', id)
  }

  // Settings operations
  async getSettings(): Promise<UserSettings> {
    if (!this.db) throw new Error('Database not initialized')
    
    const settings = await this.db.get('settings', 'user-settings')
    return settings || { ...DEFAULT_USER_SETTINGS }
  }

  async updateSettings(updates: Partial<Omit<UserSettings, 'id'>>): Promise<UserSettings> {
    if (!this.db) throw new Error('Database not initialized')
    
    const existing = await this.getSettings()
    const updated: UserSettings = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    await this.db.put('settings', updated)
    return updated
  }

  // Tag operations
  private async updateTagUsage(tags: string[]): Promise<void> {
    if (!this.db || tags.length === 0) return

    const tx = this.db.transaction('tags', 'readwrite')
    const now = new Date().toISOString()

    for (const tag of tags) {
      const existing = await tx.store.get(tag)
      if (existing) {
        await tx.store.put({
          tag,
          count: existing.count + 1,
          lastUsed: now,
        })
      } else {
        await tx.store.put({
          tag,
          count: 1,
          lastUsed: now,
        })
      }
    }

    await tx.done
  }

  async getFrequentTags(limit = 20): Promise<string[]> {
    if (!this.db) throw new Error('Database not initialized')
    
    const allTags = await this.db.getAll('tags')
    return allTags
      .sort((a, b) => b.count - a.count || b.lastUsed.localeCompare(a.lastUsed))
      .slice(0, limit)
      .map(tag => tag.tag)
  }

  // Data export/import
  async exportData(): Promise<string> {
    if (!this.db) throw new Error('Database not initialized')
    
    const moods = await this.getAllMoods()
    const settings = await this.getSettings()
    const tags = await this.getFrequentTags()

    const exportData = {
      version: this.version,
      exportDate: new Date().toISOString(),
      moods,
      settings,
      tags,
    }

    return JSON.stringify(exportData, null, 2)
  }

  async importData(jsonData: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    try {
      const data = JSON.parse(jsonData)
      
      // Validate data structure
      if (!data.moods || !Array.isArray(data.moods)) {
        throw new Error('Invalid data format')
      }

      const tx = this.db.transaction(['moods', 'settings'], 'readwrite')

      // Import moods
      for (const mood of data.moods) {
        await tx.objectStore('moods').put(mood)
      }

      // Import settings if provided
      if (data.settings) {
        await tx.objectStore('settings').put(data.settings)
      }

      await tx.done
    } catch (error) {
      console.error('Import failed:', error)
      throw new Error('Failed to import data')
    }
  }

  // Cleanup old data (optional feature for privacy)
  async cleanupOldData(daysToKeep = 365): Promise<number> {
    if (!this.db) throw new Error('Database not initialized')
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    const cutoffString = cutoffDate.toISOString().split('T')[0]

    const tx = this.db.transaction('moods', 'readwrite')
    const index = tx.store.index('by-date')
    const range = IDBKeyRange.upperBound(cutoffString, true)
    
    let deletedCount = 0
    let cursor = await index.openCursor(range)

    while (cursor) {
      await cursor.delete()
      deletedCount++
      cursor = await cursor.continue()
    }

    await tx.done
    return deletedCount
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

// Singleton instance
export const db = new DatabaseManager()

// Initialize database on module load
export const initializeDatabase = async (): Promise<void> => {
  await db.init()
}