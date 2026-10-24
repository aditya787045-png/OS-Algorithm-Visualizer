// OS Visualizer - Main React Application Entry Point
// Babel Standalone mode - No import/export statements

// --- Error Boundary Component ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Error Boundary Caught:', error, errorInfo);
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
          backgroundColor: '#0f172a',
          color: '#ef4444',
          padding: '40px',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid #ef444433',
            borderRadius: '16px',
            padding: '36px',
            maxWidth: '540px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}>
            <h2 style={{ color: '#f87171', margin: '0 0 12px 0', fontSize: '22px' }}>
              Something went wrong
            </h2>
            <p style={{
              color: '#94a3b8',
              fontSize: '14px',
              lineHeight: 1.6,
              background: '#0f172a',
              padding: '12px 16px',
              borderRadius: '8px',
              wordBreak: 'break-word',
              fontFamily: 'monospace'
            }}>
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                marginTop: '24px',
                padding: '10px 24px',
                background: '#4f8ef7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.background = '#3b78e7'}
              onMouseOut={(e) => e.target.style.background = '#4f8ef7'}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Navigation Items Definition ---
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '', title: 'Dashboard Overview' },
  { id: 'cpu', label: 'CPU Scheduling', icon: '', title: 'CPU Scheduling Algorithms' },
  { id: 'page', label: 'Page Replacement', icon: '', title: 'Page Replacement Algorithms' },
  { id: 'disk', label: 'Disk Scheduling', icon: '', title: 'Disk Scheduling Algorithms' },
  { id: 'memory', label: 'Memory Allocation', icon: '', title: 'Memory Allocation Strategies' },
  { id: 'compare', label: 'Compare', icon: '', title: 'Algorithm Comparison & Benchmarks' },
  { id: 'learn', label: 'Learn', icon: '', title: 'Interactive Learning & Theory' }
];

// --- Main App Component ---
function App() {
  const [currentPage, setCurrentPage] = React.useState('dashboard');
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeItem = NAV_ITEMS.find(item => item.id === currentPage) || NAV_ITEMS[0];

  const navItemStyle = (pageId) => {
    const isActive = currentPage === pageId;
    return {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: isMobile ? '12px' : '10px 16px',
      borderRadius: '8px',
      cursor: 'pointer',
      color: isActive ? '#4f8ef7' : '#94a3b8',
      background: isActive ? 'rgba(79, 142, 247, 0.12)' : 'transparent',
      borderLeft: isActive ? '3px solid #4f8ef7' : '3px solid transparent',
      transition: 'all 0.2s ease',
      fontSize: '14px',
      fontWeight: isActive ? '600' : '400',
      marginBottom: '4px',
      listStyle: 'none',
      justifyContent: isMobile ? 'center' : 'flex-start',
      userSelect: 'none'
    };
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return window.Dashboard
          ? React.createElement(window.Dashboard, { onNavigate: setCurrentPage })
          : <div className="page-fallback">Dashboard component is loading...</div>;
      case 'cpu':
        return window.CPUScheduling
          ? React.createElement(window.CPUScheduling, { onNavigate: setCurrentPage })
          : <div className="page-fallback">CPU Scheduling component is loading...</div>;
      case 'page':
        return window.PageReplacement
          ? React.createElement(window.PageReplacement, { onNavigate: setCurrentPage })
          : <div className="page-fallback">Page Replacement component is loading...</div>;
      case 'disk':
        return window.DiskScheduling
          ? React.createElement(window.DiskScheduling, { onNavigate: setCurrentPage })
          : <div className="page-fallback">Disk Scheduling component is loading...</div>;
      case 'memory':
        return window.MemoryAllocation
          ? React.createElement(window.MemoryAllocation, { onNavigate: setCurrentPage })
          : <div className="page-fallback">Memory Allocation component is loading...</div>;
      case 'compare':
        return window.Compare
          ? React.createElement(window.Compare, { onNavigate: setCurrentPage })
          : <div className="page-fallback">Comparison component is loading...</div>;
      case 'learn':
        return window.LearnSection
          ? React.createElement(window.LearnSection, { onNavigate: setCurrentPage })
          : <div className="page-fallback">Learn Section component is loading...</div>;
      default:
        return window.Dashboard
          ? React.createElement(window.Dashboard, { onNavigate: setCurrentPage })
          : <div className="page-fallback">Dashboard component is loading...</div>;
    }
  };

  return (
    <div className="app">
      {/* Sidebar Navigation */}
      <aside className="sidebar" style={{ width: isMobile ? '72px' : '260px' }}>
        <div
          className="sidebar-logo"
          onClick={() => setCurrentPage('dashboard')}
          style={{
            cursor: 'pointer',
            padding: '20px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            justifyContent: isMobile ? 'center' : 'flex-start'
          }}
          title="OS Visualizer"
        >
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#60a5fa' }}>OS</span>
          {!isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{
                fontWeight: '700',
                fontSize: '18px',
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #60a5fa, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                OS Visualizer
              </span>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                Interactive Suite
              </span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav" style={{ padding: '16px 8px', flex: 1, overflowY: 'auto' }}>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {NAV_ITEMS.map((item) => (
              <li
                key={item.id}
                className="sidebar-nav-item"
                style={navItemStyle(item.id)}
                onClick={() => setCurrentPage(item.id)}
                title={isMobile ? item.label : undefined}
                onMouseEnter={(e) => {
                  if (currentPage !== item.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.color = '#cbd5e1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== item.id) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#94a3b8';
                  }
                }}
              >
                {item.icon && (
                  <span style={{ fontSize: '18px', display: 'flex', alignItems: 'center' }}>
                    {item.icon}
                  </span>
                )}
                {!isMobile && (
                  <span style={{ whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {!isMobile && (
          <div style={{
            padding: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '12px',
            color: '#64748b',
            textAlign: 'center'
          }}>
            OS Visualizer
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Bar */}
        <header className="top-header" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 28px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: '#64748b',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <span
                onClick={() => setCurrentPage('dashboard')}
                style={{ cursor: 'pointer', transition: 'color 0.2s ease' }}
                onMouseOver={(e) => e.target.style.color = '#4f8ef7'}
                onMouseOut={(e) => e.target.style.color = '#64748b'}
              >
                Home
              </span>
              <span>/</span>
              <span style={{ color: '#94a3b8', fontWeight: '500' }}>{activeItem.label}</span>
            </div>
            <h1 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '700',
              color: '#f8fafc',
              letterSpacing: '-0.02em'
            }}>
              {activeItem.title}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'rgba(79, 142, 247, 0.1)',
              borderRadius: '20px',
              border: '1px solid rgba(79, 142, 247, 0.2)',
              fontSize: '12px',
              color: '#60a5fa',
              fontWeight: '500'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                boxShadow: '0 0 8px #22c55e'
              }}></span>
              <span>Online Simulator</span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <main className="page" style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

// --- Mount to DOM ---
const rootContainer = document.getElementById('root');
if (rootContainer) {
  const root = ReactDOM.createRoot(rootContainer);
  root.render(
    React.createElement(ErrorBoundary, null,
      React.createElement(App, null)
    )
  );
} else {
  console.error("Target container '#root' was not found in the DOM.");
}
