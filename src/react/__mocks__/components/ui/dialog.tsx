import React from 'react';

export const Dialog = ({ children, open, onOpenChange }: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => (
  <div data-testid="mock-dialog" data-open={open} onClick={() => onOpenChange && onOpenChange(false)}>
    {open && children}
  </div>
);

export const DialogContent = ({ children, className }: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div data-testid="mock-dialog-content" className={className}>
    {children}
  </div>
);

export const DialogHeader = ({ children, className }: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div data-testid="mock-dialog-header" className={className}>
    {children}
  </div>
);

export const DialogTitle = ({ children, className }: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h2 data-testid="mock-dialog-title" className={className}>
    {children}
  </h2>
);