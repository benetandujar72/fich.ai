## Overview
fich.ai is an attendance tracking and presence management system for educational institutions in Catalonia. It ensures compliance with Spanish labor laws and GDPR by providing features for employee management, attendance tracking, absence management, alerts, and detailed reporting, all while maintaining data privacy and security. The system aims to streamline administrative tasks and provide essential tools for managing educational staff attendance efficiently.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack Monorepo Structure
The application uses a monorepo architecture, separating client and server code:
- **Client**: React with TypeScript and Vite.
- **Server**: Express.js with TypeScript.
- **Shared**: Common schema definitions and types.

### Frontend Architecture
- **Framework**: React 18 with TypeScript.
- **Routing**: Wouter.
- **State Management**: Zustand (global state) and TanStack Query (server state).
- **UI Framework**: Shadcn/ui components built on Radix UI.
- **Styling**: Tailwind CSS with custom design tokens and dark mode.
- **Internationalization**: Custom i18n system for Catalan and Spanish.

### Backend Architecture
- **Runtime**: Node.js with Express.js.
- **Database ORM**: Drizzle ORM with PostgreSQL dialect.
- **Authentication**: Email/password authentication using bcrypt hashing.
- **Session Management**: Express sessions with PostgreSQL storage using `connect-pg-simple`.
- **API Design**: RESTful endpoints with JSON responses.

### Database Design
- **Primary Database**: PostgreSQL using Neon serverless.
- **Schema Management**: Drizzle Kit for migrations.
- **Key Entities**: Users, Institutions, Employees, Departments, Schedules, Attendance Records, Absences, Alerts, and Settings.
- **Session Storage**: Dedicated sessions table.

### Authentication & Authorization
- **Authentication Provider**: Email/password authentication.
- **Session Management**: Passport.js with PostgreSQL session storage.
- **Security**: HTTP-only secure cookies.
- **Role-Based Access Control (RBAC)**: Granular permission system with Superadmin, Admin, and Employee roles.
- **Protected Routes**: Both client-side and server-side protection.
- **UI Adaptation**: Components and navigation adapt based on user permissions.

### Key Features and Implementations
- **Role-Based Access Control (RBAC)**: Comprehensive permission system, protecting routes, adapting navigation and UI components.
- **Quick Attendance System**: Direct login screen attendance marking.
- **Smart Work Cycle Management**: Automatic check-in/check-out detection.
- **GP Untis Data Import System**: Comprehensive import for teachers, subjects, groups, and schedules from TXT files, including multi-file import with progress tracking.
- **Teacher-User Relationship Management**: Automatic linking between GP Untis teacher codes and system users.
- **GDPR Compliance System**: Privacy policy, data subject rights, digitally signed PDF exports, secure data downloads, and a GDPR ticket system.
- **Risk Assessment Dashboard**: Teacher risk monitoring with color-coded levels and empathetic notification templates.
- **Email Configuration Panel**: SMTP setup, email template management, and testing capabilities.
- **Enhanced Administrative Features**: CSV/Excel import for employees, advanced filtering, bulk operations, custom alerts, advanced report generation, weekly schedule view with real data, absence justification workflow, and automated legal alerts.
- **Accessibility**: Improved dialog accessibility and comprehensive modal contrast improvements.
- **UI/UX Enhancements**: Complete modal dialog contrast improvements across all components (Dialog, AlertDialog, Sheet, Drawer, Popover, Tooltip, HoverCard, Select, ContextMenu, DropdownMenu), enhanced mobile menu visibility with solid backgrounds, and improved overlay opacity for better visual hierarchy.

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity.
- **drizzle-orm**: Type-safe ORM for PostgreSQL.
- **@tanstack/react-query**: Server state management and caching for React.

### UI Component Libraries
- **@radix-ui/react-***: Accessible UI primitives.
- **class-variance-authority**: For type-safe component variants.
- **tailwindcss**: Utility-first CSS framework.

### Authentication & Session Management
- **openid-client**: OpenID Connect client (for Replit Auth, though now using email/password).
- **passport**: Authentication middleware.
- **connect-pg-simple**: PostgreSQL session store.

### Development Tools
- **vite**: Fast build tool and development server.
- **typescript**: Static type checking.
- **@replit/vite-plugin-runtime-error-modal**: Development-time error overlay.

### Date & Utility Libraries
- **date-fns**: Date manipulation and formatting.
- **zod**: TypeScript-first schema validation.
- **clsx**: Utility for conditionally constructing className strings.

### Form Handling
- **react-hook-form**: Performant forms library.
- **@hookform/resolvers**: Validation resolvers for react-hook-form.