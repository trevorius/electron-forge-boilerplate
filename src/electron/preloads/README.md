# Preload APIs

← [Back to Project README](../../../README.md)

This folder contains modular preload API definitions that are automatically combined into the main `preload.ts` file during build.

## Adding a New Table API

1. Create a new file in this folder with the `preload.` prefix (e.g., `preload.users.ts`)
2. Define your types and API functions:

```typescript
import { ipcRenderer } from 'electron';

// Define your types
interface User {
  id: number;
  name: string;
  email: string;
}

interface CreateUserRequest {
  name: string;
  email: string;
}

// Export your API object
export const UsersApi = {
  getUsers: (): Promise<User[]> =>
    ipcRenderer.invoke('get-users'),

  createUser: (data: CreateUserRequest): Promise<User> =>
    ipcRenderer.invoke('create-user', data),

  // ... other methods
};
```

3. Run `npm run compile:electron` and your API will be automatically included in the main preload script

## How it Works

- The build script `scripts/build-preload.js` scans this folder for `preload.*.ts` files
- It extracts types and API objects from each file
- It combines them into the main `preload.ts` using the `preload.template.ts`
- The result is a single preload file that works in Electron's sandboxed environment

## File Naming Convention

- **API files**: Use `preload.{tableName}.ts` format (e.g., `preload.users.ts`, `preload.orders.ts`, `preload.products.ts`)
- **Test files**: Use `preload.{tableName}.test.ts` format and will be automatically excluded
- **Purpose**: The `preload.` prefix makes it immediately clear these are preload script modules

## Examples

- `preload.highScore.ts` - High score database operations
- `preload.users.ts` - User management operations
- `preload.orders.ts` - Order processing operations
- `preload.products.ts` - Product catalog operations