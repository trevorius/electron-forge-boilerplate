const React = require('react');

const createMockIcon = (name: string) => {
  const MockIcon = React.forwardRef((props: any, ref: any) =>
    React.createElement('svg', {
      ref,
      'data-testid': `mock-${name.toLowerCase()}-icon`,
      ...props
    })
  );
  MockIcon.displayName = name;
  return MockIcon;
};

export const RotateCcw = createMockIcon('RotateCcw');
export const X = createMockIcon('X');
export const Circle = createMockIcon('Circle');
export const Home = createMockIcon('Home');
export const Info = createMockIcon('Info');
export const Gamepad2 = createMockIcon('Gamepad2');
export const LucideIcon = createMockIcon('LucideIcon');

// Type export for LucideIcon
export type { LucideIcon as LucideIconType } from 'lucide-react';