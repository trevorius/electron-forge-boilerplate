# Backend Architecture Guide

This document provides comprehensive guidance on the backend architecture of the Electron React Boilerplate. It covers the database layer, service architecture, controller pattern, preload scripts, and secure IPC communication.

← [Back to README](/README.md)

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Layer (Prisma + SQLite)](#database-layer-prisma--sqlite)
3. [Service Layer](#service-layer)
4. [Controller Layer](#controller-layer)
5. [Preload Scripts](#preload-scripts)
6. [IPC Communication Flow](#ipc-communication-flow)
7. [Adding New Backend Features](#adding-new-backend-features)
8. [Production Considerations](#production-considerations)
9. [Best Practices](#best-practices)

## Architecture Overview

The backend follows a layered architecture pattern that ensures security, maintainability, and testability:

```
┌─────────────────────────────────────────────────────────────┐
│                    React Renderer Process                   │
│  ┌─────────────────┐    ┌─────────────────────────────────┐  │
│  │   Components    │    │         Preload API             │  │
│  │                 │◄──►│    (window.electronAPI)         │  │
│  └─────────────────┘    └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                                     │ IPC (contextBridge)
                                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Electron Main Process                     │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │   Controllers   │◄──►│    Services     │                 │
│  │  (IPC Handlers) │    │ (Business Logic)│                 │
│  └─────────────────┘    └─────────────────┘                 │
│                                   │                         │
│                                   ▼                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Database Layer (Prisma + SQLite)          │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Principles

- **Security First**: No direct database access from renderer process
- **Separation of Concerns**: Clear boundaries between layers
- **Type Safety**: Full TypeScript support across all layers
- **Testability**: Each layer can be independently tested
- **Production Ready**: Automatic database initialization and migration

## Database Layer (Prisma + SQLite)

### Database Configuration

The application uses SQLite with Prisma ORM for data persistence:

```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/electron/generated/prisma"
}

datasource db {
  provider = "sqlite"
  url      = "file:./database.db"
}

model Score {
  id        Int      @id @default(autoincrement())
  name      String
  score     Int
  game      String
  createdAt DateTime @default(now())

  @@map("scores")
}
```

### Database Locations

- **Development**: `prisma/database.db`
- **Production**: `{userData}/database.db` (platform-specific user data directory)

### Automatic Database Initialization

The database is automatically created and initialized in production:

```typescript
// src/electron/services/highScore.service.ts
private async ensureDatabaseExists(): Promise<void> {
  const dbPath = this.getDatabasePath();
  const dbDir = path.dirname(dbPath);

  // Ensure directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    console.log('Creating new database at:', dbPath);
  }
}

private async ensureTablesExist(): Promise<void> {
  try {
    await this.prisma.$queryRaw`SELECT 1 FROM scores LIMIT 1`;
  } catch (error) {
    // Table doesn't exist, create it
    await this.prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "scores" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "name" TEXT NOT NULL,
        "score" INTEGER NOT NULL,
        "game" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
  }
}
```

## Service Layer

Services contain business logic and database operations. They are framework-agnostic and easily testable.

### Service Structure

```typescript
// src/electron/services/highScore.service.ts
export interface ScoreRecord {
  id: number;
  name: string;
  score: number;
  game: string;
  createdAt: Date;
}

export interface CreateScoreRequest {
  name: string;
  score: number;
  game: string;
}

export class HighScoreService {
  private prisma: PrismaClient;
  private initialized: boolean = false;

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: { url: this.getDatabaseUrl() }
      }
    });
  }

  async initialize(): Promise<void> {
    // Database initialization logic
  }

  async saveScore(scoreData: CreateScoreRequest): Promise<ScoreRecord> {
    await this.ensureInitialized();
    return await this.prisma.score.create({ data: scoreData });
  }

  async getHighScores(game: string, limit: number = 10): Promise<ScoreRecord[]> {
    await this.ensureInitialized();
    return await this.prisma.score.findMany({
      where: { game },
      orderBy: { score: 'desc' },
      take: limit
    });
  }
}
```

### Service Responsibilities

- **Data Validation**: Validate input data before database operations
- **Business Logic**: Implement domain-specific rules and calculations
- **Error Handling**: Provide meaningful error messages and recovery
- **Database Operations**: Abstract database complexity from controllers
- **Initialization**: Handle database setup and migration in production

### Error Handling Pattern

```typescript
async saveScore(scoreData: CreateScoreRequest): Promise<ScoreRecord> {
  await this.ensureInitialized();

  try {
    const score = await this.prisma.score.create({
      data: {
        name: scoreData.name.trim(),
        score: scoreData.score,
        game: scoreData.game,
        createdAt: new Date()
      }
    });

    return score;
  } catch (error) {
    console.error('Failed to save score:', error);
    throw error;
  }
}
```

## Controller Layer

Controllers handle IPC communication between the renderer and main processes. They act as a bridge between the frontend and services.

### Controller Structure

```typescript
// src/electron/controllers/highScore.controller.ts
export class HighScoreController {
  static async registerHandlers(): Promise<void> {
    // Initialize service
    try {
      await highScoreService.initialize();
    } catch (error) {
      console.error('Failed to initialize high score service:', error);
    }

    // Register IPC handlers
    ipcMain.handle('save-score', async (_event, scoreData: CreateScoreRequest) => {
      try {
        return await highScoreService.saveScore(scoreData);
      } catch (error) {
        console.error('Failed to save score:', error);
        throw error;
      }
    });

    ipcMain.handle('get-high-scores', async (_event, game: string, limit?: number) => {
      try {
        return await highScoreService.getHighScores(game, limit);
      } catch (error) {
        console.error('Failed to get high scores:', error);
        throw error;
      }
    });
  }

  static removeHandlers(): void {
    ipcMain.removeHandler('save-score');
    ipcMain.removeHandler('get-high-scores');
  }
}
```

### Controller Registration

Controllers are registered in the main process:

```typescript
// src/electron/main.ts
app.whenReady().then(async () => {
  try {
    await HighScoreController.registerHandlers();
    console.log('High score service and handlers initialized');
  } catch (error) {
    console.error('Failed to initialize high score service:', error);
  }

  createWindow();
});
```

## Preload Scripts

Preload scripts create a secure bridge between the renderer and main processes using Electron's `contextBridge`.

### Preload Structure

```typescript
// src/electron/preloads/preload.highScore.ts
import { contextBridge, ipcRenderer } from 'electron';
import type { CreateScoreRequest, ScoreRecord } from '../services/highScore.service';

export interface HighScoreAPI {
  saveScore(scoreData: CreateScoreRequest): Promise<ScoreRecord>;
  getHighScores(game: string, limit?: number): Promise<ScoreRecord[]>;
  getAllHighScores(limit?: number): Promise<ScoreRecord[]>;
  isHighScore(game: string, score: number): Promise<boolean>;
  deleteScore(id: number): Promise<void>;
  clearScores(game?: string): Promise<void>;
}

const highScoreAPI: HighScoreAPI = {
  saveScore: (scoreData) => ipcRenderer.invoke('save-score', scoreData),
  getHighScores: (game, limit) => ipcRenderer.invoke('get-high-scores', game, limit),
  getAllHighScores: (limit) => ipcRenderer.invoke('get-all-high-scores', limit),
  isHighScore: (game, score) => ipcRenderer.invoke('is-high-score', game, score),
  deleteScore: (id) => ipcRenderer.invoke('delete-score', id),
  clearScores: (game) => ipcRenderer.invoke('clear-scores', game)
};

contextBridge.exposeInMainWorld('electronAPI', {
  ...highScoreAPI
  // Other APIs can be added here
});

// Type declarations for renderer process
declare global {
  interface Window {
    electronAPI: HighScoreAPI;
  }
}
```

### Preload Composition

The main preload script combines all feature-specific preloads:

```typescript
// src/electron/preload.ts (auto-generated)
import './preloads/preload.highScore';
// Additional preloads will be imported here automatically
```

### Build Script Integration

The preload build script automatically detects and includes all preload modules:

```javascript
// scripts/build-preload.js
const preloadFiles = glob.sync('src/electron/preloads/preload.*.ts');
const imports = preloadFiles.map(file => {
  const relativePath = path.relative('src/electron', file).replace(/\.ts$/, '');
  return `import './${relativePath}';`;
});

const preloadContent = imports.join('\n');
fs.writeFileSync('src/electron/preload.ts', preloadContent);
```

## IPC Communication Flow

### From Renderer to Main Process

1. **Component calls API**: `window.electronAPI.saveScore(data)`
2. **Preload invokes IPC**: `ipcRenderer.invoke('save-score', data)`
3. **Controller handles IPC**: `ipcMain.handle('save-score', handler)`
4. **Service processes request**: `highScoreService.saveScore(data)`
5. **Database operation**: Prisma executes SQL query
6. **Response flows back**: Result returned through the same chain

### Type Safety Across Layers

```typescript
// Shared type definitions
export interface CreateScoreRequest {
  name: string;
  score: number;
  game: string;
}

// Used in:
// - React components (renderer)
// - Preload scripts (bridge)
// - Controllers (main process)
// - Services (business logic)
// - Database operations (Prisma)
```

## Adding New Backend Features

### Step 1: Define Data Model

Add to Prisma schema:

```prisma
// prisma/schema.prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  email     String   @unique
  createdAt DateTime @default(now())

  @@map("users")
}
```

### Step 2: Create Service

```typescript
// src/electron/services/user.service.ts
export interface UserRecord {
  id: number;
  username: string;
  email: string;
  createdAt: Date;
}

export interface CreateUserRequest {
  username: string;
  email: string;
}

export class UserService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createUser(userData: CreateUserRequest): Promise<UserRecord> {
    return await this.prisma.user.create({
      data: userData
    });
  }

  async getUserByUsername(username: string): Promise<UserRecord | null> {
    return await this.prisma.user.findUnique({
      where: { username }
    });
  }
}

