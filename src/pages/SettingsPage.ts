import { db } from '../utils/database'
import { errorManager, withErrorHandling } from '../utils/error-handler'
import type { UserSettings, MoodValue, MoodConfig } from '../types/mood'

export class SettingsPage {
  private settings: UserSettings | null = null

  async render(): Promise<HTMLElement> {
    const container = document.createElement('div')
    container.className = 'container p-6'

    try {
      await this.loadSettings()
      container.innerHTML = this.getHTML()
      this.attachEventListeners(container)
    } catch (error) {
      container.innerHTML = this.getErrorHTML()
    }

    return container
  }

  private async loadSettings(): Promise<void> {
    this.settings = await withErrorHandling(
      () => db.getSettings(),
      'LOAD_SETTINGS'
    )
  }

  private getHTML(): string {
    if (!this.settings) {
      return this.getLoadingHTML()
    }

    return `
      <div>
        <header class="mb-6">
          <h1 class="text-2xl font-semibold mb-2">Settings</h1>
          <p class="text-gray-500">Customize your Mood Snapshot experience</p>
        </header>

        <div class="space-y-6">
          ${this.getMoodCustomizationHTML()}
          ${this.getRemindersHTML()}
          ${this.getDataManagementHTML()}
          ${this.getAboutHTML()}
        </div>
      </div>
    `
  }

  private getMoodCustomizationHTML(): string {
    if (!this.settings) return ''

    return `
      <div class="card">
        <h2 class="text-lg font-medium mb-4">Mood Scale Customization</h2>
        
        <div class="space-y-4">
          ${[1, 2, 3, 4, 5].map((mood: MoodValue) => `
            <div class="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
              <span class="text-2xl">${this.settings!.moodConfig.emojis[mood]}</span>
              <div class="flex-1">
                <input
                  type="text"
                  id="mood-label-${mood}"
                  class="input"
                  value="${this.settings!.moodConfig.labels[mood]}"
                  placeholder="Mood label"
                >
              </div>
              <div class="flex items-center gap-2">
                <label for="mood-color-${mood}" class="text-sm text-gray-600">Color:</label>
                <input
                  type="color"
                  id="mood-color-${mood}"
                  value="${this.settings!.moodConfig.colors[mood]}"
                  class="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                >
              </div>
            </div>
          `).join('')}
          
          <div class="flex gap-2 pt-2">
            <button id="save-mood-config" class="btn btn-primary">
              Save Changes
            </button>
            <button id="reset-mood-config" class="btn btn-secondary">
              Reset to Default
            </button>
          </div>
        </div>
      </div>
    `
  }

  private getRemindersHTML(): string {
    if (!this.settings) return ''

    return `
      <div class="card">
        <h2 class="text-lg font-medium mb-4">Daily Reminders</h2>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-medium">Daily mood reminder</h3>
              <p class="text-sm text-gray-500">Get a daily notification to log your mood</p>
            </div>
            <label class="toggle-switch">
              <input
                type="checkbox"
                id="reminder-enabled"
                ${this.settings.reminderEnabled ? 'checked' : ''}
              >
              <span class="toggle-slider"></span>
            </label>
          </div>

          ${this.settings.reminderEnabled ? `
            <div class="ml-6 pt-2 border-t border-gray-100">
              <label for="reminder-time" class="block text-sm font-medium text-gray-700 mb-2">
                Reminder time
              </label>
              <input
                type="time"
                id="reminder-time"
                class="input w-48"
                value="${this.settings.reminderTime || '20:00'}"
              >
              <p class="text-xs text-gray-500 mt-1">
                Note: Browser notifications require permission and may not work in all browsers
              </p>
            </div>
          ` : ''}
        </div>
      </div>
    `
  }

  private getDataManagementHTML(): string {
    return `
      <div class="card">
        <h2 class="text-lg font-medium mb-4">Data Management</h2>
        
        <div class="space-y-4">
          <div>
            <h3 class="font-medium mb-2">Export Data</h3>
            <p class="text-sm text-gray-500 mb-3">
              Download your mood data as a JSON file for backup or analysis
            </p>
            <button id="export-data" class="btn btn-secondary">
              Export All Data
            </button>
          </div>

          <div class="border-t border-gray-200 pt-4">
            <h3 class="font-medium mb-2">Import Data</h3>
            <p class="text-sm text-gray-500 mb-3">
              Import mood data from a previously exported file
            </p>
            <input
              type="file"
              id="import-file"
              accept=".json"
              class="hidden"
            >
            <button id="import-data" class="btn btn-secondary">
              Import Data
            </button>
          </div>

          <div class="border-t border-gray-200 pt-4">
            <h3 class="font-medium mb-2 text-red-600">Danger Zone</h3>
            <p class="text-sm text-gray-500 mb-3">
              Permanently delete all your mood data. This action cannot be undone.
            </p>
            <button id="clear-all-data" class="btn btn-secondary text-red-600 hover:bg-red-50">
              Clear All Data
            </button>
          </div>
        </div>
      </div>
    `
  }

