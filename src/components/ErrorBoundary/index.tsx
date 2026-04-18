'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          padding: 32, textAlign: 'center', fontFamily: 'Fredoka, sans-serif',
          color: '#78350f', background: '#fef9c3', borderRadius: 16, margin: 16
        }}>
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            Something went wrong
          </p>
          <p style={{ fontSize: 14, color: '#a16207', marginBottom: 16 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '10px 24px', background: '#422006', color: '#fef08a',
              border: 'none', borderRadius: 99, cursor: 'pointer',
              fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: 14
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
