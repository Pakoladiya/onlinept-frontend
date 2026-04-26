import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('App crashed:', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'Inter, system-ui, sans-serif',
          background: '#f3f4f6',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#ef4444', marginBottom: '12px' }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px', fontWeight: 500 }}>
              The application encountered a loading error. This usually happens after a new update.
            </p>
            <pre style={{
              fontSize: '12px',
              background: '#fee2e2',
              padding: '12px',
              borderRadius: '8px',
              overflow: 'auto',
              color: '#991b1b',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              marginBottom: '24px',
              maxHeight: '150px'
            }}>
              {this.state.error?.message || 'Unknown error'}
            </pre>

            <button
              onClick={async () => {
                if ('serviceWorker' in navigator) {
                  try {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (let registration of registrations) {
                      await registration.unregister();
                    }
                  } catch (e) { console.error('SW unregister failed:', e); }
                }
                window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
                window.location.reload();
              }}
              style={{
                width: '100%',
                padding: '14px',
                background: '#14A3A8',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Refresh Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
