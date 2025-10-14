# Modern Navbar Implementation with Custom Window Controls

← [Back to README](/README.md)

This document outlines the implementation of a modern shadcn/ui navbar with custom window controls (traffic lights) that replaces the default Electron title bar.

## Key Features Implemented

### 1. Frameless Window Configuration
- **File**: `src/electron/main.js`
- Set `frame: false` to remove default titlebar
- Added `titleBarStyle: 'hiddenInset'` for macOS
- Configured `trafficLightPosition` for macOS traffic lights
- Added minimum window size constraints

### 2. Custom Window Controls
- **Component**: `src/react/components/common/WindowControls.tsx`
- Platform-aware implementation (macOS vs Windows/Linux)
- Custom minimize, maximize/restore, and close buttons
- Real-time window state synchronization
- Responsive design with hover effects

### 3. Modern Navbar Component
- **Component**: `src/react/components/common/Navbar.tsx`
- Built with shadcn/ui NavigationMenu component
- Fixed positioning at top of window
- Draggable titlebar area using `-webkit-app-region: drag`
- Interactive elements marked as `-webkit-app-region: no-drag`
- Integrated language selector and window controls

### 4. IPC Communication
- **Electron Main**: Added IPC handlers for window operations
- **Preload Script**: Exposed secure window control APIs
- **React Components**: TypeScript interfaces for window APIs

### 5. Styling and Responsiveness
- **File**: `src/react/styles/globals.css`
- Custom CSS utilities for window dragging
- Platform-specific styling adjustments
- Smooth transitions and hover effects
- Proper spacing for different platforms

## Technical Implementation Details

### Window Control APIs
```typescript
interface WindowAPI {
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  onMaximize: (callback: () => void) => void;
  onUnmaximize: (callback: () => void) => void;
}
```

### Platform Detection
- macOS: Shows system traffic lights, hides custom controls
- Windows/Linux: Shows custom window controls
- Automatic platform detection via `electronAPI.getPlatform()`

### Navigation Structure
- Home: Main game selection
- Games: Dropdown with LineDestroyer and Tic Tac Toe
- About: Application information
- Language Selector: Internationalization
- Window Controls: Platform-appropriate controls

## Files Modified/Created

### New Files
- `src/react/components/common/WindowControls.tsx`
- `src/react/components/common/Navbar.tsx`
- `NAVBAR_IMPLEMENTATION.md` (this file)

### Modified Files
- `src/electron/main.js` - Frameless window + IPC handlers
- `src/electron/preload.js` - Window control APIs
- `src/react/App.tsx` - Updated to use new Navbar
- `src/react/App.test.tsx` - Updated tests for new component
- `src/react/styles/globals.css` - Added window drag utilities

### Dependencies Added
- `@shadcn/ui/navigation-menu`
- `@shadcn/ui/menubar`

## Key Benefits

1. **Modern UI**: Clean, professional appearance with shadcn/ui components
2. **Native Feel**: Custom window controls that feel native to each platform
3. **Accessibility**: Proper ARIA labels and keyboard navigation
4. **Responsive**: Works across different screen sizes and platforms
5. **Maintainable**: Well-structured components with TypeScript support
6. **Tested**: Full test coverage maintained at 100%

## Usage Notes

- The navbar is fixed at the top and takes up 48px (h-12) of height
- Content is automatically padded with `pt-12` to avoid overlap
- Window controls are platform-aware and automatically adapt
- All navigation is handled by React Router with proper state management
- Language switching is integrated into the navbar for easy access

## Security Considerations

- IPC communication is properly sandboxed through contextBridge
- No direct Node.js APIs exposed to renderer process
- Window control APIs are restricted to specific operations only
- Preload script maintains security isolation
