# CBT Learning Platform

## Overview
A comprehensive Computer-Based Test (CBT) learning platform designed for Nigerian examination preparation (JAMB, WAEC, NECO, POST-UTME). It offers year-specific question practice (2001-2020), AI-powered explanations, success animations, and detailed post-quiz review. The platform includes real-time quiz functionality, authentic ALOC API integration, and comprehensive performance analytics. Key features include short notes, an adaptive study scheduler, a focus mode, and study insights, all integrated into a main dashboard. It also features a CBT examination system with Paystack integration for paid access, supporting 4-subject selection, timed exams, instant results, and session management.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite.
- **UI Framework**: Custom component library built on Radix UI primitives with shadcn/ui styling.
- **State Management**: TanStack Query for server state and custom hooks for local state.
- **Routing**: Wouter for client-side routing.
- **Styling**: Tailwind CSS with CSS variables for theming and dark mode.
- **Component Structure**: Modular with reusable UI components, custom hooks, and page-level components.

### Backend Architecture
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ES modules.
- **API Design**: RESTful endpoints with consistent error handling and logging.
- **File Handling**: Multer for image uploads.

### Database Architecture
- **Database**: PostgreSQL hosted on Neon.
- **ORM**: Drizzle ORM.
- **Schema Design**: Includes tables for Users (authentication, premium status, usage tracking), Subjects, Questions (with ALOC API integration), Quiz Sessions (with question storage, user answers, AI explanations), Study Progress, Analytics, Study Plan Content, Competition, Leaderboard, Explained Questions, Short Notes, Study Scheduler, and Focus Sessions.
- **Data Management**: Drizzle schema with automatic migrations and type safety.
- **Quiz Storage**: Complete session data preservation for review and analytics.

### Authentication & Authorization
- **Strategy**: Email and password-based registration with email verification.
- **Registration**: Requires first name, last name, email, nickname, and password.
- **Login**: Email and password authentication with email verification.
- **Premium Features**: WhatsApp unlock code system for premium access.
- **User Management**: Profile creation with avatar upload.
- **Session Handling**: Client-side session management with API validation.

### AI Service Integration
- **Primary Provider**: Kaizenji Groq API service using Llama-3.3-70B-Versatile model.
- **Multi-Provider Support**: Groq (primary), Google Gemini, OpenAI GPT-4, and Grok API fallbacks.
- **Capabilities**: Comprehensive educational explanations, study plan generation, and automated question analysis.
- **Fallback Strategy**: Graceful degradation with robust chain (Groq → Gemini → GPT-4 → Enhanced Manual).

## External Dependencies

### Payment Processing
- **Paystack**: Nigerian payment gateway for CBT exam access (₦3000).
- **Unlock Codes**: System for access control via manual codes.

### AI Services
- **Kaizenji Groq API**: Primary AI service using Llama-3.3-70B model for educational content.
- **Google Gemini**: Secondary AI service.
- **OpenAI GPT-4**: Alternative AI provider.
- **Grok API**: Additional AI fallback option.

### Database & Storage
- **PostgreSQL**: Relational database.
- **Drizzle ORM**: Type-safe database operations.
- **Neon**: Serverless PostgreSQL hosting.

### Third-Party APIs
- **ALOC API**: Provides Nigerian examination questions (2001-2020) for UTME, WASSCE, NECO, and POST-UTME exams.
- **Wikipedia API**: For educational content search and retrieval.

### UI Libraries
- **Radix UI**: Headless component primitives.
- **Lucide React**: Icon system.
- **Tailwind CSS**: Utility-first styling.