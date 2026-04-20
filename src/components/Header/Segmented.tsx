'use client';

import { ReactNode } from 'react';

interface SegmentedProps {
  children: ReactNode;
  className?: string;
}

export function Segmented({ children, className }: SegmentedProps) {
  return <div className={`segmented ${className || ''}`}>{children}</div>;
}

interface SegmentedButtonProps {
  icon?: ReactNode;
  label?: ReactNode;
  title?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function SegmentedButton({ icon, label, title, active, disabled, onClick }: SegmentedButtonProps) {
  return (
    <button
      type="button"
      title={title}
      className={`segmented-btn ${active ? 'segmented-btn-active' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="segmented-btn-icon">{icon}</span>}
      {label !== undefined && <span className="segmented-btn-label">{label}</span>}
    </button>
  );
}
