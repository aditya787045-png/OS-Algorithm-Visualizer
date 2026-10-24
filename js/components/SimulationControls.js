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
            style={{ width: 'auto', padding: '0 12px', borderRadius: '6px' }}
          >
            Prev
          </button>

          {isPlaying ? (
            <button
              type="button"
              className="sim-btn sim-btn-pause active-action"
              onClick={onPause}
              aria-label="Pause Simulation"
              title="Pause Simulation"
              style={{ width: 'auto', padding: '0 14px', borderRadius: '6px' }}
            >
              Pause
            </button>
          ) : (
            <button
              type="button"
              className="sim-btn sim-btn-play"
              onClick={onPlay}
              disabled={currentStep >= maxStep && totalSteps > 0}
              aria-label="Play Simulation"
              title="Play Simulation"
              style={{ width: 'auto', padding: '0 14px', borderRadius: '6px' }}
            >
              Play
            </button>
          )}

          <button
            type="button"
            className="sim-btn sim-btn-next"
            onClick={onNext}
            disabled={currentStep >= maxStep}
            aria-label="Next Step"
            title="Next Step"
            style={{ width: 'auto', padding: '0 12px', borderRadius: '6px' }}
          >
            Next
          </button>

          <button
            type="button"
            className="sim-btn sim-btn-reset"
            onClick={onReset}
            aria-label="Reset Simulation"
            title="Reset Simulation"
            style={{ width: 'auto', padding: '0 12px', borderRadius: '6px' }}
          >
            Reset
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
