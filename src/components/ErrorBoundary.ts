import { errorManager } from '../utils/error-handler'

export interface ErrorBoundaryState {
  hasError: boolean
  error?: Error | undefined
  errorInfo?: string | undefined
}

export class ErrorBoundary {
  private static instance: ErrorBoundary
  private state: ErrorBoundaryState = { hasError: false }
  private fallbackUI: HTMLElement | null = null
  private originalContent: HTMLElement | null = null

  static getInstance(): ErrorBoundary {
    if (!ErrorBoundary.instance) {
      ErrorBoundary.instance = new ErrorBoundary()
    }
    return ErrorBoundary.instance
  }

  wrap(element: HTMLElement): HTMLElement {
    this.originalContent = element.cloneNode(true) as HTMLElement
    
    // Create error boundary wrapper
    const wrapper = document.createElement('div')
    wrapper.className = 'error-boundary'
    wrapper.appendChild(element)

    return wrapper
  }

  handleError(error: Error, errorInfo?: string): void {
    this.state = {
      hasError: true,
      error: error,
      errorInfo: errorInfo,
    }

    // Log error through error manager
    errorManager.handleError(error, 'critical', 'COMPONENT_ERROR', {
      errorInfo,
      component: 'ErrorBoundary',
    })

    this.renderErrorUI()
  }

  private renderErrorUI(): void {
    const errorContainer = document.querySelector('.error-boundary')
    if (!errorContainer) return

    // Create fallback UI
    this.fallbackUI = document.createElement('div')
    this.fallbackUI.className = 'error-fallback'
    this.fallbackUI.innerHTML = `
      <div class="card error">
        <div class="text-center">
          <h2 class="text-xl mb-4">😔 Something went wrong</h2>
          <p class="mb-6">
            We're sorry, but something unexpected happened. 
            Your data is safe and we're working to fix this.
          </p>
          <div class="flex gap-4 justify-center">
            <button class="btn btn-primary" id="error-retry">
              Try Again
            </button>
            <button class="btn btn-secondary" id="error-report">
              Report Issue
            </button>
          </div>
          ${
            import.meta.env.DEV && this.state.error
              ? `
                <details class="mt-6 text-left">
                  <summary class="cursor-pointer text-sm text-gray-500 mb-2">
                    Technical Details (Development Mode)
                  </summary>
                  <pre class="text-xs bg-gray-100 p-3 rounded overflow-auto">
                    ${this.state.error.stack || this.state.error.message}
                  </pre>
                </details>
              `
              : ''
          }
        </div>
      </div>
    `

    // Replace content with error UI
    errorContainer.innerHTML = ''
    errorContainer.appendChild(this.fallbackUI)

    // Add event listeners
    this.setupErrorUIListeners()
  }

  private setupErrorUIListeners(): void {
    const retryButton = document.getElementById('error-retry')
    const reportButton = document.getElementById('error-report')

    retryButton?.addEventListener('click', () => {
      this.retry()
    })

    reportButton?.addEventListener('click', () => {
      this.reportError()
    })
  }

  retry(): void {
    if (!this.originalContent) return

    const errorContainer = document.querySelector('.error-boundary')
    if (errorContainer && this.originalContent) {
      // Reset state
      this.state = { hasError: false }
      
      // Restore original content
      errorContainer.innerHTML = ''
      errorContainer.appendChild(this.originalContent.cloneNode(true))
      
      // Clear fallback UI
      this.fallbackUI = null
    }
  }

  reportError(): void {
    if (!this.state.error) return

    // Create error report
    const report = {
      error: this.state.error.message,
      stack: this.state.error.stack,
      errorInfo: this.state.errorInfo,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    }

    // Copy to clipboard
    navigator.clipboard?.writeText(JSON.stringify(report, null, 2))
      .then(() => {
        this.showToast('Error report copied to clipboard')
      })
      .catch(() => {
        // Fallback: show in modal
        this.showErrorReport(report)
      })
  }

  private showToast(message: string): void {
    const toast = document.createElement('div')
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50'
    toast.textContent = message
    document.body.appendChild(toast)

    setTimeout(() => {
      toast.remove()
    }, 3000)
  }

  private showErrorReport(report: Record<string, unknown>): void {
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-auto">
        <h3 class="text-lg font-semibold mb-4">Error Report</h3>
        <p class="text-sm text-gray-600 mb-4">
          Please copy this information and send it to our support team:
        </p>
        <textarea 
          readonly 
          class="w-full h-32 text-xs font-mono border rounded p-2 mb-4"
          >${JSON.stringify(report, null, 2)}</textarea>
        <div class="flex justify-end gap-2">
          <button class="btn btn-secondary" id="close-error-report">Close</button>
          <button class="btn btn-primary" id="copy-error-report">Copy</button>
        </div>
      </div>
    `

    document.body.appendChild(modal)

    // Event listeners
    modal.querySelector('#close-error-report')?.addEventListener('click', () => {
      modal.remove()
    })

    modal.querySelector('#copy-error-report')?.addEventListener('click', () => {
      const textarea = modal.querySelector('textarea') as HTMLTextAreaElement
      textarea.select()
      document.execCommand('copy')
      this.showToast('Error report copied to clipboard')
      modal.remove()
    })

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove()
      }
    })
  }
}

// Global error boundary instance
export const globalErrorBoundary = ErrorBoundary.getInstance()

// Utility function to wrap elements with error boundary
export function withErrorBoundary(element: HTMLElement): HTMLElement {
  return globalErrorBoundary.wrap(element)
}

// Setup global error handling for the app
export function setupGlobalErrorBoundary(): void {
  // Catch any uncaught errors and show error boundary
  window.addEventListener('error', (event) => {
    globalErrorBoundary.handleError(new Error(event.message))
  })

  window.addEventListener('unhandledrejection', (event) => {
    globalErrorBoundary.handleError(
      new Error(event.reason?.message || 'Unhandled promise rejection')
    )
  })
}