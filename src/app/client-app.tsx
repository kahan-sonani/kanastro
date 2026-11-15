"use client";

import React from "react";
import dynamic from "next/dynamic";

const Kanastro = dynamic(() => import("../App"), {
  ssr: false,
  loading: () => (
    <div className="initial-loading" role="status">
      Loading profiles…
    </div>
  ),
});

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    if (this.state.error)
      return (
        <main className="fatal-error">
          <h1>Unable to open Kanastro.</h1>
          <button
            className="button primary"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </main>
      );
    return this.props.children;
  }
}

export default function ClientApp() {
  return (
    <ErrorBoundary>
      <Kanastro />
    </ErrorBoundary>
  );
}
