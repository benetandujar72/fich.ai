# replit.md

## Overview

EduPresència is a comprehensive attendance tracking and presence management system designed specifically for educational institutions in Catalonia. The application addresses the legal requirements for employee time tracking in educational centers, ensuring compliance with Spanish labor laws and GDPR data protection regulations. The system provides features for employee management, attendance tracking, absence management, alert notifications, and detailed reporting while maintaining data privacy and security standards.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- **Authentication Provider**: Replit Auth with OAuth 2.0/OpenID Connect
- **Session Security**: HTTP-only secure cookies with configurable TTL
- **Role-Based Access**: User roles (superadmin, admin, employee) with institution-based permissions
- **Protected Routes**: Client-side route protection with server-side validation

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