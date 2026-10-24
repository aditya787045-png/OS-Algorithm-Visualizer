// Gantt Chart Component
// Props:
// - ganttChart: array of {processId, start, end} entries
// - currentStep: number (current time)
// - totalTime: number
// - processes: array (to get colors)

window.GanttChart = function GanttChart(props) {
  const {
    ganttChart = [],
    currentStep = 0,
    totalTime = 0,
    processes = []
  } = props;

  const [tooltip, setTooltip] = React.useState({ visible: false, x: 0, y: 0, data: null });

  // Map processId to index for consistent coloring if needed
  const processIndexMap = React.useMemo(() => {
    const map = {};
    if (Array.isArray(processes)) {
      processes.forEach((p, idx) => {
        if (p && p.id) map[p.id] = idx;
      });
    }
    return map;
  }, [processes]);

  const effectiveTotalTime = totalTime > 0 ? totalTime : (
    ganttChart.length > 0 ? Math.max(...ganttChart.map(item => item.end || 0)) : 0
  );

  const handleMouseEnter = (entry, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      data: {
        processId: entry.processId,
        start: entry.start,
        end: entry.end,
        duration: entry.end - entry.start
      }
    });
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  if (!ganttChart || ganttChart.length === 0) {
    return (
      <div className="gantt-chart-container empty-state">
        <p className="empty-text">No Gantt chart data available.</p>
      </div>
    );
  }

  return (
    <div className="gantt-chart-wrapper">
      <div className="gantt-chart-scroll-container">
        <div className="gantt-chart-timeline" style={{ minWidth: `${Math.max(500, ganttChart.length * 60)}px` }}>
          {/* Blocks container */}
          <div className="gantt-bars-row">
            {ganttChart.map((entry, idx) => {
              const duration = entry.end - entry.start;
              const widthPct = effectiveTotalTime > 0 ? (duration / effectiveTotalTime) * 100 : (100 / ganttChart.length);
              const isIdle = entry.processId === 'IDLE' || entry.processId === 'Idle';
              const isCurrent = currentStep >= entry.start && currentStep < entry.end;
              const isCompletedSoFar = currentStep >= entry.end;

              const bgColor = isIdle
                ? '#64748b'
                : (window.getProcessColor
                    ? window.getProcessColor(entry.processId, processIndexMap[entry.processId])
                    : '#4f8ef7');

              return (
                <div
                  key={`${entry.processId}-${entry.start}-${idx}`}
                  className={`gantt-bar-item ${isCurrent ? 'gantt-bar-active' : ''} ${isIdle ? 'gantt-bar-idle' : ''} ${isCompletedSoFar ? 'gantt-bar-passed' : ''}`}
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: bgColor
                  }}
                  onMouseEnter={(e) => handleMouseEnter(entry, e)}
                  onMouseLeave={handleMouseLeave}
                  title={`${entry.processId}: ${entry.start} -> ${entry.end} (Duration: ${duration})`}
                >
                  <span className="gantt-bar-label">{entry.processId}</span>
                  {isCurrent && <span className="gantt-current-pulse" />}
                </div>
              );
            })}
          </div>

          {/* Time scale markers below */}
          <div className="gantt-time-scale">
            {ganttChart.map((entry, idx) => {
              const duration = entry.end - entry.start;
              const widthPct = effectiveTotalTime > 0 ? (duration / effectiveTotalTime) * 100 : (100 / ganttChart.length);

              return (
                <div
                  key={`time-${idx}`}
                  className="gantt-time-slot"
                  style={{ width: `${widthPct}%` }}
                >
                  <span className="time-marker start-marker">{entry.start}</span>
                  {idx === ganttChart.length - 1 && (
                    <span className="time-marker end-marker">{entry.end}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Tooltip */}
      {tooltip.visible && tooltip.data && (
        <div
          className="gantt-tooltip"
          style={{
            position: 'fixed',
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            zIndex: 9999
          }}
        >
          <div className="tooltip-title"><strong>Process:</strong> {tooltip.data.processId}</div>
          <div><strong>Start:</strong> {tooltip.data.start} | <strong>End:</strong> {tooltip.data.end}</div>
          <div><strong>Duration:</strong> {tooltip.data.duration}</div>
        </div>
      )}
    </div>
  );
};
