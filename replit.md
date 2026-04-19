# Okiru.Pro B-BBEE Compliance Intelligence Platform

## Overview

This is a production-ready multi-tenant B-BBEE (Broad-Based Black Economic Empowerment) compliance web application for South African businesses. It replicates the functionality of a 52-sheet Excel toolkit ("Okiru Toolkit RCOGP") as an interactive web platform. The core purpose is to let users upload their B-BBEE Excel files, view compliance scorecards on a dashboard, edit pillar data with real-time score updates, run "what-if" scenario planning, and export reports (Excel, PDF, PowerPoint).

The project is currently in **Phase 1: Excel-Driven**, where Excel is the source of truth and the system must produce calculations that match the Excel toolkit exactly. The platform is being built for a consulting company (Okiru) and their client Chengetai.

**Key domain concepts:**
- **B-BBEE Scorecard**: Measures compliance across 7 pillars (Ownership, Management Control, Skills Development, Procurement, ESD, SED, YES) with a total score determining a Level (1-8 or Non-compliant)
- **Sub-minimum rules**: Priority pillars (Ownership, Skills, Procurement) must achieve ≥40% of target or the level gets discounted by 1
- **Deemed NPAT**: If actual profit margin < 25% of industry norm, use Revenue × Industry Norm instead
- **EAP (Economically Active Population)**: Province-specific demographic targets that affect Management Control and Skills calculations

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **Feb 2026**: Full production transformation complete:
  - PostgreSQL schema with 14+ tables (users, organizations, clients, all pillar data, scenarios, import/export logs)
  - Session-based authentication with bcrypt password hashing and express-session + connect-pg-simple
  - Multi-tenant architecture: users → organizations → clients → pillar data
  - Organization-scoped access control on all client data API routes (verifyClientAccess middleware)
  - Zustand store rewritten as API-backed data layer (loads from DB, persists changes via API)
  - Complete rebrand from "Okiru" to "Okiru.Pro" across all UI, exports, and metadata
  - Fixed routing bug where procurement page incorrectly loaded ESD component
  - Error handling in store hydration to prevent infinite loading states

## System Architecture

### Frontend
- **Framework**: React (SPA) with Vite as the build tool
- **Routing**: Wouter (lightweight client-side router)
- **UI Components**: shadcn/ui (new-york style) with Radix UI primitives
- **Styling**: Tailwind CSS v4 (using `@tailwindcss/vite` plugin)
- **State Management**: Zustand store (API-backed) + TanStack React Query for server state
- **Animations**: Framer Motion for page transitions
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers
- **Charts**: Recharts for data visualization
- **Fonts**: Inter (body) and Plus Jakarta Sans (headings)
- **Theme**: Light/dark mode support via a ThemeProvider component

### Frontend Structure
- `client/src/App.tsx` - Main app with auth protection, client selection, data loading, routes
- `client/src/pages/` - Page components: Dashboard, Scorecard, ExcelImport, Scenarios, Reports, Settings, AuthPage, ClientSelector
- `client/src/pages/pillars/` - Individual pillar pages: Ownership, ManagementControl, SkillsDevelopment, ESD, SED, Financials, IndustryNorms
- `client/src/components/layout/AppLayout.tsx` - Main layout wrapper (sidebar navigation)
- `client/src/components/ui/` - shadcn/ui component library
- `client/src/lib/auth.tsx` - AuthProvider context with login/register/logout/session persistence
- `client/src/lib/api.ts` - API helper module for all HTTP calls with error handling
- `client/src/lib/store.ts` - Zustand store: loads from API on client selection, persists changes via API
- `client/src/lib/client-context.tsx` - Active client context with localStorage persistence
- Path aliases: `@/` → `client/src/`, `@shared/` → `shared/`, `@assets/` → `attached_assets/`

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript (compiled with tsx for dev, esbuild for production)
- **API Pattern**: REST API endpoints under `/api/`
- **Authentication**: bcrypt password hashing, express-session with connect-pg-simple store, httpOnly cookies
- **Authorization**: Organization-scoped access control via verifyClientAccess middleware
- **File Upload**: Multer (memory storage, 50MB limit) for Excel/CSV/PDF uploads
- **Excel Processing**: SheetJS (xlsx) library for parsing uploaded Excel files
- **Server entry**: `server/index.ts` → creates Express app + HTTP server

