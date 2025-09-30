import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Settings from './index';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('Settings', () => {
  it('should render settings page', () => {
    render(<Settings />);
    expect(screen.getByText('settings.title')).toBeInTheDocument();
    expect(screen.getByText('settings.select_submenu')).toBeInTheDocument();
  });

  it('should have correct structure', () => {
    const { container } = render(<Settings />);
    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('flex', 'items-center', 'justify-center', 'h-full', 'p-6');
  });
});