export const userService = new UserService();
```

### Step 3: Create Controller

```typescript
// src/electron/controllers/user.controller.ts
import { ipcMain } from 'electron';
import { userService, CreateUserRequest } from '../services/user.service';

export class UserController {
  static registerHandlers(): void {
    ipcMain.handle('create-user', async (_event, userData: CreateUserRequest) => {
      try {
        return await userService.createUser(userData);
      } catch (error) {
        console.error('Failed to create user:', error);
        throw error;
      }
    });

    ipcMain.handle('get-user', async (_event, username: string) => {
      try {
        return await userService.getUserByUsername(username);
      } catch (error) {
        console.error('Failed to get user:', error);
        throw error;
      }
    });
  }

  static removeHandlers(): void {
    ipcMain.removeHandler('create-user');
    ipcMain.removeHandler('get-user');
  }
}
```

### Step 4: Create Preload

```typescript
// src/electron/preloads/preload.user.ts
import { contextBridge, ipcRenderer } from 'electron';
import type { CreateUserRequest, UserRecord } from '../services/user.service';

export interface UserAPI {
  createUser(userData: CreateUserRequest): Promise<UserRecord>;
  getUser(username: string): Promise<UserRecord | null>;
}

const userAPI: UserAPI = {
  createUser: (userData) => ipcRenderer.invoke('create-user', userData),
  getUser: (username) => ipcRenderer.invoke('get-user', username)
};

