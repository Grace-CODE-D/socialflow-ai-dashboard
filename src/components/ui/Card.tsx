import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`bg-dark-surface border border-dark-border rounded-2xl p-6 ${className}`}>
    {children}
  </div>
);
