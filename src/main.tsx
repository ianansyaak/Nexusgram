import {StrictMode, Component, ErrorInfo, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean; error: Error | null}> {
  state = { hasError: false, error: null as Error | null };

  constructor(props: {children: ReactNode}) {
    super(props);
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', background: '#000', height: '100vh' }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

// Prevent pinch-to-zoom on iOS Safari gestures
document.addEventListener('gesturestart', (e: any) => e.preventDefault(), { passive: false });
document.addEventListener('gesturechange', (e: any) => e.preventDefault(), { passive: false });
document.addEventListener('gestureend', (e: any) => e.preventDefault(), { passive: false });

// Prevent desktop trackpad and mouse pinch/zoom with Ctrl/Cmd key
document.addEventListener('wheel', (e: WheelEvent) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
  }
}, { passive: false });

// Prevent keyboard zoom shortcuts (Ctrl/Cmd + +, -, =, 0)
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
    e.preventDefault();
  }
});

// Prevent double-tap zoom on iOS Safari
let lastTouchEndTimestamp = 0;
document.addEventListener('touchend', (e: TouchEvent) => {
  const now = Date.now();
  if (now - lastTouchEndTimestamp <= 300) {
    // Only prevent if not tapping an input or button
    const target = e.target as HTMLElement | null;
    if (target && !['INPUT', 'TEXTAREA', 'BUTTON', 'A'].includes(target.tagName)) {
      e.preventDefault();
    }
  }
  lastTouchEndTimestamp = now;
}, { passive: false });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