contextBridge.exposeInMainWorld('userAPI', userAPI);

declare global {
  interface Window {
    userAPI: UserAPI;
  }
}
```

### Step 5: Register Controller

```typescript
// src/electron/main.ts
import { UserController } from './controllers/user.controller';

app.whenReady().then(async () => {
  try {
    UserController.registerHandlers();
    // ... other controllers
  } catch (error) {
    console.error('Failed to initialize controllers:', error);
  }
});
```

### Step 6: Use in React Components

```typescript
// src/react/components/UserProfile.tsx
import React, { useState } from 'react';

const UserProfile: React.FC = () => {
  const [user, setUser] = useState(null);

  const handleCreateUser = async (userData: CreateUserRequest) => {
    try {
      const newUser = await window.userAPI.createUser(userData);
      setUser(newUser);
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  return (
    <div>
      {/* User creation form */}
    </div>
  );
};
```

## Production Considerations

### Database Migration Strategy

```typescript
// For production databases, implement migration logic
private async runMigrations(): Promise<void> {
  const currentVersion = await this.getDatabaseVersion();
  const migrations = this.getMigrationsToRun(currentVersion);

  for (const migration of migrations) {
    await migration.execute();
    await this.updateDatabaseVersion(migration.version);
  }
}
```

### Error Recovery

```typescript
// Implement retry logic for critical operations
async saveScore(scoreData: CreateScoreRequest): Promise<ScoreRecord> {
  let retries = 3;

  while (retries > 0) {
    try {
      await this.ensureInitialized();
      return await this.prisma.score.create({ data: scoreData });
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

### Database Backup

```typescript
// Implement database backup for critical data
async backupDatabase(): Promise<void> {
  const backupPath = path.join(
    app.getPath('userData'),
    'backups',
    `database-${Date.now()}.db`
  );

  await fs.promises.copyFile(this.getDatabasePath(), backupPath);
}
```

## Best Practices

### 1. Service Design

- **Single Responsibility**: Each service handles one domain
- **Dependency Injection**: Use constructor injection for dependencies
- **Error Handling**: Always wrap database operations in try-catch
- **Type Safety**: Use TypeScript interfaces for all data structures

### 2. Controller Design

- **Thin Controllers**: Keep controllers lightweight, delegate to services
- **Error Propagation**: Re-throw errors with additional context
- **Validation**: Validate input data before passing to services
- **Logging**: Log all errors with sufficient context

### 3. Database Design

- **Normalization**: Follow database normalization principles
- **Indexing**: Add indexes for frequently queried columns
- **Constraints**: Use database constraints for data integrity
- **Migrations**: Plan for schema evolution in production

### 4. Security

- **No Direct DB Access**: Never expose database connections to renderer
- **Input Validation**: Validate all data before database operations
- **SQL Injection Protection**: Use Prisma's parameterized queries
- **Context Isolation**: Use contextBridge for secure IPC

### 5. Testing

- **Service Testing**: Test services with mocked Prisma client
- **Controller Testing**: Test IPC handlers with mocked services
- **Integration Testing**: Test full IPC flow end-to-end
- **Database Testing**: Use in-memory database for tests

### 6. Performance

- **Connection Pooling**: Configure Prisma connection pool settings
- **Query Optimization**: Use Prisma's query optimization features
- **Caching**: Implement caching for frequently accessed data
- **Batch Operations**: Use batch operations for bulk data processing

← [Back to README](/README.md)