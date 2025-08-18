'use client';

import React from 'react';

interface MobileResponsiveWrapperProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
  maxWidth?: 'full' | 'container' | 'sm' | 'md' | 'lg' | 'xl';
  overflow?: 'visible' | 'hidden' | 'auto';
}

export default function MobileResponsiveWrapper({
  children,
  className = '',
  padding = 'medium',
  maxWidth = 'container',
  overflow = 'visible'
}: MobileResponsiveWrapperProps) {
  const paddingClasses = {
    none: '',
    small: 'p-2 sm:p-3',
    medium: 'p-4 sm:p-6',
    large: 'p-6 sm:p-8'
  };

  const maxWidthClasses = {
    full: 'w-full',
    container: 'w-full max-w-4xl mx-auto',
    sm: 'w-full max-w-sm mx-auto',
    md: 'w-full max-w-md mx-auto',
    lg: 'w-full max-w-lg mx-auto',
    xl: 'w-full max-w-xl mx-auto'
  };

  const overflowClasses = {
    visible: 'overflow-visible',
    hidden: 'overflow-hidden',
    auto: 'overflow-auto'
  };

  return (
    <div
      className={`
        ${paddingClasses[padding]}
        ${maxWidthClasses[maxWidth]}
        ${overflowClasses[overflow]}
        overflow-x-hidden
        w-full
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Specific wrapper components for common use cases
export function CardWrapper({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <MobileResponsiveWrapper
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
      padding="medium"
      overflow="hidden"
    >
      {children}
    </MobileResponsiveWrapper>
  );
}

export function FormWrapper({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <MobileResponsiveWrapper
      className={`responsive-form ${className}`}
      padding="medium"
      maxWidth="lg"
    >
      {children}
    </MobileResponsiveWrapper>
  );
}

export function TableWrapper({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <MobileResponsiveWrapper
      className={`responsive-table ${className}`}
      padding="small"
      overflow="auto"
    >
      {children}
    </MobileResponsiveWrapper>
  );
}

export function GridWrapper({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <MobileResponsiveWrapper
      className={`responsive-grid ${className}`}
      padding="medium"
    >
      {children}
    </MobileResponsiveWrapper>
  );
}

export function NavigationWrapper({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <MobileResponsiveWrapper
      className={`responsive-nav ${className}`}
      padding="none"
      overflow="auto"
    >
      {children}
    </MobileResponsiveWrapper>
  );
}


