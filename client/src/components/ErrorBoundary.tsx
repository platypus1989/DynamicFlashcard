import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo: errorInfo.componentStack,
    });
  }

  handleClearCache = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      console.error('Error clearing cache:', e);
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Something went wrong
                  </h1>
                  <p className="text-gray-600">
                    The application encountered an unexpected error.
                  </p>
                </div>
              </div>

              {this.state.error && (
                <div className="bg-gray-100 p-4 rounded-lg mb-6">
                  <h2 className="font-semibold mb-2 text-sm text-gray-700">Error Details:</h2>
                  <pre className="text-xs text-red-600 overflow-x-auto whitespace-pre-wrap">
                    {this.state.error.toString()}
                  </pre>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-600 cursor-pointer">
                        Stack Trace
                      </summary>
                      <pre className="text-xs text-gray-600 mt-2 overflow-x-auto whitespace-pre-wrap">
                        {this.state.errorInfo}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={this.handleReload} variant="default">
                  Reload Page
                </Button>
                <Button onClick={this.handleClearCache} variant="outline">
                  Clear Cache & Reload
                </Button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>💡 Tip:</strong> If this error persists, try clearing your browser cache
                  or using the "Clear Cache & Reload" button above.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

