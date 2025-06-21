# Mood Snapshot

A minimalist web application for mood tracking with local storage and PWA capabilities. Track your daily moods, analyze patterns, and gain insights into your emotional well-being while maintaining complete privacy.

![Mood Snapshot Preview](https://via.placeholder.com/800x400/4F46E5/ffffff?text=Mood+Snapshot)

## ✨ Features

- **📱 Progressive Web App**: Install to your home screen for native-like experience
- **😊 Simple Mood Logging**: Quick daily check-ins with emoji-based mood selection
- **🏷️ Tag-based Insights**: Track what influences your moods with customizable tags
- **📅 Calendar History**: Visual monthly view of your mood patterns
- **📊 Data Visualization**: Charts and graphs to understand your emotional trends
- **⚙️ Customizable**: Personalize mood scales, colors, and labels
- **🔒 Privacy-First**: All data stored locally on your device
- **📤 Data Export**: Export your data for backup or sharing with professionals
- **🌙 Dark Mode**: Automatic dark/light theme support
- **🔔 Daily Reminders**: Optional browser notifications (with permission)

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/gingerol/moodsnapshot.git
   cd moodsnapshot
   ```

2. **Start development server**
   ```bash
   docker-compose --profile dev up
   ```

3. **Open your browser**
   Navigate to `http://localhost:5173`

### Railway Deployment

Deploy to Railway with one click:

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/mood-snapshot)

Or manually:

1. **Fork this repository**
2. **Connect to Railway** at [railway.app](https://railway.app)
3. **Import your fork** - Railway will auto-detect the configuration
4. **Deploy** - Your app will be live in minutes!

### Local Development

1. **Prerequisites**
   - Node.js 18+ 
   - npm 9+

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 📦 Production Deployment

### Docker Production Build

```bash
# Build production image
docker build --target production -t mood-snapshot:latest .

# Run production container
docker run -p 80:80 mood-snapshot:latest
```

### Manual Build

```bash
# Build for production
npm run build:prod

# Preview production build locally
npm run preview
```

### Environment Variables

Create environment files for different stages:

- `.env.development` - Development settings
- `.env.staging` - Staging environment
- `.env.production` - Production settings

Example `.env.production`:
```
VITE_ENV=production
VITE_APP_TITLE=Mood Snapshot
VITE_ENABLE_ANALYTICS=true
VITE_LOG_LEVEL=error
```

## 🛠️ Development

### Project Structure

```
mood-snapshot/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Application pages/routes
│   ├── styles/        # CSS stylesheets
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Utility functions and helpers
│   └── main.ts        # Application entry point
├── public/
│   ├── icons/         # PWA icons
│   └── manifest.json  # PWA manifest
├── tests/
│   ├── unit/          # Unit tests
│   └── e2e/           # End-to-end tests
├── docker-compose.yml # Docker development setup
├── Dockerfile         # Multi-stage Docker build
└── vite.config.ts     # Vite configuration
```

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run format          # Format code with Prettier
npm run type-check      # TypeScript type checking

# Testing
npm run test            # Run unit tests
npm run test:ui         # Run tests with UI
npm run test:e2e        # Run end-to-end tests

# Analysis
npm run build:analyze   # Build and analyze bundle size
```

### Docker Development

```bash
# Development with hot reload
docker-compose --profile dev up

# Production build
docker-compose --profile prod up

# Run tests
docker-compose --profile test up
```

## 🧪 Testing

### Unit Tests
```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with UI
npm run test:ui
```

### End-to-End Tests
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e -- --ui
```

### Test Coverage
```bash
# Generate coverage report
npm run test -- --coverage
```

## 🔧 Configuration

### PWA Configuration

The app is configured as a Progressive Web App with:
- **Service Worker**: Offline caching and background sync
- **Web App Manifest**: Installation and icon configuration
- **Push Notifications**: Daily reminder capabilities

### Database Schema

Data is stored locally using IndexedDB with the following stores:
- `moods` - Individual mood entries with date, value, and tags
- `settings` - User preferences and configuration
- `tags` - Tag usage statistics for autocomplete

### Customization

Users can customize:
- Mood scale labels and colors
- Daily reminder settings
- Theme preferences (light/dark/auto)
- Data export preferences

## 📊 Analytics & Performance

### Bundle Analysis
```bash
npm run build:analyze
open dist/stats.html
```

### Performance Monitoring
- Lighthouse CI integration in GitHub Actions
- Bundle size tracking with rollup-plugin-visualizer
- Performance budgets configured in Vite

### Browser Support
- Modern browsers with ES2020+ support
- PWA features require HTTPS in production
- IndexedDB support required for data storage

## 🔒 Privacy & Security

### Data Privacy
- **Local Storage Only**: All mood data stays on your device
- **No Server Communication**: Zero external data transmission
- **Export Control**: Users own and control their data
- **Automatic Cleanup**: Optional old data cleanup features

### Security Features
- Content Security Policy (CSP) headers
- XSS protection headers
- Secure cookie settings
- Input sanitization and validation

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks for quality checks

### Commit Guidelines
- Use conventional commit format
- Include tests for new features
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Chart.js** for data visualization
- **IndexedDB** for local storage
- **Vite** for build tooling
- **TypeScript** for type safety
- **Playwright** for E2E testing

## 📞 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs and request features on GitHub
- **Privacy**: All data stays on your device - we can't see it!

## 🗺️ Roadmap

### Version 1.1 (Planned)
- [ ] Data sync across devices (optional cloud backup)
- [ ] Advanced mood patterns and predictions
- [ ] Integration with health apps and wearables
- [ ] More chart types and visualization options

### Version 1.2 (Planned)
- [ ] Guided meditation and wellness content
- [ ] Mood sharing with healthcare providers
- [ ] Advanced reporting and analytics
- [ ] Multiple mood tracking (energy, anxiety, etc.)

---

**Built with ❤️ for mental wellness**

*Mood Snapshot helps you understand your emotional patterns while keeping your data completely private and under your control.*