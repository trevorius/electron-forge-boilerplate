import React from 'react';

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: string;
    size?: string;
    asChild?: boolean;
  }
>(({ children, className, variant, size, asChild, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={className}
      data-testid="mock-button"
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";

export const buttonVariants = jest.fn();