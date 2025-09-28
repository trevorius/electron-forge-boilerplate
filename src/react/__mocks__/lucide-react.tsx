import React from 'react';

const createMockIcon = (name: string) => {
  const MockIcon = React.forwardRef<
    SVGSVGElement,
    React.SVGProps<SVGSVGElement>
  >((props, ref) => (
    <svg
      ref={ref}
      data-testid={`mock-${name.toLowerCase()}-icon`}
      {...props}
    />
  ));
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