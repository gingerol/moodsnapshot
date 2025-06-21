// Simple router for SPA navigation

export interface Route {
  path: string
  component: () => Promise<HTMLElement>
  title?: string
}

export class Router {
  private routes: Map<string, Route> = new Map()
  private currentRoute: string | null = null
  private container: HTMLElement | null = null

  constructor(container: HTMLElement) {
    this.container = container
    this.setupEventListeners()
  }

  addRoute(path: string, route: Omit<Route, 'path'>): void {
    this.routes.set(path, { path, ...route })
  }

  private setupEventListeners(): void {
    // Handle back/forward browser navigation
    window.addEventListener('popstate', () => {
      this.handleRoute()
    })

    // Handle link clicks for SPA navigation
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      const link = target.closest('a[data-route]') as HTMLAnchorElement
      
      if (link) {
        event.preventDefault()
        const path = link.getAttribute('data-route')
        if (path) {
          this.navigate(path)
        }
      }
    })
  }

  navigate(path: string): void {
    if (path === this.currentRoute) return

    // Update browser history
    window.history.pushState({}, '', path)
    this.handleRoute()
  }

  private async handleRoute(): Promise<void> {
    const path = window.location.pathname

    const route = this.routes.get(path) || this.routes.get('/404')
    if (!route) {
      console.error('No route found for path:', path)
      return
    }

    try {
      // Update page title
      if (route.title) {
        document.title = `${route.title} - Mood Snapshot`
      }

      // Load and render component
      const component = await route.component()
      
      if (this.container) {
        // Clear current content
        this.container.innerHTML = ''
        this.container.appendChild(component)
      }

      this.currentRoute = path

      // Update navigation active state
      this.updateNavigation(path)

    } catch (error) {
      console.error('Error loading route:', error)
      // Handle route loading error
      if (this.container) {
        this.container.innerHTML = `
          <div class="container p-6">
            <div class="card error text-center">
              <h2>Page Load Error</h2>
              <p>Sorry, we couldn't load this page.</p>
              <button class="btn btn-primary mt-4" onclick="location.reload()">
                Refresh Page
              </button>
            </div>
          </div>
        `
      }
    }
  }

  private updateNavigation(currentPath: string): void {
    // Update bottom navigation active states
    const navItems = document.querySelectorAll('.nav-item')
    navItems.forEach(item => {
      const link = item as HTMLAnchorElement
      const routePath = link.getAttribute('data-route')
      
      if (routePath === currentPath) {
        link.classList.add('active')
      } else {
        link.classList.remove('active')
      }
    })
  }

  async start(): Promise<void> {
    await this.handleRoute()
  }

  getCurrentRoute(): string | null {
    return this.currentRoute
  }
}

// Utility function to create navigation links
export function createNavLink(path: string, text: string, iconSvg?: string): HTMLAnchorElement {
  const link = document.createElement('a')
  link.href = path
  link.setAttribute('data-route', path)
  link.className = 'nav-item'
  
  link.innerHTML = `
    ${iconSvg ? `<span class="nav-icon">${iconSvg}</span>` : ''}
    <span class="nav-label">${text}</span>
  `
  
  return link
}