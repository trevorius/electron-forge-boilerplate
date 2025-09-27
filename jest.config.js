module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  rootDir: '.',
  testMatch: [
    '<rootDir>/src/react/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/react/**/*.{test,spec}.{ts,tsx}'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/react/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^\\./(.*)\\.css$': 'identity-obj-proxy',
    '^./components/ui/button$': '<rootDir>/src/react/__mocks__/components/ui/button',
    '^./components/ui/card$': '<rootDir>/src/react/__mocks__/components/ui/card',
    '^lucide-react$': '<rootDir>/src/react/__mocks__/lucide-react',
    '^./components/TicTacToe$': '<rootDir>/src/react/__mocks__/components/TicTacToe'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/react/**/*.{ts,tsx}',
    '!src/react/**/*.d.ts',
    '!src/react/components/ui/**/*',
    '!src/react/__mocks__/**/*',
    '!src/react/index.tsx'
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
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  moduleDirectories: ['node_modules', 'src/react']
};
