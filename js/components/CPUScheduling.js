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
            Process Configuration
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
