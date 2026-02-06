# Gestor de Expedientes V2

Professional desktop application for managing administrative records (expedientes) for the **Jefatura de Zona de Riego** (Irrigation Zone Management Office). Built with a modern full-stack architecture combining React frontend with Rust backend via Tauri, featuring offline-first dual-database synchronization.

## 🚀 Features

- **Offline-First Architecture**: SQLite for local persistence, PostgreSQL for remote sync
- **Full-Stack Type Safety**: TypeScript frontend + Rust backend with compile-time guarantees
- **Expedientes Management**: Complete CRUD operations with search and filtering
- **Responsive UI**: Built with React, Tailwind CSS, and shadcn/ui components
- **Cross-Platform Desktop**: Packaged with Tauri for Windows, macOS, and Linux support
- **Clean Architecture**: Repository pattern, service layer, and clear separation of concerns

## 🛠️ Tech Stack

### Frontend
- **React 19.1** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite 7.0** - Lightning-fast build tool
- **Tailwind CSS 3.4** - Utility-first styling
- **shadcn/ui** - High-quality React components
- **Tauri API 2.x** - Desktop IPC communication

### Backend
- **Rust** - Systems programming language
- **Tauri 2.x** - Desktop framework
- **Tokio** - Async runtime
- **SQLx 0.7** - Type-safe SQL library
  - **SQLite** - Local/offline database
  - **PostgreSQL** - Remote/sync database

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Rust 1.70+ (via rustup)
- Visual Studio 2022 Community (C++ build tools for Windows)

### Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd gestor-irrigacion
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run tauri dev
```

## 🏗️ Project Structure

```
gestor-irrigacion/
├── src/                      # React frontend
│   ├── components/
│   │   ├── Dashboard.tsx    # Main application
│   │   └── ui/              # shadcn/ui components
│   ├── services/
│   ├── types/
│   └── main.tsx
├── src-tauri/               # Rust backend
│   ├── src/
│   │   ├── models/          # Data structures
│   │   ├── db/              # Database layer
│   │   ├── repositories/    # Data access
│   │   ├── commands/        # Tauri handlers
│   │   └── error.rs
│   ├── migrations/          # SQL migrations
│   └── Cargo.toml
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🚀 Development Commands

```bash
npm run tauri dev      # Start dev server
npm run tauri build    # Production build
npm run type-check     # TypeScript check
```

## 🔄 Architecture

**Offline-First Dual-Database**:
- **SQLite** (Primary): Always available, zero config
- **PostgreSQL** (Secondary): Automatic sync when available

## 📄 License

TBD

---

**Built with ❤️ for efficient irrigation zone record management**
