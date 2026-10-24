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
            <button onClick={onStepBack} disabled={currentStep <= 0} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded text-sm">Prev</button>
            <button onClick={onPlayPause} className="px-4 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium">
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button onClick={onStepForward} disabled={totalSteps === 0 || currentStep >= totalSteps - 1} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded text-sm">Next</button>
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
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
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
