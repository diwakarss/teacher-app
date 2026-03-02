'use client';

import { Component, type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[50vh] items-center justify-center p-4">
          <Card className="max-w-md">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <AlertTriangle className="mb-4 h-12 w-12 text-amber-500" />
              <h2 className="mb-2 text-lg font-semibold text-gray-900">
                Something went wrong
              </h2>
              <p className="mb-4 text-sm text-gray-500">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <Button onClick={this.handleReset} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook-based error display for async errors
export function ErrorDisplay({
  error,
  onRetry,
}: {
  error: string | null;
  onRetry?: () => void;
}) {
  if (!error) return null;

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
