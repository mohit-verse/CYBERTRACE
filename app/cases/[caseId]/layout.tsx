'use client';

import React from 'react';

export default function CaseLayout({
  children,
}: {
  children: React.ReactNode;
  params: { caseId: string };
}) {
  return (
    <div className="h-full flex-1 overflow-y-auto">
      <main className="p-8 max-w-[1600px] mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
