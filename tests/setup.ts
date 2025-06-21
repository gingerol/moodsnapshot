import { vi } from 'vitest'

// Mock IndexedDB for testing
global.indexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
  cmp: vi.fn(),
} as any

// Mock fetch for any network requests
global.fetch = vi.fn()

// Mock window.navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'test-user-agent',
    permissions: {
      query: vi.fn(),
    },
  },
  writable: true,
})

// Mock Notification API
global.Notification = {
  requestPermission: vi.fn().mockResolvedValue('granted'),
  permission: 'default',
} as any

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock Canvas for Chart.js tests
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Array(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({ data: new Array(4) })),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
})

// Mock HTMLCanvasElement methods
HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,test')
HTMLCanvasElement.prototype.getContext = vi.fn()

// Suppress console warnings in tests
const originalConsoleWarn = console.warn
console.warn = (...args: any[]) => {
  // Suppress specific warnings that are expected in tests
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Chart.js') || 
     args[0].includes('IndexedDB') ||
     args[0].includes('Service Worker'))
  ) {
    return
  }
  originalConsoleWarn.apply(console, args)
}