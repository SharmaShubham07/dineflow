# DineFlow - Modern Cafe POS & QR Table Ordering System

Production-ready, multi-tenant Cafe/Restaurant POS and QR Table Ordering web application designed for fast, frictionless hospitality workflows (similar to Petpooja).

---

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, React Router v6, Tailwind CSS
- **State Management**: TanStack Query (server-state), Zustand (cart & UI state)
- **Backend & Auth**: Firebase Auth, Cloud Firestore (real-time listeners), Cloud Storage
- **Design System**: Glassmorphism cards with solid Lite mode fallbacks, WCAG AA compliance, reduced motion support

---

## Features (Phase 1 Delivered)

- **Design System & Theme Tokens**: Warm neutral palette with terracotta accent (`#C2632A`). Full light, dark, and system theme modes.
- **Lite Mode Support**: Automatically detects low-spec mobile devices (`<= 2GB RAM` or `<= 4 cores`) to disable blur/shadows and ensure 60fps performance on budget phones.
- **Component Library**:
  - `GlassCard` (flat, raised, interactive variants)
  - `Button` & `IconButton` (accessible touch targets >= 44px)
  - `Input`, `Select`, `Switch`
  - `Tabs`, `Modal`, `Drawer`
  - `Badge` (with Veg/Non-Veg/Egg food standard dots)
  - `Skeleton`, `EmptyState`, `StatCard`
  - `Toast` notification system
- **Role-Based Routing**:
  - Public QR landing (`/m/:cafeId/:token`)
  - Authentication (`/login`)
  - Super Admin portal (`/super/*`)
  - Cafe Admin operations (`/admin/*`)
- **Security & Rules**: Strict Firestore rules enforcing multi-tenant isolation.

---

## Getting Started

### 1. Prerequisites
- Node.js >= 18
- npm

### 2. Installation
```bash
npm install
```

### 3. Firebase Configuration
1. Open [Firebase Console](https://console.firebase.google.com/) and create/select your **DineFlow** project.
2. In Project Settings, register a **Web App** and copy your credentials.
3. Enable **Authentication** with Email/Password sign-in provider.
4. Enable **Cloud Firestore** and choose production or test mode.
5. Create a `.env.local` file in the root directory (based on `.env.example`):
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=dineflow.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dineflow
VITE_FIREBASE_STORAGE_BUCKET=dineflow.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Project Structure

```
├── firestore.rules          # Production Firestore security rules
├── index.html               # Main HTML entry
├── tailwind.config.ts       # Design tokens & color system
├── vite.config.ts           # Bundler & alias configuration
└── src/
    ├── components/
    │   ├── auth/            # ProtectedRoute, RoleGuard
    │   ├── layout/          # AdminLayout, CustomerLayout, Sidebar, ThemeToggle
    │   └── ui/              # Reusable glassmorphic design system
    ├── config/              # Firebase initialization
    ├── contexts/            # AuthContext
    ├── hooks/               # useTheme, useLiteMode, useAuth
    ├── pages/               # SuperAdmin, Admin, Customer QR Menu, Login
    ├── stores/              # Zustand UI store
    └── types/               # Full TypeScript schemas for POS data model
```