  private getAboutHTML(): string {
    return `
      <div class="card">
        <h2 class="text-lg font-medium mb-4">About</h2>
        
        <div class="space-y-4">
          <div>
            <h3 class="font-medium">Mood Snapshot</h3>
            <p class="text-sm text-gray-500">Version 1.0.0</p>
          </div>
          
          <div>
            <p class="text-sm text-gray-600 mb-3">
              A minimalist mood tracking web app that helps you understand your emotional patterns.
              All your data is stored locally on your device for complete privacy.
            </p>
          </div>

          <div class="flex flex-wrap gap-4 text-sm">
            <a href="#" id="privacy-policy" class="text-primary-600 hover:text-primary-700">
              Privacy Policy
            </a>
            <a href="#" id="terms-of-service" class="text-primary-600 hover:text-primary-700">
              Terms of Service
            </a>
            <a href="https://github.com/gingerol/moodsnapshot" class="text-primary-600 hover:text-primary-700" target="_blank" rel="noopener">
              GitHub
            </a>
          </div>

          <div class="text-xs text-gray-500 pt-2 border-t border-gray-100">
            <p>Built with ❤️ for mental wellness</p>
            <p>© 2024 Mood Snapshot. All rights reserved.</p>
          </div>
        </div>
      </div>
    `
  }

  private getLoadingHTML(): string {
    return `
      <div class="loading">
        <div class="spinner"></div>
        <span class="ml-3">Loading settings...</span>
      </div>
    `
  }

  private getErrorHTML(): string {
    return `
      <div class="card error text-center">
        <h2 class="text-xl mb-4">😔 Something went wrong</h2>
        <p class="mb-6">
          We couldn't load your settings. Please try refreshing the page.
        </p>
        <button class="btn btn-primary" onclick="location.reload()">
          Refresh Page
        </button>
      </div>
    `
  }

  private attachEventListeners(container: HTMLElement): void {
    if (!this.settings) return

    // Mood customization
    this.attachMoodCustomizationListeners(container)
    
    // Reminders
    this.attachReminderListeners(container)
    
    // Data management
    this.attachDataManagementListeners(container)
    
    // About section
    this.attachAboutListeners(container)
  }

  private attachMoodCustomizationListeners(container: HTMLElement): void {
    const saveButton = container.querySelector('#save-mood-config')
    const resetButton = container.querySelector('#reset-mood-config')

    saveButton?.addEventListener('click', () => {
      this.saveMoodConfig(container)
    })

    resetButton?.addEventListener('click', () => {
      this.resetMoodConfig(container)
    })
  }

  private attachReminderListeners(container: HTMLElement): void {
    const reminderToggle = container.querySelector('#reminder-enabled') as HTMLInputElement
    
    reminderToggle?.addEventListener('change', () => {
      this.toggleReminder(reminderToggle.checked, container)
    })

    const timeInput = container.querySelector('#reminder-time') as HTMLInputElement
    timeInput?.addEventListener('change', () => {
      this.updateReminderTime(timeInput.value)
    })
  }

