// Step Panel Component
// Props:
// - step: the current step object {time, runningProcess, readyQueue, completedProcesses, remainingBurst, explanation}
// - algorithm: string (algorithm name)

window.StepPanel = function StepPanel(props) {
  const { step, algorithm } = props;

  if (!step) {
    return (
      <div className="step-panel step-panel-empty card">
        <p className="empty-text">No simulation step data available.</p>
      </div>
    );
  }

  const {
    time = 0,
    runningProcess = null,
    readyQueue = [],
    completedProcesses = [],
    remainingBurst = {},
    explanation = ''
  } = step;

  const isIdle = !runningProcess || runningProcess === 'IDLE' || runningProcess === 'Idle';
  const runningColor = isIdle
    ? '#64748b'
    : (window.getProcessColor ? window.getProcessColor(runningProcess) : '#4f8ef7');

  return (
    <div className="step-panel card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {algorithm && (
        <div className="step-panel-header">
          <span className="step-algo-badge">{algorithm}</span>
        </div>
      )}

      {/* 1. Current Time */}
      <div className="step-section step-time-section">
        <div className="step-section-title">Current Time</div>
        <div className="step-time-display">
          <span className="step-time-value">{time}</span>
          <span className="step-time-unit">units</span>
        </div>
      </div>

      {/* 2. CPU State */}
      <div className="step-section step-cpu-section">
        <div className="step-section-title">CPU State</div>
        <div className="step-cpu-state">
          {isIdle ? (
            <div className="cpu-badge cpu-idle">
              <span className="cpu-status-dot idle-dot" />
              <span>IDLE</span>
            </div>
          ) : (
            <div
              className="cpu-badge cpu-active"
              style={{ borderColor: runningColor }}
            >
              <span
                className="cpu-status-dot active-dot pulse"
                style={{ backgroundColor: runningColor }}
              />
              <span className="cpu-process-name" style={{ color: runningColor, fontWeight: 'bold' }}>
                {runningProcess}
              </span>
              <span className="cpu-executing-label">Executing</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Ready Queue */}
      <div className="step-section step-queue-section">
        <div className="step-section-title">Ready Queue</div>
        <div className="step-queue-list">
          {Array.isArray(readyQueue) && readyQueue.length > 0 ? (
            readyQueue.map((pid, idx) => {
              const color = window.getProcessColor ? window.getProcessColor(pid) : '#4f8ef7';
              return (
                <span
                  key={`rq-${pid}-${idx}`}
                  className="badge queue-badge"
                  style={{
                    backgroundColor: `${color}20`,
                    borderColor: color,
                    color: color
                  }}
                >
                  {pid}
                </span>
              );
            })
          ) : (
            <span className="empty-subtext">Queue is empty</span>
          )}
        </div>
      </div>

      {/* 4. Completed Processes */}
      <div className="step-section step-completed-section">
        <div className="step-section-title">Completed Processes</div>
        <div className="step-completed-list">
          {Array.isArray(completedProcesses) && completedProcesses.length > 0 ? (
            completedProcesses.map((pid, idx) => (
              <span
                key={`comp-${pid}-${idx}`}
                className="badge completed-badge"
                style={{
                  backgroundColor: '#10b98120',
                  borderColor: '#10b981',
                  color: '#10b981'
                }}
              >
                ✓ {pid}
              </span>
            ))
          ) : (
            <span className="empty-subtext">None yet</span>
          )}
        </div>
      </div>

      {/* 5. Remaining Burst Table */}
      {remainingBurst && Object.keys(remainingBurst).length > 0 && (
        <div className="step-section step-burst-section">
          <div className="step-section-title">Remaining Burst Times</div>
          <div className="step-burst-table-wrapper">
            <table className="step-burst-table">
              <thead>
                <tr>
                  <th>Process</th>
                  <th>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(remainingBurst).map(([pid, rem]) => {
                  const isCurrentRunning = pid === runningProcess;
                  const isFinished = rem === 0;
                  return (
                    <tr
                      key={pid}
                      className={`${isCurrentRunning ? 'row-running' : ''} ${isFinished ? 'row-finished' : ''}`}
                    >
                      <td>
                        <span
                          className="burst-pid-dot"
                          style={{
                            backgroundColor: window.getProcessColor ? window.getProcessColor(pid) : '#4f8ef7'
                          }}
                        />
                        {pid}
                      </td>
                      <td>
                        <span className={`burst-rem-value ${isFinished ? 'text-zero' : ''}`}>
                          {rem}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Why this happened? */}
      {explanation && (
        <div className="step-section step-explanation-section">
          <div className="step-explanation-box">
            <div className="step-explanation-header">
              <strong>Why this happened?</strong>
            </div>
            <div className="step-explanation-body">
              {explanation}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
