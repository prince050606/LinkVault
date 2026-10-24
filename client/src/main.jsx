import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("LinkVault Runtime Error Caught by Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#090a0f",
          color: "#f8fafc",
          fontFamily: "Plus Jakarta Sans, sans-serif",
          padding: "24px",
          textAlign: "center"
        }}>
          <div style={{
            maxWidth: "480px",
            background: "#0e111a",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "12px",
            padding: "32px 24px",
            boxShadow: "0 12px 30px rgba(0,0,0,0.5)"
          }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "8px", color: "#fff" }}>
              LinkVault Dashboard Notice
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5, marginBottom: "20px" }}>
              An error occurred during dashboard rendering. Click below to refresh your link session.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                background: "#6366f1",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "8px 18px",
                fontSize: "0.85rem",
                fontWeight: 500,
                cursor: "pointer"
              }}
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
