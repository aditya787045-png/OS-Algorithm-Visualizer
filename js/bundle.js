

// ----------------------------------------------------
// FILE: js\components\SimulationControls.js
// ----------------------------------------------------
// Simulation Controls Component
// Props:
// - currentStep: number
// - totalSteps: number
// - isPlaying: boolean
// - speed: number (0.5, 1, 1.5, 2)
// - onPlay: function
// - onPause: function
// - onNext: function
// - onPrev: function
// - onReset: function
// - onSpeedChange: function(speed)
// - onStepChange: function(step) - for clicking on progress bar

window.SimulationControls = function SimulationControls(props) {
  const {
    currentStep = 0,
    totalSteps = 1,
    isPlaying = false,
    speed = 1,
    onPlay = () => {},
    onPause = () => {},
    onNext = () => {},
    onPrev = () => {},
    onReset = () => {},
    onSpeedChange = () => {},
    onStepChange = () => {}
  } = props;

  const maxStep = Math.max(0, totalSteps - 1);
  const percentage = maxStep > 0 ? Math.min(100, Math.max(0, (currentStep / maxStep) * 100)) : (totalSteps > 0 ? 100 : 0);

  const handleProgressBarClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetStep = Math.round(ratio * maxStep);
    onStepChange(targetStep);
  };

  const speedOptions = [0.5, 1, 1.5, 2];

  return (
    <div className="sim-controls" role="region" aria-label="Simulation Controls">
      <div className="sim-controls-row">
        {/* Playback action buttons */}
        <div className="sim-btn-group" role="group" aria-label="Playback Navigation">
          <button
            type="button"
            className="sim-btn sim-btn-prev"
            onClick={onPrev}
            disabled={currentStep <= 0}
            aria-label="Previous Step"
            title="Previous Step"
          >
            ⏮ Prev
          </button>

          {isPlaying ? (
            <button
              type="button"
              className="sim-btn sim-btn-pause active-action"
              onClick={onPause}
              aria-label="Pause Simulation"
              title="Pause Simulation"
            >
              ⏸ Pause
            </button>
          ) : (
            <button
              type="button"
              className="sim-btn sim-btn-play"
              onClick={onPlay}
              disabled={currentStep >= maxStep && totalSteps > 0}
              aria-label="Play Simulation"
              title="Play Simulation"
            >
              ▶ Play
            </button>
          )}

          <button
            type="button"
            className="sim-btn sim-btn-next"
            onClick={onNext}
            disabled={currentStep >= maxStep}
            aria-label="Next Step"
            title="Next Step"
          >
            ⏭ Next
          </button>

          <button
            type="button"
            className="sim-btn sim-btn-reset"
            onClick={onReset}
            aria-label="Reset Simulation"
            title="Reset Simulation"
          >
            ↺ Reset
          </button>
        </div>

        {/* Speed adjustment buttons */}
        <div className="sim-speed-group" role="group" aria-label="Speed Controls">
          <span className="sim-speed-label">Speed:</span>
          {speedOptions.map((s) => (
            <button
              key={s}
              type="button"
              className={`sim-speed-btn ${speed === s ? 'active' : ''}`}
              onClick={() => onSpeedChange(s)}
              aria-label={`Set speed to ${s}x`}
              aria-pressed={speed === s}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Step indicator */}
        <div className="sim-step-indicator" aria-live="polite">
          Step {totalSteps === 0 ? 0 : Math.min(currentStep + 1, totalSteps)} / {totalSteps}
        </div>
      </div>

      {/* Clickable Progress bar */}
      <div
        className="sim-progress-container"
        onClick={handleProgressBarClick}
        title="Click to seek"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={0}
        aria-valuemax={maxStep}
        aria-label="Simulation timeline progress"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' && currentStep < maxStep) onStepChange(currentStep + 1);
          if (e.key === 'ArrowLeft' && currentStep > 0) onStepChange(currentStep - 1);
        }}
      >
        <div
          className="sim-progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};


// ----------------------------------------------------
// FILE: js\components\GanttChart.js
// ----------------------------------------------------
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


// ----------------------------------------------------
// FILE: js\components\StepPanel.js
// ----------------------------------------------------
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
              <span className="explanation-icon" aria-hidden="true">💡</span>
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


// ----------------------------------------------------
// FILE: js\components\LearnSection.js
// ----------------------------------------------------
// LearnSection.js
// Expose as window.LearnSection React component
(function() {
  'use strict';

  const { useState, useMemo } = React;

  // Comprehensive knowledge database for all algorithms
  const ALGORITHM_KNOWLEDGE = {
    // -------------------------------------------------------------------------
    // CPU Scheduling
    // -------------------------------------------------------------------------
    FCFS: {
      categoryKey: 'CPU',
      name: 'FCFS',
      fullName: 'First Come First Serve',
      category: 'CPU Scheduling',
      description: 'First Come First Serve (FCFS) is the simplest, non-preemptive CPU scheduling algorithm where the process that requests the CPU first is allocated the CPU first. Processes are managed in a strict FIFO queue according to their arrival times.',
      howItWorks: 'The CPU scheduler dispatches processes strictly in arrival order. Once a process gets the CPU, it runs to completion (or until it blocks for I/O) without interruption.',
      steps: [
        'Place incoming processes into a FIFO ready queue as they arrive.',
        'Select the process at the head of the queue when the CPU becomes idle.',
        'Execute the selected process non-preemptively until completion.',
        'Calculate completion, turnaround, and waiting times before dispatching the next process.'
      ],
      advantages: [
        'Very simple to understand, implement, and maintain.',
        'Zero scheduling overhead since no dynamic priorities or remaining times need re-evaluation.',
        'Guarantees fairness in arrival order; starvation is impossible.'
      ],
      disadvantages: [
        'Convoy Effect: Short processes must wait behind long CPU-burst processes.',
        'High and unpredictable average waiting time compared to shortest-job alternatives.',
        'Not suitable for interactive or time-sharing operating systems.'
      ],
      timeComplexity: 'O(n log n)',
      spaceComplexity: 'O(n)',
      realWorldUse: 'Used in batch processing systems, basic FIFO job queues, and printer spooling buffers where turnaround predictability is secondary.',
      whenToUse: 'Ideal for simple embedded microcontrollers, background batch jobs with uniform execution times, or systems with minimal compute overhead.'
    },

    SJF: {
      categoryKey: 'CPU',
      name: 'SJF',
      fullName: 'Shortest Job First (Non-Preemptive)',
      category: 'CPU Scheduling',
      description: 'Shortest Job First (SJF) is a non-preemptive scheduling policy that selects the process with the smallest CPU burst time from the ready queue. When CPU bursts are identical, FCFS is used as a tie-breaker.',
      howItWorks: 'Whenever the CPU becomes idle, the scheduler scans all arrived processes in the ready queue, identifies the one with the shortest expected burst, and executes it to completion.',
      steps: [
        'Track all arrived processes waiting in the ready pool.',
        'Pick the process with the minimum CPU burst time.',
        'Allocate the CPU non-preemptively to this process until it completes.',
        'Repeat the selection process for remaining uncompleted processes.'
      ],
      advantages: [
        'Provably optimal for minimizing the average waiting time among non-preemptive algorithms.',
        'Provides rapid throughput for collections of short tasks.',
        'Simple logic once burst times are known.'
      ],
      disadvantages: [
        'Future CPU burst duration cannot generally be predicted in advance for interactive systems.',
        'Risk of starvation for long processes if a continuous stream of short processes arrives.',
        'Lack of preemption means a long job starting right before a short job cannot be paused.'
      ],
      timeComplexity: 'O(n log n)',
      spaceComplexity: 'O(n)',
      realWorldUse: 'Long-term job scheduling in supercomputing clusters where users explicitly declare estimated computation runtimes with job submissions.',
      whenToUse: 'Use in batch workflows or compile servers where execution lengths are known beforehand or can be accurately estimated using exponential averaging.'
    },

    SRTF: {
      categoryKey: 'CPU',
      name: 'SRTF',
      fullName: 'Shortest Remaining Time First',
      category: 'CPU Scheduling',
      description: 'Shortest Remaining Time First (SRTF) is the preemptive counterpart of Shortest Job First. At every time unit or process arrival, the process with the least remaining execution time preempts the currently running job.',
      howItWorks: 'The scheduler continually evaluates the remaining burst of the active process against new arrivals. If any arrived process has a shorter remaining burst than what remains on the current job, context switching occurs.',
      steps: [
        'Track the remaining execution time of each active process.',
        'When a new process arrives, compare its burst time against the running process\'s remaining burst.',
        'If the incoming process has a shorter burst, preempt the current process and place it back in the ready queue.',
        'Dispatch the process with the minimum remaining execution time.',
        'Repeat at every clock tick or arrival event until all processes finish.'
      ],
      advantages: [
        'Produces the absolute minimal average waiting time among all scheduling algorithms.',
        'Short interactive processes receive immediate responsiveness without waiting behind long background jobs.',
        'Dynamically adapts to newly arriving urgent bursts.'
      ],
      disadvantages: [
        'Higher context switching overhead due to frequent preemption.',
        'Starvation of long jobs can persist indefinitely under high load.',
        'Requires real-time tracking of remaining burst times.'
      ],
      timeComplexity: 'O(n log n)',
      spaceComplexity: 'O(n)',
      realWorldUse: 'Real-time event loops, network packet schedulers, and high-frequency dispatchers prioritizing short control packets over bulk transfers.',
      whenToUse: 'Best when low latency for short jobs is critical and context switching costs are negligible.'
    },

    'Priority NP': {
      categoryKey: 'CPU',
      name: 'Priority NP',
      fullName: 'Priority Scheduling (Non-Preemptive)',
      category: 'CPU Scheduling',
      description: 'Non-Preemptive Priority Scheduling assigns a priority rank to each process. The CPU is allocated to the ready process with the highest priority (conventionally smallest numerical rank) until completion.',
      howItWorks: 'When the CPU becomes available, the scheduler selects the waiting process with the highest priority rank. Once granted the CPU, the process executes without interruption.',
      steps: [
        'Assign numeric priority levels to each incoming process.',
        'Filter the ready queue for processes that have arrived.',
        'Select the process with highest priority (lowest integer value).',
        'Run the chosen process to completion before re-evaluating priority queue.'
      ],
      advantages: [
        'Provides deterministic control over task execution order based on application importance.',
        'Well-suited for systems where certain mission-critical processes must take precedence.',
        'Zero preemption overhead during task execution.'
      ],
      disadvantages: [
        'Indefinite blocking (starvation): Low-priority processes may never execute if high-priority processes keep arriving.',
        'A high-priority process arriving just after a low-priority task begins must wait until that task finishes.',
        'Requires aging mechanisms to prevent indefinite starvation.'
      ],
      timeComplexity: 'O(n log n)',
      spaceComplexity: 'O(n)',
      realWorldUse: 'Automotive and avionics control units where safety-critical telemetry loops run ahead of diagnostic logging.',
      whenToUse: 'When processes have static, well-defined importance levels and tasks run short, bounded bursts.'
    },

    'Priority P': {
      categoryKey: 'CPU',
      name: 'Priority P',
      fullName: 'Priority Scheduling (Preemptive)',
      category: 'CPU Scheduling',
      description: 'Preemptive Priority Scheduling immediately interrupts the running process if a newly arrived process possesses a higher priority (lower priority number).',
      howItWorks: 'Whenever a process arrives, its priority is compared to the currently running process. If higher, the running process is suspended and returned to the ready queue, granting the CPU to the new arrival.',
      steps: [
        'Maintain a prioritized ready queue of arrived processes.',
        'Run the highest priority process on the CPU.',
        'On every new arrival, check if its priority exceeds the current process\'s priority.',
        'If yes, preempt the CPU immediately, save state, and dispatch the higher-priority job.',
        'Resume preempted jobs when higher-priority work finishes.'
      ],
      advantages: [
        'Instantaneous responsiveness for mission-critical or emergency tasks.',
        'Guarantees high-priority jobs never wait for lower-priority jobs to finish.',
        'Supports strict real-time deadline guarantees.'
      ],
      disadvantages: [
        'Increased context-switch frequency leads to CPU performance overhead.',
        'Severe risk of starvation for low-priority processes without aging.',
        'Susceptible to priority inversion when synchronization locks are involved.'
      ],
      timeComplexity: 'O(n log n)',
      spaceComplexity: 'O(n)',
      realWorldUse: 'Real-Time Operating Systems (RTOS) like FreeRTOS, VxWorks, and QNX for industrial automation, medical equipment, and flight control.',
      whenToUse: 'Mandatory in hard real-time systems where deadline guarantees override fairness considerations.'
    },

    'Round Robin': {
      categoryKey: 'CPU',
      name: 'Round Robin',
      fullName: 'Round Robin Scheduling (RR)',
      category: 'CPU Scheduling',
      description: 'Round Robin (RR) is a classic preemptive scheduling algorithm designed for time-sharing systems. Each process is allocated a fixed slice of CPU time called a Time Quantum (q) in a cyclic FIFO order.',
      howItWorks: 'Processes take turns on the CPU for up to one time quantum. If a process does not finish within its quantum, it is interrupted, moved to the tail of the ready queue, and the next process is dispatched.',
      steps: [
        'Initialize a circular FIFO queue of ready processes.',
        'Dispatch the head process and start a hardware timer set to the Time Quantum (q).',
        'If the process finishes within the quantum, remove it and calculate completion statistics.',
        'If the timer expires before the process finishes, preempt it and place it at the back of the ready queue.',
        'Repeat continually until all processes complete execution.'
      ],
      advantages: [
        'Inherently fair; starvation is impossible because every process gets a guaranteed CPU slice.',
        'Excellent response time for interactive GUI applications and terminal shells.',
        'Does not require prior knowledge of burst times.'
      ],
      disadvantages: [
        'High context switching overhead if the time quantum is chosen too small.',
        'Degrades to FCFS if the time quantum is larger than the longest burst time.',
        'Average turnaround time can be higher than SJF/SRTF.'
      ],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      realWorldUse: 'Standard time-sharing multi-user operating systems including Linux CFS base slices, Windows interactive desktop scheduling, and web servers.',
      whenToUse: 'General-purpose computing, desktop operating systems, and any environment where equitable response time is paramount.'
    },

    // -------------------------------------------------------------------------
    // Page Replacement
    // -------------------------------------------------------------------------
    FIFO: {
      categoryKey: 'Page',
      name: 'FIFO',
      fullName: 'First-In, First-Out Page Replacement',
      category: 'Page Replacement',
      description: 'FIFO is the simplest page replacement algorithm. The operating system maintains a queue of all pages in memory; when a page fault occurs and frames are full, the oldest page (the one loaded earliest) is evicted.',
      howItWorks: 'A FIFO queue tracks the residency order of resident frames. When a page must be replaced, the frame at the head of the queue is replaced, and the new page enters at the tail.',
      steps: [
        'On memory access, check if the requested page is already resident in any physical frame (Page Hit).',
        'If not resident (Page Fault), check if an empty frame is available.',
        'If frames are full, evict the page that entered physical memory earliest.',
        'Load the incoming page into the vacated frame and update the FIFO pointer/queue.'
      ],
      advantages: [
        'Extremely easy to understand and implement with low algorithmic overhead.',
        'Minimal hardware assistance required (standard FIFO queue or circular array).',
        'Deterministic replacement behavior.'
      ],
      disadvantages: [
        'Suffers from Belady\'s Anomaly: allocating more physical frames can actually cause more page faults.',
        'Ignores page usage frequency and recency; may repeatedly evict heavily accessed shared libraries.',
        'Poor hit ratio in real-world access patterns.'
      ],
      timeComplexity: 'O(1) per reference',
      spaceComplexity: 'O(f) where f = number of frames',
      realWorldUse: 'Basic memory managers in embedded systems with strict hardware constraints, secondary buffer caches.',
      whenToUse: 'When memory overhead for page bookkeeping must be strictly minimal and access patterns are strictly sequential.'
    },

    LRU: {
      categoryKey: 'Page',
      name: 'LRU',
      fullName: 'Least Recently Used Page Replacement',
      category: 'Page Replacement',
      description: 'LRU replaces the page that has not been referenced for the longest period of time. It exploits the principle of temporal locality: pages accessed recently are very likely to be accessed again soon.',
      howItWorks: 'The operating system monitors references using timestamps or stack manipulation. When eviction is necessary, the page with the oldest last-access timestamp is replaced.',
      steps: [
        'Check if the target page resides in the frame buffer (Hit).',
        'On a hit, update the page\'s recency record (move to most recent position or record timestamp).',
        'On a fault, if frames are filled, identify the page whose last reference is oldest.',
        'Evict that least recently used page and load the requested page in its place.'
      ],
      advantages: [
        'Does NOT suffer from Belady\'s Anomaly (belongs to the class of stack algorithms).',
        'Consistently delivers superior hit ratios matching real software locality characteristics.',
        'Widely considered the golden standard for practical cache replacement.'
      ],
      disadvantages: [
        'Requires specialized hardware support (counters or shift registers) to track access recency efficiently.',
        'Pure LRU software stack updates incur non-trivial overhead on every memory reference.',
        'Pathological performance on loop references that exceed frame capacity.'
      ],
      timeComplexity: 'O(1) with hash-map + doubly linked list',
      spaceComplexity: 'O(f) frames',
      realWorldUse: 'CPU L1/L2/L3 caches, database buffer pools (PostgreSQL/MySQL), browser memory caches, and OS virtual memory approximations (Clock algorithm).',
      whenToUse: 'Ideal for typical desktop and server workloads where temporal locality governs memory references.'
    },

    Optimal: {
      categoryKey: 'Page',
      name: 'Optimal',
      fullName: 'Belady\'s Optimal Page Replacement (OPT / MIN)',
      category: 'Page Replacement',
      description: 'The Optimal algorithm (also known as MIN or Belady\'s algorithm) replaces the page that will not be used for the longest duration of time in the future. It provides the theoretical upper bound on replacement efficiency.',
      howItWorks: 'When eviction is needed, the algorithm inspects future page references. It identifies which resident page has its next reference farthest into the future (or never again) and replaces it.',
      steps: [
        'Detect page hit if reference is in memory.',
        'On a page fault with full frames, look ahead along the entire remaining reference stream.',
        'For each frame in memory, compute the distance until its next future access.',
        'Select the page with the maximum future distance (or one never referenced again) for eviction.',
        'Replace that page with the requested page.'
      ],
      advantages: [
        'Provably guarantees the absolute lowest number of page faults for any fixed number of frames.',
        'Free from Belady\'s Anomaly.',
        'Serves as the universal benchmark to measure how close real-world heuristics come to theoretical perfection.'
      ],
      disadvantages: [
        'Impossible to implement in general-purpose operating systems because future references cannot be known in advance.',
        'High computational cost to scan ahead in simulation environments.'
      ],
      timeComplexity: 'O(f * r) where r = remaining reference string length',
      spaceComplexity: 'O(f) frames',
      realWorldUse: 'Benchmark comparisons in research papers, compiler optimization traces, and offline video/data prefetching where complete playback paths are known.',
      whenToUse: 'In offline analytical studies, post-mortem workload analysis, and deterministic media stream buffering.'
    },

    // -------------------------------------------------------------------------
    // Disk Scheduling
    // -------------------------------------------------------------------------
    'Disk-FCFS': {
      categoryKey: 'Disk',
      name: 'FCFS',
      fullName: 'First Come First Serve (Disk)',
      category: 'Disk Scheduling',
      description: 'Disk FCFS services I/O track requests strictly in the order they arrive in the disk request queue, regardless of current head position or mechanical seek distance.',
      howItWorks: 'The disk arm moves directly from its current track to the cylinder requested by the head item in the queue. Total head movement is the cumulative sum of absolute differences.',
      steps: [
        'Receive disk track read/write requests in queue order.',
        'Move the read/write head from current track to next requested track.',
        'Add absolute seek difference: |target - current| to total head movement.',
        'Repeat until all requests are serviced.'
      ],
      advantages: [
        'Complete fairness: every request is serviced in arrival order; zero starvation.',
        'Trivially easy to implement without queue sorting or repositioning logic.',
        'No computational overhead on the disk controller.'
      ],
      disadvantages: [
        'Produces excessive mechanical head swings across disk platters (wild seek patterns).',
        'Suboptimal total seek time and poor overall disk throughput.',
        'Severely degrades performance under heavy multi-threaded workloads.'
      ],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      realWorldUse: 'Simple embedded flash/SD drivers where physical seek penalties do not exist, and legacy low-throughput storage devices.',
      whenToUse: 'When I/O queue depths are very low (1-2 items) or when mechanical seek latency is absent.'
    },

    SSTF: {
      categoryKey: 'Disk',
      name: 'SSTF',
      fullName: 'Shortest Seek Time First',
      category: 'Disk Scheduling',
      description: 'Shortest Seek Time First selects the request that requires the least head movement from the current position, minimizing mechanical arm seek time for each consecutive step.',
      howItWorks: 'At each step, the disk controller inspects all pending cylinder requests and picks the one with minimum absolute distance |request - currentHead|.',
      steps: [
        'Examine all pending requests remaining in the queue.',
        'Calculate head seek distance for each: |cyl - currentHead|.',
        'Move the head to the closest requested cylinder.',
        'Update total head movement and set current head to the serviced track.',
        'Repeat until all queue items are fulfilled.'
      ],
      advantages: [
        'Substantially reduces total head movement compared to FCFS.',
        'Improves average response time and overall I/O throughput.',
        'Greedy approach is intuitive and efficient.'
      ],
      disadvantages: [
        'Prone to starvation: requests situated at extreme inner or outer tracks may wait indefinitely if local clusters keep arriving.',
        'High variance in response times makes guarantees difficult.',
        'Slightly higher computation per seek step.'
      ],
      timeComplexity: 'O(n²)',
      spaceComplexity: 'O(n)',
      realWorldUse: 'Used in early disk operating systems and localized disk defragmentation scheduling.',
      whenToUse: 'When reducing mechanical wear and seek latency is important and request bursts are short enough to prevent edge starvation.'
    },

    SCAN: {
      categoryKey: 'Disk',
      name: 'SCAN',
      fullName: 'SCAN (Elevator Algorithm)',
      category: 'Disk Scheduling',
      description: 'In the SCAN algorithm, the disk arm starts at one end and moves toward the opposite end, servicing requests as it reaches each cylinder until it hits the physical disk boundary, then reverses direction.',
      howItWorks: 'Behaves exactly like a building elevator: travels in a single direction servicing all pending calls along the way until reaching the bottom/top, then reverses direction and services requests on the return trip.',
      steps: [
        'Sort requests into cylinders.',
        'Determine current travel direction (e.g., towards higher cylinders).',
        'Service requests in ascending order until reaching the physical maximum cylinder (e.g. track 199).',
        'Reverse direction and service remaining requests in descending order.'
      ],
      advantages: [
        'Eliminates starvation: the disk arm sweeps across all cylinders periodically.',
        'Much lower variance in response time compared to SSTF.',
        'High throughput with smooth, unidirectional mechanical sweeping.'
      ],
      disadvantages: [
        'Longer wait for requests just behind the arm\'s current direction of travel.',
        'Unnecessary travel to the extreme edge cylinder (0 or diskSize-1) even if no requests reside there.',
        'Favors middle tracks over boundary tracks.'
      ],
      timeComplexity: 'O(n log n)',
      spaceComplexity: 'O(n)',
      realWorldUse: 'Traditional hard drive firmware (NCQ) and storage array controllers handling heavy mixed sequential/random traffic.',
      whenToUse: 'High-load hard disk environments requiring both high throughput and bounded wait times.'
    },

    'C-SCAN': {
      categoryKey: 'Disk',
      name: 'C-SCAN',
      fullName: 'Circular SCAN',
      category: 'Disk Scheduling',
      description: 'C-SCAN (Circular SCAN) is a variation of SCAN designed to provide a more uniform waiting time. The arm moves in one direction only, servicing requests until the end, then rapidly returns to the beginning without servicing requests on the return trip.',
      howItWorks: 'The disk arm treats cylinders as a circular list. It sweeps from lowest to highest servicing requests, and once it hits the outer boundary, jumps directly back to track 0 and begins sweeping upwards again.',
      steps: [
        'Move the head in a fixed forward direction (e.g., toward max cylinder).',
        'Service all requests encountered along the way.',
        'Upon reaching the disk limit, immediately seek to cylinder 0 without servicing requests during return.',
        'Resume servicing remaining requests in the same forward direction.'
      ],
      advantages: [
        'Provides significantly more uniform waiting times than standard SCAN.',
        'Does not unfairly favor center tracks over outer tracks.',
        'Predictable, consistent response cycle across the entire platter.'
      ],
      disadvantages: [
        'Incurs seek time during the full return stroke across the disk platter.',
        'Still moves all the way to disk boundaries regardless of request boundaries.'
      ],
      timeComplexity: 'O(n log n)',
      spaceComplexity: 'O(n)',
      realWorldUse: 'Enterprise database spindle storage where query response latency must be statistically consistent.',
      whenToUse: 'When uniform response time distribution across all cylinder ranges is mandatory under heavy load.'
    },

    LOOK: {
      categoryKey: 'Disk',
      name: 'LOOK',
      fullName: 'LOOK Disk Scheduling',
      category: 'Disk Scheduling',
      description: 'LOOK is an optimization of the SCAN algorithm. Instead of travelling all the way to the physical boundary (0 or diskSize-1), the disk arm travels only as far as the final request in each direction before reversing.',
      howItWorks: 'The arm looks ahead in the current direction. If no further requests exist ahead, it immediately reverses direction without continuing to the edge of the physical platter.',
      steps: [
        'Sort requests and inspect the highest and lowest cylinder numbers in the queue.',
        'Sweep in current direction servicing requests up to the extreme request in that direction.',
        'Reverse direction immediately without seeking all the way to track 0 or diskSize - 1.',
        'Service remaining requests in reverse direction.'
      ],
      advantages: [
        'Prevents wasted mechanical movement to empty disk boundaries.',
        'Lower total seek time than SCAN.',
        'Maintains SCAN\'s resistance to starvation.'
      ],
      disadvantages: [
        'Slightly more complex controller logic to inspect the queue extrema.',
        'Requests behind the current head direction still experience a round-trip wait.'
      ],
      timeComplexity: 'O(n log n)',
      spaceComplexity: 'O(n)',
      realWorldUse: 'Standard hard disk drive microcode (Western Digital, Seagate Native Command Queuing implementations).',
      whenToUse: 'Preferred default over SCAN for almost all mechanical magnetic storage applications.'
    },

    'C-LOOK': {
      categoryKey: 'Disk',
      name: 'C-LOOK',
      fullName: 'Circular LOOK',
      category: 'Disk Scheduling',
      description: 'C-LOOK combines the unidirectional consistency of C-SCAN with the boundary optimization of LOOK. The arm sweeps only as far as the last request in the forward direction, then returns directly to the lowest requested cylinder.',
      howItWorks: 'Services requests exclusively in one direction up to the highest pending request. It then resets the arm directly to the lowest pending request and resumes forward servicing.',
      steps: [
        'Identify min and max request cylinders in the current queue.',
        'Sweep forward, servicing requests up to the highest requested cylinder.',
        'Jump directly back to the lowest requested cylinder without going to cylinder 0.',
        'Resume servicing remaining requests in the forward direction.'
      ],
      advantages: [
        'Eliminates wasted travel to empty platter edges.',
        'Provides uniform waiting time like C-SCAN with lower total seek movement than both SCAN and C-SCAN.',
        'Highly efficient for high-density I/O traffic.'
      ],
      disadvantages: [
        'Requires continuous evaluation of minimum and maximum queued cylinder positions.',
        'Return seek stroke still expends movement without servicing requests.'
      ],
      timeComplexity: 'O(n log n)',
      spaceComplexity: 'O(n)',
      realWorldUse: 'Modern SAN / NAS array storage schedulers and Linux I/O elevators (Deadline and BFQ schedulers).',
      whenToUse: 'Optimal for multi-tenant server workloads on magnetic media requiring consistent latency and high throughput.'
    },

    // -------------------------------------------------------------------------
    // Memory Allocation
    // -------------------------------------------------------------------------
    'First Fit': {
      categoryKey: 'Memory',
      name: 'First Fit',
      fullName: 'First Fit Memory Allocation',
      category: 'Memory Allocation',
      description: 'First Fit allocates the first available free memory block from the beginning of memory that is large enough to satisfy the process\'s size requirement.',
      howItWorks: 'The memory manager scans memory blocks starting from the very first partition. As soon as it encounters an unallocated block with size >= process size, it places the process in that block.',
      steps: [
        'Start scan at block 0.',
        'Check if the current block is free and its capacity >= process size.',
        'If yes, allocate the process to this block and record internal fragmentation.',
        'If no, move to the next block and repeat until a fit is found or all blocks are exhausted.'
      ],
      advantages: [
        'Fastest search speed among allocation strategies; halts on the first valid block.',
        'Simple logic with low allocator runtime overhead.',
        'Generally produces lower overall external fragmentation than Worst Fit.'
      ],
      disadvantages: [
        'Tends to cluster small fragmented partitions near the beginning of physical memory.',
        'Later allocations must search through numerous small unusable fragments before finding a fit.',
        'Causes internal fragmentation in fixed-partition setups.'
      ],
      timeComplexity: 'O(n) worst case, very fast average case',
      spaceComplexity: 'O(1) auxiliary',
      realWorldUse: 'Kernel heap allocators, basic embedded OS memory pool managers (RTOS), and initial partition allocators.',
      whenToUse: 'When allocation speed and low processor overhead are higher priorities than partition compaction.'
    },

    'Best Fit': {
      categoryKey: 'Memory',
      name: 'Best Fit',
      fullName: 'Best Fit Memory Allocation',
      category: 'Memory Allocation',
      description: 'Best Fit searches the entire list of free blocks and allocates the smallest available partition that is large enough to accommodate the process, minimizing leftover unused space in that block.',
      howItWorks: 'The allocator examines every free partition in memory, computing (blockSize - processSize). It selects the block with the minimum non-negative difference.',
      steps: [
        'Search the entire list of available free memory blocks.',
        'Filter for blocks where blockSize >= processSize.',
        'Identify the block among these with the minimum capacity.',
        'Allocate the process into this optimal block, leaving the smallest possible internal fragmentation.'
      ],
      advantages: [
        'Minimizes internal fragmentation within the chosen individual block.',
        'Preserves larger free blocks for subsequent large process requests.',
        'Memory utilization can be high when requests closely match partition sizes.'
      ],
      disadvantages: [
        'Slower allocation speed because the entire block list must be scanned unless indexed in balanced search trees.',
        'Creates tiny, unusable leftover fragments scattered throughout memory (external fragmentation in dynamic systems).',
        'Fragments created are often too minuscule for any practical subsequent allocation.'
      ],
      timeComplexity: 'O(n) sequential scan (or O(log n) with AVL/red-black trees)',
      spaceComplexity: 'O(1) auxiliary',
      realWorldUse: 'Standard C library heap allocators (dlmalloc / ptmalloc) utilizing segregated free lists organized by size.',
      whenToUse: 'When available block sizes vary widely and preserving massive blocks for rare, huge jobs is vital.'
    },

    'Worst Fit': {
      categoryKey: 'Memory',
      name: 'Worst Fit',
      fullName: 'Worst Fit Memory Allocation',
      category: 'Memory Allocation',
      description: 'Worst Fit allocates the largest available free memory block to the process. The design rationale is that allocating from the largest block will leave behind a remainder partition large enough to remain useful.',
      howItWorks: 'The allocator scans all free memory blocks and chooses the one with the maximum available capacity that satisfies the process requirement.',
      steps: [
        'Scan the full set of free memory blocks.',
        'Identify the block possessing the largest total capacity.',
        'Check if this largest block is >= requested process size.',
        'If yes, allocate the process to this block; if not, declare allocation failure.'
      ],
      advantages: [
        'Leftover remainder space in the allocated block is maximized, increasing the chance it can accommodate another process.',
        'Reduces the emergence of tiny unusable memory slivers characteristic of Best Fit.'
      ],
      disadvantages: [
        'Quickly destroys large contiguous memory blocks needed by subsequent large processes.',
        'Must search through the entire block list on every allocation.',
        'Empirical studies demonstrate it performs worse in overall memory utilization than First Fit and Best Fit.'
      ],
      timeComplexity: 'O(n) full scan (or O(log n) using max-heaps)',
      spaceComplexity: 'O(1) auxiliary',
      realWorldUse: 'Theoretical academic comparisons and specialized memory pools where processes share relatively uniform, medium size footprints.',
      whenToUse: 'Only when workload consists of mostly medium-sized processes and fragmentation into tiny holes must be actively avoided.'
    },

    'Next Fit': {
      categoryKey: 'Memory',
      name: 'Next Fit',
      fullName: 'Next Fit Memory Allocation',
      category: 'Memory Allocation',
      description: 'Next Fit is a modified version of First Fit that begins searching for a free block starting from the location where the previous allocation occurred, rather than restarting from the beginning of memory.',
      howItWorks: 'Maintains a roving pointer to the last allocated partition. Subsequent allocations search sequentially forward from that point in a circular ring, wrapping back to the beginning if necessary.',
      steps: [
        'Resume search from the block index of the last successful allocation.',
        'Check each subsequent block in circular order for sufficient free space.',
        'Allocate into the first block found that fits the process.',
        'Update the pointer position for the next allocation request.'
      ],
      advantages: [
        'Evenly distributes allocations across physical memory space rather than concentrating at the beginning.',
        'Often faster than First Fit on later allocations because it skips over earlier, already-occupied blocks.',
        'Very simple circular pointer logic.'
      ],
      disadvantages: [
        'Breaks up large blocks situated near the end of memory that First Fit would have left untouched.',
        'Can lead to higher overall fragmentation than First Fit in long-running systems.',
        'Does not perform as well as First Fit under varied process size workloads.'
      ],
      timeComplexity: 'O(n) worst case, fast average search',
      spaceComplexity: 'O(1) auxiliary',
      realWorldUse: 'Ring-buffer allocators, high-speed packet buffer pool allocators in network interface controllers (NICs).',
      whenToUse: 'When allocations and deallocations occur in quick succession and scanning through early memory addresses wastes CPU cycles.'
    }
  };

  const CATEGORIES = [
    { key: 'CPU', label: 'CPU Scheduling', icon: '⚡' },
    { key: 'Page', label: 'Page Replacement', icon: '📄' },
    { key: 'Disk', label: 'Disk Scheduling', icon: '💽' },
    { key: 'Memory', label: 'Memory Allocation', icon: '🧩' }
  ];

  window.LearnSection = function LearnSection(props) {
    const [selectedCategory, setSelectedCategory] = useState('CPU');
    const [selectedAlgorithm, setSelectedAlgorithm] = useState('FCFS');

    // Filter algorithm keys belonging to active category
    const algorithmsInCategory = useMemo(() => {
      return Object.keys(ALGORITHM_KNOWLEDGE).filter(
        key => ALGORITHM_KNOWLEDGE[key].categoryKey === selectedCategory
      );
    }, [selectedCategory]);

    // Ensure selectedAlgorithm belongs to current category when category changes
    const handleCategorySelect = (catKey) => {
      setSelectedCategory(catKey);
      const firstInCat = Object.keys(ALGORITHM_KNOWLEDGE).find(
        k => ALGORITHM_KNOWLEDGE[k].categoryKey === catKey
      );
      if (firstInCat) {
        setSelectedAlgorithm(firstInCat);
      }
    };

    const currentAlgo = ALGORITHM_KNOWLEDGE[selectedAlgorithm] || ALGORITHM_KNOWLEDGE['FCFS'];

    return (
      <div className="page" style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div className="page-header" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Operating Systems Knowledge Reference
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Deep-dive theoretical guide, mechanics, complexity trade-offs, and industrial use cases for core OS algorithms.
            </p>
          </div>
        </div>

        {/* Category Selector Tabs */}
        <div className="tab-list" style={{ marginBottom: '1.5rem' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              type="button"
              className={`tab ${selectedCategory === cat.key ? 'active' : ''}`}
              onClick={() => handleCategorySelect(cat.key)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Main Content: Left Nav + Right Explanation */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 300px) 1fr',
            gap: '1.5rem',
            alignItems: 'start'
          }}
        >
          {/* Left Panel: Algorithm Selector */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header">
              <h3>
                <span>Algorithms</span>
              </h3>
              <span className="badge blue">
                {algorithmsInCategory.length} Available
              </span>
            </div>
            <div className="card-body" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {algorithmsInCategory.map(key => {
                const item = ALGORITHM_KNOWLEDGE[key];
                const isSelected = selectedAlgorithm === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedAlgorithm(key)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'transparent'}`,
                      backgroundColor: isSelected ? 'rgba(79, 142, 247, 0.15)' : 'transparent',
                      color: isSelected ? 'var(--accent-blue)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: isSelected ? '#ffffff' : 'inherit' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {item.fullName}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Comprehensive Algorithm Explanation */}
          <div className="card" style={{ marginBottom: 0 }}>
            {/* Header / Badges */}
            <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                    {currentAlgo.name}
                  </h3>
                  <span className="badge blue">{currentAlgo.category}</span>
                </div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {currentAlgo.fullName}
                </div>
              </div>

              {/* Complexity Badges */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge purple" title="Time Complexity">
                  Time: {currentAlgo.timeComplexity}
                </span>
                <span className="badge orange" title="Space Complexity">
                  Space: {currentAlgo.spaceComplexity}
                </span>
              </div>
            </div>

            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {/* Description */}
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Overview
                </h4>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                  {currentAlgo.description}
                </p>
              </div>

              {/* How it Works & Numbered Steps */}
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  How It Works
                </h4>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem', marginBottom: '1rem' }}>
                  {currentAlgo.howItWorks}
                </p>

                <div
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    padding: '1.25rem'
                  }}
                >
                  <ol style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {currentAlgo.steps.map((step, idx) => (
                      <li key={idx} style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Advantages & Disadvantages Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {/* Advantages */}
                <div
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: 'var(--radius)',
                    padding: '1.25rem'
                  }}
                >
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span>✓</span> Advantages
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {currentAlgo.advantages.map((adv, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>✓</span>
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Disadvantages */}
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: 'var(--radius)',
                    padding: '1.25rem'
                  }}
                >
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span>✕</span> Disadvantages
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {currentAlgo.disadvantages.map((dis, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        <span style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>✕</span>
                        <span>{dis}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Real World Use Case */}
              <div
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '1.25rem'
                }}
              >
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🌐</span> Real-World Application
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                  {currentAlgo.realWorldUse}
                </p>
              </div>

              {/* When To Use Tip Box */}
              <div
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  borderLeft: '4px solid var(--accent-orange)',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                  padding: '1rem 1.25rem'
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--accent-orange)', marginBottom: '0.25rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>💡</span> When To Use
                </div>
                <div style={{ color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  {currentAlgo.whenToUse}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
})();


// ----------------------------------------------------
// FILE: js\components\Dashboard.js
// ----------------------------------------------------
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
      icon: '🖥️',
      badge: '6 Algorithms',
      description: 'Visualize FCFS, SJF, SRTF, Priority & Round Robin scheduling algorithms with interactive Gantt charts.',
      color: '#4f8ef7'
    },
    {
      id: 'page',
      title: 'Page Replacement',
      icon: '📄',
      badge: '3 Algorithms',
      description: 'Simulate FIFO, LRU & Optimal page replacement with real-time frame tables and hit/miss tracking.',
      color: '#10b981'
    },
    {
      id: 'disk',
      title: 'Disk Scheduling',
      icon: '💿',
      badge: '6 Algorithms',
      description: 'Animate FCFS, SSTF, SCAN, C-SCAN, LOOK & C-LOOK cylinder head movements with seek count calculation.',
      color: '#f59e0b'
    },
    {
      id: 'memory',
      title: 'Memory Allocation',
      icon: '🧩',
      badge: '4 Algorithms',
      description: 'Visualize First Fit, Best Fit, Worst Fit & Next Fit contiguous memory partition allocation and fragmentation.',
      color: '#8b5cf6'
    },
    {
      id: 'compare',
      title: 'Comparison Hub',
      icon: '⚖️',
      badge: 'Multi-Compare',
      description: 'Run multiple algorithms side-by-side with identical inputs to contrast throughput, waiting times, and overhead.',
      color: '#ec4899'
    },
    {
      id: 'learn',
      title: 'Study & Concepts',
      icon: '📚',
      badge: 'Study Guide',
      description: 'In-depth conceptual explanations, formulas, time/space complexity analysis, and real-world OS case studies.',
      color: '#06b6d4'
    }
  ];

  const statBadges = [
    { label: '6 CPU Algorithms', icon: '⚡' },
    { label: '3 Page Replacement', icon: '📄' },
    { label: '6 Disk Algorithms', icon: '💿' },
    { label: '4 Memory Algorithms', icon: '🧩' }
  ];

  const features = [
    {
      icon: '🎬',
      title: 'Step-by-Step Animation',
      desc: 'Watch algorithms execute one discrete step at a time with adjustable playback speed and frame stepping.'
    },
    {
      icon: '📊',
      title: 'Detailed Statistics',
      desc: 'Instant calculation of turnaround time, waiting time, page fault rates, total head movement, and memory utilization.'
    },
    {
      icon: '💡',
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
          <span>🎓</span> Algorithm Visualization Platform
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
              <span>{badge.icon}</span>
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
                    fontSize: '2rem',
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px'
                  }}>
                    {mod.icon}
                  </div>
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
                Explore →
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
              <span style={{ fontSize: '2rem', marginBottom: '12px' }}>{feat.icon}</span>
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
          ⚡ Quick Start Guide
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


// ----------------------------------------------------
// FILE: js\components\CPUScheduling.js
// ----------------------------------------------------
'use strict';

// CPU Scheduling Component
// Expose as window.CPUScheduling

window.CPUScheduling = function CPUScheduling(props) {
  const [selectedAlgorithm, setSelectedAlgorithm] = React.useState('FCFS');
  const [processes, setProcesses] = React.useState(
    window.getSampleCPUProcesses ? window.getSampleCPUProcesses() : [
      { id: 'P1', arrivalTime: 0, burstTime: 5, priority: 3 },
      { id: 'P2', arrivalTime: 1, burstTime: 3, priority: 1 },
      { id: 'P3', arrivalTime: 2, burstTime: 8, priority: 4 },
      { id: 'P4', arrivalTime: 3, burstTime: 6, priority: 2 },
      { id: 'P5', arrivalTime: 4, burstTime: 4, priority: 5 }
    ]
  );
  const [timeQuantum, setTimeQuantum] = React.useState(2);
  const [simulationResult, setSimulationResult] = React.useState(null);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState(1);
  const [errors, setErrors] = React.useState([]);
  const [activeTab, setActiveTab] = React.useState('simulation'); // 'simulation' | 'results' | 'learn'

  const algorithms = [
    { key: 'FCFS', label: 'FCFS', fullName: 'First-Come, First-Served' },
    { key: 'SJF', label: 'SJF', fullName: 'Shortest Job First (Non-Preemptive)' },
    { key: 'SRTF', label: 'SRTF', fullName: 'Shortest Remaining Time First (Preemptive SJF)' },
    { key: 'PriorityNP', label: 'Priority (NP)', fullName: 'Priority Scheduling (Non-Preemptive)' },
    { key: 'PriorityP', label: 'Priority (P)', fullName: 'Priority Scheduling (Preemptive)' },
    { key: 'RoundRobin', label: 'Round Robin', fullName: 'Round Robin (Time Sharing)' }
  ];

  const algorithmDetails = {
    FCFS: {
      title: 'First-Come, First-Served (FCFS)',
      desc: 'Processes are executed in the order they arrive. No preemption.',
      type: 'Non-Preemptive',
      complexity: 'O(n log n) sorting or O(n) queue traversal',
      pros: 'Simple to understand and implement; fair queue order with no starvation.',
      cons: 'Suffers from the Convoy Effect (short processes waiting behind long ones), leading to high average waiting time.'
    },
    SJF: {
      title: 'Shortest Job First (SJF)',
      desc: 'The process with the shortest burst time is selected next. Non-preemptive.',
      type: 'Non-Preemptive',
      complexity: 'O(n log n)',
      pros: 'Minimizes average waiting time among non-preemptive scheduling algorithms.',
      cons: 'Requires knowing future burst times; potential starvation for processes with long burst times.'
    },
    SRTF: {
      title: 'Shortest Remaining Time First (SRTF)',
      desc: 'Preemptive version of SJF. The process with the shortest remaining time runs.',
      type: 'Preemptive',
      complexity: 'O(n log n)',
      pros: 'Optimal average turnaround and waiting time for preemptive systems.',
      cons: 'Frequent context switches overhead; longer jobs may experience starvation under heavy loads.'
    },
    PriorityNP: {
      title: 'Priority Scheduling (Non-Preemptive)',
      desc: 'Process with highest priority (lowest number) runs next. Non-preemptive.',
      type: 'Non-Preemptive',
      complexity: 'O(n log n)',
      pros: 'Accommodates important tasks first; suitable for systems with critical tasks.',
      cons: 'Low-priority processes can starve indefinitely unless aging mechanisms are implemented.'
    },
    PriorityP: {
      title: 'Priority Scheduling (Preemptive)',
      desc: 'Preemptive version. Higher priority process can preempt current process.',
      type: 'Preemptive',
      complexity: 'O(n log n)',
      pros: 'Ensures urgent tasks get the CPU immediately upon arrival without delay.',
      cons: 'Starvation risk for lower priorities and increased overhead due to preemptive context switching.'
    },
    RoundRobin: {
      title: 'Round Robin (RR)',
      desc: 'Each process gets a fixed time quantum. Cyclic, fair scheduling.',
      type: 'Preemptive',
      complexity: 'O(n)',
      pros: 'Fair CPU allocation, prevents starvation, well-suited for interactive multi-user timesharing.',
      cons: 'Performance is sensitive to quantum size; too small causes context switch overhead, too large degrades to FCFS.'
    }
  };

  const isPriorityAlgorithm = selectedAlgorithm === 'PriorityNP' || selectedAlgorithm === 'PriorityP';
  const isRoundRobin = selectedAlgorithm === 'RoundRobin';

  // Animation effect
  React.useEffect(() => {
    if (!isPlaying || !simulationResult || !simulationResult.steps) return;
    const delay = Math.max(100, 1000 / speed);
    const timer = setInterval(() => {
      setCurrentStep(s => {
        if (s >= simulationResult.steps.length - 1) {
          setIsPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, delay);
    return () => clearInterval(timer);
  }, [isPlaying, speed, simulationResult]);

  // Handle process field changes
  const handleProcessChange = (index, field, value) => {
    setProcesses(prev => {
      const next = [...prev];
      let val = value;
      if (field === 'arrivalTime' || field === 'burstTime' || field === 'priority') {
        val = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0);
      }
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const addProcess = () => {
    setProcesses(prev => {
      const newIndex = prev.length + 1;
      return [
        ...prev,
        {
          id: `P${newIndex}`,
          arrivalTime: 0,
          burstTime: 4,
          priority: 1
        }
      ];
    });
  };

  const removeProcess = (index) => {
    setProcesses(prev => prev.filter((_, idx) => idx !== index));
  };

  const loadExample = () => {
    if (window.getSampleCPUProcesses) {
      setProcesses(window.getSampleCPUProcesses());
    } else {
      setProcesses([
        { id: 'P1', arrivalTime: 0, burstTime: 5, priority: 3 },
        { id: 'P2', arrivalTime: 1, burstTime: 3, priority: 1 },
        { id: 'P3', arrivalTime: 2, burstTime: 8, priority: 4 },
        { id: 'P4', arrivalTime: 3, burstTime: 6, priority: 2 },
        { id: 'P5', arrivalTime: 4, burstTime: 4, priority: 5 }
      ]);
    }
    setErrors([]);
  };

  const generateRandom = () => {
    if (window.getRandomCPUProcesses) {
      setProcesses(window.getRandomCPUProcesses(4));
    } else {
      const count = 4;
      const arr = [];
      for (let i = 0; i < count; i++) {
        arr.push({
          id: `P${i + 1}`,
          arrivalTime: Math.floor(Math.random() * 5),
          burstTime: Math.floor(Math.random() * 8) + 1,
          priority: Math.floor(Math.random() * 5) + 1
        });
      }
      setProcesses(arr);
    }
    setErrors([]);
  };

  const clearAll = () => {
    setProcesses([]);
    setSimulationResult(null);
    setCurrentStep(0);
    setIsPlaying(false);
    setErrors([]);
  };

  // Run simulation
  const runSimulation = () => {
    const errs = window.validateCPUProcesses ? window.validateCPUProcesses(processes) : [];
    if (isRoundRobin && (isNaN(timeQuantum) || timeQuantum <= 0)) {
      errs.push('Time Quantum must be a positive integer (> 0).');
    }
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setErrors([]);

    let result = null;
    switch (selectedAlgorithm) {
      case 'FCFS':
        result = window.runFCFS ? window.runFCFS(processes) : null;
        break;
      case 'SJF':
        result = window.runSJF ? window.runSJF(processes) : null;
        break;
      case 'SRTF':
        result = window.runSRTF ? window.runSRTF(processes) : null;
        break;
      case 'PriorityNP':
        result = window.runPriorityNP ? window.runPriorityNP(processes) : null;
        break;
      case 'PriorityP':
        result = window.runPriorityP ? window.runPriorityP(processes) : null;
        break;
      case 'RoundRobin':
        result = window.runRoundRobin ? window.runRoundRobin(processes, Number(timeQuantum)) : null;
        break;
      default:
        result = window.runFCFS ? window.runFCFS(processes) : null;
    }

    if (!result) {
      setErrors(['Simulation failed to produce results. Please check engine scripts.']);
      return;
    }

    setSimulationResult(result);
    setCurrentStep(0);
    setIsPlaying(false);
    setActiveTab('simulation');
  };

  const currentStepData = simulationResult && simulationResult.steps ? simulationResult.steps[currentStep] : null;
  const currentTime = currentStepData ? currentStepData.time : 0;
  const totalSimTime = simulationResult && simulationResult.ganttChart && simulationResult.ganttChart.length > 0
    ? simulationResult.ganttChart[simulationResult.ganttChart.length - 1].end
    : 0;

  return (
    <div className="cpu-scheduling-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2>CPU Scheduling Visualizer</h2>
          <p>Configure process parameters, inspect step-by-step dispatching, and compare scheduling metrics.</p>
        </div>
      </div>

      {/* Algorithm Selector Tabs */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body" style={{ padding: '1rem 1.25rem' }}>
          <div className="tab-list" style={{ marginBottom: 0, borderBottom: 'none', gap: '0.5rem', flexWrap: 'wrap' }}>
            {algorithms.map((algo) => (
              <button
                key={algo.key}
                type="button"
                className={`tab ${selectedAlgorithm === algo.key ? 'active' : ''}`}
                onClick={() => {
                  setSelectedAlgorithm(algo.key);
                  setSimulationResult(null);
                  setCurrentStep(0);
                  setIsPlaying(false);
                }}
                style={{
                  background: selectedAlgorithm === algo.key ? 'rgba(79, 142, 247, 0.15)' : 'transparent',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: selectedAlgorithm === algo.key ? 'var(--accent-blue)' : 'transparent',
                  padding: '0.5rem 1rem'
                }}
              >
                {algo.label}
              </button>
            ))}
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <strong>{algorithmDetails[selectedAlgorithm].title}:</strong> {algorithmDetails[selectedAlgorithm].desc}
          </div>
        </div>
      </div>

      {/* Input Configuration Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3>
            <span>⚙️</span> Process Configuration
          </h3>
          {isRoundRobin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label htmlFor="time-quantum-input" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Time Quantum:
              </label>
              <input
                id="time-quantum-input"
                type="number"
                min="1"
                className="form-input"
                style={{ width: '80px', padding: '0.35rem 0.6rem', textAlign: 'center' }}
                value={timeQuantum}
                onChange={(e) => setTimeQuantum(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
            </div>
          )}
        </div>

        <div className="card-body">
          {/* Validation Errors */}
          {errors.length > 0 && (
            <div className="alert alert-error" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
              <strong>Please correct the following:</strong>
              <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                {errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Processes Table */}
          <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
            <table className="process-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Color</th>
                  <th>Process ID</th>
                  <th>Arrival Time</th>
                  <th>Burst Time</th>
                  {isPriorityAlgorithm && <th>Priority (Lower = Higher)</th>}
                  <th style={{ width: '80px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {processes.length === 0 ? (
                  <tr>
                    <td colSpan={isPriorityAlgorithm ? 6 : 5} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      No processes added. Click &quot;Add Process&quot; or &quot;Load Example&quot; to begin.
                    </td>
                  </tr>
                ) : (
                  processes.map((proc, index) => {
                    const color = window.getProcessColor ? window.getProcessColor(proc.id, index) : '#4f8ef7';
                    return (
                      <tr key={`p-${index}`}>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              width: '18px',
                              height: '18px',
                              borderRadius: '4px',
                              backgroundColor: color,
                              border: '1px solid rgba(255,255,255,0.2)'
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={proc.id}
                            onChange={(e) => handleProcessChange(index, 'id', e.target.value)}
                            placeholder="P1"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={proc.arrivalTime}
                            onChange={(e) => handleProcessChange(index, 'arrivalTime', e.target.value)}
                            placeholder="0"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            value={proc.burstTime}
                            onChange={(e) => handleProcessChange(index, 'burstTime', e.target.value)}
                            placeholder="1"
                          />
                        </td>
                        {isPriorityAlgorithm && (
                          <td>
                            <input
                              type="number"
                              min="0"
                              value={proc.priority != null ? proc.priority : 1}
                              onChange={(e) => handleProcessChange(index, 'priority', e.target.value)}
                              placeholder="1"
                            />
                          </td>
                        )}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => removeProcess(index)}
                            title="Delete Process"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div className="btn-group">
              <button type="button" className="btn btn-secondary btn-sm" onClick={addProcess}>
                + Add Process
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={loadExample}>
                📄 Load Example
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={generateRandom}>
                🎲 Random Input
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={clearAll}>
                🗑 Clear All
              </button>
            </div>

            <button type="button" className="btn btn-primary btn-lg" onClick={runSimulation}>
              ▶ Run Simulation
            </button>
          </div>
        </div>
      </div>

      {/* Simulation / Results / Learn Tabs Section */}
      {simulationResult && (
        <div className="tabs" style={{ marginTop: '2rem' }}>
          <div className="tab-list">
            <button
              type="button"
              className={`tab ${activeTab === 'simulation' ? 'active' : ''}`}
              onClick={() => setActiveTab('simulation')}
            >
              📊 Simulation
            </button>
            <button
              type="button"
              className={`tab ${activeTab === 'results' ? 'active' : ''}`}
              onClick={() => setActiveTab('results')}
            >
              📋 Results & Metrics
            </button>
            <button
              type="button"
              className={`tab ${activeTab === 'learn' ? 'active' : ''}`}
              onClick={() => setActiveTab('learn')}
            >
              📖 Learn Algorithm
            </button>
          </div>

          {/* Tab 1: Simulation View */}
          {activeTab === 'simulation' && (
            <div className="tab-panel">
              {/* Gantt Chart Card */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header">
                  <h3>
                    <span>📈</span> Gantt Chart Timeline
                  </h3>
                  <span className="badge blue">
                    Total Time: {totalSimTime} units
                  </span>
                </div>
                <div className="card-body">
                  {window.GanttChart ? (
                    <window.GanttChart
                      ganttChart={simulationResult.ganttChart}
                      currentStep={currentTime}
                      totalTime={totalSimTime}
                      processes={simulationResult.processes || processes}
                    />
                  ) : (
                    <p className="text-muted">GanttChart component not loaded.</p>
                  )}
                </div>
              </div>

              {/* Simulation Playback Controls */}
              {window.SimulationControls ? (
                <window.SimulationControls
                  currentStep={currentStep}
                  totalSteps={simulationResult.steps ? simulationResult.steps.length : 1}
                  isPlaying={isPlaying}
                  speed={speed}
                  onPlay={() => {
                    if (simulationResult.steps && currentStep >= simulationResult.steps.length - 1) {
                      setCurrentStep(0);
                    }
                    setIsPlaying(true);
                  }}
                  onPause={() => setIsPlaying(false)}
                  onNext={() => {
                    if (simulationResult.steps && currentStep < simulationResult.steps.length - 1) {
                      setCurrentStep(s => s + 1);
                    }
                  }}
                  onPrev={() => {
                    if (currentStep > 0) {
                      setCurrentStep(s => s - 1);
                    }
                  }}
                  onReset={() => {
                    setIsPlaying(false);
                    setCurrentStep(0);
                  }}
                  onSpeedChange={(newSpeed) => setSpeed(newSpeed)}
                  onStepChange={(step) => {
                    setIsPlaying(false);
                    setCurrentStep(step);
                  }}
                />
              ) : null}

              {/* Step By Step Detail Panel */}
              {window.StepPanel && currentStepData ? (
                <window.StepPanel
                  step={currentStepData}
                  algorithm={algorithmDetails[selectedAlgorithm].title}
                />
              ) : null}
            </div>
          )}

          {/* Tab 2: Results View */}
          {activeTab === 'results' && (
            <div className="tab-panel">
              {/* Statistics Cards */}
              {simulationResult.statistics && (
                <div className="metrics-grid">
                  <div className="metric-card blue">
                    <div className="metric-value">
                      {window.formatTime ? window.formatTime(simulationResult.statistics.avgWaitingTime) : simulationResult.statistics.avgWaitingTime}
                    </div>
                    <div className="metric-label">Avg Waiting Time</div>
                  </div>
                  <div className="metric-card green">
                    <div className="metric-value">
                      {window.formatTime ? window.formatTime(simulationResult.statistics.avgTurnaroundTime) : simulationResult.statistics.avgTurnaroundTime}
                    </div>
                    <div className="metric-label">Avg Turnaround Time</div>
                  </div>
                  <div className="metric-card orange">
                    <div className="metric-value">
                      {window.formatTime ? window.formatTime(simulationResult.statistics.avgResponseTime) : simulationResult.statistics.avgResponseTime}
                    </div>
                    <div className="metric-label">Avg Response Time</div>
                  </div>
                  <div className="metric-card purple">
                    <div className="metric-value">
                      {simulationResult.statistics.cpuUtilization != null
                        ? `${Number(simulationResult.statistics.cpuUtilization).toFixed(1)}%`
                        : '100%'}
                    </div>
                    <div className="metric-label">CPU Utilization</div>
                  </div>
                  <div className="metric-card cyan">
                    <div className="metric-value">
                      {window.formatTime ? window.formatTime(simulationResult.statistics.throughput) : simulationResult.statistics.throughput}
                    </div>
                    <div className="metric-label">Throughput (proc/unit)</div>
                  </div>
                </div>
              )}

              {/* Process Performance Summary Table */}
              <div className="card">
                <div className="card-header">
                  <h3>
                    <span>📊</span> Process Performance Breakdown
                  </h3>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="results-table">
                      <thead>
                        <tr>
                          <th>Process</th>
                          <th>Arrival (AT)</th>
                          <th>Burst (BT)</th>
                          {isPriorityAlgorithm && <th>Priority</th>}
                          <th>Start Time</th>
                          <th>Completion (CT)</th>
                          <th>Turnaround (TAT)</th>
                          <th>Waiting (WT)</th>
                          <th>Response (RT)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(simulationResult.processes || []).map((proc, idx) => {
                          const color = window.getProcessColor ? window.getProcessColor(proc.id, idx) : '#4f8ef7';
                          return (
                            <tr key={proc.id || idx}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                                  <span
                                    style={{
                                      width: '12px',
                                      height: '12px',
                                      borderRadius: '3px',
                                      backgroundColor: color
                                    }}
                                  />
                                  <span>{proc.id}</span>
                                </div>
                              </td>
                              <td>{proc.arrivalTime}</td>
                              <td>{proc.burstTime}</td>
                              {isPriorityAlgorithm && <td>{proc.priority != null ? proc.priority : '-'}</td>}
                              <td>{proc.startTime != null ? proc.startTime : '-'}</td>
                              <td>{proc.completionTime}</td>
                              <td><strong>{proc.turnaroundTime}</strong></td>
                              <td><strong>{proc.waitingTime}</strong></td>
                              <td>{proc.responseTime != null ? proc.responseTime : '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card-footer" style={{ justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>TAT = Completion Time − Arrival Time</span>
                  <span>WT = Turnaround Time − Burst Time</span>
                  <span>RT = First Run Time − Arrival Time</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Learn View */}
          {activeTab === 'learn' && (
            <div className="tab-panel">
              <div className="card">
                <div className="card-header">
                  <h3>
                    <span>📖</span> {algorithmDetails[selectedAlgorithm].title}
                  </h3>
                  <span className={`badge ${algorithmDetails[selectedAlgorithm].type === 'Preemptive' ? 'orange' : 'blue'}`}>
                    {algorithmDetails[selectedAlgorithm].type}
                  </span>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1rem' }}>Overview</h4>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {algorithmDetails[selectedAlgorithm].desc}
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <h5 style={{ color: 'var(--accent-green)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>✓</span> Advantages
                      </h5>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                        {algorithmDetails[selectedAlgorithm].pros}
                      </p>
                    </div>

                    <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <h5 style={{ color: 'var(--accent-red)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>⚠</span> Disadvantages & Overhead
                      </h5>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                        {algorithmDetails[selectedAlgorithm].cons}
                      </p>
                    </div>
                  </div>

                  <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Theoretical Time Complexity:</span>
                      <code style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {algorithmDetails[selectedAlgorithm].complexity}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


// ----------------------------------------------------
// FILE: js\components\PageReplacement.js
// ----------------------------------------------------
// PageReplacement.js
// Expose as window.PageReplacement React component
(function() {
  const { useState, useEffect, useRef } = React;

  window.PageReplacement = function PageReplacement(props) {
    const [algorithm, setAlgorithm] = useState('FIFO');
    const [referenceString, setReferenceString] = useState(
      window.getSamplePageRef ? window.getSamplePageRef() : '7 0 1 2 0 3 0 4 2 3 0 3 2'
    );
    const [numFrames, setNumFrames] = useState(3);
    const [simulationResult, setSimulationResult] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [errors, setErrors] = useState([]);

    // Run simulation
    const runSimulation = () => {
      if (window.validatePageInput) {
        const validationErrors = window.validatePageInput(referenceString, numFrames);
        if (validationErrors && validationErrors.length > 0) {
          setErrors(validationErrors);
          return;
        }
      }
      setErrors([]);

      let result = null;
      if (algorithm === 'FIFO' && window.runFIFO) {
        result = window.runFIFO(referenceString, numFrames);
      } else if (algorithm === 'LRU' && window.runLRU) {
        result = window.runLRU(referenceString, numFrames);
      } else if (algorithm === 'Optimal' && window.runOptimal) {
        result = window.runOptimal(referenceString, numFrames);
      }

      if (result) {
        setSimulationResult(result);
        setCurrentStep(0);
        setIsPlaying(false);
      }
    };

    // Auto-run on initial mount
    useEffect(() => {
      runSimulation();
    }, [algorithm]);

    // Animation timer
    useEffect(() => {
      let timer = null;
      if (isPlaying && simulationResult && simulationResult.steps) {
        const interval = Math.max(150, Math.floor(1000 / speed));
        timer = setInterval(() => {
          setCurrentStep(prev => {
            if (prev < simulationResult.steps.length - 1) {
              return prev + 1;
            } else {
              setIsPlaying(false);
              return prev;
            }
          });
        }, interval);
      }
      return () => {
        if (timer) clearInterval(timer);
      };
    }, [isPlaying, speed, simulationResult]);

    const handleLoadExample = () => {
      const sample = window.getSamplePageRef ? window.getSamplePageRef() : '7 0 1 2 0 3 0 4 2 3 0 3 2';
      setReferenceString(sample);
      setNumFrames(3);
      setErrors([]);
    };

    const SimulationControls = window.SimulationControls || function({ currentStep, totalSteps, isPlaying, onPlayPause, onStepForward, onStepBack, onReset, speed, onSpeedChange }) {
      return (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-800 rounded-lg text-white">
          <div className="flex items-center gap-2">
            <button onClick={onReset} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm">Reset</button>
            <button onClick={onStepBack} disabled={currentStep <= 0} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded text-sm">◀ Prev</button>
            <button onClick={onPlayPause} className="px-4 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium">
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button onClick={onStepForward} disabled={totalSteps === 0 || currentStep >= totalSteps - 1} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded text-sm">Next ▶</button>
          </div>
          <div className="text-sm font-mono">
            Step: {totalSteps > 0 ? currentStep + 1 : 0} / {totalSteps}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>Speed:</span>
            <input type="range" min="0.5" max="3" step="0.5" value={speed} onChange={e => onSpeedChange(parseFloat(e.target.value))} className="w-24 cursor-pointer" />
            <span>{speed}x</span>
          </div>
        </div>
      );
    };

    const currentStepData = simulationResult && simulationResult.steps && simulationResult.steps[currentStep]
      ? simulationResult.steps[currentStep]
      : null;

    // Build frame table data up to currentStep or entire steps
    const steps = simulationResult ? simulationResult.steps : [];
    const frameRows = Array.from({ length: Number(numFrames) || 3 }, (_, i) => i);

    return (
      <div className="space-y-6 p-6 max-w-7xl mx-auto text-slate-100">
        {/* Header / Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-700 pb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Page Replacement Algorithms</h2>
            <p className="text-slate-400 text-sm mt-1">Visualize FIFO, LRU, and Optimal page replacement in virtual memory management.</p>
          </div>
          <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            {['FIFO', 'LRU', 'Optimal'].map(alg => (
              <button
                key={alg}
                onClick={() => setAlgorithm(alg)}
                style={{
                  padding: '10px 24px',
                  fontSize: '15px',
                  fontWeight: algorithm === alg ? 700 : 500,
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: algorithm === alg ? '#2563eb' : 'transparent',
                  color: algorithm === alg ? '#ffffff' : '#94a3b8',
                  boxShadow: algorithm === alg ? '0 2px 8px rgba(37,99,235,0.4)' : 'none',
                  letterSpacing: '0.02em'
                }}
                onMouseEnter={e => { if (algorithm !== alg) { e.target.style.background = '#334155'; e.target.style.color = '#ffffff'; }}}
                onMouseLeave={e => { if (algorithm !== alg) { e.target.style.background = 'transparent'; e.target.style.color = '#94a3b8'; }}}
              >
                {alg}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-xl shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-6">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Reference String (space/comma separated)
              </label>
              <input
                type="text"
                value={referenceString}
                onChange={e => setReferenceString(e.target.value)}
                placeholder="e.g. 7 0 1 2 0 3 0 4 2 3 0 3 2"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Frames
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={numFrames}
                onChange={e => setNumFrames(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-4 flex gap-2">
              <button
                onClick={handleLoadExample}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-600"
              >
                Load Example
              </button>
              <button
                onClick={runSimulation}
                className="flex-1 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-md transition-colors"
              >
                Run
              </button>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="mt-4 p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-200 text-sm space-y-1">
              {errors.map((err, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Simulation Controls */}
        {simulationResult && (
          <SimulationControls
            currentStep={currentStep}
            totalSteps={steps.length}
            isPlaying={isPlaying}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onStepForward={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
            onStepBack={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            onReset={() => {
              setIsPlaying(false);
              setCurrentStep(0);
            }}
            speed={speed}
            onSpeedChange={setSpeed}
          />
        )}

        {/* Frame Table & Step Visualization */}
        {simulationResult && steps.length > 0 && (
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-5 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Frame Allocation Matrix</h3>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span> Page Hit
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-rose-500 inline-block"></span> Page Fault
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-500 inline-block"></span> Replaced Frame
                </span>
              </div>
            </div>

            <div className="overflow-x-auto pb-2">
              <table className="min-w-full text-center border-collapse">
                <thead>
                  {/* Reference string items row */}
                  <tr className="border-b border-slate-700 bg-slate-900/50">
                    <th className="p-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left min-w-[100px]">
                      Page Req
                    </th>
                    {steps.map((step, sIdx) => {
                      const isCurrent = sIdx === currentStep;
                      const isPastOrCurrent = sIdx <= currentStep;
                      return (
                        <th
                          key={sIdx}
                          className={`p-2.5 min-w-[48px] text-sm font-mono font-bold transition-all ${
                            isCurrent
                              ? 'bg-blue-600 text-white rounded-t-lg ring-2 ring-blue-400 scale-105 z-10'
                              : isPastOrCurrent
                              ? 'text-slate-200'
                              : 'text-slate-500 opacity-40'
                          }`}
                        >
                          {step.page}
                        </th>
                      );
                    })}
                  </tr>

                  {/* Hit / Fault Indicator row */}
                  <tr className="border-b border-slate-700 bg-slate-900/30">
                    <th className="p-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">
                      Status
                    </th>
                    {steps.map((step, sIdx) => {
                      const isPastOrCurrent = sIdx <= currentStep;
                      const isCurrent = sIdx === currentStep;
                      if (!isPastOrCurrent) {
                        return <td key={sIdx} className="p-2 text-xs text-slate-600">-</td>;
                      }
                      return (
                        <td key={sIdx} className={`p-2 text-xs font-bold ${isCurrent ? 'ring-1 ring-blue-400' : ''}`}>
                          {step.isHit ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">H</span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">F</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 font-mono text-sm">
                  {frameRows.map(frameIdx => (
                    <tr key={frameIdx} className="hover:bg-slate-750">
                      <td className="p-3 text-left font-sans text-xs font-semibold text-slate-400 bg-slate-900/40">
                        Frame {frameIdx + 1}
                      </td>
                      {steps.map((step, sIdx) => {
                        const isPastOrCurrent = sIdx <= currentStep;
                        const isCurrent = sIdx === currentStep;
                        if (!isPastOrCurrent) {
                          return (
                            <td key={sIdx} className="p-2.5 text-slate-600 border-l border-slate-700/40">
                              -
                            </td>
                          );
                        }

                        const pageVal = step.frames[frameIdx];
                        const displayVal = (pageVal !== undefined && pageVal !== -1 && pageVal !== null) ? pageVal : '-';
                        
                        // Determine cell styling
                        let cellBg = 'bg-slate-900/30';
                        let textColor = 'text-slate-300';
                        let borderStyle = 'border-l border-slate-700/40';

                        if (isCurrent && pageVal !== -1 && pageVal !== null) {
                          if (step.isHit && pageVal === step.page) {
                            cellBg = 'bg-emerald-600/40 text-emerald-200 font-bold ring-2 ring-emerald-500';
                          } else if (step.isFault && step.replacedPage !== null && step.frames[frameIdx] === step.page) {
                            cellBg = 'bg-amber-600/40 text-amber-200 font-bold ring-2 ring-amber-500';
                          } else if (step.isFault && step.frames[frameIdx] === step.page) {
                            cellBg = 'bg-rose-600/40 text-rose-200 font-bold ring-2 ring-rose-500';
                          }
                        } else if (isPastOrCurrent && pageVal === step.page && sIdx === currentStep) {
                          cellBg = step.isHit ? 'bg-emerald-950/40 text-emerald-300' : 'bg-rose-950/40 text-rose-300';
                        }

                        return (
                          <td
                            key={sIdx}
                            className={`p-2.5 transition-all duration-200 ${borderStyle} ${cellBg} ${textColor}`}
                          >
                            {displayVal}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Why / Explanation Panel */}
        {currentStepData && (
          <div className="bg-gradient-to-r from-slate-800 to-slate-850 border border-blue-500/30 p-5 rounded-xl shadow-md">
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-lg bg-blue-500/20 text-blue-400 text-lg">💡</span>
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-blue-400 mb-1">
                  Step {currentStep + 1} Explanation: Page {currentStepData.page}
                </h4>
                <p className="text-slate-200 text-base leading-relaxed">
                  {currentStepData.explanation || (currentStepData.isHit
                    ? `Page ${currentStepData.page} is already in frames. (Page Hit)`
                    : currentStepData.replacedPage !== null
                    ? `Page fault occurred. Replaced page ${currentStepData.replacedPage} with page ${currentStepData.page}.`
                    : `Page fault occurred. Loaded page ${currentStepData.page} into an empty frame.`
                  )}
                </p>
                <div className="mt-2 flex gap-4 text-xs font-mono text-slate-400">
                  <span>Cumulative Faults: <strong className="text-rose-400">{currentStepData.faultCount}</strong></span>
                  <span>Cumulative Hits: <strong className="text-emerald-400">{currentStepData.hitCount}</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Metric Cards */}
        {simulationResult && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/80 border border-rose-500/30 p-4 rounded-xl">
              <div className="text-xs font-semibold uppercase tracking-wider text-rose-400 mb-1">Total Faults</div>
              <div className="text-3xl font-extrabold text-white">{simulationResult.totalFaults}</div>
              <div className="text-xs text-slate-400 mt-1">Misses requiring I/O load</div>
            </div>

            <div className="bg-slate-800/80 border border-emerald-500/30 p-4 rounded-xl">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">Total Hits</div>
              <div className="text-3xl font-extrabold text-white">{simulationResult.totalHits}</div>
              <div className="text-xs text-slate-400 mt-1">Pages found in memory</div>
            </div>

            <div className="bg-slate-800/80 border border-blue-500/30 p-4 rounded-xl">
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">Hit Ratio</div>
              <div className="text-3xl font-extrabold text-white">
                {(simulationResult.hitRatio * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {(simulationResult.hitRatio).toFixed(3)} ratio
              </div>
            </div>

            <div className="bg-slate-800/80 border border-amber-500/30 p-4 rounded-xl">
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">Fault Ratio</div>
              <div className="text-3xl font-extrabold text-white">
                {(simulationResult.faultRatio * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {(simulationResult.faultRatio).toFixed(3)} ratio
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
})();


// ----------------------------------------------------
// FILE: js\components\DiskScheduling.js
// ----------------------------------------------------
// DiskScheduling.js
// Expose as window.DiskScheduling React component
(function() {
  const { useState, useEffect, useRef } = React;

  window.DiskScheduling = function DiskScheduling(props) {
    const [algorithm, setAlgorithm] = useState('FCFS');
    const [initialHead, setInitialHead] = useState(53);
    const [diskSize, setDiskSize] = useState(200);
    const [requestQueue, setRequestQueue] = useState(
      window.getSampleDiskRequests ? window.getSampleDiskRequests() : '98 183 37 122 14 124 65 67'
    );
    const [direction, setDirection] = useState('right'); // 'right' | 'left'
    const [simulationResult, setSimulationResult] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [errors, setErrors] = useState([]);

    const algorithms = ['FCFS', 'SSTF', 'SCAN', 'C-SCAN', 'LOOK', 'C-LOOK'];
    const needsDirection = ['SCAN', 'C-SCAN', 'LOOK', 'C-LOOK'].includes(algorithm);

    const runSimulation = () => {
      if (window.validateDiskInput) {
        const validationErrors = window.validateDiskInput(initialHead, requestQueue, diskSize);
        if (validationErrors && validationErrors.length > 0) {
          setErrors(validationErrors);
          return;
        }
      }
      setErrors([]);

      let result = null;
      const head = Number(initialHead);
      const size = Number(diskSize);

      switch (algorithm) {
        case 'FCFS':
          if (window.runDiskFCFS) result = window.runDiskFCFS(head, requestQueue, size);
          break;
        case 'SSTF':
          if (window.runDiskSSTF) result = window.runDiskSSTF(head, requestQueue, size);
          break;
        case 'SCAN':
          if (window.runDiskSCAN) result = window.runDiskSCAN(head, requestQueue, size, direction);
          break;
        case 'C-SCAN':
          if (window.runDiskCSCAN) result = window.runDiskCSCAN(head, requestQueue, size, direction);
          break;
        case 'LOOK':
          if (window.runDiskLOOK) result = window.runDiskLOOK(head, requestQueue, size, direction);
          break;
        case 'C-LOOK':
          if (window.runDiskCLOOK) result = window.runDiskCLOOK(head, requestQueue, size, direction);
          break;
        default:
          break;
      }

      if (result) {
        setSimulationResult(result);
        setCurrentStep(0);
        setIsPlaying(false);
      }
    };

    // Auto-run on changes to algorithm or direction
    useEffect(() => {
      runSimulation();
    }, [algorithm, direction]);

    // Animation timer
    useEffect(() => {
      let timer = null;
      if (isPlaying && simulationResult && simulationResult.steps) {
        const interval = Math.max(150, Math.floor(1000 / speed));
        timer = setInterval(() => {
          setCurrentStep(prev => {
            if (prev < simulationResult.steps.length - 1) {
              return prev + 1;
            } else {
              setIsPlaying(false);
              return prev;
            }
          });
        }, interval);
      }
      return () => {
        if (timer) clearInterval(timer);
      };
    }, [isPlaying, speed, simulationResult]);

    const handleLoadExample = () => {
      const sample = window.getSampleDiskRequests ? window.getSampleDiskRequests() : '98 183 37 122 14 124 65 67';
      setRequestQueue(sample);
      setInitialHead(53);
      setDiskSize(200);
      setDirection('right');
      setErrors([]);
    };

    const SimulationControls = window.SimulationControls || function({ currentStep, totalSteps, isPlaying, onPlayPause, onStepForward, onStepBack, onReset, speed, onSpeedChange }) {
      return (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-800 rounded-lg text-white">
          <div className="flex items-center gap-2">
            <button onClick={onReset} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm">Reset</button>
            <button onClick={onStepBack} disabled={currentStep <= 0} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded text-sm">◀ Prev</button>
            <button onClick={onPlayPause} className="px-4 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium">
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button onClick={onStepForward} disabled={totalSteps === 0 || currentStep >= totalSteps - 1} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded text-sm">Next ▶</button>
          </div>
          <div className="text-sm font-mono">
            Step: {totalSteps > 0 ? currentStep + 1 : 0} / {totalSteps}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>Speed:</span>
            <input type="range" min="0.5" max="3" step="0.5" value={speed} onChange={e => onSpeedChange(parseFloat(e.target.value))} className="w-24 cursor-pointer" />
            <span>{speed}x</span>
          </div>
        </div>
      );
    };

    const steps = simulationResult ? simulationResult.steps || [] : [];
    const serviceOrder = simulationResult ? simulationResult.serviceOrder || [] : [];
    const currentStepData = steps[currentStep] || null;

    // Parse all original requested cylinders
    const parsedRequests = requestQueue
      .toString()
      .split(/[\s,]+/)
      .map(x => parseInt(x.trim(), 10))
      .filter(x => !isNaN(x));

    // Calculate position for SVG
    const svgWidth = 800;
    const svgHeight = 280;
    const paddingX = 50;
    const topMargin = 50;
    const bottomMargin = 40;
    const trackY = 40;
    const usableWidth = svgWidth - paddingX * 2;
    const maxCylinder = Math.max(1, Number(diskSize) - 1);

    const getXCoord = (val) => {
      const clamped = Math.max(0, Math.min(maxCylinder, val));
      return paddingX + (clamped / maxCylinder) * usableWidth;
    };

    // Current position
    const currentPos = currentStepData ? currentStepData.to : (serviceOrder[0] !== undefined ? serviceOrder[0] : Number(initialHead));

    // Movement history up to currentStep
    const visitedPoints = [];
    if (simulationResult && serviceOrder.length > 0) {
      visitedPoints.push({
        cyl: serviceOrder[0],
        x: getXCoord(serviceOrder[0]),
        y: topMargin + 20,
        index: 0
      });
      for (let i = 0; i <= currentStep && i < steps.length; i++) {
        const destCyl = steps[i].to;
        const stepY = topMargin + 20 + ((i + 1) / Math.max(1, steps.length)) * (svgHeight - topMargin - bottomMargin - 30);
        visitedPoints.push({
          cyl: destCyl,
          x: getXCoord(destCyl),
          y: stepY,
          index: i + 1,
          movement: steps[i].movement
        });
      }
    }

    // Cumulative movement up to current step
    let cumulativeMovement = 0;
    for (let i = 0; i <= currentStep && i < steps.length; i++) {
      cumulativeMovement += steps[i].movement || 0;
    }

    return (
      <div className="space-y-6 p-6 max-w-7xl mx-auto text-slate-100">
        {/* Header / Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-700 pb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Disk Scheduling Algorithms</h2>
            <p className="text-slate-400 text-sm mt-1">Visualize cylinder head traversal for FCFS, SSTF, SCAN, C-SCAN, LOOK, and C-LOOK.</p>
          </div>
          <div className="flex flex-wrap bg-slate-800 p-1 rounded-lg border border-slate-700 gap-1">
            {algorithms.map(alg => (
              <button
                key={alg}
                onClick={() => setAlgorithm(alg)}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                  algorithm === alg
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {alg}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-xl shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Initial Head
              </label>
              <input
                type="number"
                min="0"
                max={diskSize - 1}
                value={initialHead}
                onChange={e => setInitialHead(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Disk Size (Cylinders)
              </label>
              <input
                type="number"
                min="10"
                max="5000"
                value={diskSize}
                onChange={e => setDiskSize(parseInt(e.target.value) || 200)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Request Queue
              </label>
              <input
                type="text"
                value={requestQueue}
                onChange={e => setRequestQueue(e.target.value)}
                placeholder="e.g. 98 183 37 122 14 124 65 67"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {needsDirection && (
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Head Direction
                </label>
                <div className="flex items-center gap-3 py-2">
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="direction"
                      value="left"
                      checked={direction === 'left'}
                      onChange={e => setDirection(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Left (0)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="direction"
                      value="right"
                      checked={direction === 'right'}
                      onChange={e => setDirection(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Right (Max)</span>
                  </label>
                </div>
              </div>
            )}

            <div className={`${needsDirection ? 'md:col-span-2' : 'md:col-span-4'} flex gap-2`}>
              <button
                onClick={handleLoadExample}
                className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-600"
              >
                Example
              </button>
              <button
                onClick={runSimulation}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-md transition-colors"
              >
                Run
              </button>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="mt-4 p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-200 text-sm space-y-1">
              {errors.map((err, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        {simulationResult && (
          <SimulationControls
            currentStep={currentStep}
            totalSteps={steps.length}
            isPlaying={isPlaying}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onStepForward={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
            onStepBack={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            onReset={() => {
              setIsPlaying(false);
              setCurrentStep(0);
            }}
            speed={speed}
            onSpeedChange={setSpeed}
          />
        )}

        {/* Disk Movement Visualization (SVG) */}
        {simulationResult && (
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 pb-3">
              <h3 className="text-lg font-semibold text-white">Disk Head Trajectory & Track Visualization</h3>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-slate-400">Head at Cylinder: <strong className="text-amber-400 text-sm">{currentPos}</strong></span>
                <span className="text-slate-400">Cumulative Movement: <strong className="text-blue-400 text-sm">{cumulativeMovement}</strong></span>
              </div>
            </div>

            {/* SVG Canvas */}
            <div className="w-full overflow-x-auto bg-slate-900/80 rounded-lg p-2 border border-slate-800">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto min-w-[650px] select-none">
                {/* Horizontal Track axis line */}
                <line
                  x1={paddingX}
                  y1={trackY}
                  x2={svgWidth - paddingX}
                  y2={trackY}
                  stroke="#475569"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Track Bounds: 0 and diskSize-1 */}
                <line x1={paddingX} y1={trackY - 10} x2={paddingX} y2={trackY + 10} stroke="#94a3b8" strokeWidth="2" />
                <text x={paddingX} y={trackY - 15} textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace">0</text>

                <line x1={svgWidth - paddingX} y1={trackY - 10} x2={svgWidth - paddingX} y2={trackY + 10} stroke="#94a3b8" strokeWidth="2" />
                <text x={svgWidth - paddingX} y={trackY - 15} textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace">{diskSize - 1}</text>

                {/* Request dots along the main track */}
                {parsedRequests.map((req, rIdx) => {
                  const reqX = getXCoord(req);
                  const isCurrentTarget = currentStepData && currentStepData.to === req;
                  const isServiced = steps.slice(0, currentStep + 1).some(s => s.to === req);

                  return (
                    <g key={rIdx}>
                      <line x1={reqX} y1={trackY - 6} x2={reqX} y2={trackY + 6} stroke="#64748b" strokeWidth="1" />
                      <circle
                        cx={reqX}
                        cy={trackY}
                        r={isCurrentTarget ? 6 : 4}
                        fill={isCurrentTarget ? '#f59e0b' : isServiced ? '#10b981' : '#38bdf8'}
                        className="transition-all duration-200"
                      />
                      <text
                        x={reqX}
                        y={trackY + 20}
                        textAnchor="middle"
                        fill={isCurrentTarget ? '#f59e0b' : '#94a3b8'}
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight={isCurrentTarget ? 'bold' : 'normal'}
                      >
                        {req}
                      </text>
                    </g>
                  );
                })}

                {/* Trajectory Path Line */}
                {visitedPoints.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                    points={visitedPoints.map(p => `${p.x},${p.y}`).join(' ')}
                  />
                )}

                {/* Trajectory points & step annotations */}
                {visitedPoints.map((pt, pIdx) => {
                  const isLatest = pIdx === visitedPoints.length - 1;
                  return (
                    <g key={pIdx}>
                      {/* Vertical connector guide to track */}
                      <line
                        x1={pt.x}
                        y1={trackY}
                        x2={pt.x}
                        y2={pt.y}
                        stroke="#334155"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isLatest ? 7 : 4.5}
                        fill={isLatest ? '#f59e0b' : '#3b82f6'}
                        stroke="#0f172a"
                        strokeWidth="2"
                      />
                      <text
                        x={pt.x + (pt.x > svgWidth - 70 ? -12 : 12)}
                        y={pt.y + 4}
                        textAnchor={pt.x > svgWidth - 70 ? 'end' : 'start'}
                        fill={isLatest ? '#fbbf24' : '#cbd5e1'}
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight={isLatest ? 'bold' : 'normal'}
                      >
                        {pIdx === 0 ? `Start (${pt.cyl})` : `#${pIdx}: ${pt.cyl}`}
                      </text>
                    </g>
                  );
                })}

                {/* Main Head indicator moving on track */}
                <g transform={`translate(${getXCoord(currentPos)}, ${trackY})`}>
                  <polygon
                    points="0,-16 -7,-26 7,-26"
                    fill="#f59e0b"
                    filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.5))"
                  />
                  <text
                    x="0"
                    y="-30"
                    textAnchor="middle"
                    fill="#f59e0b"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    HEAD: {currentPos}
                  </text>
                </g>
              </svg>
            </div>

            {/* Sequence Flow: 53 -> 65 -> 67 ... */}
            <div className="pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Traversal Sequence:
              </span>
              <div className="flex flex-wrap items-center gap-1.5 p-3 bg-slate-900/60 rounded-lg border border-slate-800 font-mono text-xs overflow-x-auto">
                {serviceOrder.map((cyl, idx) => {
                  const isCurrent = idx === currentStep + 1 || (currentStep === 0 && idx === 0);
                  const isVisited = idx <= currentStep + 1;
                  return (
                    <React.Fragment key={idx}>
                      <span
                        className={`px-2 py-1 rounded transition-all ${
                          isCurrent
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-md scale-105'
                            : isVisited
                            ? 'bg-blue-900/50 text-blue-200 border border-blue-700/50'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {cyl}
                      </span>
                      {idx < serviceOrder.length - 1 && (
                        <span className={`text-xs ${isVisited ? 'text-blue-400 font-bold' : 'text-slate-600'}`}>
                          →
                        </span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step Detail Panel */}
        {currentStepData && (
          <div className="bg-gradient-to-r from-slate-800 to-slate-850 border border-amber-500/30 p-5 rounded-xl shadow-md">
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-lg bg-amber-500/20 text-amber-400 text-lg">💿</span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-amber-400">
                    Step {currentStep + 1} of {steps.length}: Head Transition
                  </h4>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-700">
                      From: <strong className="text-blue-300">{currentStepData.from}</strong>
                    </span>
                    <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-700">
                      To: <strong className="text-amber-300">{currentStepData.to}</strong>
                    </span>
                    <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-700">
                      Distance: <strong className="text-emerald-400">{currentStepData.movement}</strong> cyls
                    </span>
                  </div>
                </div>

                <p className="text-slate-200 text-base leading-relaxed mb-3">
                  {currentStepData.explanation || `Moving disk head from cylinder ${currentStepData.from} to cylinder ${currentStepData.to} (distance: ${currentStepData.movement} cylinders).`}
                </p>

                {currentStepData.remaining && (
                  <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                    <span className="text-slate-500 font-sans font-medium">Pending Requests:</span>
                    <span>
                      {currentStepData.remaining.length > 0
                        ? currentStepData.remaining.join(', ')
                        : '(All requests completed)'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Statistics Metric Cards */}
        {simulationResult && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/80 border border-blue-500/30 p-4 rounded-xl">
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">Total Head Movement</div>
              <div className="text-3xl font-extrabold text-white">
                {simulationResult.totalMovement} <span className="text-sm font-normal text-slate-400">cylinders</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">Overall mechanical seek distance</div>
            </div>

            <div className="bg-slate-800/80 border border-emerald-500/30 p-4 rounded-xl">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">Average Movement</div>
              <div className="text-3xl font-extrabold text-white">
                {typeof simulationResult.avgMovement === 'number'
                  ? simulationResult.avgMovement.toFixed(2)
                  : simulationResult.avgMovement} <span className="text-sm font-normal text-slate-400">cyl/req</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">Average cylinders traversed per request</div>
            </div>

            <div className="bg-slate-800/80 border border-purple-500/30 p-4 rounded-xl">
              <div className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-1">Requests Serviced</div>
              <div className="text-3xl font-extrabold text-white">
                {parsedRequests.length}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Serviced across {steps.length} movement steps
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
})();


// ----------------------------------------------------
// FILE: js\components\MemoryAllocation.js
// ----------------------------------------------------
// MemoryAllocation.js
// Expose as window.MemoryAllocation React component
(function() {
  'use strict';

  const { useState, useEffect, useRef, useMemo } = React;

  window.MemoryAllocation = function MemoryAllocation(props) {
    const [algorithm, setAlgorithm] = useState('FirstFit');
    const [blockSizes, setBlockSizes] = useState('100, 500, 200, 300, 600');
    const [processSizes, setProcessSizes] = useState('212, 417, 112, 426');
    const [simulationResult, setSimulationResult] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [errors, setErrors] = useState([]);

    // Parse block and process strings into numeric arrays
    const parseInputs = () => {
      const parsedErrors = [];
      const blocks = blockSizes
        .trim()
        .split(/[\s,]+/)
        .map(v => parseInt(v.trim(), 10))
        .filter(v => !isNaN(v));

      const processes = processSizes
        .trim()
        .split(/[\s,]+/)
        .map(v => parseInt(v.trim(), 10))
        .filter(v => !isNaN(v));

      if (blocks.length === 0) {
        parsedErrors.push('Please specify at least one valid memory block size.');
      } else if (blocks.some(b => b <= 0)) {
        parsedErrors.push('All memory block sizes must be greater than 0 KB.');
      }

      if (processes.length === 0) {
        parsedErrors.push('Please enter at least one valid process size.');
      } else if (processes.some(p => p <= 0)) {
        parsedErrors.push('All process sizes must be greater than 0 KB.');
      }

      return { blocks, processes, errors: parsedErrors };
    };

    // Run simulation
    const runSimulation = () => {
      const { blocks, processes, errors: validationErrors } = parseInputs();
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setSimulationResult(null);
        return;
      }
      setErrors([]);

      let result = null;
      if (algorithm === 'FirstFit' && typeof window.runFirstFit === 'function') {
        result = window.runFirstFit(blocks, processes);
      } else if (algorithm === 'BestFit' && typeof window.runBestFit === 'function') {
        result = window.runBestFit(blocks, processes);
      } else if (algorithm === 'WorstFit' && typeof window.runWorstFit === 'function') {
        result = window.runWorstFit(blocks, processes);
      } else if (algorithm === 'NextFit' && typeof window.runNextFit === 'function') {
        result = window.runNextFit(blocks, processes);
      }

      if (result) {
        setSimulationResult(result);
        setCurrentStep(0);
        setIsPlaying(false);
      }
    };

    // Auto-run on mount or algorithm change
    useEffect(() => {
      runSimulation();
    }, [algorithm]);

    // Timer for playback animation
    useEffect(() => {
      let timer = null;
      if (isPlaying && simulationResult && simulationResult.steps && simulationResult.steps.length > 0) {
        const interval = Math.max(200, Math.floor(1000 / speed));
        timer = setInterval(() => {
          setCurrentStep(prev => {
            if (prev < simulationResult.steps.length - 1) {
              return prev + 1;
            } else {
              setIsPlaying(false);
              return prev;
            }
          });
        }, interval);
      }
      return () => {
        if (timer) clearInterval(timer);
      };
    }, [isPlaying, speed, simulationResult]);

    const handleLoadExample = () => {
      const sampleBlocks = window.getSampleMemoryBlocks ? window.getSampleMemoryBlocks() : [100, 500, 200, 300, 600];
      const sampleProcs = window.getSampleMemoryProcesses ? window.getSampleMemoryProcesses() : [212, 417, 112, 426];
      setBlockSizes(sampleBlocks.join(', '));
      setProcessSizes(sampleProcs.join(', '));
      setErrors([]);
    };

    // Compute the state of memory blocks up to currentStep
    const currentMemoryBlocksState = useMemo(() => {
      if (!simulationResult || !simulationResult.blocks) return [];

      // Initial unallocated state of blocks
      const initialBlocks = simulationResult.blocks.map((b, idx) => ({
        index: idx,
        originalSize: b.originalSize,
        remainingSize: b.originalSize,
        allocatedProcess: null,
        processSize: 0,
        internalFragmentation: 0
      }));

      if (!simulationResult.steps || simulationResult.steps.length === 0) {
        return initialBlocks;
      }

      const effectiveStep = Math.min(currentStep, simulationResult.steps.length - 1);

      // Replay allocations up to effectiveStep
      for (let s = 0; s <= effectiveStep; s++) {
        const step = simulationResult.steps[s];
        if (step && step.allocated && step.blockIndex >= 0 && step.blockIndex < initialBlocks.length) {
          const targetBlock = initialBlocks[step.blockIndex];
          targetBlock.allocatedProcess = step.processId;
          targetBlock.processSize = step.processSize;
          targetBlock.internalFragmentation = step.internalFragmentation;
          targetBlock.remainingSize = step.internalFragmentation;
        }
      }

      return initialBlocks;
    }, [simulationResult, currentStep]);

    // Maximum block size for height proportionality calculation
    const maxBlockSize = useMemo(() => {
      if (!simulationResult || !simulationResult.blocks || simulationResult.blocks.length === 0) return 500;
      return Math.max(...simulationResult.blocks.map(b => b.originalSize), 100);
    }, [simulationResult]);

    const currentStepInfo = simulationResult && simulationResult.steps && simulationResult.steps[currentStep]
      ? simulationResult.steps[currentStep]
      : null;

    const totalStepsCount = simulationResult && simulationResult.steps ? simulationResult.steps.length : 0;

    // Helper for process colors
    const getProcColor = (procId, idx) => {
      if (typeof window.getProcessColor === 'function') {
        return window.getProcessColor(procId, idx);
      }
      const palette = ['#4f8ef7', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
      return palette[(idx || 0) % palette.length];
    };

    return (
      <div className="page" style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div className="page-header" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Memory Allocation Visualizer
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Simulate contiguous memory partition allocation policies: First Fit, Best Fit, Worst Fit, and Next Fit.
            </p>
          </div>
        </div>

        {/* Algorithm Tabs */}
        <div className="tab-list" style={{ marginBottom: '1.5rem' }}>
          {[
            { id: 'FirstFit', label: 'First Fit' },
            { id: 'BestFit', label: 'Best Fit' },
            { id: 'WorstFit', label: 'Worst Fit' },
            { id: 'NextFit', label: 'Next Fit' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`tab ${algorithm === tab.id ? 'active' : ''}`}
              onClick={() => {
                setAlgorithm(tab.id);
                setIsPlaying(false);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Configuration Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3>Memory Allocation Inputs</h3>
            <div className="btn-group">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleLoadExample}
              >
                Load Example
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={runSimulation}
              >
                Run Simulation
              </button>
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Block Sizes (KB, comma-separated)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={blockSizes}
                  onChange={e => setBlockSizes(e.target.value)}
                  placeholder="e.g. 100, 500, 200, 300, 600"
                />
                <span className="form-hint">Physical memory partition sizes in address order.</span>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Process Sizes (KB, comma-separated)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={processSizes}
                  onChange={e => setProcessSizes(e.target.value)}
                  placeholder="e.g. 212, 417, 112, 426"
                />
                <span className="form-hint">Processes requested in order of arrival (P1, P2, ...).</span>
              </div>
            </div>

            {/* Error alerts */}
            {errors.length > 0 && (
              <div className="alert alert-error" style={{ marginTop: '1rem', marginBottom: 0 }}>
                <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                  {errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Simulation Controls */}
        {simulationResult && totalStepsCount > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            {window.SimulationControls ? (
              <window.SimulationControls
                currentStep={currentStep}
                totalSteps={totalStepsCount}
                isPlaying={isPlaying}
                speed={speed}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onNext={() => setCurrentStep(prev => Math.min(totalStepsCount - 1, prev + 1))}
                onPrev={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                onReset={() => {
                  setCurrentStep(0);
                  setIsPlaying(false);
                }}
                onSpeedChange={s => setSpeed(s)}
                onStepChange={s => setCurrentStep(s)}
              />
            ) : (
              <div className="sim-controls">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                  disabled={currentStep <= 0}
                >
                  ⏮ Prev
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? '⏸ Pause' : '▶ Play'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentStep(prev => Math.min(totalStepsCount - 1, prev + 1))}
                  disabled={currentStep >= totalStepsCount - 1}
                >
                  Next ⏭
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setCurrentStep(0);
                    setIsPlaying(false);
                  }}
                >
                  Reset
                </button>
                <span className="step-indicator">
                  Step {currentStep + 1} of {totalStepsCount}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Step Explanation Callout */}
        {currentStepInfo && (
          <div
            className="why-box"
            style={{
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap'
            }}
          >
            <div>
              <strong style={{ color: 'var(--accent-blue)', marginRight: '0.5rem' }}>
                Step {currentStep + 1} ({currentStepInfo.processId}):
              </strong>
              <span>{currentStepInfo.explanation}</span>
            </div>
            <span
              className={`badge ${currentStepInfo.allocated ? 'green' : 'red'}`}
              style={{ flexShrink: 0 }}
            >
              {currentStepInfo.allocated ? 'Allocated Successfully' : 'Allocation Failed'}
            </span>
          </div>
        )}

        {/* Visual Memory Stack & Stats Grid */}
        {simulationResult && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Memory Blocks Vertical Stack */}
            <div className="card" style={{ height: '100%', marginBottom: 0 }}>
              <div className="card-header">
                <h3>
                  <span>Physical Memory Layout</span>
                </h3>
                <span className="badge blue">
                  {currentMemoryBlocksState.length} Blocks
                </span>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Vertical representation with proportional block heights and internal fragmentation indicators:
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    background: 'var(--bg-secondary)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)'
                  }}
                >
                  {currentMemoryBlocksState.map((block, idx) => {
                    const isAllocated = block.allocatedProcess !== null;
                    const procColor = isAllocated ? getProcColor(block.allocatedProcess, idx) : '#334155';
                    // Height proportional to block size, clamped between 65px and 180px
                    const blockHeightPx = Math.max(68, Math.min(180, Math.round((block.originalSize / maxBlockSize) * 150)));
                    
                    const isStepTarget = currentStepInfo && currentStepInfo.allocated && currentStepInfo.blockIndex === idx;

                    const processHeightPct = isAllocated
                      ? Math.min(100, Math.round((block.processSize / block.originalSize) * 100))
                      : 0;
                    const fragHeightPct = isAllocated ? 100 - processHeightPct : 0;

                    return (
                      <div
                        key={idx}
                        style={{
                          height: `${blockHeightPx}px`,
                          border: isStepTarget
                            ? '2px solid var(--accent-blue)'
                            : '1px solid var(--border)',
                          boxShadow: isStepTarget ? '0 0 12px rgba(79, 142, 247, 0.4)' : 'none',
                          borderRadius: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden',
                          position: 'relative',
                          backgroundColor: '#161922',
                          transition: 'all 0.25s ease'
                        }}
                      >
                        {isAllocated ? (
                          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
                            {/* Process Occupied Space */}
                            <div
                              style={{
                                height: `${processHeightPct}%`,
                                backgroundColor: procColor,
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0 0.85rem',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                                transition: 'height 0.3s ease'
                              }}
                            >
                              <span>
                                {block.allocatedProcess} ({block.processSize} KB)
                              </span>
                              <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                                Block {idx + 1}
                              </span>
                            </div>

                            {/* Internal Fragmentation Portion */}
                            {fragHeightPct > 0 && (
                              <div
                                style={{
                                  height: `${fragHeightPct}%`,
                                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                  backgroundImage: 'repeating-linear-gradient(45deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.15) 8px, rgba(239, 68, 68, 0.25) 8px, rgba(239, 68, 68, 0.25) 16px)',
                                  borderTop: '1px dashed rgba(239, 68, 68, 0.4)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '0 0.85rem',
                                  fontSize: '0.75rem',
                                  color: '#fca5a5',
                                  fontFamily: 'var(--font-mono)'
                                }}
                              >
                                <span>Internal Fragmentation</span>
                                <strong>{block.internalFragmentation} KB</strong>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Free Block */
                          <div
                            style={{
                              height: '100%',
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0 0.85rem',
                              color: 'var(--text-muted)',
                              backgroundColor: 'rgba(255, 255, 255, 0.02)'
                            }}
                          >
                            <div>
                              <strong style={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }}>
                                Block {idx + 1}
                              </strong>
                              <span style={{ fontSize: '0.8rem' }}>({block.originalSize} KB)</span>
                            </div>
                            <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                              FREE
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Statistics & Allocation Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Statistics Cards */}
              <div className="metrics-grid" style={{ marginBottom: 0 }}>
                <div className="metric-card blue">
                  <div className="metric-value">
                    {simulationResult.statistics.totalAllocated}
                  </div>
                  <div className="metric-label">Allocated Processes</div>
                </div>

                <div className="metric-card orange">
                  <div className="metric-value">
                    {simulationResult.statistics.totalUnallocated}
                  </div>
                  <div className="metric-label">Unallocated Processes</div>
                </div>

                <div className="metric-card purple">
                  <div className="metric-value">
                    {simulationResult.statistics.totalInternalFragmentation}{' '}
                    <span style={{ fontSize: '1rem', fontWeight: 500 }}>KB</span>
                  </div>
                  <div className="metric-label">Internal Fragmentation</div>
                </div>

                <div className="metric-card green">
                  <div className="metric-value">
                    {simulationResult.statistics.memoryUtilization}%
                  </div>
                  <div className="metric-label">Memory Utilization</div>
                </div>
              </div>

              {/* Allocation Table */}
              <div className="card" style={{ marginBottom: 0, flex: 1 }}>
                <div className="card-header">
                  <h3>Process Allocation Table</h3>
                  <span className="badge purple">{algorithm}</span>
                </div>
                <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
                  <table className="results-table" style={{ border: 'none', borderRadius: 0 }}>
                    <thead>
                      <tr>
                        <th>Process</th>
                        <th>Process Size</th>
                        <th>Allocated Block</th>
                        <th>Block Capacity</th>
                        <th>Internal Frag.</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simulationResult.allocations.map((alloc, i) => {
                        const isAllocated = alloc.blockIndex !== -1;
                        const isCurrentInStep = currentStepInfo && currentStepInfo.processId === alloc.processId;
                        const isEvaluatedYet = i <= currentStep;

                        return (
                          <tr
                            key={alloc.processId}
                            className={isCurrentInStep ? 'highlight-row' : ''}
                            style={{ opacity: isEvaluatedYet ? 1 : 0.5 }}
                          >
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span
                                  style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    backgroundColor: isAllocated ? getProcColor(alloc.processId, alloc.blockIndex) : '#64748b'
                                  }}
                                />
                                <strong>{alloc.processId}</strong>
                              </div>
                            </td>
                            <td>{alloc.processSize} KB</td>
                            <td>
                              {isAllocated ? (
                                <span className="badge blue">
                                  Block {alloc.blockIndex + 1}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                              )}
                            </td>
                            <td>
                              {isAllocated ? `${alloc.blockSize} KB` : '—'}
                            </td>
                            <td>
                              {isAllocated ? (
                                <span style={{ color: alloc.internalFragmentation > 0 ? 'var(--accent-orange)' : 'var(--text-muted)' }}>
                                  {alloc.internalFragmentation} KB
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td>
                              {isAllocated ? (
                                <span className="badge green">Allocated</span>
                              ) : (
                                <span className="badge red">Not Allocated</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
})();


// ----------------------------------------------------
// FILE: js\components\Compare.js
// ----------------------------------------------------
// Compare.js
// Expose as window.Compare React component
(function() {
  'use strict';

  const { useState, useEffect, useMemo } = React;

  const ALL_ALGORITHMS = [
    { id: 'FCFS', name: 'FCFS', label: 'First Come First Serve (FCFS)' },
    { id: 'SJF', name: 'SJF', label: 'Shortest Job First (SJF)' },
    { id: 'SRTF', name: 'SRTF', label: 'Shortest Remaining Time First (SRTF)' },
    { id: 'Priority (NP)', name: 'Priority (NP)', label: 'Priority (Non-Preemptive)' },
    { id: 'Priority (P)', name: 'Priority (P)', label: 'Priority (Preemptive)' },
    { id: 'Round Robin', name: 'Round Robin', label: 'Round Robin (RR)' }
  ];

  window.Compare = function Compare(props) {
    const defaultProcesses = () => {
      if (typeof window.getSampleCPUProcesses === 'function') {
        return window.getSampleCPUProcesses();
      }
      return [
        { id: 'P1', arrivalTime: 0, burstTime: 5, priority: 3 },
        { id: 'P2', arrivalTime: 1, burstTime: 3, priority: 1 },
        { id: 'P3', arrivalTime: 2, burstTime: 8, priority: 4 },
        { id: 'P4', arrivalTime: 3, burstTime: 6, priority: 2 },
        { id: 'P5', arrivalTime: 4, burstTime: 4, priority: 5 }
      ];
    };

    const [processes, setProcesses] = useState(defaultProcesses);
    const [selectedAlgorithms, setSelectedAlgorithms] = useState(
      new Set(['FCFS', 'SJF', 'SRTF', 'Round Robin'])
    );
    const [timeQuantum, setTimeQuantum] = useState(2);
    const [comparisonResults, setComparisonResults] = useState([]);
    const [chartMetric, setChartMetric] = useState('avgWaitingTime');
    const [errors, setErrors] = useState([]);

    // Process table manipulation
    const handleAddProcess = () => {
      const nextNum = processes.length + 1;
      const newProc = {
        id: `P${nextNum}`,
        arrivalTime: 0,
        burstTime: 4,
        priority: 1
      };
      setProcesses([...processes, newProc]);
    };

    const handleRemoveProcess = (index) => {
      if (processes.length <= 1) {
        setErrors(['At least one process is required for comparison.']);
        return;
      }
      const updated = processes.filter((_, idx) => idx !== index);
      setProcesses(updated);
      setErrors([]);
    };

    const handleProcessChange = (index, field, value) => {
      const updated = processes.map((p, idx) => {
        if (idx !== index) return p;
        if (field === 'id') return { ...p, id: value };
        const numVal = parseInt(value, 10);
        return { ...p, [field]: isNaN(numVal) ? 0 : Math.max(0, numVal) };
      });
      setProcesses(updated);
    };

    const handleLoadExample = () => {
      const sample = defaultProcesses();
      setProcesses(sample);
      setTimeQuantum(2);
      setErrors([]);
    };

    const toggleAlgorithm = (algName) => {
      setSelectedAlgorithms(prev => {
        const next = new Set(prev);
        if (next.has(algName)) {
          next.delete(algName);
        } else {
          next.add(algName);
        }
        return next;
      });
    };

    const handleSelectAll = () => {
      setSelectedAlgorithms(new Set(ALL_ALGORITHMS.map(a => a.id)));
    };

    const handleDeselectAll = () => {
      setSelectedAlgorithms(new Set());
    };

    // Run comparison
    const runComparison = () => {
      // Validate processes
      if (typeof window.validateCPUProcesses === 'function') {
        const validationErrors = window.validateCPUProcesses(processes);
        if (validationErrors && validationErrors.length > 0) {
          setErrors(validationErrors);
          return;
        }
      } else {
        if (!processes || processes.length === 0) {
          setErrors(['Please specify at least one process.']);
          return;
        }
      }

      if (selectedAlgorithms.size === 0) {
        setErrors(['Please select at least one algorithm to compare.']);
        return;
      }

      if (selectedAlgorithms.has('Round Robin') && (isNaN(timeQuantum) || timeQuantum <= 0)) {
        setErrors(['Time Quantum for Round Robin must be a positive number.']);
        return;
      }

      setErrors([]);

      const results = [];
      const runnerMap = {
        'FCFS': () => typeof window.runFCFS === 'function' && window.runFCFS(processes),
        'SJF': () => typeof window.runSJF === 'function' && window.runSJF(processes),
        'SRTF': () => typeof window.runSRTF === 'function' && window.runSRTF(processes),
        'Priority (NP)': () => typeof window.runPriorityNP === 'function' && window.runPriorityNP(processes),
        'Priority (P)': () => typeof window.runPriorityP === 'function' && window.runPriorityP(processes),
        'Round Robin': () => typeof window.runRoundRobin === 'function' && window.runRoundRobin(processes, timeQuantum)
      };

      ALL_ALGORITHMS.forEach(alg => {
        if (selectedAlgorithms.has(alg.id) && runnerMap[alg.id]) {
          try {
            const res = runnerMap[alg.id]();
            if (res && res.statistics) {
              results.push({
                algorithm: alg.id,
                name: alg.label,
                result: res
              });
            }
          } catch (err) {
            console.error(`Error running ${alg.id}:`, err);
          }
        }
      });

      setComparisonResults(results);
    };

    // Run automatically on first render
    useEffect(() => {
      runComparison();
    }, []);

    // Find best metric values across results
    const bestMetrics = useMemo(() => {
      if (comparisonResults.length === 0) return {};
      const minWT = Math.min(...comparisonResults.map(r => r.result.statistics.avgWaitingTime));
      const minTAT = Math.min(...comparisonResults.map(r => r.result.statistics.avgTurnaroundTime));
      const minRT = Math.min(...comparisonResults.map(r => r.result.statistics.avgResponseTime));
      const maxUtil = Math.max(...comparisonResults.map(r => r.result.statistics.cpuUtilization));
      const maxThroughput = Math.max(...comparisonResults.map(r => r.result.statistics.throughput));

      return { minWT, minTAT, minRT, maxUtil, maxThroughput };
    }, [comparisonResults]);

    // Bar chart maximum value for scaling
    const chartData = useMemo(() => {
      if (comparisonResults.length === 0) return [];
      return comparisonResults.map(r => {
        const val = r.result.statistics[chartMetric] || 0;
        return {
          algorithm: r.algorithm,
          value: val,
          formatted: chartMetric === 'throughput' ? val.toFixed(4) : (typeof window.formatTime === 'function' ? window.formatTime(val) : val.toFixed(2))
        };
      });
    }, [comparisonResults, chartMetric]);

    const maxChartValue = useMemo(() => {
      if (chartData.length === 0) return 1;
      const max = Math.max(...chartData.map(d => d.value));
      return max > 0 ? max : 1;
    }, [chartData]);

    const formatVal = (val, isTime = true) => {
      if (typeof window.formatTime === 'function' && isTime) {
        return window.formatTime(val);
      }
      return Number(val).toFixed(2);
    };

    const metricLabels = {
      avgWaitingTime: 'Average Waiting Time',
      avgTurnaroundTime: 'Average Turnaround Time',
      avgResponseTime: 'Average Response Time',
      cpuUtilization: 'CPU Utilization (%)',
      throughput: 'Throughput (proc/unit)'
    };

    return (
      <div className="page" style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div className="page-header" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              CPU Scheduling Algorithm Comparison
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Benchmark and compare performance metrics across multiple CPU scheduling algorithms with identical workloads.
            </p>
          </div>
          <div className="btn-group">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleLoadExample}
            >
              Load Example
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={runComparison}
            >
              Compare Algorithms
            </button>
          </div>
        </div>

        {/* Errors Display */}
        {errors.length > 0 && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Input Configuration Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.4fr) minmax(280px, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Process Input Table Card */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header">
              <h3>Process Workload Table</h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddProcess}
              >
                + Add Process
              </button>
            </div>
            <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="process-table" style={{ margin: 0, width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>PID</th>
                    <th>Arrival Time</th>
                    <th>Burst Time</th>
                    <th>Priority</th>
                    <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {processes.map((proc, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          type="text"
                          value={proc.id}
                          onChange={e => handleProcessChange(idx, 'id', e.target.value)}
                          style={{ fontWeight: 600 }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={proc.arrivalTime}
                          onChange={e => handleProcessChange(idx, 'arrivalTime', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          value={proc.burstTime}
                          onChange={e => handleProcessChange(idx, 'burstTime', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={proc.priority}
                          onChange={e => handleProcessChange(idx, 'priority', e.target.value)}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleRemoveProcess(idx)}
                          title="Remove process"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Algorithm Selection Checkboxes Card */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header">
              <h3>Select Algorithms</h3>
              <div className="btn-group">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                  onClick={handleSelectAll}
                >
                  All
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                  onClick={handleDeselectAll}
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {ALL_ALGORITHMS.map(alg => {
                const isSelected = selectedAlgorithms.has(alg.id);
                return (
                  <div
                    key={alg.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected ? 'rgba(79, 142, 247, 0.08)' : 'var(--bg-secondary)',
                      border: `1px solid ${isSelected ? 'rgba(79, 142, 247, 0.4)' : 'var(--border)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => toggleAlgorithm(alg.id)}
                  >
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)'
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleAlgorithm(alg.id)}
                        style={{ cursor: 'pointer', accentColor: 'var(--accent-blue)' }}
                      />
                      <span>{alg.label}</span>
                    </label>

                    {alg.id === 'Round Robin' && isSelected && (
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quantum:</span>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={timeQuantum}
                          onChange={e => setTimeQuantum(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="form-input"
                          style={{
                            width: '56px',
                            padding: '0.2rem 0.4rem',
                            fontSize: '0.8rem',
                            textAlign: 'center'
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results Comparison Section */}
        {comparisonResults.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Results Table Card */}
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-header">
                <h3>Comparative Performance Summary</h3>
                <span className="badge green">
                  {comparisonResults.length} Algorithms Evaluated
                </span>
              </div>
              <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
                <table className="results-table" style={{ margin: 0, width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Algorithm</th>
                      <th>Avg Waiting Time</th>
                      <th>Avg Turnaround Time</th>
                      <th>Avg Response Time</th>
                      <th>CPU Utilization</th>
                      <th>Throughput</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonResults.map(item => {
                      const stats = item.result.statistics;
                      const isBestWT = stats.avgWaitingTime === bestMetrics.minWT;
                      const isBestTAT = stats.avgTurnaroundTime === bestMetrics.minTAT;
                      const isBestRT = stats.avgResponseTime === bestMetrics.minRT;
                      const isBestUtil = stats.cpuUtilization === bestMetrics.maxUtil;
                      const isBestTP = stats.throughput === bestMetrics.maxThroughput;

                      return (
                        <tr key={item.algorithm}>
                          <td>
                            <strong>{item.algorithm}</strong>
                            {item.algorithm === 'Round Robin' && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                                (TQ={timeQuantum})
                              </span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span>{formatVal(stats.avgWaitingTime)}</span>
                              {isBestWT && <span className="badge green" style={{ fontSize: '0.65rem' }}>Best</span>}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span>{formatVal(stats.avgTurnaroundTime)}</span>
                              {isBestTAT && <span className="badge green" style={{ fontSize: '0.65rem' }}>Best</span>}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span>{formatVal(stats.avgResponseTime)}</span>
                              {isBestRT && <span className="badge green" style={{ fontSize: '0.65rem' }}>Best</span>}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span>{stats.cpuUtilization}%</span>
                              {isBestUtil && <span className="badge green" style={{ fontSize: '0.65rem' }}>Best</span>}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span>{stats.throughput.toFixed(4)}</span>
                              {isBestTP && <span className="badge green" style={{ fontSize: '0.65rem' }}>Best</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Custom SVG Bar Chart Card */}
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-header">
                <h3>Visual Metric Benchmark</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Metric:</label>
                  <select
                    className="form-select"
                    value={chartMetric}
                    onChange={e => setChartMetric(e.target.value)}
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                  >
                    <option value="avgWaitingTime">Avg Waiting Time (lower is better)</option>
                    <option value="avgTurnaroundTime">Avg Turnaround Time (lower is better)</option>
                    <option value="avgResponseTime">Avg Response Time (lower is better)</option>
                    <option value="cpuUtilization">CPU Utilization % (higher is better)</option>
                    <option value="throughput">Throughput (higher is better)</option>
                  </select>
                </div>
              </div>

              <div className="card-body">
                <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Comparing <strong>{metricLabels[chartMetric]}</strong> across selected algorithms:
                </div>

                {/* Bar chart container */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    background: 'var(--bg-secondary)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)'
                  }}
                >
                  {chartData.map((d, idx) => {
                    const pct = Math.max(4, Math.round((d.value / maxChartValue) * 100));
                    const isMin = d.value === Math.min(...chartData.map(c => c.value));
                    const isMax = d.value === Math.max(...chartData.map(c => c.value));
                    
                    // Decide highlight based on whether lower or higher is better
                    const isOptimal = (chartMetric === 'cpuUtilization' || chartMetric === 'throughput') ? isMax : isMin;
                    const barColor = isOptimal ? 'var(--accent-green)' : 'var(--accent-blue)';

                    return (
                      <div key={d.algorithm} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {d.algorithm}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: isOptimal ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                            {d.formatted} {chartMetric === 'cpuUtilization' ? '%' : ''}
                            {isOptimal && ' ★ Best'}
                          </span>
                        </div>

                        <div
                          style={{
                            width: '100%',
                            height: '24px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            position: 'relative'
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              backgroundColor: barColor,
                              backgroundImage: isOptimal
                                ? 'linear-gradient(90deg, #059669, #10b981)'
                                : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                              borderRadius: '6px',
                              transition: 'width 0.4s ease-in-out',
                              boxShadow: isOptimal ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
})();


// ----------------------------------------------------
// FILE: js\app.js
// ----------------------------------------------------
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
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
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
  { id: 'dashboard', label: 'Dashboard', icon: '🏠', title: 'Dashboard Overview' },
  { id: 'cpu', label: 'CPU Scheduling', icon: '🖥️', title: 'CPU Scheduling Algorithms' },
  { id: 'page', label: 'Page Replacement', icon: '📄', title: 'Page Replacement Algorithms' },
  { id: 'disk', label: 'Disk Scheduling', icon: '💿', title: 'Disk Scheduling Algorithms' },
  { id: 'memory', label: 'Memory Allocation', icon: '🧩', title: 'Memory Allocation Strategies' },
  { id: 'compare', label: 'Compare', icon: '📊', title: 'Algorithm Comparison & Benchmarks' },
  { id: 'learn', label: 'Learn', icon: '📚', title: 'Interactive Learning & Theory' }
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
          <span style={{ fontSize: '24px', lineHeight: 1 }}>🖥️</span>
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
                <span style={{ fontSize: '18px', display: 'flex', alignItems: 'center' }}>
                  {item.icon}
                </span>
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
