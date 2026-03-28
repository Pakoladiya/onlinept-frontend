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
            <pre style={{
              fontSize: '12px',
              background: '#fee2e2',
              padding: '12px',
              borderRadius: '8px',
              overflow: 'auto',
              color: '#991b1b',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {this.state.error?.message || 'Unknown error'}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