  private attachDataManagementListeners(container: HTMLElement): void {
    const exportButton = container.querySelector('#export-data')
    const importButton = container.querySelector('#import-data')
    const importFile = container.querySelector('#import-file') as HTMLInputElement
    const clearButton = container.querySelector('#clear-all-data')

    exportButton?.addEventListener('click', () => {
      this.exportData()
    })

    importButton?.addEventListener('click', () => {
      importFile?.click()
    })

    importFile?.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        this.importData(file)
      }
    })

    clearButton?.addEventListener('click', () => {
      this.clearAllData()
    })
  }

  private attachAboutListeners(container: HTMLElement): void {
    const privacyLink = container.querySelector('#privacy-policy')
    const termsLink = container.querySelector('#terms-of-service')

    privacyLink?.addEventListener('click', (e) => {
      e.preventDefault()
      this.showPrivacyPolicy()
    })

    termsLink?.addEventListener('click', (e) => {
      e.preventDefault()
      this.showTermsOfService()
    })
  }

  private async saveMoodConfig(container: HTMLElement): Promise<void> {
    if (!this.settings) return

    try {
      const newConfig: MoodConfig = {
        labels: {} as Record<MoodValue, string>,
        colors: {} as Record<MoodValue, string>,
        emojis: this.settings.moodConfig.emojis // Keep existing emojis
      };

      [1, 2, 3, 4, 5].forEach((mood: MoodValue) => {
        const labelInput = container.querySelector(`#mood-label-${mood}`) as HTMLInputElement
        const colorInput = container.querySelector(`#mood-color-${mood}`) as HTMLInputElement
        
        newConfig.labels[mood] = labelInput?.value || this.settings!.moodConfig.labels[mood]
        newConfig.colors[mood] = colorInput?.value || this.settings!.moodConfig.colors[mood]
      })

      this.settings = await db.updateSettings({
        moodConfig: newConfig
      })

      this.showSuccessMessage('Mood configuration saved successfully!')

    } catch (error) {
      errorManager.handleError(
        error instanceof Error ? error : new Error('Failed to save mood config'),
        'medium',
        'SAVE_MOOD_CONFIG_ERROR'
      )
      this.showErrorMessage('Failed to save mood configuration')
    }
  }

  private async resetMoodConfig(container: HTMLElement): Promise<void> {
    if (!confirm('Are you sure you want to reset the mood configuration to default?')) {
      return
    }

    try {
      const { DEFAULT_MOOD_CONFIG } = await import('../types/mood')
      
      this.settings = await db.updateSettings({
        moodConfig: DEFAULT_MOOD_CONFIG
      })

      // Update the form
      this.updateMoodConfigForm(container)
      this.showSuccessMessage('Mood configuration reset to default')

    } catch (error) {
      errorManager.handleError(
        error instanceof Error ? error : new Error('Failed to reset mood config'),
        'medium',
        'RESET_MOOD_CONFIG_ERROR'
      )
      this.showErrorMessage('Failed to reset mood configuration')
    }
  }

  private updateMoodConfigForm(container: HTMLElement): void {
    if (!this.settings) return;

    [1, 2, 3, 4, 5].forEach((mood: MoodValue) => {
      const labelInput = container.querySelector(`#mood-label-${mood}`) as HTMLInputElement
      const colorInput = container.querySelector(`#mood-color-${mood}`) as HTMLInputElement
      
      if (labelInput) labelInput.value = this.settings!.moodConfig.labels[mood]
      if (colorInput) colorInput.value = this.settings!.moodConfig.colors[mood]
    })
  }

  private async toggleReminder(enabled: boolean, container: HTMLElement): Promise<void> {
    try {
      this.settings = await db.updateSettings({
        reminderEnabled: enabled
      })

      // Request notification permission if enabling
      if (enabled && 'Notification' in window) {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          this.showErrorMessage('Notification permission denied. Reminders may not work.')
        }
      }

      // Update UI
      this.updateRemindersSection(container)
      this.showSuccessMessage(`Reminders ${enabled ? 'enabled' : 'disabled'}`)

    } catch (error) {
      errorManager.handleError(
        error instanceof Error ? error : new Error('Failed to toggle reminder'),
        'medium',
        'TOGGLE_REMINDER_ERROR'
      )
      this.showErrorMessage('Failed to update reminder setting')
    }
  }

  private async updateReminderTime(time: string): Promise<void> {
    try {
      this.settings = await db.updateSettings({
        reminderTime: time
      })

      this.showSuccessMessage('Reminder time updated')

    } catch (error) {
      errorManager.handleError(
        error instanceof Error ? error : new Error('Failed to update reminder time'),
        'medium',
        'UPDATE_REMINDER_TIME_ERROR'
      )
      this.showErrorMessage('Failed to update reminder time')
    }
  }

  private updateRemindersSection(container: HTMLElement): void {
    const remindersCard = container.querySelector('.card:nth-child(2)')
    if (remindersCard) {
      const newContent = document.createElement('div')
      newContent.innerHTML = this.getRemindersHTML()
      
      if (newContent.firstElementChild) {
        remindersCard.parentElement?.replaceChild(newContent.firstElementChild, remindersCard)
        this.attachReminderListeners(container)
      }
    }
  }

  private async exportData(): Promise<void> {
    try {
      const data = await db.exportData()
      
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `mood-snapshot-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      URL.revokeObjectURL(url)
      this.showSuccessMessage('Data exported successfully!')

    } catch (error) {
      errorManager.handleError(
        error instanceof Error ? error : new Error('Failed to export data'),
        'medium',
        'EXPORT_DATA_ERROR'
      )
      this.showErrorMessage('Failed to export data')
    }
  }

  private async importData(file: File): Promise<void> {
    try {
      const text = await file.text()
      await db.importData(text)
      
      this.showSuccessMessage('Data imported successfully!')
      
      // Refresh the page to reflect imported data
      setTimeout(() => {
        window.location.reload()
      }, 2000)

    } catch (error) {
      errorManager.handleError(
        error instanceof Error ? error : new Error('Failed to import data'),
        'medium',
        'IMPORT_DATA_ERROR'
      )
      this.showErrorMessage('Failed to import data. Please check the file format.')
    }
  }

  private async clearAllData(): Promise<void> {
    const confirmation = prompt(
      'This will permanently delete ALL your mood data. Type "DELETE" to confirm:'
    )

    if (confirmation !== 'DELETE') {
      return
    }

    try {
      // Get all moods and delete them
      const moods = await db.getAllMoods()
      for (const mood of moods) {
        await db.deleteMood(mood.id)
      }

      this.showSuccessMessage('All data cleared successfully')
      
      // Refresh the page
      setTimeout(() => {
        window.location.reload()
      }, 2000)

    } catch (error) {
      errorManager.handleError(
        error instanceof Error ? error : new Error('Failed to clear data'),
        'high',
        'CLEAR_DATA_ERROR'
      )
      this.showErrorMessage('Failed to clear data')
    }
  }

  private showPrivacyPolicy(): void {
    this.showModal('Privacy Policy', `
      <div class="space-y-4 text-sm">
        <p><strong>Effective Date:</strong> ${new Date().toLocaleDateString()}</p>
        
        <h3 class="font-medium">Data Storage</h3>
        <p>All your mood data is stored locally on your device using IndexedDB. We do not collect, store, or have access to your personal mood data on any external servers.</p>
        
        <h3 class="font-medium">Privacy by Design</h3>
        <p>Mood Snapshot is designed with privacy as a core principle. Your emotional data remains completely private and under your control.</p>
        
        <h3 class="font-medium">No Tracking</h3>
        <p>We do not use analytics, tracking cookies, or any other technologies to monitor your usage of the application.</p>
        
        <h3 class="font-medium">Data Export</h3>
        <p>You can export your data at any time and delete it from the application. The exported data is yours to keep and use as you see fit.</p>
      </div>
    `)
  }

  private showTermsOfService(): void {
    this.showModal('Terms of Service', `
      <div class="space-y-4 text-sm">
        <p><strong>Effective Date:</strong> ${new Date().toLocaleDateString()}</p>
        
        <h3 class="font-medium">Acceptance of Terms</h3>
        <p>By using Mood Snapshot, you agree to these terms of service.</p>
        
        <h3 class="font-medium">Use of the Application</h3>
        <p>Mood Snapshot is provided for personal use to track your emotional well-being. You agree to use the application responsibly and not for any harmful purposes.</p>
        
        <h3 class="font-medium">Data Responsibility</h3>
        <p>You are responsible for your own data. We recommend regularly exporting your data as a backup.</p>
        
        <h3 class="font-medium">Medical Disclaimer</h3>
        <p>Mood Snapshot is not a medical device or professional mental health service. If you are experiencing severe mental health issues, please consult with a qualified healthcare professional.</p>
        
        <h3 class="font-medium">Limitation of Liability</h3>
        <p>The application is provided "as is" without warranties. We are not liable for any data loss or other damages.</p>
      </div>
    `)
  }

  private showModal(title: string, content: string): void {
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">${title}</h3>
          <button class="text-gray-400 hover:text-gray-600" id="close-modal">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        ${content}
        <div class="flex justify-end mt-6">
          <button class="btn btn-primary" id="close-modal-btn">Close</button>
        </div>
      </div>
    `

    document.body.appendChild(modal)

    // Close handlers
    const closeModal = () => modal.remove()
    modal.querySelector('#close-modal')?.addEventListener('click', closeModal)
    modal.querySelector('#close-modal-btn')?.addEventListener('click', closeModal)
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal()
    })
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