import './styles/main.css'
import { Router } from './utils/router'
import { initializeDatabase } from './utils/database'
import { setupGlobalErrorBoundary } from './components/ErrorBoundary'

// Page components (will be implemented next)
async function loadHomePage(): Promise<HTMLElement> {
  const { HomePage } = await import('./pages/HomePage')
  return new HomePage().render()
}

async function loadHistoryPage(): Promise<HTMLElement> {
  const { HistoryPage } = await import('./pages/HistoryPage')
  return new HistoryPage().render()
}

async function loadInsightsPage(): Promise<HTMLElement> {
  const { InsightsPage } = await import('./pages/InsightsPage')
  return new InsightsPage().render()
}

async function loadSettingsPage(): Promise<HTMLElement> {
  const { SettingsPage } = await import('./pages/SettingsPage')
  return new SettingsPage().render()
}

async function load404Page(): Promise<HTMLElement> {
  const container = document.createElement('div')
  container.className = 'container p-6'
  container.innerHTML = `
    <div class="card text-center">
      <h1 class="text-2xl mb-4">😕 Page Not Found</h1>
      <p class="mb-6">The page you're looking for doesn't exist.</p>
      <a href="/" data-route="/" class="btn btn-primary">
        Go Home
      </a>
    </div>
  `
  return container
}

class App {
  private router: Router | null = null

  async init(): Promise<void> {
    try {
      console.log('🚀 Starting Mood Snapshot initialization...')
      
      // Check browser compatibility first
      this.checkBrowserCompatibility()
      console.log('✓ Browser compatibility check passed')
      
      // Show loading state
      this.showLoading()
      console.log('✓ Loading state shown')

      // Setup global error handling
      setupGlobalErrorBoundary()
      console.log('✓ Global error boundary setup')

      // Initialize database
      console.log('📀 Initializing database...')
      await initializeDatabase()
      console.log('✓ Database initialized successfully')

      // Hide loading state and prepare app structure
      this.hideLoading()
      console.log('✓ App structure created')

      // Setup application
      console.log('🔧 Setting up application...')
      await this.setupApp()
      console.log('✓ Application setup complete')

      console.log('🎉 App initialization complete!')

    } catch (error) {
      console.error('💥 App initialization failed:', error)
      this.showError(error)
    }
  }

  private showLoading(): void {
    const app = document.getElementById('app')
    if (app) {
      app.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
          <span class="ml-3">Loading Mood Snapshot...</span>
        </div>
      `
    }
  }

  private hideLoading(): void {
    const app = document.getElementById('app')
    if (app) {
      app.innerHTML = `
        <div class="app">
          <main id="main-content" class="main-content" role="main" tabindex="-1">
            <!-- Content will be injected here by router -->
          </main>
          ${this.createBottomNavigation()}
        </div>
      `
    }
  }

  private showError(error: unknown): void {
    const app = document.getElementById('app')
    if (app) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorStack = error instanceof Error ? error.stack : 'No stack trace available'
      
      // Log detailed error to console for debugging
      console.error('App initialization failed:', error)
      
      app.innerHTML = `
        <div class="container p-6">
          <div class="card error text-center">
            <h1 class="text-xl mb-4">😞 Failed to Load App</h1>
            <p class="mb-6">
              We're sorry, but Mood Snapshot couldn't start properly. 
              This might be due to your browser not supporting required features.
            </p>
            <details class="text-left mb-6">
              <summary class="cursor-pointer text-sm">Technical Details</summary>
              <div class="text-xs mt-2 p-3 bg-gray-100 rounded">
                <strong>Error:</strong> ${errorMessage}<br><br>
                <strong>Stack Trace:</strong><br>
                <pre class="whitespace-pre-wrap">${errorStack}</pre>
              </div>
            </details>
            <button class="btn btn-primary" onclick="location.reload()">
              Try Again
            </button>
          </div>
        </div>
      `
    }
  }

  private async setupApp(): Promise<void> {
    // Get main content container
    const mainContent = document.getElementById('main-content')
    if (!mainContent) {
      throw new Error('Main content container not found')
    }

    // Setup router
    this.router = new Router(mainContent)

    // Define routes
    this.router.addRoute('/', {
      component: loadHomePage,
      title: 'Home'
    })

    this.router.addRoute('/history', {
      component: loadHistoryPage,
      title: 'History'
    })

    this.router.addRoute('/insights', {
      component: loadInsightsPage,
      title: 'Insights'
    })

    this.router.addRoute('/settings', {
      component: loadSettingsPage,
      title: 'Settings'
    })

    this.router.addRoute('/404', {
      component: load404Page,
      title: 'Page Not Found'
    })

    // Start router
    await this.router.start()
  }

  private createBottomNavigation(): string {
    return `
      <nav class="bottom-nav" role="navigation" aria-label="Main navigation">
        <div class="nav-container">
          <a href="/" data-route="/" class="nav-item" aria-label="Home">
            <span class="nav-icon">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
            </span>
            <span class="nav-label">Home</span>
          </a>
          
          <a href="/history" data-route="/history" class="nav-item" aria-label="History">
            <span class="nav-icon">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </span>
            <span class="nav-label">History</span>
          </a>
          
          <a href="/insights" data-route="/insights" class="nav-item" aria-label="Insights">
            <span class="nav-icon">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </span>
            <span class="nav-label">Insights</span>
          </a>
          
          <a href="/settings" data-route="/settings" class="nav-item" aria-label="Settings">
            <span class="nav-icon">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </span>
            <span class="nav-label">Settings</span>
          </a>
        </div>
      </nav>
    `
  }

  private checkBrowserCompatibility(): void {
    const errors: string[] = []

    // Check IndexedDB support
    if (!('indexedDB' in window)) {
      errors.push('IndexedDB is not supported')
    }

    // Check ES6 modules support - if this code is running, modules are supported
    // (Since this file itself is loaded as a module)
    // Additional check: ensure we can create script with type="module"
    try {
      const testScript = document.createElement('script')
      testScript.type = 'module'
      if (testScript.type !== 'module') {
        errors.push('ES6 modules are not supported')
      }
    } catch (e) {
      errors.push('ES6 modules are not supported')
    }

    // Check async/await support
    try {
      new Function('return (async () => {})()')()
    } catch (e) {
      errors.push('Async/await is not supported')
    }

    // Check localStorage
    try {
      const testKey = '__test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
    } catch (e) {
      errors.push('localStorage is not available')
    }

    if (errors.length > 0) {
      throw new Error(`Browser compatibility issues: ${errors.join(', ')}. Please use a modern browser like Chrome 60+, Firefox 55+, Safari 11+, or Edge 79+.`)
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  const app = new App()
  await app.init()
})

// Handle service worker registration for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('/sw.js')
      console.log('Service worker registered successfully')
    } catch (error) {
      console.warn('Service worker registration failed:', error)
    }
  })
}