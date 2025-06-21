import { db } from '../utils/database'
import { errorManager, withErrorHandling } from '../utils/error-handler'
import type { MoodEntry, MoodValue, UserSettings } from '../types/mood'

// Chart.js will be imported dynamically when needed
let Chart: any = null
let chartLoaded = false

async function loadChart() {
  if (!chartLoaded) {
    try {
      const chartModule = await import('chart.js')
      Chart = chartModule.Chart
      Chart.register(...chartModule.registerables)
      chartLoaded = true
    } catch (error) {
      console.error('Failed to load Chart.js:', error)
    }
  }
  return Chart
}

interface TimeframeData {
  moods: MoodEntry[]
  averageMood: number
  moodCounts: Record<MoodValue, number>
  tagCounts: Record<string, number>
  streak: number
}

type Timeframe = '7d' | '30d' | 'all'

export class InsightsPage {
  private currentTimeframe: Timeframe = '30d'
  private data: Record<Timeframe, TimeframeData | null> = {
    '7d': null,
    '30d': null,
    'all': null
  }
  private charts: Record<string, Chart | null> = {
    trendChart: null,
    frequencyChart: null
  }
  private settings: UserSettings | null = null

  async render(): Promise<HTMLElement> {
    const container = document.createElement('div')
    container.className = 'container p-6'

    try {
      await this.loadAllData()
      container.innerHTML = this.getHTML()
      this.attachEventListeners(container)
      
      // Wait for DOM to be ready, then render charts
      setTimeout(async () => {
        await this.renderCharts(container)
      }, 100)

    } catch (error) {
      container.innerHTML = this.getErrorHTML()
    }

    return container
  }

  private async loadAllData(): Promise<void> {
    // Load user settings for mood configuration
    this.settings = await withErrorHandling(
      () => db.getSettings(),
      'LOAD_USER_SETTINGS'
    )

    const now = new Date()
    
    // Load 7 days
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    this.data['7d'] = await this.loadDataForTimeframe(weekAgo, now)

    // Load 30 days
    const monthAgo = new Date(now)
    monthAgo.setDate(monthAgo.getDate() - 30)
    this.data['30d'] = await this.loadDataForTimeframe(monthAgo, now)

    // Load all data
    const allMoods = await withErrorHandling(
      () => db.getAllMoods(),
      'LOAD_ALL_MOODS'
    ) || []
    this.data['all'] = this.processData(allMoods)
  }

  private async loadDataForTimeframe(startDate: Date, endDate: Date): Promise<TimeframeData> {
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    const moods = await withErrorHandling(
      () => db.getMoodsInRange(startDateStr, endDateStr),
      'LOAD_TIMEFRAME_MOODS'
    ) || []

    return this.processData(moods)
  }

  private processData(moods: MoodEntry[]): TimeframeData {
    if (moods.length === 0) {
      return {
        moods: [],
        averageMood: 0,
        moodCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        tagCounts: {},
        streak: 0
      }
    }

    // Calculate average mood
    const averageMood = moods.reduce((sum, mood) => sum + mood.mood, 0) / moods.length

    // Count mood frequencies
    const moodCounts: Record<MoodValue, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    moods.forEach(mood => {
      moodCounts[mood.mood]++
    })

    // Count tag frequencies
    const tagCounts: Record<string, number> = {}
    moods.forEach(mood => {
      mood.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })

    // Calculate current streak
    const streak = this.calculateStreak(moods)

    return {
      moods,
      averageMood,
      moodCounts,
      tagCounts,
      streak
    }
  }

