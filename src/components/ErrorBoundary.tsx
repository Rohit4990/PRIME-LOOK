import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected rendering error',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Storefront render error:', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetAndReload = () => {
    try {
      localStorage.removeItem('primelook_india_bag_v5');
    } catch {
      // Ignore storage errors
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#E6DFD3] rounded-2xl p-6 sm:p-8 shadow-sm text-center space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8C6A36]">
              Prime Look India
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C1917]">
              Storefront Refresh Needed
            </h1>
            <p className="text-sm text-[#57524C] leading-relaxed">
              We encountered an unexpected display error. Reload the page to
              continue browsing our collection.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#144534] text-white text-sm font-semibold hover:bg-[#0E3427] cursor-pointer"
              >
                Reload Storefront
              </button>
              <button
                type="button"
                onClick={this.handleResetAndReload}
                className="min-h-[44px] px-4 py-2.5 rounded-lg border border-[#D6CFC3] bg-white text-[#1C1917] text-sm font-medium hover:bg-[#FAF8F5] cursor-pointer"
              >
                Reset Cart &amp; Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
