import { db } from '../utils/database'
import { errorManager, withErrorHandling } from '../utils/error-handler'
import type { MoodValue, MoodEntry, UserSettings } from '../types/mood'

export class HomePage {
  private selectedMood: MoodValue | null = null
  private tags: string[] = []
  private frequentTags: string[] = []
  private todaysMood: MoodEntry | null = null
  private settings: UserSettings | null = null

  async render(): Promise<HTMLElement> {
    const container = document.createElement('div')
    container.className = 'container p-6'

    try {
      // Load data
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

    // Load today's mood if exists
    const today = new Date().toISOString().split('T')[0]
    this.todaysMood = await withErrorHandling(
      () => db.getMoodByDate(today),
      'LOAD_TODAYS_MOOD'
    )

    // Load frequent tags for autocomplete
    this.frequentTags = await withErrorHandling(
      () => db.getFrequentTags(10),
      'LOAD_FREQUENT_TAGS'
    ) || []

    // Set initial state if mood already logged today
    if (this.todaysMood) {
      this.selectedMood = this.todaysMood.mood
      this.tags = [...this.todaysMood.tags]
    }
  }

  private getHTML(): string {
    const today = new Date()
    const dateString = today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const isUpdating = this.todaysMood !== null

    return `
      <div class="text-center">
        <header class="mb-8">
          <h1 class="text-3xl font-semibold mb-2">
            ${isUpdating ? 'Update your mood' : 'How are you feeling today?'}
          </h1>
          <p class="text-gray-500">${dateString}</p>
        </header>

        ${isUpdating ? `
          <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p class="text-sm text-blue-700">
              You've already logged your mood today. You can update it if you'd like.
            </p>
          </div>
        ` : ''}

        <div class="mood-selector" role="radiogroup" aria-label="Mood selection">
          ${this.getMoodOptionsHTML()}
        </div>

        <div class="mt-8">
          <label for="mood-tags" class="block text-left text-sm font-medium text-gray-700 mb-2">
            What influenced your mood? (optional)
          </label>
          <input
            type="text"
            id="mood-tags"
            class="input"
            placeholder="${this.getTagPlaceholder()}"
            value="${this.tags.join(', ')}"
            autocomplete="off"
          >
          <div id="tag-suggestions" class="hidden mt-2"></div>
          <p class="text-xs text-gray-500 mt-1">
            Use commas to separate multiple tags
          </p>
        </div>

        <button
          id="save-mood"
          class="btn btn-primary mt-8 w-full"
          ${!this.selectedMood ? 'disabled' : ''}
        >
          ${isUpdating ? 'Update Mood' : 'Save Mood'}
        </button>

        ${this.getTodaysStatsHTML()}
      </div>
    `
  }

  private getTagPlaceholder(): string {
    if (this.frequentTags.length >= 3) {
      return `e.g., ${this.frequentTags.slice(0, 4).join(', ')}...`
    }
    return 'e.g., work, sleep, exercise, friends...'
  }

  private getMoodOptionsHTML(): string {
    if (!this.settings) return ''

    const moods: Array<{ value: MoodValue; emoji: string; label: string; color: string }> = [
      { value: 1, emoji: this.settings.moodConfig.emojis[1], label: this.settings.moodConfig.labels[1], color: this.settings.moodConfig.colors[1] },
      { value: 2, emoji: this.settings.moodConfig.emojis[2], label: this.settings.moodConfig.labels[2], color: this.settings.moodConfig.colors[2] },
      { value: 3, emoji: this.settings.moodConfig.emojis[3], label: this.settings.moodConfig.labels[3], color: this.settings.moodConfig.colors[3] },
      { value: 4, emoji: this.settings.moodConfig.emojis[4], label: this.settings.moodConfig.labels[4], color: this.settings.moodConfig.colors[4] },
      { value: 5, emoji: this.settings.moodConfig.emojis[5], label: this.settings.moodConfig.labels[5], color: this.settings.moodConfig.colors[5] },
    ]

    return moods.map(mood => `
      <button
        class="mood-option ${this.selectedMood === mood.value ? 'selected' : ''}"
        data-mood="${mood.value}"
        role="radio"
        aria-checked="${this.selectedMood === mood.value}"
        aria-label="${mood.label}"
        style="border-color: ${this.selectedMood === mood.value ? mood.color : 'transparent'}"
      >
        <span role="img" aria-label="${mood.label}">${mood.emoji}</span>
      </button>
    `).join('')
  }

  private getTodaysStatsHTML(): string {
    if (!this.todaysMood) return ''

    const timeAgo = this.getTimeAgo(new Date(this.todaysMood.createdAt))
    
    return `
      <div class="mt-8 pt-6 border-t border-gray-200">
        <h3 class="text-sm font-medium text-gray-500 mb-2">Today's mood logged</h3>
        <p class="text-sm text-gray-600">
          Last updated ${timeAgo}
        </p>
      </div>
    `
  }

  private getTimeAgo(date: Date): string {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    return date.toLocaleDateString()
  }

  private getErrorHTML(): string {
    return `
      <div class="card error text-center">
        <h2 class="text-xl mb-4">😔 Something went wrong</h2>
        <p class="mb-6">
          We couldn't load the mood tracker. Please try refreshing the page.
        </p>
        <button class="btn btn-primary" onclick="location.reload()">
          Refresh Page
        </button>
      </div>
    `
  }

  private attachEventListeners(container: HTMLElement): void {
    // Mood selection
    const moodOptions = container.querySelectorAll('.mood-option')
    moodOptions.forEach(option => {
      option.addEventListener('click', () => {
        const mood = parseInt(option.getAttribute('data-mood') || '0') as MoodValue
        this.selectMood(mood, container)
      })
    })

    // Tag input with autocomplete
    const tagInput = container.querySelector('#mood-tags') as HTMLInputElement
    if (tagInput) {
      tagInput.addEventListener('input', (e) => {
        this.handleTagInput(e.target as HTMLInputElement, container)
      })

      tagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          this.saveMood(container)
        }
      })
    }

    // Save button
    const saveButton = container.querySelector('#save-mood')
    saveButton?.addEventListener('click', () => {
      this.saveMood(container)
    })
  }

  private selectMood(mood: MoodValue, container: HTMLElement): void {
    this.selectedMood = mood

    // Update UI
    const moodOptions = container.querySelectorAll('.mood-option')
    moodOptions.forEach((option, index) => {
      if (parseInt(option.getAttribute('data-mood') || '0') === mood) {
        option.classList.add('selected')
        option.setAttribute('aria-checked', 'true')
      } else {
        option.classList.remove('selected')
        option.setAttribute('aria-checked', 'false')
      }
    })

    // Enable save button
    const saveButton = container.querySelector('#save-mood') as HTMLButtonElement
    if (saveButton) {
      saveButton.disabled = false
    }
  }

  private handleTagInput(input: HTMLInputElement, container: HTMLElement): void {
    const value = input.value
    this.tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)

    // Show tag suggestions
    this.showTagSuggestions(value, container)
  }

  private showTagSuggestions(inputValue: string, container: HTMLElement): void {
    const suggestionsContainer = container.querySelector('#tag-suggestions')
    if (!suggestionsContainer) return

    const lastTag = inputValue.split(',').pop()?.trim().toLowerCase() || ''
    
    if (lastTag.length < 2) {
      suggestionsContainer.classList.add('hidden')
      return
    }

    const suggestions = this.frequentTags
      .filter(tag => tag.toLowerCase().includes(lastTag) && !this.tags.includes(tag))
      .slice(0, 5)

    if (suggestions.length === 0) {
      suggestionsContainer.classList.add('hidden')
      return
    }

    suggestionsContainer.innerHTML = `
      <div class="bg-white border border-gray-200 rounded-md shadow-sm">
        ${suggestions.map(tag => `
          <button
            class="suggestion-item w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            data-tag="${tag}"
          >
            ${tag}
          </button>
        `).join('')}
      </div>
    `
    suggestionsContainer.classList.remove('hidden')

    // Add click handlers for suggestions
    const suggestionItems = suggestionsContainer.querySelectorAll('.suggestion-item')
    suggestionItems.forEach(item => {
      item.addEventListener('click', () => {
        const tag = item.getAttribute('data-tag')
        if (tag) {
          this.addTagSuggestion(tag, container)
        }
      })
    })
  }

  private addTagSuggestion(tag: string, container: HTMLElement): void {
    const input = container.querySelector('#mood-tags') as HTMLInputElement
    if (!input) return

    const currentTags = input.value.split(',').map(t => t.trim()).filter(t => t.length > 0)
    
    // Remove the partial last tag and add the selected tag
    currentTags.pop()
    currentTags.push(tag)
    
    input.value = currentTags.join(', ')
    this.tags = currentTags

    // Hide suggestions
    const suggestionsContainer = container.querySelector('#tag-suggestions')
    suggestionsContainer?.classList.add('hidden')

    input.focus()
  }

  private async saveMood(container: HTMLElement): Promise<void> {
    if (!this.selectedMood) return

    const saveButton = container.querySelector('#save-mood') as HTMLButtonElement
    const originalText = saveButton.textContent

    try {
      // Show loading state
      saveButton.disabled = true
      saveButton.textContent = 'Saving...'

      const today = new Date().toISOString().split('T')[0]

      if (this.todaysMood) {
        // Update existing mood
        await db.updateMood(this.todaysMood.id, {
          mood: this.selectedMood,
          tags: this.tags,
        })
      } else {
        // Create new mood entry
        await db.saveMood({
          date: today,
          mood: this.selectedMood,
          tags: this.tags,
        })
      }

      // Show success feedback
      this.showSuccessMessage(container)

      // Update state
      this.todaysMood = await db.getMoodByDate(today)

    } catch (error) {
      errorManager.handleError(
        error instanceof Error ? error : new Error('Failed to save mood'),
        'high',
        'SAVE_MOOD_ERROR'
      )
      
      this.showErrorMessage(container)
    } finally {
      // Reset button state
      saveButton.disabled = false
      saveButton.textContent = originalText
    }
  }

  private showSuccessMessage(container: HTMLElement): void {
    const message = document.createElement('div')
    message.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50'
    message.textContent = '✓ Mood saved successfully!'
    document.body.appendChild(message)

    setTimeout(() => {
      message.remove()
    }, 3000)
  }

  private showErrorMessage(container: HTMLElement): void {
    const message = document.createElement('div')
    message.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50'
    message.textContent = '✗ Failed to save mood. Please try again.'
    document.body.appendChild(message)

    setTimeout(() => {
      message.remove()
    }, 5000)
  }
}