import { cn } from './utils';

// Mock the dependencies
jest.mock('clsx', () => ({
  clsx: jest.fn((inputs) => inputs.filter(Boolean).join(' '))
}));

jest.mock('tailwind-merge', () => ({
  twMerge: jest.fn((classes) => classes)
}));

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

describe('utils', () => {
  describe('cn function', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should call clsx with provided inputs', () => {
      const inputs = ['class1', 'class2'];
      cn(...inputs);

      expect(clsx).toHaveBeenCalledWith(inputs);
    });

    it('should call twMerge with clsx result', () => {
      const inputs = ['class1', 'class2'];
      const clsxResult = 'class1 class2';
      (clsx as jest.Mock).mockReturnValue(clsxResult);

      cn(...inputs);

      expect(twMerge).toHaveBeenCalledWith(clsxResult);
    });

    it('should return the result from twMerge', () => {
      const expectedResult = 'merged-classes';
      (twMerge as jest.Mock).mockReturnValue(expectedResult);

      const result = cn('class1', 'class2');

      expect(result).toBe(expectedResult);
    });

    it('should handle empty inputs', () => {
      cn();

      expect(clsx).toHaveBeenCalledWith([]);
    });

    it('should handle single input', () => {
      const input = 'single-class';
      cn(input);

      expect(clsx).toHaveBeenCalledWith([input]);
    });

    it('should handle multiple mixed inputs', () => {
      const inputs = ['string', { conditional: true }, null, undefined, false];
      cn(...inputs);

      expect(clsx).toHaveBeenCalledWith(inputs);
    });
  });
});