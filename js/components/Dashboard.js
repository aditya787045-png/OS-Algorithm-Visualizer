/**
 * Dashboard.js
 * Landing / Home component for OS Algorithm Visualizer.
 * Loaded via <script type="text/babel"> without import/export.
 */

window.Dashboard = function Dashboard({ onNavigate }) {
  const modules = [
    {
      id: 'cpu',
      title: 'CPU Scheduling',
      badge: '6 Algorithms',
      description: 'Visualize FCFS, SJF, SRTF, Priority & Round Robin scheduling algorithms with interactive Gantt charts.',
      color: '#4f8ef7'
    },
    {
      id: 'page',
      title: 'Page Replacement',
      badge: '3 Algorithms',
      description: 'Simulate FIFO, LRU & Optimal page replacement with real-time frame tables and hit/miss tracking.',
      color: '#10b981'
    },
    {
      id: 'disk',
      title: 'Disk Scheduling',
      badge: '6 Algorithms',
      description: 'Animate FCFS, SSTF, SCAN, C-SCAN, LOOK & C-LOOK cylinder head movements with seek count calculation.',
      color: '#f59e0b'
    },
    {
      id: 'memory',
      title: 'Memory Allocation',
      badge: '4 Algorithms',
      description: 'Visualize First Fit, Best Fit, Worst Fit & Next Fit contiguous memory partition allocation and fragmentation.',
      color: '#8b5cf6'
    },
    {
      id: 'compare',
      title: 'Comparison Hub',
      badge: 'Multi-Compare',
      description: 'Run multiple algorithms side-by-side with identical inputs to contrast throughput, waiting times, and overhead.',
      color: '#ec4899'
    },
    {
      id: 'learn',
      title: 'Study & Concepts',
      badge: 'Study Guide',
      description: 'In-depth conceptual explanations, formulas, time/space complexity analysis, and real-world OS case studies.',
      color: '#06b6d4'
    }
  ];

  const statBadges = [
    { label: '6 CPU Algorithms' },
    { label: '3 Page Replacement' },
    { label: '6 Disk Algorithms' },
    { label: '4 Memory Algorithms' }
  ];

  const features = [
    {
      title: 'Step-by-Step Animation',
      desc: 'Watch algorithms execute one discrete step at a time with adjustable playback speed and frame stepping.'
    },
    {
      title: 'Detailed Statistics',
      desc: 'Instant calculation of turnaround time, waiting time, page fault rates, total head movement, and memory utilization.'
    },
    {
      title: 'Smart Explanations',
      desc: 'Understand WHY each decision is made at each tick with live state annotations and scheduling log rationale.'
    }
  ];

  const quickSteps = [
    { step: 1, text: 'Select an algorithm category from the sidebar or dashboard cards above.' },
    { step: 2, text: 'Enter your custom process / page / disk request data or load ready-made presets.' },
    { step: 3, text: 'Click Run Simulation to compute schedules and generate visual structures.' },
    { step: 4, text: 'Use Play, Pause, and Step Forward controls to inspect execution dynamics.' }
  ];

  return (
    <div style={{
      padding: '32px 24px',
      maxWidth: '1200px',
      margin: '0 auto',
      color: '#e2e8f0',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* 1. Hero Section */}
      <section style={{
        textAlign: 'center',
        padding: '48px 20px 40px',
        marginBottom: '40px',
        borderRadius: '16px',
        background: 'linear-gradient(180deg, rgba(79, 142, 247, 0.08) 0%, rgba(30, 33, 48, 0.5) 100%)',
        border: '1px solid rgba(79, 142, 247, 0.2)'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '999px',
          backgroundColor: 'rgba(79, 142, 247, 0.15)',
          color: '#4f8ef7',
          fontSize: '0.875rem',
          fontWeight: 600,
          marginBottom: '20px',
          border: '1px solid rgba(79, 142, 247, 0.3)'
        }}>
          Algorithm Visualization Platform
        </div>

        <h1 style={{
          fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          margin: '0 0 16px',
          color: '#ffffff',
          lineHeight: 1.15
        }}>
          OS Algorithm <span style={{
            background: 'linear-gradient(135deg, #4f8ef7 0%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Visualizer</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.2rem)',
          color: '#94a3b8',
          maxWidth: '680px',
          margin: '0 auto 28px',
          lineHeight: 1.6
        }}>
          Interactive step-by-step visualization of Operating System algorithms. Master core OS concepts intuitively.
        </p>

        {/* Stat Badges */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '12px',
          marginTop: '12px'
        }}>
          {statBadges.map((badge, idx) => (
            <div key={idx} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: '#1e2130',
              border: '1px solid #2d3148',
              fontSize: '0.875rem',
              color: '#cbd5e1',
              fontWeight: 500
            }}>
              <span>{badge.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Module Cards Grid */}
      <section style={{ marginBottom: '48px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 8px', color: '#f8fafc' }}>
            Exploration Modules
          </h2>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>
            Choose an area of operating system resource management to visualize and experiment with.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {modules.map(mod => (
            <div
              key={mod.id}
              style={{
                backgroundColor: '#1e2130',
                borderRadius: '14px',
                padding: '24px',
                border: '1px solid #2d3148',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = mod.color;
                e.currentTarget.style.boxShadow = `0 10px 24px -10px ${mod.color}33`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#2d3148';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onClick={() => onNavigate && onNavigate(mod.id)}
            >
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: '36px',
                    height: '4px',
                    borderRadius: '2px',
                    backgroundColor: mod.color
                  }} />
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: '999px',
                    backgroundColor: `${mod.color}22`,
                    color: mod.color,
                    border: `1px solid ${mod.color}44`
                  }}>
                    {mod.badge}
                  </span>
                </div>

                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  margin: '0 0 10px',
                  color: '#ffffff'
                }}>
                  {mod.title}
                </h3>

                <p style={{
                  fontSize: '0.9rem',
                  color: '#94a3b8',
                  lineHeight: 1.55,
                  margin: '0 0 20px'
                }}>
                  {mod.description}
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onNavigate) onNavigate(mod.id);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  backgroundColor: 'transparent',
                  color: mod.color,
                  border: `1px solid ${mod.color}55`,
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease, color 0.15s ease',
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = mod.color;
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = mod.color;
                }}
              >
                Explore
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Features Section */}
      <section style={{
        marginBottom: '48px',
        padding: '32px 24px',
        backgroundColor: '#161926',
        borderRadius: '16px',
        border: '1px solid #24283b'
      }}>
        <h2 style={{
          fontSize: '1.4rem',
          fontWeight: 700,
          textAlign: 'center',
          margin: '0 0 28px',
          color: '#f8fafc'
        }}>
          Why Visualize with This Tool?
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px'
        }}>
          {features.map((feat, idx) => (
            <div key={idx} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '16px',
              backgroundColor: '#1e2130',
              borderRadius: '12px',
              border: '1px solid #2d3148'
            }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 8px', color: '#f1f5f9' }}>
                {feat.title}
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Quick Start Guide */}
      <section style={{
        padding: '32px 28px',
        backgroundColor: '#1e2130',
        borderRadius: '16px',
        border: '1px solid #2d3148'
      }}>
        <h2 style={{
          fontSize: '1.3rem',
          fontWeight: 700,
          margin: '0 0 8px',
          color: '#ffffff'
        }}>
          Quick Start Guide
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 24px' }}>
          Follow these 4 simple steps to run any algorithm simulation:
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}>
          {quickSteps.map(step => (
            <div key={step.step} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '16px',
              backgroundColor: '#151722',
              borderRadius: '10px',
              border: '1px solid #262a3f'
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#4f8ef7',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: 700,
                flexShrink: 0
              }}>
                {step.step}
              </div>
              <p style={{
                fontSize: '0.875rem',
                color: '#cbd5e1',
                margin: 0,
                lineHeight: 1.5
              }}>
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
