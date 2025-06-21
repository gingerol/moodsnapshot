// Global error handling utilities

export interface AppError {
  message: string
  code?: string | undefined
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: string
  stack?: string | undefined
  context?: Record<string, unknown> | undefined
}

export class ErrorManager {
  private static instance: ErrorManager
  private errors: AppError[] = []
  private listeners: ((error: AppError) => void)[] = []
  private maxErrors = 50

  static getInstance(): ErrorManager {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager()
    }
    return ErrorManager.instance
  }

  constructor() {
    this.setupGlobalHandlers()
  }

  private setupGlobalHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        new Error(event.reason?.message || 'Unhandled promise rejection'),
        'high',
        'UNHANDLED_PROMISE',
        { reason: event.reason }
      )
    })

    // Handle global JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(
        new Error(event.message),
        'high',
        'JAVASCRIPT_ERROR',
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      )
    })

    // Handle resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handleError(
          new Error(`Failed to load resource: ${(event.target as HTMLElement)?.tagName}`),
          'medium',
          'RESOURCE_ERROR',
          { target: event.target }
        )
      }
    }, true)
  }

  handleError(
    error: Error,
    severity: AppError['severity'] = 'medium',
    code?: string,
    context?: Record<string, unknown>
  ): AppError {
    const appError: AppError = {
      message: error.message,
      code,
      severity,
      timestamp: new Date().toISOString(),
      stack: error.stack,
      context,
    }

    // Add to errors array (keep only recent errors)
    this.errors.unshift(appError)
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors)
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('[ErrorManager]', appError)
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(appError)
      } catch (err) {
        console.error('Error in error listener:', err)
      }
    })

    return appError
  }

  onError(listener: (error: AppError) => void): () => void {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  getErrors(severity?: AppError['severity']): AppError[] {
    if (severity) {
      return this.errors.filter(error => error.severity === severity)
    }
    return [...this.errors]
  }

  clearErrors(): void {
    this.errors = []
  }

  // User-friendly error messages
  getUserFriendlyMessage(error: AppError): string {
    switch (error.code) {
      case 'DATABASE_ERROR':
        return 'We had trouble saving your data. Please try again.'
      case 'NETWORK_ERROR':
        return 'Connection problem. Please check your internet connection.'
      case 'STORAGE_FULL':
        return 'Your device storage is full. Please free up some space.'
      case 'PERMISSION_DENIED':
        return 'Permission denied. Please check your browser settings.'
      default:
        return 'Something went wrong. Please try again.'
    }
  }
}

// Singleton instance
export const errorManager = ErrorManager.getInstance()

// Utility function for handling async operations with error management
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorCode?: string,
  context?: Record<string, unknown>
): Promise<T | null> {
  try {
    return await operation()
  } catch (error) {
    errorManager.handleError(
      error instanceof Error ? error : new Error(String(error)),
      'medium',
      errorCode,
      context
    )
    return null
  }
}

// Database-specific error handling
export function handleDatabaseError(error: unknown, operation: string): never {
  const message = error instanceof Error ? error.message : String(error)
  
  // Map common database errors to user-friendly messages
  let code = 'DATABASE_ERROR'
  if (message.includes('quota')) {
    code = 'STORAGE_FULL'
  } else if (message.includes('blocked')) {
    code = 'DATABASE_BLOCKED'
  } else if (message.includes('version')) {
    code = 'DATABASE_VERSION_ERROR'
  }

  throw errorManager.handleError(
    new Error(`Database operation failed: ${operation}`),
    'high',
    code,
    { originalError: message }
  )
}

// Network error handling
export function handleNetworkError(error: unknown, url?: string): never {
  throw errorManager.handleError(
    error instanceof Error ? error : new Error('Network request failed'),
    'medium',
    'NETWORK_ERROR',
    { url }
  )
}

// Validation error handling
export function handleValidationError(message: string, field?: string): never {
  throw errorManager.handleError(
    new Error(message),
    'low',
    'VALIDATION_ERROR',
    { field }
  )
}