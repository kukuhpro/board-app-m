# Board App

A modern job board application built with Next.js 15, TypeScript, and Supabase, following Clean Architecture principles and Atomic Design patterns.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Code Structure](#code-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Design Patterns](#design-patterns)
- [Testing](#testing)

## Overview

This is a full-featured job board application that allows users to create, view, update, and delete job postings. The application emphasizes clean code architecture, type safety, performance optimization, and accessibility.

## Tech Stack

### Core
- **Next.js 15.5** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5.9** - Type safety
- **Tailwind CSS 4** - Styling

### Backend & Database
- **Supabase** - Backend as a Service (Authentication, Database, Storage)
- **@supabase/ssr** - Server-side authentication

### State Management
- **Zustand** - Lightweight state management
- **SWR** - Data fetching and caching
- **React Hook Form** - Form state management

### Validation & Type Safety
- **Zod 4** - Runtime validation and schema definition
- **@hookform/resolvers** - Form validation integration

### Monitoring & Observability
- **OpenTelemetry** - Distributed tracing and metrics
- Supports Jaeger, Honeycomb, New Relic, DataDog

### Testing
- **Jest 30** - Test runner
- **React Testing Library** - Component testing
- **jest-axe** - Accessibility testing

### Development Tools
- **Webpack Bundle Analyzer** - Bundle size analysis
- **ESLint** - Code linting

## Architecture

This application follows **Clean Architecture** principles with clear separation of concerns:

```
┌─────────────────────────────────────────────┐
│           Presentation Layer                │
│    (UI Components, Pages, Hooks)            │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│          Application Layer                  │
│         (Use Cases, DTOs)                   │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│           Domain Layer                      │
│    (Entities, Value Objects, Rules)         │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│        Infrastructure Layer                 │
│  (Repositories, Adapters, External APIs)    │
└─────────────────────────────────────────────┘
```

### Layer Responsibilities

1. **Domain Layer** (`src/domain/`)
   - Core business entities (Job, User)
   - Value objects (JobType)
   - Business rules and domain logic

2. **Application Layer** (`src/application/`)
   - Use cases (CreateJob, UpdateJob, DeleteJob, GetJobs, GetJobById)
   - Application-specific business rules
   - Orchestrates data flow between layers

3. **Infrastructure Layer** (`src/infrastructure/`)
   - Repository implementations (JobRepository)
   - External service adapters (SupabaseAdapter)
   - Database and API integrations

4. **Presentation Layer** (`src/components/`, `app/`)
   - UI components following Atomic Design
   - Pages and routing (Next.js App Router)
   - Hooks and context providers

## Code Structure

```
board-app/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── jobs/            # Job CRUD endpoints
│   │   └── users/           # User endpoints
│   ├── auth/                # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/           # Dashboard page
│   ├── jobs/                # Job pages
│   │   ├── [id]/           # Job detail page
│   │   └── new/            # Create job page
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── error.tsx            # Error boundary
│   ├── loading.tsx          # Loading UI
│   ├── not-found.tsx        # 404 page
│   ├── globals.css          # Global styles
│   ├── robots.ts            # SEO robots
│   └── sitemap.ts           # SEO sitemap
│
├── src/
│   ├── application/         # Application layer
│   │   └── useCases/        # Use cases (business logic)
│   │       ├── CreateJobUseCase.ts
│   │       ├── UpdateJobUseCase.ts
│   │       ├── DeleteJobUseCase.ts
│   │       ├── GetJobsUseCase.ts
│   │       ├── GetJobByIdUseCase.ts
│   │       └── __tests__/   # Use case tests
│   │
│   ├── domain/              # Domain layer
│   │   ├── entities/        # Domain entities
│   │   │   ├── Job.ts
│   │   │   └── User.ts
│   │   └── valueObjects/    # Value objects
│   │       └── JobType.ts
│   │
│   ├── infrastructure/      # Infrastructure layer
│   │   ├── adapters/        # External service adapters
│   │   │   └── SupabaseAdapter.ts
│   │   └── repositories/    # Repository implementations
│   │       ├── interfaces.ts
│   │       └── JobRepository.ts
│   │
│   ├── components/          # Atomic Design components
│   │   ├── atoms/           # Basic building blocks
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Label.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── SkipNavigation.tsx
│   │   │   └── OptimizedImage.tsx
│   │   ├── molecules/       # Simple component groups
│   │   │   ├── FormField.tsx
│   │   │   ├── JobCard.tsx
│   │   │   ├── FilterBar.tsx
│   │   │   └── EmptyState.tsx
│   │   ├── organisms/       # Complex component groups
│   │   │   ├── JobForm.tsx
│   │   │   ├── JobList.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── AuthForm.tsx
│   │   │   └── ToastContainer.tsx
│   │   └── templates/       # Page layouts
│   │       ├── DashboardLayout.tsx
│   │       ├── JobLayout.tsx
│   │       └── PublicLayout.tsx
│   │
│   ├── lib/                 # Shared utilities
│   │   ├── supabase/        # Supabase client & helpers
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   ├── middleware.ts
│   │   │   ├── auth-provider.tsx
│   │   │   └── auth-helpers.ts
│   │   ├── validations/     # Zod schemas
│   │   │   └── job.ts
│   │   ├── telemetry/       # OpenTelemetry
│   │   │   ├── api-wrapper.ts
│   │   │   └── tracer.ts
│   │   ├── performance/     # Performance utilities
│   │   │   ├── dynamic-imports.ts
│   │   │   ├── lazy-components.tsx
│   │   │   └── monitoring.ts
│   │   ├── seo/             # SEO utilities
│   │   │   └── metadata.ts
│   │   ├── accessibility/   # A11y utilities
│   │   │   └── colors.ts
│   │   └── hooks/           # Custom hooks
│   │       └── useSWR.ts
│   │
│   ├── stores/              # Zustand stores
│   │   ├── authStore.ts
│   │   └── filterStore.ts
│   │
│   ├── contexts/            # React contexts
│   │   └── ToastContext.tsx
│   │
│   ├── providers/           # Context providers
│   │   └── SWRProvider.tsx
│   │
│   ├── hooks/               # Custom React hooks
│   │   └── useToastNotification.ts
│   │
│   └── types/               # TypeScript types
│       └── database.ts
│
├── __tests__/               # Test files
│   └── performance/         # Performance tests
│
├── scripts/                 # Build scripts
│   └── analyze-bundle.js
│
├── supabase/               # Supabase configuration
│
├── middleware.ts           # Next.js middleware
├── instrumentation.ts      # OpenTelemetry setup
├── jest.config.js          # Jest configuration
├── jest.api.config.js      # API test configuration
├── next.config.js          # Next.js configuration
├── tailwind.config.ts      # Tailwind configuration
└── tsconfig.json           # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ or higher
- npm or pnpm
- Supabase account (for backend services)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd board-app
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Update `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: OpenTelemetry configuration
OTEL_SERVICE_NAME=job-board-app
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=http://localhost:4318/v1/metrics
OTEL_EXPORTER_OTLP_HEADERS=
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- **`npm run dev`** - Start development server
- **`npm run build`** - Build for production
- **`npm start`** - Start production server
- **`npm run lint`** - Run ESLint
- **`npm run typecheck`** - Run TypeScript type checking
- **`npm test`** - Run all tests
- **`npm run test:watch`** - Run tests in watch mode
- **`npm run test:perf`** - Run performance tests
- **`npm run analyze`** - Build with bundle analysis
- **`npm run analyze:bundle`** - Analyze bundle size
- **`npm run build:analyze`** - Build and analyze bundle

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |

### Optional (OpenTelemetry)

| Variable | Description | Default |
|----------|-------------|---------|
| `OTEL_SERVICE_NAME` | Service name for tracing | `job-board-app` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP endpoint for traces | `http://localhost:4318/v1/traces` |
| `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` | OTLP endpoint for metrics | `http://localhost:4318/v1/metrics` |
| `OTEL_EXPORTER_OTLP_HEADERS` | Custom headers for OTLP exporter | - |

## Design Patterns

### Clean Architecture

The project follows Clean Architecture principles:
- **Dependency Rule**: Dependencies point inward (UI → Application → Domain)
- **Domain Layer**: Pure business logic, no framework dependencies
- **Use Cases**: Single responsibility, orchestrate business logic
- **Repository Pattern**: Abstract data access

### Atomic Design

UI components are organized following Atomic Design:
- **Atoms**: Basic UI elements (Button, Input, Label)
- **Molecules**: Simple component groups (FormField, JobCard)
- **Organisms**: Complex components (JobForm, Navigation)
- **Templates**: Page layouts (DashboardLayout, JobLayout)
- **Pages**: Actual pages in `app/` directory

### Additional Patterns

- **Repository Pattern**: Data access abstraction
- **Adapter Pattern**: External service integration (SupabaseAdapter)
- **Provider Pattern**: Dependency injection via React Context
- **Hook Pattern**: Reusable stateful logic
- **Server-Side Rendering**: Next.js App Router with RSC

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run performance tests
npm run test:perf
```

### Test Structure

- Unit tests for use cases: `src/application/useCases/__tests__/`
- Component tests: Co-located with components
- Performance tests: `__tests__/performance/`
- API tests: Configured via `jest.api.config.js`

### Testing Tools

- **Jest**: Test runner and assertions
- **React Testing Library**: Component testing
- **jest-axe**: Accessibility testing
- **@testing-library/user-event**: User interaction simulation

## Performance Optimization

- **Code Splitting**: Dynamic imports for heavy components
- **Image Optimization**: Next.js Image component with lazy loading
- **Bundle Analysis**: Webpack Bundle Analyzer integration
- **SWR Caching**: Client-side data caching and revalidation
- **OpenTelemetry**: Performance monitoring and tracing

## Accessibility

- WCAG 2.1 AA compliant
- Semantic HTML
- ARIA attributes
- Keyboard navigation support
- Skip navigation links
- Color contrast validation
- Automated testing with jest-axe

## Next Steps in Development

### High Priority

#### 1. Enhanced Field Validation & Error Messages
- [ ] **Comprehensive Zod validation schemas**
  - Add detailed validation for all form fields
  - Min/max length requirements
  - Pattern matching for email, phone, URLs
  - Custom error messages per validation rule

- [ ] **Proper error message display**
  - Real-time validation feedback
  - Field-level error messages
  - Form-level error summary
  - Accessible error announcements (ARIA live regions)

- [ ] **Validation examples to implement**
  ```typescript
  // Job title: 3-100 chars, no special chars
  // Salary: positive numbers only, proper ranges
  // Email: valid format with custom error
  // URL: valid format for company website
  // Description: min 50 chars, max 5000 chars
  ```

#### 2. UI Component Improvements
- [ ] **Enhanced existing components**
  - Better visual hierarchy and spacing
  - Improved color scheme with brand identity
  - Smooth transitions and animations
  - Loading states for all async actions
  - Empty states with helpful CTAs

- [ ] **New component additions**
  - Badge/Tag component for job types
  - Card variants (elevated, outlined, interactive)
  - Modal/Dialog component
  - Dropdown menu component
  - Tooltip component
  - Pagination component
  - Breadcrumb navigation
  - Progress indicator
  - Skeleton loaders

- [ ] **Component library integration** (consider)
  - Radix UI primitives for accessibility
  - Headless UI components
  - CVA (Class Variance Authority) for variants

#### 3. Advanced Job Search Filters
- [ ] **Additional filter options**
  - Salary range (min/max slider)
  - Location/Remote options
  - Company name/size
  - Experience level (Entry, Mid, Senior)
  - Date posted (Last 24h, Week, Month)
  - Employment type (Full-time, Part-time, Contract)
  - Benefits/Perks
  - Industry/Sector

- [ ] **Filter UI enhancements**
  - Multi-select filters with checkboxes
  - Range sliders for salary
  - Date range picker
  - Auto-suggest for locations/companies
  - Save filter presets
  - Active filter chips with remove option
  - Filter count badge
  - Clear all filters button

- [ ] **Filter functionality**
  - URL-based filter state (shareable links)
  - Filter persistence in localStorage
  - Debounced search input
  - Real-time result count
  - Sort options (date, salary, relevance)

### Medium Priority

#### 4. User Experience Enhancements
- [ ] Infinite scroll or pagination for job listings
- [ ] Job bookmarking/favorites
- [ ] Recently viewed jobs
- [ ] Email alerts for new matching jobs
- [ ] Share job functionality
- [ ] Print-friendly job details

#### 5. Dashboard Improvements
- [ ] Analytics and charts (job views, applications)
- [ ] Quick stats cards
- [ ] Recent activity feed
- [ ] Saved searches management

#### 6. Additional Features
- [ ] Application tracking system
- [ ] Company profiles
- [ ] User profiles with resumes
- [ ] Job recommendations based on preferences
- [ ] Dark mode toggle
- [ ] Multi-language support (i18n)

## License

ISC
