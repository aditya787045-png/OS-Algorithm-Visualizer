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
                  Prev
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentStep(prev => Math.min(totalStepsCount - 1, prev + 1))}
                  disabled={currentStep >= totalStepsCount - 1}
                >
                  Next
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
                                <span style={{ color: 'var(--text-muted)' }}>-</span>
                              )}
                            </td>
                            <td>
                              {isAllocated ? `${alloc.blockSize} KB` : '-'}
                            </td>
                            <td>
                              {isAllocated ? (
                                <span style={{ color: alloc.internalFragmentation > 0 ? 'var(--accent-orange)' : 'var(--text-muted)' }}>
                                  {alloc.internalFragmentation} KB
                                </span>
                              ) : (
                                '-'
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
