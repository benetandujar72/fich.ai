# replit.md

## Overview

EduPresència is a comprehensive attendance tracking and presence management system designed specifically for educational institutions in Catalonia. The application addresses the legal requirements for employee time tracking in educational centers, ensuring compliance with Spanish labor laws and GDPR data protection regulations. The system provides features for employee management, attendance tracking, absence management, alert notifications, and detailed reporting while maintaining data privacy and security standards.

## User Preferences

Preferred communication style: Simple, everyday language.

## Current Development Requirements (January 2025)

### Completed Core Infrastructure
- ✓ Removed all mock/hardcoded data from development code
- ✓ Created real database entities with proper relationships
- ✓ Implemented multi-year functionality for academic year management
- ✓ Created test dataset: Institut Bitàcola with 20 teachers for 2025-2026 academic year
- ✓ Implemented email/password authentication system replacing Replit Auth
- ✓ Created admin users for testing (admin@bitacola.edu, director@bitacola.edu, profesor@bitacola.edu)
- ✓ Fixed timestamp conversion errors in attendance tracking system

### ✓ Recently Implemented (January 2025)
- **Role-Based Access Control (RBAC)**: Comprehensive permission system implemented
- **Protected Routes**: All pages now protected based on user roles
- **Role-Specific Navigation**: Sidebar shows only accessible features per role
- **Permission-Based UI**: Dashboard and components adapt to user permissions
- **Real Database Integration**: All mock data completely removed and replaced with PostgreSQL queries

### Current Role Hierarchy
1. **Superadmin**: Full system access, all institutions, security settings
2. **Admin**: Institution-specific management, employee control, reports
3. **Employee**: Personal data only, attendance tracking, limited reports

### Missing Core Functionalities to Implement
1. **Institution Management**: Create/edit institutions, multi-year support
2. **Academic Year Management**: Create/manage academic years per institution
3. **User Profile Management**: Complete user profile system
4. **Employee Onboarding**: Complete employee creation workflow
5. **Advanced Settings**: Institution-specific configurations
6. **Time Tracking Configuration**: QR codes, methods, thresholds
7. **Advanced Reporting**: Multi-year reports, export functionality
8. **Email Notification System**: Alert notifications via email
9. **Additional Roles**: Coordinator, Supervisor, Secretary, Auditor roles
10. **Mobile Application**: Native iOS/Android app with offline capabilities

## System Architecture

### Full-Stack Monorepo Structure
The application follows a monorepo architecture with clear separation between client and server code:
- **Client**: React-based frontend using TypeScript and Vite for development
- **Server**: Express.js backend with TypeScript
- **Shared**: Common schema definitions and types shared between client and server

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: Zustand for global state (language preferences) and TanStack Query for server state
- **UI Framework**: Shadcn/ui components built on Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom design tokens and dark mode support
- **Internationalization**: Custom i18n system supporting Catalan and Spanish languages

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect for secure user authentication
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple
- **API Design**: RESTful endpoints with JSON responses and comprehensive error handling

### Database Design
- **Primary Database**: PostgreSQL using Neon serverless for scalability
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **Key Entities**: Users, Institutions, Employees, Departments, Schedules, Attendance Records, Absences, Alerts, and Settings
- **Data Relationships**: Well-defined foreign key relationships ensuring data integrity
- **Session Storage**: Dedicated sessions table for authentication state persistence

### Authentication & Authorization
- **Authentication Provider**: Email/password authentication with bcrypt hashing
- **Session Management**: Passport.js with PostgreSQL session storage
- **Session Security**: HTTP-only secure cookies with configurable TTL
- **Role-Based Access Control (RBAC)**: Comprehensive permission system with granular controls
- **User Roles**: Superadmin, Admin, Employee with institution-scoped permissions
- **Protected Routes**: Both client-side and server-side route protection
- **Permission System**: usePermissions hook with 20+ permission checks
- **UI Adaptation**: Components and navigation adapt based on user permissions
- **Login Credentials**: Test accounts for admin@bitacola.edu, director@bitacola.edu, profesor@bitacola.edu

### Development & Build Pipeline
- **Development Server**: Vite with HMR for fast frontend development
- **Backend Development**: tsx for TypeScript execution with hot reload
- **Build Process**: Vite for frontend bundling and esbuild for backend compilation
- **Type Safety**: Comprehensive TypeScript configuration with strict mode enabled

### API Structure
The backend provides RESTful endpoints organized by feature:
- **Authentication**: `/api/auth/*` for user authentication and profile management
- **Dashboard**: `/api/dashboard/*` for statistics and overview data
- **Employees**: `/api/employees/*` for employee CRUD operations
- **Attendance**: `/api/attendance/*` for time tracking and presence management
- **Alerts**: `/api/alerts/*` for notification and alert management
- **Reports**: `/api/reports/*` for generating attendance and compliance reports

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity for serverless environments
- **drizzle-orm**: Type-safe ORM for database operations with PostgreSQL support
- **@tanstack/react-query**: Server state management and caching for React applications

### UI Component Libraries
- **@radix-ui/react-***: Comprehensive set of accessible UI primitives for dialogs, dropdowns, forms, and navigation
- **class-variance-authority**: Utility for creating type-safe component variants
- **tailwindcss**: Utility-first CSS framework for rapid UI development

### Authentication & Session Management
- **openid-client**: OpenID Connect client implementation for Replit Auth integration
- **passport**: Authentication middleware with strategy-based approach
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### Development Tools
- **vite**: Fast build tool and development server for modern web applications
- **typescript**: Static type checking for enhanced developer experience
- **@replit/vite-plugin-runtime-error-modal**: Development-time error overlay for better debugging

### Date & Utility Libraries
- **date-fns**: Modern date utility library for date manipulation and formatting
- **zod**: TypeScript-first schema validation for API inputs and data validation
- **clsx**: Utility for conditionally constructing className strings

### Form Handling
- **react-hook-form**: Performant forms library with minimal re-renders
- **@hookform/resolvers**: Validation resolvers for react-hook-form integration

The architecture prioritizes type safety, developer experience, and compliance with educational sector regulations while maintaining scalability and performance.