import { Component, type ReactNode, type ErrorInfo } from "react";

interface ErrorBoundaryProps {
  fallback: ReactNode;
  componentName?: string;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Simple ErrorBoundary that catches render errors in override components
 * and falls back to the default component or a fallback UI.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(
      `[ErrorBoundary] Override component "${this.props.componentName ?? "unknown"}" failed to render:`,
      error,
      errorInfo,
    );
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
