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
                          X
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
                            {isOptimal && ' (Best)'}
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