  private calculateStreak(moods: MoodEntry[]): number {
    if (moods.length === 0) return 0

    // Sort moods by date (most recent first)
    const sortedMoods = moods.sort((a, b) => b.date.localeCompare(a.date))
    
    // Check if today has a mood logged
    const today = new Date().toISOString().split('T')[0]
    if (sortedMoods[0]?.date !== today) return 0

    // Count consecutive days
    let streak = 1
    let currentDate = new Date(today)

    for (let i = 1; i < sortedMoods.length; i++) {
      currentDate.setDate(currentDate.getDate() - 1)
      const expectedDate = currentDate.toISOString().split('T')[0]
      
      if (sortedMoods[i].date === expectedDate) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  private getHTML(): string {
    const currentData = this.data[this.currentTimeframe]
    
    return `
      <div>
        <header class="mb-6">
          <h1 class="text-2xl font-semibold mb-2">Mood Insights</h1>
          <p class="text-gray-500">Discover patterns in your emotional well-being</p>
        </header>

        ${this.getTimeframeSelectorHTML()}
        ${this.getStatsCardsHTML()}
        ${this.getChartsHTML()}
        ${this.getTagInsightsHTML()}
        ${currentData?.moods.length === 0 ? this.getEmptyStateHTML() : ''}
      </div>
    `
  }

  private getTimeframeSelectorHTML(): string {
    const timeframes = [
      { key: '7d', label: 'Last 7 days' },
      { key: '30d', label: 'Last 30 days' },
      { key: 'all', label: 'All time' }
    ]

    return `
      <div class="mb-6">
        <div class="flex flex-wrap gap-2">
          ${timeframes.map(tf => `
            <button
              class="timeframe-btn ${this.currentTimeframe === tf.key ? 'active' : ''}"
              data-timeframe="${tf.key}"
            >
              ${tf.label}
            </button>
          `).join('')}
        </div>
      </div>
    `
  }

  private getStatsCardsHTML(): string {
    const data = this.data[this.currentTimeframe]
    if (!data || data.moods.length === 0) return ''

    return `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="card text-center">
          <div class="text-2xl font-semibold text-primary-600">${data.moods.length}</div>
          <div class="text-sm text-gray-500">Days logged</div>
        </div>
        
        <div class="card text-center">
          <div class="text-2xl font-semibold text-primary-600">${data.averageMood.toFixed(1)}</div>
          <div class="text-sm text-gray-500">Average mood</div>
        </div>
        
        <div class="card text-center">
          <div class="text-2xl font-semibold text-primary-600">${data.streak}</div>
          <div class="text-sm text-gray-500">Day streak</div>
        </div>
        
        <div class="card text-center">
          <div class="text-2xl font-semibold text-primary-600">${Object.keys(data.tagCounts).length}</div>
          <div class="text-sm text-gray-500">Unique tags</div>
        </div>
      </div>
    `
  }

  private getChartsHTML(): string {
    const data = this.data[this.currentTimeframe]
    if (!data || data.moods.length === 0) return ''

    return `
      <div class="grid md:grid-cols-2 gap-6 mb-6">
        <div class="card">
          <h3 class="text-lg font-medium mb-4">Mood Trend</h3>
          <div class="chart-container">
            <canvas id="trend-chart"></canvas>
          </div>
        </div>
        
        <div class="card">
          <h3 class="text-lg font-medium mb-4">Mood Distribution</h3>
          <div class="chart-container">
            <canvas id="frequency-chart"></canvas>
          </div>
        </div>
      </div>
    `
  }

  private getTagInsightsHTML(): string {
    const data = this.data[this.currentTimeframe]
    if (!data || data.moods.length === 0) return ''

    // Get top tags and their associated mood averages
    const tagInsights = Object.entries(data.tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => {
        const moodsWithTag = data.moods.filter(mood => mood.tags.includes(tag))
        const averageMood = moodsWithTag.reduce((sum, mood) => sum + mood.mood, 0) / moodsWithTag.length
        return { tag, count, averageMood }
      })

    if (tagInsights.length === 0) return ''

    return `
      <div class="card">
        <h3 class="text-lg font-medium mb-4">Tag Insights</h3>
        <div class="space-y-3">
          ${tagInsights.map(({ tag, count, averageMood }) => {
            const moodColor = this.getMoodColor(Math.round(averageMood) as MoodValue)
            const moodEmoji = this.getMoodEmoji(Math.round(averageMood) as MoodValue)
            
            return `
              <div class="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div class="flex items-center gap-3">
                  <span class="text-lg">${moodEmoji}</span>
                  <div>
                    <span class="font-medium">${tag}</span>
                    <div class="text-sm text-gray-500">${count} entries</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-medium" style="color: ${moodColor}">
                    ${averageMood.toFixed(1)} avg
                  </div>
                </div>
              </div>
            `
          }).join('')}
        </div>
      </div>
    `
  }

  private getEmptyStateHTML(): string {
    return `
      <div class="card text-center">
        <div class="py-12">
          <div class="text-6xl mb-4">📊</div>
          <h3 class="text-lg font-medium mb-2">No data to analyze</h3>
          <p class="text-gray-500 mb-6">
            Start logging your moods to see insights about your emotional patterns.
          </p>
          <a href="/" data-route="/" class="btn btn-primary">
            Log Your First Mood
          </a>
        </div>
      </div>
    `
  }

  private getErrorHTML(): string {
    return `
      <div class="card error text-center">
        <h2 class="text-xl mb-4">😔 Something went wrong</h2>
        <p class="mb-6">
          We couldn't load your mood insights. Please try refreshing the page.
        </p>
        <button class="btn btn-primary" onclick="location.reload()">
          Refresh Page
        </button>
      </div>
    `
  }

  private attachEventListeners(container: HTMLElement): void {
    // Timeframe selector
    const timeframeBtns = container.querySelectorAll('.timeframe-btn')
    timeframeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const timeframe = btn.getAttribute('data-timeframe') as Timeframe
        this.switchTimeframe(timeframe, container)
      })
    })
  }

  private async switchTimeframe(timeframe: Timeframe, container: HTMLElement): Promise<void> {
    if (timeframe === this.currentTimeframe) return

    this.currentTimeframe = timeframe

    // Update button states
    const timeframeBtns = container.querySelectorAll('.timeframe-btn')
    timeframeBtns.forEach(btn => {
      if (btn.getAttribute('data-timeframe') === timeframe) {
        btn.classList.add('active')
      } else {
        btn.classList.remove('active')
      }
    })

    // Update content
    this.updateContent(container)
    await this.renderCharts(container)
  }

  private updateContent(container: HTMLElement): void {
    // Update stats cards
    const statsContainer = container.querySelector('.grid.grid-cols-2')?.parentElement
    if (statsContainer) {
      const newStats = document.createElement('div')
      newStats.innerHTML = this.getStatsCardsHTML()
      const oldStats = statsContainer.querySelector('.grid.grid-cols-2')
      if (oldStats && newStats.firstElementChild) {
        statsContainer.replaceChild(newStats.firstElementChild, oldStats)
      }
    }

    // Update charts container
    const chartsContainer = container.querySelector('.grid.md\\:grid-cols-2')?.parentElement
    if (chartsContainer) {
      const newCharts = document.createElement('div')
      newCharts.innerHTML = this.getChartsHTML()
      const oldCharts = chartsContainer.querySelector('.grid.md\\:grid-cols-2')
      if (oldCharts && newCharts.firstElementChild) {
        chartsContainer.replaceChild(newCharts.firstElementChild, oldCharts)
      }
    }

    // Update tag insights
    const tagContainer = container.querySelector('.card:last-child')
    if (tagContainer) {
      const newTags = document.createElement('div')
      newTags.innerHTML = this.getTagInsightsHTML()
      if (newTags.firstElementChild) {
        tagContainer.parentElement?.replaceChild(newTags.firstElementChild, tagContainer)
      }
    }
  }

  private async renderCharts(container: HTMLElement): Promise<void> {
    const data = this.data[this.currentTimeframe]
    if (!data || data.moods.length === 0) return

    // Load Chart.js if needed
    const ChartClass = await loadChart()
    if (!ChartClass) {
      console.warn('Chart.js failed to load, showing placeholders')
      this.renderChartPlaceholders(container)
      return
    }

    // Destroy existing charts
    Object.values(this.charts).forEach(chart => {
      if (chart) {
        chart.destroy()
      }
    })

    await this.renderTrendChart(container, data)
    await this.renderFrequencyChart(container, data)
  }

  private renderChartPlaceholders(container: HTMLElement): void {
    const trendCanvas = container.querySelector('#trend-chart') as HTMLCanvasElement
    const freqCanvas = container.querySelector('#frequency-chart') as HTMLCanvasElement
    
    [trendCanvas, freqCanvas].forEach(canvas => {
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#f3f4f6'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.fillStyle = '#6b7280'
          ctx.font = '16px system-ui'
          ctx.textAlign = 'center'
          ctx.fillText('Charts loading...', canvas.width / 2, canvas.height / 2)
        }
      }
    })
  }

  private async renderTrendChart(container: HTMLElement, data: TimeframeData): Promise<void> {
    const canvas = container.querySelector('#trend-chart') as HTMLCanvasElement
    if (!canvas || !Chart) return

    // Prepare data for line chart
    const sortedMoods = data.moods.sort((a, b) => a.date.localeCompare(b.date))
    const labels = sortedMoods.map(mood => {
      const date = new Date(mood.date + 'T00:00:00')
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    })
    
    const moodData = sortedMoods.map(mood => mood.mood)

    const config = {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Mood',
          data: moodData,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#4f46e5',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            min: 1,
            max: 5,
            ticks: {
              stepSize: 1,
              callback: (value: any) => {
                if (!this.settings) return ''
                const labels = ['', 
                  this.settings.moodConfig.labels[1], 
                  this.settings.moodConfig.labels[2], 
                  this.settings.moodConfig.labels[3], 
                  this.settings.moodConfig.labels[4], 
                  this.settings.moodConfig.labels[5]
                ]
                return labels[value as number] || ''
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          }
        },
        elements: {
          point: {
            hoverRadius: 6
          }
        }
      }
    }

    this.charts.trendChart = new Chart(canvas, config)
  }

  private async renderFrequencyChart(container: HTMLElement, data: TimeframeData): Promise<void> {
    const canvas = container.querySelector('#frequency-chart') as HTMLCanvasElement
    if (!canvas || !Chart) return

    const labels = this.settings ? [
      this.settings.moodConfig.labels[1],
      this.settings.moodConfig.labels[2],
      this.settings.moodConfig.labels[3],
      this.settings.moodConfig.labels[4],
      this.settings.moodConfig.labels[5]
    ] : ['Very Sad', 'Sad', 'Neutral', 'Happy', 'Very Happy']
    
    const chartData = [
      data.moodCounts[1],
      data.moodCounts[2],
      data.moodCounts[3],
      data.moodCounts[4],
      data.moodCounts[5]
    ]
    
    const colors = this.settings ? [
      this.settings.moodConfig.colors[1],
      this.settings.moodConfig.colors[2],
      this.settings.moodConfig.colors[3],
      this.settings.moodConfig.colors[4],
      this.settings.moodConfig.colors[5]
    ] : ['#dc2626', '#f97316', '#6b7280', '#16a34a', '#22c55e']

    const config = {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: chartData,
          backgroundColor: colors,
          borderColor: '#ffffff',
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                size: 12
              }
            }
          }
        },
        cutout: '60%'
      }
    }

    this.charts.frequencyChart = new Chart(canvas, config)
  }

  private getMoodColor(mood: MoodValue): string {
    if (this.settings) {
      return this.settings.moodConfig.colors[mood]
    }
    
    // Fallback to default colors
    const colors = {
      1: '#dc2626',
      2: '#f97316',
      3: '#6b7280',
      4: '#16a34a',
      5: '#22c55e'
    }
    return colors[mood]
  }

  private getMoodEmoji(mood: MoodValue): string {
    if (this.settings) {
      return this.settings.moodConfig.emojis[mood]
    }
    
    // Fallback to default emojis
    const emojis = {
      1: '😢',
      2: '😞',
      3: '😐',
      4: '😊',
      5: '😄'
    }
    return emojis[mood]
  }
}