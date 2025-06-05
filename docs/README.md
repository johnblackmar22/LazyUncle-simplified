# LazyUncle-Simplified

> A clean, simple "set-it-and-forget-it" gift management app

## 🎯 Vision

LazyUncle-Simplified focuses on the core value proposition: **register a recipient, tell us about them, set occasions, and we handle the rest**. No complex AI, no overwhelming features - just simple, automated gift giving.

## ✨ Core Features

- **Quick Recipient Setup**: Name, relationship, interests - that's it
- **Simple Occasions**: Birthday, Christmas, Anniversary, or custom
- **Gift Recommendations**: Curated suggestions based on interests
- **Set-and-Forget**: Minimal ongoing management required

## 🏗️ Architecture

### Clean & Simple
- **React + TypeScript** for type safety
- **Chakra UI** for consistent design
- **Firebase** for production data
- **localStorage** for demo mode
- **Vite** for fast development

### Data Structure
```
User → Recipients → Occasions → Gifts
```

Simple, linear relationships with minimal required fields.

## 🚀 Getting Started

### Quick Start
```bash
# Clone and start
git clone <repo-url>
cd LazyUncle-Simplified
./scripts/start-fresh.sh
```

### Manual Setup
```bash
npm install
npm run dev
```

### Demo Mode
The app works fully offline with demo data - no Firebase setup required for development.

## 📁 Project Structure

```
src/
├── components/          # UI components
├── pages/              # Route pages
├── store/              # Zustand state management
├── hooks/              # Custom React hooks
├── services/           # Business logic
├── types/              # TypeScript definitions
└── utils/              # Helper functions

docs/
├── DATA_ARCHITECTURE.md    # Data structure guide
└── ai/                     # Legacy AI docs (outdated)
```

## 🎁 Gift Flow

1. **Add Recipient**: Name, relationship, interests
2. **Create Occasion**: Birthday, Christmas, etc.
3. **Get Suggestions**: Simple recommendations
4. **Select & Order**: One-click gift selection
5. **Automated Delivery**: Set-and-forget

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests

### Environment Variables
```bash
# Optional - for production Firebase
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
# ... other Firebase config

# Demo mode (default)
VITE_USE_DEMO_MODE=true
```

## 📊 Current Status

### ✅ Completed
- Clean project structure
- Basic recipient management
- Occasion tracking
- Gift selection persistence
- Demo mode functionality
- Responsive UI design

### 🔄 In Progress
- Simple gift recommendation system
- Curated gift catalog
- Basic ordering workflow

### 📋 Planned
- Payment integration
- Automated delivery scheduling
- Mobile app

## 🎯 Design Principles

1. **Simplicity First**: Minimal user input required
2. **Automation Focus**: Set-it-and-forget-it experience
3. **Clean Architecture**: Easy to understand and maintain
4. **User-Centric**: Solve real gifting problems simply

## 🤝 Contributing

This is a simplified, focused project. Contributions should align with the "simple and automated" philosophy.

## 📝 License

[Your License Here]

---

**LazyUncle-Simplified**: Because gift giving should be simple, not stressful.
