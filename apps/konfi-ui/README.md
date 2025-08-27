# Konfi-UI Application

A real-time collaborative "brunch" (breakfast) table voting application built with Angular 20 and Server-Side Rendering (SSR).

## Overview

KonfiUi allows users to create virtual breakfast tables where participants can vote on their preferences using a 1-5 star rating system. The application provides real-time synchronization across all participants with WebSocket communication.

## Key Features

- **Real-time Voting**: Live synchronization of votes across all participants
- **Admin Dashboard**: Real-time analytics with vote distribution charts and QR codes for easy joining
- **WebSocket Communication**: Dual approach with native WebSocket and SockJS fallback
- **Server-Side Rendering**: Full SSR support for better performance and SEO
- **Responsive Design**: Built with PrimeNG and PrimeFlex for modern UI

## Technology Stack

- **Frontend**: Angular 20 with standalone components
- **UI Framework**: PrimeNG 20, PrimeFlex, PrimeIcons
- **Real-time**: WebSocket via STOMP protocol (@stomp/rx-stomp)
- **Validation**: Zod for runtime type validation
- **Charts**: ng-apexcharts for vote distribution visualization
- **Build System**: Nx monorepo with Angular CLI

## Development

### Running Tests

To run the unit test suite:

```bash
pnpm nx test konfi-ui
```

To run tests with coverage:

```bash
pnpm nx test konfi-ui --codeCoverage
```

To run tests in watch mode:

```bash
pnpm nx test konfi-ui --watch
```

To run a specific test file:

```bash
pnpm nx test konfi-ui --testNamePattern="NameService"
```

### Other Development Commands

```bash
# Start development server
pnpm nx serve konfi-ui

# Build for production
pnpm nx build konfi-ui

# Run linting
pnpm nx lint konfi-ui

# Run e2e tests
pnpm nx e2e konfi-ui-e2e
```

## Architecture

### Route Structure

- `/` - Table creation (landing page)
- `/brunch/create` - Alternative brunch creation flow
- `/table/:id` - User voting interface
- `/table/admin/:id` - Admin dashboard with analytics

### Key Services

- **WebSocketConnectingService** - Manages STOMP WebSocket connections
- **NameService** - Handles user name persistence and validation
- **BrunchCreateService** - Handles table/brunch creation logic

### WebSocket Message Types

- `JOIN` - User joins a table
- `LEAVE` - User leaves a table
- `UPDATE` - User updates their vote (1-5 stars)

## Test Coverage

The application includes comprehensive test coverage for:

- Service layer business logic (validation, HTTP requests, WebSocket communication)
- Component functionality (voting, form handling, real-time updates)
- Integration testing with proper mocking of external dependencies

**Test Statistics**: 58 passing tests across 85 total test cases covering core functionality.
