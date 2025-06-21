import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ErrorManager, errorManager, withErrorHandling } from '../../src/utils/error-handler'

describe('ErrorManager', () => {
  let manager: ErrorManager

  beforeEach(() => {
    manager = new ErrorManager()
    manager.clearErrors()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should handle and store errors', () => {
    const error = new Error('Test error')
    const appError = manager.handleError(error, 'high', 'TEST_ERROR', { context: 'test' })

    expect(appError.message).toBe('Test error')
    expect(appError.severity).toBe('high')
    expect(appError.code).toBe('TEST_ERROR')
    expect(appError.context).toEqual({ context: 'test' })
    expect(appError.timestamp).toBeDefined()

    const errors = manager.getErrors()
    expect(errors).toHaveLength(1)
    expect(errors[0]).toEqual(appError)
  })

  it('should filter errors by severity', () => {
    manager.handleError(new Error('Low error'), 'low')
    manager.handleError(new Error('High error'), 'high')
    manager.handleError(new Error('Critical error'), 'critical')

    const highErrors = manager.getErrors('high')
    expect(highErrors).toHaveLength(1)
    expect(highErrors[0].message).toBe('High error')
  })

  it('should limit stored errors', () => {
    // Create more errors than the max limit
    for (let i = 0; i < 60; i++) {
      manager.handleError(new Error(`Error ${i}`), 'low')
    }

    const errors = manager.getErrors()
    expect(errors.length).toBeLessThanOrEqual(50)
  })

  it('should clear errors', () => {
    manager.handleError(new Error('Test error'), 'low')
    expect(manager.getErrors()).toHaveLength(1)

    manager.clearErrors()
    expect(manager.getErrors()).toHaveLength(0)
  })

  it('should notify error listeners', () => {
    const listener = vi.fn()
    const unsubscribe = manager.onError(listener)

    const error = new Error('Test error')
    manager.handleError(error, 'medium')

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Test error',
        severity: 'medium'
      })
    )

    unsubscribe()
  })

  it('should unsubscribe error listeners', () => {
    const listener = vi.fn()
    const unsubscribe = manager.onError(listener)

    manager.handleError(new Error('Before unsubscribe'), 'low')
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    manager.handleError(new Error('After unsubscribe'), 'low')
    expect(listener).toHaveBeenCalledTimes(1) // Should not be called again
  })

  it('should generate user-friendly messages', () => {
    const databaseError = manager.handleError(
      new Error('Database failed'),
      'high',
      'DATABASE_ERROR'
    )
    
    const networkError = manager.handleError(
      new Error('Network failed'),
      'medium',
      'NETWORK_ERROR'
    )

    expect(manager.getUserFriendlyMessage(databaseError))
      .toBe('We had trouble saving your data. Please try again.')
    
    expect(manager.getUserFriendlyMessage(networkError))
      .toBe('Connection problem. Please check your internet connection.')
  })
})

describe('withErrorHandling', () => {
  beforeEach(() => {
    errorManager.clearErrors()
  })

  it('should execute successful operations', async () => {
    const successfulOperation = async () => 'success'
    const result = await withErrorHandling(successfulOperation)

    expect(result).toBe('success')
    expect(errorManager.getErrors()).toHaveLength(0)
  })

  it('should handle operation failures', async () => {
    const failingOperation = async () => {
      throw new Error('Operation failed')
    }

    const result = await withErrorHandling(failingOperation, 'TEST_OP', { test: true })

    expect(result).toBeNull()

    const errors = errorManager.getErrors()
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toBe('Operation failed')
    expect(errors[0].code).toBe('TEST_OP')
    expect(errors[0].context).toEqual({ test: true })
  })

  it('should handle non-Error objects', async () => {
    const failingOperation = async () => {
      throw 'String error'
    }

    const result = await withErrorHandling(failingOperation)

    expect(result).toBeNull()

    const errors = errorManager.getErrors()
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toBe('String error')
  })
})