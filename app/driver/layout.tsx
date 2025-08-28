'use client';

import React from 'react';

// Simple layout for driver routes that doesn't enforce authentication
// This allows /driver/login to work without being redirected
export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="driver-layout">
      {children}
    </div>
  );
}