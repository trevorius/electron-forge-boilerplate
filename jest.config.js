module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  projects: [
    // React tests with jsdom
    {
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      displayName: 'React',
      testMatch: [
        '<rootDir>/src/react/**/__tests__/**/*.{ts,tsx}',
        '<rootDir>/src/react/**/*.{test,spec}.{ts,tsx}'
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/react/$1',
        '^\\./styles/globals\\.css$': '<rootDir>/src/react/__mocks__/styles/globals.css.js',
        '^\\./App\\.module\\.css$': '<rootDir>/src/react/__mocks__/App.module.css.js',
        '^\\./LicenseApp\\.module\\.css$': '<rootDir>/src/react/__mocks__/components/license/LicenseApp.module.css.js',
        '\\.module\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^./components/ui/button$': '<rootDir>/src/react/__mocks__/components/ui/button',
        '^./components/ui/card$': '<rootDir>/src/react/__mocks__/components/ui/card',
        '^./components/ui/dialog$': '<rootDir>/src/react/__mocks__/components/ui/dialog',
        '^lucide-react$': '<rootDir>/src/react/__mocks__/lucide-react',
        '^./components/TicTacToe$': '<rootDir>/src/react/__mocks__/components/TicTacToe'
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      collectCoverageFrom: [
        'src/react/**/*.{ts,tsx}',
        '!src/react/**/*.d.ts',
        '!src/react/**/*.{test,spec}.{ts,tsx}',
        '!src/react/components/ui/**/*.{ts,tsx}',
        '!src/react/__mocks__/**/*',
        '!src/react/index.tsx',
        '!src/react/i18n.ts'
      ],
      moduleDirectories: ['node_modules', 'src/react']
    },
    // Electron tests with node
    {
      preset: 'ts-jest',
      testEnvironment: 'node',
      displayName: 'Electron',
      testMatch: [
        '<rootDir>/src/electron/**/*.{test,spec}.{ts,tsx}'
      ],
      collectCoverageFrom: [
        'src/electron/**/*.{ts,tsx}',
        '!src/electron/**/*.d.ts',
        '!src/electron/**/*.{test,spec}.{ts,tsx}',
        '!src/electron/preload.template.ts'
      ]
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.{test,spec}.{ts,tsx}',
    '!src/react/components/ui/**/*.{ts,tsx}',
    '!src/react/__mocks__/**/*',
    '!src/react/index.tsx',
    '!src/react/i18n.ts',
    '!src/electron/preload.template.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  }
};
