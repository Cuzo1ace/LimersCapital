import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="font-sans text-[1.2rem] font-bold text-txt mb-2">Something went wrong</h2>
          <p className="text-[.82rem] text-muted mb-1 max-w-md">
            The app encountered an unexpected error. Your data is safe — try reloading the page.
          </p>
          <p className="text-[.68rem] text-muted/60 mb-6 max-w-md font-mono">
            {this.state.error?.message || 'Unknown error'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-sea text-night font-sans font-bold text-[.82rem] cursor-pointer border-none transition-all hover:brightness-90">
              Reload Page
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('caribcrypto-storage');
                window.location.reload();
              }}
              className="px-5 py-2.5 rounded-xl bg-transparent border border-border text-muted font-mono text-[.75rem] cursor-pointer transition-all hover:text-txt hover:border-sea/30">
              Reset & Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
