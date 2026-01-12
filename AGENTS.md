# AGENTS.md - Railover Codebase Guide

> Guidelines for AI agents operating in this TypeScript/Node.js codebase (Docker deployment platform).

## Quick Reference - Commands

```bash
# Build (includes circular dependency check)
npm run build

# Lint
npm run lint              # Check
npm run lint-fix          # Auto-fix

# Format
npm run formatter         # Check
npm run formatter-write   # Auto-fix

# Test
npm test                  # Run all tests
npx jest tests/utils.test.ts              # Single test file
npx jest --testNamePattern="dropFirst"    # Pattern match test names
npx jest tests/utils.test.ts -t "larger"  # Single test in file
```

## Project Structure

```
src/
├── api/           # API response types, error codes
├── datastore/     # Data persistence layer
├── docker/        # Docker API integration (dockerode)
├── handlers/      # Business logic handlers
├── models/        # TypeScript interfaces/types
├── routes/        # Express routers
├── user/          # Core user/service management
└── utils/         # Shared utilities
tests/             # Jest test files (*.test.ts)
built/             # Compiled output (gitignored)
```

## TypeScript Configuration

- **Module**: Node16 (ES modules with Node.js resolution)
- **Target**: ES2018
- **Strict mode**: `strictNullChecks: true`, `noImplicitAny: true`
- **Unused variables**: `noUnusedLocals: true`
- **Source maps**: Enabled

## Code Style

### Formatting (Prettier)

```json
{
    "tabWidth": 4,
    "semi": false,
    "singleQuote": true,
    "trailingComma": "es5",
    "arrowParens": "always",
    "bracketSpacing": true
}
```

### Import Patterns

```typescript
// Named imports with relative paths
import { IAppDef, IAppEnvVar } from '../models/AppDefinition'
import Logger from '../utils/Logger'

// CommonJS-style require for certain packages (legacy pattern)
import express = require('express')
import bcrypt = require('bcryptjs')
import jwt = require('jsonwebtoken')
```

- Use relative paths (`../`, `./`) - no path aliases configured
- Default exports are common for classes and routers
- Named exports for interfaces and types

### Naming Conventions

| Element         | Convention                 | Example                                             |
| --------------- | -------------------------- | --------------------------------------------------- |
| Files - Classes | PascalCase                 | `ServiceManager.ts`, `DockerApi.ts`                 |
| Files - Routers | PascalCase + Router suffix | `AppsRouter.ts`, `LoginRouter.ts`                   |
| Files - Tests   | camelCase.test.ts          | `utils.test.ts`, `backup.test.ts`                   |
| Classes         | PascalCase                 | `class ServiceManager`, `class Authenticator`       |
| Interfaces      | I-prefix + PascalCase      | `IAppDef`, `IAppEnvVar`, `IHashMapGeneric`          |
| Methods         | camelCase                  | `getAppDefinition()`, `enableSslForApp()`           |
| Constants       | UPPER_SNAKE_CASE           | `COOKIE_AUTH_SUFFIX`, `ERROR_FIRST_ENABLE_ROOT_SSL` |
| Private fields  | camelCase (no underscore)  | `private dataStore`, `private isReady`              |

### Type Patterns

```typescript
// Interfaces for data shapes (preferred)
export interface IAppEnvVar {
    key: string
    value: string
}

// Const enums for fixed values
export const enum VolumesTypes {
    BIND = 'bind',
    VOLUME = 'volume',
}

// Type aliases for generics
export type IAllAppDefinitions = IHashMapGeneric<IAppDef>

// Generic interface with I-prefix
export interface IHashMapGeneric<T> {
    [key: string]: T
}
```

### Class Structure

```typescript
class ServiceManager {
    // Static factory method (singleton-ish pattern)
    static get(namespace: string, ...deps): ServiceManager {
        if (!cache[namespace]) {
            cache[namespace] = new ServiceManager(...)
        }
        return cache[namespace]
    }

    // Private fields first
    private dataStore: DataStore
    private isReady: boolean

    // Constructor with dependency injection
    constructor(
        private dataStore: DataStore,
        private authenticator: Authenticator
    ) {
        this.isReady = true
    }

    // Public methods
    isInited() { return this.isReady }
}

export default ServiceManager
```

