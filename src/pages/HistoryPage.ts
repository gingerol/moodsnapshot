import { db } from '../utils/database'
import { errorManager, withErrorHandling } from '../utils/error-handler'
import type { MoodEntry, MoodValue, UserSettings } from '../types/mood'

interface CalendarDay {
  date: string
  mood?: MoodEntry
  isCurrentMonth: boolean
  isToday: boolean
}

export class HistoryPage {
  private currentDate: Date = new Date()
  private moods: Map<string, MoodEntry> = new Map()
  private selectedEntry: MoodEntry | null = null
  private settings: UserSettings | null = null

  async render(): Promise<HTMLElement> {
    const container = document.createElement('div')
    container.className = 'container p-6'

    try {
      await this.loadData()
      container.innerHTML = this.getHTML()
      this.attachEventListeners(container)
    } catch (error) {
      container.innerHTML = this.getErrorHTML()
    }

    return container
  }

  private async loadData(): Promise<void> {
    // Load user settings for mood configuration
    this.settings = await withErrorHandling(
      () => db.getSettings(),
      'LOAD_USER_SETTINGS'
    )

    // Load moods for the current month
    await this.loadMoodsForMonth()
  }

  private async loadMoodsForMonth(): Promise<void> {
    const startOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1)
    const endOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0)
    
    // Extend range to include prev/next month days shown in calendar
    const startDate = new Date(startOfMonth)
    startDate.setDate(startDate.getDate() - startDate.getDay())
    
    const endDate = new Date(endOfMonth)
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))

    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    const moods = await withErrorHandling(
      () => db.getMoodsInRange(startDateStr, endDateStr),
      'LOAD_MOOD_HISTORY'
    ) || []

    // Create map for quick lookup
    this.moods.clear()
    moods.forEach(mood => {
      this.moods.set(mood.date, mood)
    })
  }

  private getHTML(): string {
    return `
      <div>
        <header class="mb-6">
          <h1 class="text-2xl font-semibold mb-2">Mood History</h1>
          <p class="text-gray-500">View your mood patterns over time</p>
        </header>

        ${this.getCalendarHTML()}
        ${this.getMoodDetailHTML()}
        ${this.getStatsHTML()}
      </div>
    `
  }

  private getCalendarHTML(): string {
    const monthName = this.currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    })

    return `
      <div class="card mb-6">
        <div class="flex items-center justify-between mb-4">
          <button 
            id="prev-month" 
            class="btn btn-secondary"
            aria-label="Previous month"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          
          <h2 class="text-lg font-medium">${monthName}</h2>
          
          <button 
            id="next-month" 
            class="btn btn-secondary"
            aria-label="Next month"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        <div class="calendar-grid">
          ${this.getCalendarGridHTML()}
        </div>
      </div>
    `
  }

  private getCalendarGridHTML(): string {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const calendarDays = this.generateCalendarDays()

    return `
      <!-- Calendar header -->
      <div class="grid grid-cols-7 gap-1 mb-2">
        ${daysOfWeek.map(day => `
          <div class="text-center text-xs font-medium text-gray-500 py-2">
            ${day}
          </div>
        `).join('')}
      </div>

      <!-- Calendar days -->
      <div class="grid grid-cols-7 gap-1">
        ${calendarDays.map(day => `
          <button
            class="calendar-day ${day.isCurrentMonth ? 'current-month' : 'other-month'} ${day.isToday ? 'today' : ''} ${day.mood ? 'has-mood' : ''}"
            data-date="${day.date}"
            aria-label="View mood for ${new Date(day.date + 'T00:00:00').toLocaleDateString()}"
          >
            <span class="day-number">${new Date(day.date + 'T00:00:00').getDate()}</span>
            ${day.mood ? this.getMoodIndicatorHTML(day.mood.mood) : ''}
          </button>
        `).join('')}
      </div>
    `
  }

  private generateCalendarDays(): CalendarDay[] {
    const days: CalendarDay[] = []
    const today = new Date().toISOString().split('T')[0]
    
    const startOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1)
    const endOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0)
    
    // Start from the first day of the week containing the first day of the month
    const startDate = new Date(startOfMonth)
    startDate.setDate(startDate.getDate() - startDate.getDay())
    
    // Generate 42 days (6 weeks) to fill the calendar grid
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      
      const dateStr = currentDate.toISOString().split('T')[0]
      const isCurrentMonth = currentDate.getMonth() === this.currentDate.getMonth()
      
      days.push({
        date: dateStr,
        mood: this.moods.get(dateStr),
        isCurrentMonth,
        isToday: dateStr === today
      })
    }

    return days
  }

  private getMoodIndicatorHTML(mood: MoodValue): string {
    if (!this.settings) {
      // Fallback to default if settings not loaded
      const moodData = {
        1: { emoji: '😢', color: '#dc2626' },
        2: { emoji: '😞', color: '#f97316' },
        3: { emoji: '😐', color: '#6b7280' },
        4: { emoji: '😊', color: '#16a34a' },
        5: { emoji: '😄', color: '#22c55e' },
      }
      const data = moodData[mood]
      return `<span class="mood-indicator" style="color: ${data.color}">${data.emoji}</span>`
    }

    const emoji = this.settings.moodConfig.emojis[mood]
    const color = this.settings.moodConfig.colors[mood]
    return `
      <span class="mood-indicator" style="color: ${color}">
        ${emoji}
      </span>
    `
  }

  private getMoodDetailHTML(): string {
    if (!this.selectedEntry) {
      return `
        <div class="card mb-6 text-center text-gray-500">
          <p>Select a date from the calendar to view mood details</p>
        </div>
      `
    }

    const date = new Date(this.selectedEntry.date + 'T00:00:00')
    const dateString = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const moodLabels = this.settings ? this.settings.moodConfig.labels : {
      1: 'Very Sad',
      2: 'Sad', 
      3: 'Neutral',
      4: 'Happy',
      5: 'Very Happy'
    }

    return `
      <div class="card mb-6" id="mood-detail">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h3 class="text-lg font-medium">${dateString}</h3>
            <p class="text-sm text-gray-500">
              Logged at ${new Date(this.selectedEntry.createdAt).toLocaleTimeString()}
            </p>
          </div>
          <button 
            id="close-detail"
            class="text-gray-400 hover:text-gray-600"
            aria-label="Close details"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="flex items-center gap-3 mb-4">
          ${this.getMoodIndicatorHTML(this.selectedEntry.mood)}
          <span class="text-lg font-medium">${moodLabels[this.selectedEntry.mood]}</span>
        </div>

        ${this.selectedEntry.tags.length > 0 ? `
          <div class="mb-4">
            <h4 class="text-sm font-medium text-gray-700 mb-2">Influences:</h4>
            <div class="flex flex-wrap gap-2">
              ${this.selectedEntry.tags.map(tag => `
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  ${tag}
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="flex gap-2 mt-4">
          <button 
            id="edit-mood"
            class="btn btn-secondary text-sm"
          >
            Edit Mood
          </button>
          <button 
            id="delete-mood"
            class="btn btn-secondary text-sm text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>
    `
  }

  private getStatsHTML(): string {
    const currentMonthMoods = Array.from(this.moods.values())
      .filter(mood => {
        const moodDate = new Date(mood.date + 'T00:00:00')
        return moodDate.getMonth() === this.currentDate.getMonth() &&
               moodDate.getFullYear() === this.currentDate.getFullYear()
      })

    if (currentMonthMoods.length === 0) {
      return `
        <div class="card text-center text-gray-500">
          <p>No mood entries for this month yet</p>
        </div>
      `
    }

    const averageMood = currentMonthMoods.reduce((sum, mood) => sum + mood.mood, 0) / currentMonthMoods.length
    const moodCounts = currentMonthMoods.reduce((counts, mood) => {
      counts[mood.mood] = (counts[mood.mood] || 0) + 1
      return counts
    }, {} as Record<MoodValue, number>)

    const mostCommonMood = Object.entries(moodCounts)
      .reduce((max, [mood, count]) => count > max.count ? { mood: parseInt(mood) as MoodValue, count } : max, 
              { mood: 3 as MoodValue, count: 0 })

    const monthName = this.currentDate.toLocaleDateString('en-US', { month: 'long' })

    return `
      <div class="card">
        <h3 class="text-lg font-medium mb-4">${monthName} Summary</h3>
        
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="text-center">
            <div class="text-2xl font-semibold text-primary-600">${currentMonthMoods.length}</div>
            <div class="text-sm text-gray-500">Days logged</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-semibold text-primary-600">${averageMood.toFixed(1)}</div>
            <div class="text-sm text-gray-500">Average mood</div>
          </div>
        </div>

        <div class="text-center">
          <div class="text-sm text-gray-500 mb-1">Most common mood</div>
          <div class="flex items-center justify-center gap-2">
            ${this.getMoodIndicatorHTML(mostCommonMood.mood)}
            <span class="font-medium">${mostCommonMood.count} days</span>
          </div>
        </div>
      </div>
    `
  }

  private getErrorHTML(): string {
    return `
      <div class="card error text-center">
        <h2 class="text-xl mb-4">😔 Something went wrong</h2>
        <p class="mb-6">
          We couldn't load your mood history. Please try refreshing the page.
        </p>
        <button class="btn btn-primary" onclick="location.reload()">
          Refresh Page
        </button>
      </div>
    `
  }

  private attachEventListeners(container: HTMLElement): void {
    // Month navigation
    const prevButton = container.querySelector('#prev-month')
    const nextButton = container.querySelector('#next-month')

    prevButton?.addEventListener('click', () => {
      this.navigateMonth(-1, container)
    })

    nextButton?.addEventListener('click', () => {
      this.navigateMonth(1, container)
    })

    // Calendar day clicks
    const calendarDays = container.querySelectorAll('.calendar-day')
    calendarDays.forEach(day => {
      day.addEventListener('click', () => {
        const date = day.getAttribute('data-date')
        if (date) {
          this.selectDate(date, container)
        }
      })
    })

    // Detail panel actions
    this.attachDetailEventListeners(container)
  }

  private attachDetailEventListeners(container: HTMLElement): void {
    const closeButton = container.querySelector('#close-detail')
    const editButton = container.querySelector('#edit-mood')
    const deleteButton = container.querySelector('#delete-mood')

    closeButton?.addEventListener('click', () => {
      this.selectedEntry = null
      this.updateMoodDetail(container)
    })

    editButton?.addEventListener('click', () => {
      if (this.selectedEntry) {
        // Navigate to home page with the selected date
        window.history.pushState({}, '', `/?date=${this.selectedEntry.date}`)
        window.dispatchEvent(new PopStateEvent('popstate'))
      }
    })

    deleteButton?.addEventListener('click', () => {
      if (this.selectedEntry) {
        this.deleteMoodEntry(this.selectedEntry, container)
      }
    })
  }

  private async navigateMonth(direction: number, container: HTMLElement): Promise<void> {
    this.currentDate.setMonth(this.currentDate.getMonth() + direction)
    this.selectedEntry = null

    try {
      await this.loadMoodsForMonth()
      
      // Update calendar
      const calendarGrid = container.querySelector('.calendar-grid')
      if (calendarGrid) {
        calendarGrid.innerHTML = this.getCalendarGridHTML()
      }

      // Update month header
      const monthName = this.currentDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      })
      const monthHeader = container.querySelector('h2')
      if (monthHeader) {
        monthHeader.textContent = monthName
      }

      // Update mood detail and stats
      this.updateMoodDetail(container)
      this.updateStats(container)

      // Reattach event listeners for new calendar days
      this.attachCalendarDayListeners(container)

    } catch (error) {
      errorManager.handleError(
        error instanceof Error ? error : new Error('Failed to navigate month'),
        'medium',
        'NAVIGATE_MONTH_ERROR'
      )
    }
  }

  private attachCalendarDayListeners(container: HTMLElement): void {
    const calendarDays = container.querySelectorAll('.calendar-day')
    calendarDays.forEach(day => {
      day.addEventListener('click', () => {
        const date = day.getAttribute('data-date')
        if (date) {
          this.selectDate(date, container)
        }
      })
    })
  }

  private selectDate(date: string, container: HTMLElement): void {
    const mood = this.moods.get(date)
    this.selectedEntry = mood || null
    this.updateMoodDetail(container)
  }

  private updateMoodDetail(container: HTMLElement): void {
    const detailContainer = container.querySelector('#mood-detail')?.parentElement
    if (detailContainer) {
      const newDetail = document.createElement('div')
      newDetail.innerHTML = this.getMoodDetailHTML()
      
      const oldDetail = detailContainer.querySelector('.card')
      if (oldDetail) {
        detailContainer.replaceChild(newDetail.firstElementChild!, oldDetail)
      }

      this.attachDetailEventListeners(container)
    }
  }

  private updateStats(container: HTMLElement): void {
    const statsContainer = container.querySelector('.card:last-child')
    if (statsContainer) {
      const newStats = document.createElement('div')
      newStats.innerHTML = this.getStatsHTML()
      
      const parent = statsContainer.parentElement
      if (parent) {
        parent.replaceChild(newStats.firstElementChild!, statsContainer)
      }
    }
  }

  private async deleteMoodEntry(entry: MoodEntry, container: HTMLElement): Promise<void> {
    if (!confirm('Are you sure you want to delete this mood entry?')) {
      return
    }

    try {
      await db.deleteMood(entry.id)
      
      // Remove from local map
      this.moods.delete(entry.date)
      
      // Clear selection
      this.selectedEntry = null
      
      // Update UI
      this.updateMoodDetail(container)
      this.updateStats(container)
      
      // Update calendar
      const calendarGrid = container.querySelector('.calendar-grid')
      if (calendarGrid) {
        calendarGrid.innerHTML = this.getCalendarGridHTML()
        this.attachCalendarDayListeners(container)
      }

      // Show success message
      this.showSuccessMessage('Mood entry deleted successfully')

    } catch (error) {
      errorManager.handleError(
        error instanceof Error ? error : new Error('Failed to delete mood'),
        'medium',
        'DELETE_MOOD_ERROR'
      )
      
      this.showErrorMessage('Failed to delete mood entry')
    }
  }

  private showSuccessMessage(message: string): void {
    const toast = document.createElement('div')
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50'
    toast.textContent = `✓ ${message}`
    document.body.appendChild(toast)

    setTimeout(() => {
      toast.remove()
    }, 3000)
  }

  private showErrorMessage(message: string): void {
    const toast = document.createElement('div')
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50'
    toast.textContent = `✗ ${message}`
    document.body.appendChild(toast)

    setTimeout(() => {
      toast.remove()
    }, 5000)
  }
}