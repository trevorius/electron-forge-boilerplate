# Release Compilation and Distribution Guide

This document provides comprehensive guidance on compiling, packaging, and distributing release versions of the Electron React Boilerplate. It covers the complete build pipeline from development to production deployment across multiple platforms.

← [Back to README](/README.md)

## Table of Contents

1. [Build Pipeline Overview](#build-pipeline-overview)
2. [Development vs Production Builds](#development-vs-production-builds)
3. [Compilation Process](#compilation-process)
4. [Packaging for Distribution](#packaging-for-distribution)
5. [Platform-Specific Builds](#platform-specific-builds)
6. [Release Automation](#release-automation)
7. [Troubleshooting Common Issues](#troubleshooting-common-issues)
8. [Performance Optimization](#performance-optimization)
9. [Security Considerations](#security-considerations)

## Build Pipeline Overview

The build pipeline consists of several stages that transform your development code into production-ready executables:

```
Development Code → React Build → Electron Package → Platform Distributables
     ↓                ↓              ↓                    ↓
Source Files     Optimized JS    Executable App      Installers
TypeScript       Minified CSS    Native Binaries     Platform Packages
React JSX        Assets Bundle   App Resources       Signed Packages
```

### Build Tools and Framework

- **Vite**: Frontend build tool for React application optimization
- **Electron Forge**: Complete build and distribution pipeline
- **TypeScript Compiler**: Type checking and JavaScript generation
- **Tailwind CSS**: Style optimization and purging
- **Native Dependencies**: Platform-specific compilation

## Development vs Production Builds

### Development Build Characteristics

```bash
npm run dev
```

- **Hot Reload**: Instant code changes reflection
- **Source Maps**: Full debugging information
- **Unminified Code**: Readable for development
- **Local Database**: SQLite in `prisma/database.db`
- **Development Console**: Electron DevTools enabled

### Production Build Characteristics

```bash
npm run build
npm run package
npm run make
```

- **Optimized Bundle**: Minified and tree-shaken code
- **No Source Maps**: Reduced bundle size
- **Asset Optimization**: Compressed images and fonts
- **Production Database**: SQLite in user data directory
- **Security Hardening**: DevTools disabled, CSP enabled

## Compilation Process

### Step 1: React Application Build

Build the React frontend for production:

```bash
# Build React app with Vite
npm run build
```

This process:
- Compiles TypeScript to optimized JavaScript
- Processes and minifies CSS with Tailwind
- Optimizes and compresses assets
- Generates production bundle in `dist/` directory

**Output Structure:**
```
dist/
├── assets/
│   ├── index-[hash].js      # Main application bundle
│   ├── index-[hash].css     # Styles bundle
│   └── favicon.ico          # App icon
├── index.html               # Entry HTML file
└── vite.svg                 # Vite logo
```

### Step 2: Electron Application Packaging

Package the Electron application with the built React app:

```bash
# Package for current platform
npm run package

# Package for specific platform
npm run package -- --platform=win32
npm run package -- --platform=darwin
npm run package -- --platform=linux
```

**Packaging Configuration** (`package.json`):
```json
{
  "config": {
    "forge": {
      "packagerConfig": {
        "name": "electron_boilerplate",
        "executableName": "electron_boilerplate",
        "icon": "assets/icon",
        "extraResource": [
          "prisma/database.db"
        ],
        "ignore": [
          "src/",
          "prisma/migrations/",
          "coverage/",
          "docs/"
        ]
      }
    }
  }
}
```

### Step 3: Database Preparation

The application automatically handles database setup in production:

```typescript
// Automatic database initialization in production
private getDatabasePath(): string {
  if (process.env.NODE_ENV === 'production') {
    return path.join(app.getPath('userData'), 'database.db');
  }
  return path.join(process.cwd(), 'prisma', 'database.db');
}

private async ensureDatabaseExists(): Promise<void> {
  const dbPath = this.getDatabasePath();
  const dbDir = path.dirname(dbPath);

  // Create user data directory if it doesn't exist
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Log database creation for first run
  if (!fs.existsSync(dbPath)) {
    console.log('Creating new database at:', dbPath);
  }
}
```

## Packaging for Distribution

### Universal Package Command

```bash
# Create packages for all configured platforms
npm run make
```

### Platform-Specific Packaging

#### Windows (from any platform)

```bash
# Create Windows installer
npm run make -- --platform=win32

# Output: Squirrel installer (.exe)
# Location: out/make/squirrel.windows/x64/
```

**Windows Build Features:**
- Squirrel.Windows installer with auto-updater support
- Code signing capabilities (requires certificate)
- Windows-specific app icon and metadata
- Registry integration for file associations

#### macOS (requires macOS for signing)

```bash
# Create macOS package
npm run make -- --platform=darwin

# Output: ZIP archive (.zip)
# Location: out/make/zip/darwin/x64/
```

**macOS Build Features:**
- ZIP archive for easy distribution
- Code signing with Developer ID (requires Apple Developer account)
- Notarization support for App Store compliance
- Universal binary support (Intel + Apple Silicon)

#### Linux

```bash
# Create Linux packages
npm run make -- --platform=linux

# Output: DEB and RPM packages
# Location: out/make/deb/x64/ and out/make/rpm/x64/
```

**Linux Build Features:**
- DEB packages for Debian/Ubuntu systems
- RPM packages for Red Hat/Fedora systems
- AppImage support for universal Linux distribution
- Desktop file integration

### Package Output Structure

After running `npm run make`, you'll find:

```
out/
├── electron_boilerplate-linux-x64/          # Packaged application
│   ├── electron_boilerplate                 # Executable
│   ├── resources/                           # App resources
│   │   ├── app.asar                        # Application bundle
│   │   └── database.db                     # Database file
│   └── locales/                            # Electron locales
├── make/                                   # Distribution packages
│   ├── deb/x64/                           # Debian packages
│   │   └── electron_boilerplate_1.0.0_amd64.deb
│   ├── rpm/x64/                           # RPM packages
│   │   └── electron_boilerplate-1.0.0-1.x86_64.rpm
│   └── zip/                               # ZIP archives
│       └── electron_boilerplate-linux-x64-1.0.0.zip
```

## Platform-Specific Builds

### Cross-Platform Build Matrix

| Build Platform | Target Platform | Supported | Notes |
|----------------|-----------------|-----------|-------|
| Linux | Linux | ✅ | Native build |
| Linux | Windows | ✅ | Wine required for signing |
| Linux | macOS | ❌ | Apple tools required |
| macOS | macOS | ✅ | Native build with signing |
| macOS | Linux | ✅ | Cross-compilation |
| macOS | Windows | ✅ | Cross-compilation |
| Windows | Windows | ✅ | Native build |
| Windows | Linux | ✅ | Cross-compilation |
| Windows | macOS | ❌ | Apple tools required |

### Build Configuration Examples

#### Multi-Platform Configuration

```json
// forge.config.js
module.exports = {
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'electron_boilerplate',
        setupIcon: 'assets/icon.ico'
      },
      platforms: ['win32']
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'Your Name',
          homepage: 'https://your-app.com'
        }
      },
      platforms: ['linux']
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          license: 'MIT'
        }
      },
      platforms: ['linux']
    }
  ]
};
```

## Release Automation

### GitHub Actions Workflow

Create automated builds on GitHub Actions:

```yaml
# .github/workflows/build.yml
name: Build and Release

on:
  push:
    tags: ['v*']

jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:coverage

      - name: Build application
        run: npm run build

      - name: Package application
        run: npm run package

      - name: Create distributables
        run: npm run make

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.os }}-distributables
          path: out/make/**/*
```

### Version Management

Update version numbers consistently:

```bash
# Update package.json version
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0

# Build and create release
npm run build
npm run package
npm run make
```

### Release Checklist

Before creating a release:

- [ ] Update `package.json` version
- [ ] Run full test suite: `npm run test:coverage`
- [ ] Update `CHANGELOG.md` with new features
- [ ] Build for all target platforms
- [ ] Test packaged applications on each platform
- [ ] Verify database initialization in production builds
- [ ] Check for security vulnerabilities: `npm audit`
- [ ] Create Git tag: `git tag v1.0.0`
- [ ] Push tag: `git push origin v1.0.0`

## Troubleshooting Common Issues

### Build Failures

#### 1. Native Dependencies Issues

```bash
# Rebuild native modules for Electron
npm run rebuild

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 2. TypeScript Compilation Errors

```bash
# Check TypeScript errors
npx tsc --noEmit

# Fix imports and type definitions
npm run build
```

#### 3. Asset Loading Issues

```typescript
// Ensure proper asset paths in production
const getAssetPath = (path: string): string => {
  if (process.env.NODE_ENV === 'production') {
    return path.join(process.resourcesPath, 'app', path);
  }
  return path;
};
```

### Platform-Specific Issues

#### Windows Code Signing

```bash
# Install certificate for signing
# Set environment variables:
# WINDOWS_CERTIFICATE_FILE=path/to/cert.p12
# WINDOWS_CERTIFICATE_PASSWORD=your_password

npm run make -- --platform=win32
```

#### macOS Notarization

```bash
# Set Apple ID credentials
export APPLE_ID=your@apple.id
export APPLE_ID_PASSWORD=app-specific-password

# Build with notarization
npm run make -- --platform=darwin
```

#### Linux AppImage Creation

```bash
# Install AppImage tools
npm install -g @electron-forge/maker-appimage

# Build AppImage
npm run make -- --platform=linux
```

### Database Issues

#### Production Database Not Created

```typescript
// Verify database path in production
console.log('Database path:', this.getDatabasePath());

// Check user data directory permissions
const userData = app.getPath('userData');
console.log('User data directory:', userData);
console.log('Directory exists:', fs.existsSync(userData));
```

#### Migration Issues

```typescript
// Handle database version upgrades
private async checkDatabaseVersion(): Promise<void> {
  try {
    // Query version table if it exists
    const version = await this.prisma.$queryRaw`
      SELECT version FROM app_version LIMIT 1
    `;
    console.log('Database version:', version);
  } catch (error) {
    // First run, create version table
    await this.prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS app_version (
        version TEXT PRIMARY KEY
      )
    `;
    await this.prisma.$executeRaw`
      INSERT INTO app_version (version) VALUES ('1.0.0')
    `;
  }
}
```

## Performance Optimization

### Bundle Size Optimization

#### 1. Code Splitting

```typescript
// Lazy load components
import { lazy, Suspense } from 'react';

const LineDestroyerGame = lazy(() => import('./components/game/LineDestroyer'));

// In routes
{
  path: '/game/lineDestroyer',
  component: () => (
    <Suspense fallback={<div>Loading...</div>}>
      <LineDestroyerGame />
    </Suspense>
  )
}
```

#### 2. Tree Shaking

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    }
  }
});
```

#### 3. Asset Optimization

```javascript
// vite.config.js
export default defineConfig({
  build: {
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    cssCodeSplit: true,      // Split CSS into separate files
    minify: 'terser',        // Use Terser for minification
    terserOptions: {
      compress: {
        drop_console: true,  // Remove console.log in production
        drop_debugger: true  // Remove debugger statements
      }
    }
  }
});
```

### Runtime Performance

#### 1. Database Optimization

```typescript
// Connection pooling configuration
const prisma = new PrismaClient({
  datasources: {
    db: { url: this.getDatabaseUrl() }
  },
  log: process.env.NODE_ENV === 'development' ? ['query'] : [],
});

// Index frequently queried columns
await this.prisma.$executeRaw`
  CREATE INDEX IF NOT EXISTS idx_scores_game_score
  ON scores(game, score DESC)
`;
```

#### 2. Memory Management

```typescript
// Proper cleanup in main process
app.on('before-quit', async () => {
  try {
    await highScoreService.close();
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
});

// Garbage collection hints
app.on('window-all-closed', () => {
  if (global.gc) {
    global.gc();
  }
});
```

## Security Considerations

### Production Security Hardening

#### 1. Content Security Policy

```typescript
// main.ts
const createWindow = () => {
  mainWindow = new BrowserWindow({
    webPreferences: {
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    }
  });

  // Set CSP headers
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
        ]
      }
    });
  });
};
```

#### 2. Code Signing

```bash
# Windows signing
electron-builder --win --publish=never \
  --config.win.certificateFile=cert.p12 \
  --config.win.certificatePassword="password"

# macOS signing
electron-builder --mac --publish=never \
  --config.mac.identity="Developer ID Application: Your Name"
```

#### 3. Update Security

```typescript
// Secure auto-updater configuration
import { autoUpdater } from 'electron-updater';

autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'your-username',
  repo: 'your-repo',
  private: false
});

// Verify updates before installation
autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info.version);
  // Show user notification
});
```

### Environment Variable Security

```typescript
// Never expose sensitive data
const isDevelopment = process.env.NODE_ENV === 'development';

// Use environment-specific configurations
const config = {
  database: {
    url: isDevelopment
      ? 'file:./dev.db'
      : `file:${app.getPath('userData')}/database.db`
  },
  api: {
    endpoint: process.env.API_ENDPOINT || 'https://api.yourapp.com'
  }
};
```

This comprehensive guide ensures you can successfully build, package, and distribute your Electron application across all major platforms while maintaining security and performance standards.

← [Back to README](/README.md)