### Key API Endpoints
- `POST /api/auth/register` - User registration with organization creation
- `POST /api/auth/login` - User login with session creation
- `POST /api/auth/logout` - Session destruction
- `GET /api/auth/me` - Current user info
- `GET/POST /api/clients` - Client CRUD (org-scoped)
- `GET /api/clients/:id/data` - Full client data bundle (all pillar data, scenarios, financial years)
- `POST/DELETE /api/clients/:id/shareholders` - Shareholder management
- `PATCH /api/clients/:id/ownership` - Ownership data updates
- `POST/DELETE /api/clients/:id/employees` - Employee management
- `POST/DELETE /api/clients/:id/training-programs` - Training program management
- `POST/DELETE /api/clients/:id/suppliers` - Supplier management
- `PATCH /api/clients/:id/procurement` - Procurement data updates
- `POST/DELETE /api/clients/:id/esd-contributions` - ESD contribution management
- `POST/DELETE /api/clients/:id/sed-contributions` - SED contribution management
- `POST/DELETE /api/clients/:id/scenarios` - Scenario management
- `POST/DELETE /api/clients/:id/financial-years` - Financial year management
- `POST /api/import/excel` - Upload and parse Excel files
- `POST /api/export-log` - Log export events
- `GET /api/clients/:id/export-logs` - Export history

### Data Storage
- **Database**: SQLite (file-based, `sqlite.db`) via Drizzle ORM with better-sqlite3 driver
- **Schema** (`shared/schema.ts`): 14+ tables - users, organizations, clients, financialYears, shareholders, ownershipData, employees, trainingPrograms, suppliers, procurementData, esdContributions, sedContributions, scenarios, importLogs, exportLogs
- **Storage Layer**: `server/storage.ts` - DatabaseStorage class with complete CRUD interface using Drizzle ORM
- **Session Store**: memorystore (in-memory session store with automatic expiry cleanup)
- **Table Creation**: Tables are auto-created on startup via `server/db.ts` using `CREATE TABLE IF NOT EXISTS`

### Data Flow
1. `App.tsx` → `AuthProvider` → `ClientProvider` → `DataLoader` → Zustand store
2. `store.loadClientData(clientId)` → API fetch → hydrate store state
3. Client-side calculation engines process raw data → UI rendering
4. User mutations → Zustand store update → API persist → recalculate

### Build System
- **Development**: `tsx server/index.ts` runs the server which sets up Vite dev middleware for HMR
- **Production Build**: Custom `script/build.ts` that runs Vite build (client → `dist/public/`) then esbuild (server → `dist/index.cjs`)
- **Production Start**: `node dist/index.cjs` serves static files from `dist/public/`

### Key Design Decisions
1. **Monorepo structure** with shared types between client and server via `shared/` directory
2. **Excel-first approach**: The system is designed around importing Excel files and replicating their calculations exactly
3. **Cross-pillar cascading**: Changes in one pillar propagate to dependent pillars
4. **Scenario isolation**: What-if scenarios never modify base data; they create isolated JSONB snapshots
5. **Client-side calculation preference**: Scorecard recalculations happen client-side; APIs only persist raw data
6. **Multi-tenant isolation**: All client data routes verify organization ownership before access
7. **API-backed Zustand store**: Store loads from API on client selection, maintains working state in memory, persists changes back via API calls

### B-BBEE Calculation Engine (Domain Logic)
The scorecard calculations must match the Excel toolkit exactly:
- **Ownership** (max 25 pts): Voting Rights, Economic Interest, Net Value with graduation tables
- **Management Control** (max 19 pts): Board, Executive, Senior/Middle/Junior management representation vs EAP targets
- **Skills Development** (max 25 pts): 3.5% of leviable amount target, bursaries, absorption
- **Procurement** (max 29 pts): Supplier recognition levels (L1=135%, L2=125%, L3=110%, L4=100%), bonus points
- **ESD** (max 15 pts): 2% NPAT for Supplier Dev, 1% for Enterprise Dev
- **SED** (max 5 pts): 1% of NPAT target
- **Level determination**: Total points → Level 1 (≥100) through Level 8 (≥40), with sub-minimum discounting

## External Dependencies

### Core Runtime
- **SQLite**: File-based database (`sqlite.db`) via better-sqlite3 driver
- **Drizzle ORM** + **drizzle-kit**: Database schema management and queries
- **bcrypt**: Password hashing (10 rounds)
- **express-session** + **memorystore**: Session management with in-memory store

### Key Libraries
- **SheetJS (xlsx)**: Excel file parsing and generation - critical for the Excel import/export pipeline
- **Recharts**: Dashboard charts and data visualization
- **canvas-confetti**: Celebration effects (for level achievements)
- **date-fns**: Date formatting and manipulation
- **Zod**: Schema validation (shared between client and server via drizzle-zod)
- **Framer Motion**: Page transition animations
- **uuid/nanoid**: ID generation
- **Zustand**: Client-side state management (API-backed)

### Planned/Future Integrations
- **AI/OCR**: Future phase for document ingestion (Tesseract, OpenAI)
- **Role-based access control**: Expand beyond basic user roles
- **Replit-specific plugins**: vite-plugin-runtime-error-modal, cartographer, dev-banner, meta-images (for deployment)
