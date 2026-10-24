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