### Error Handling

```typescript
// Custom error class with status code
import { CaptainError } from '../api/CaptainError'
import ApiStatusCodes from '../api/ApiStatusCodes'

// Creating errors
throw ApiStatusCodes.createError(
    ApiStatusCodes.STATUS_ERROR_GENERIC,
    'Error message here'
)

// Promise chain with catch
return Promise.resolve()
    .then(function () {
        /* ... */
    })
    .catch(function (error) {
        if (error && error.captainErrorType) {
            // Handle CaptainError
        }
        throw error
    })

// Error status codes (src/api/ApiStatusCodes.ts)
// STATUS_OK = 100
// STATUS_ERROR_GENERIC = 1000
// STATUS_ERROR_NOT_AUTHORIZED = 1102
// ILLEGAL_OPERATION = 1108
```

### Async Patterns

```typescript
// Promise chains (predominant style)
return Promise.resolve()
    .then(function () {
        return dataStore.getAppDefinition(appName)
    })
    .then(function (app) {
        // Chain continues
    })
    .catch(function (error) {
        Logger.e(error)
        throw error
    })

// Use `const self = this` when needed in callbacks
const self = this
return Promise.resolve().then(function () {
    return self.dataStore.getAppsDataStore()
})
```

## Testing Patterns

### Framework: Jest with ts-jest

```typescript
// Basic test structure - use test() not it()
test('Testing descriptive name', () => {
    expect(result).toBe(expected)
})

// Async tests
test('Async operation', async () => {
    const result = await asyncFunction()
    expect(result).toBeTruthy()
})

// Exception testing
test('Should throw on invalid input', () => {
    expect(() => {
        Utils.checkCustomDomain('', appName, rootDomain)
    }).toThrow('Expected error message')
})

// Setup/teardown (when needed)
beforeEach(() => {
    /* setup */
})
afterEach(() => {
    /* cleanup */
})
```

### Test file naming: `[feature].test.ts` in `/tests/`

## ESLint Configuration

Permissive rules (explicitly disabled):

- `@typescript-eslint/no-unused-vars`: off
- `@typescript-eslint/no-explicit-any`: off
- `@typescript-eslint/no-this-alias`: off
- `@typescript-eslint/no-require-imports`: off

## Important Notes

1. **Build step required**: Run `npm run build` before testing changes
2. **Circular dependency check**: Build script uses `madge` to detect circular imports
3. **No path aliases**: All imports use relative paths
4. **Express v5**: Using Express 5.x with async route handlers
5. **Docker integration**: Uses `dockerode` for Docker API calls
6. **Legacy patterns**: Some CommonJS-style imports (`import x = require()`) are intentional

## Common Patterns

### Express Router

```typescript
import express = require('express')
const router = express.Router()

router.post('/endpoint', function (req, res, next) {
    return Promise.resolve()
        .then(function () {
            /* logic */
        })
        .then(function (data) {
            res.send(new BaseApi(ApiStatusCodes.STATUS_OK, 'Success'))
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

export default router
```

### Logging

```typescript
import Logger from '../utils/Logger'

Logger.d('Debug message') // Debug
Logger.e(error) // Error
Logger.w('Warning') // Warning
```

## Multi-User/Team Features

### User Management

- **Super Admin** role for VDS owner
- **Admin/Developer/Viewer** roles for team members
- User CRUD operations (Create, Read, Update, Delete)
- Password hashing with bcryptjs

### Permission System

- Project-level access control
- System-level permissions
- Role-based authorization middleware

### Team UI Components

- `TeamManagement.tsx` - User management interface
- `ProjectCollaborators.tsx` - Project-specific access control
- `RealtimeLogs.tsx` - WebSocket log streaming

### Authentication

- JWT-based authentication
- Role verification in routes
- Session management

### WebSocket Logs

- Real-time log streaming via Socket.IO
- Permission-based subscription
- Auto-scroll and pause/resume
- Log download functionality
