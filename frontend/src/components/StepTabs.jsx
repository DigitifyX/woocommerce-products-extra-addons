/**
 * StepTabs – horizontal step/progress bar.
 */

export default function StepTabs({ groups, activeStep, onStepChange, selections }) {
  return (
    <div className="gvc-steps">
      <div className="gvc-steps__track">
        <div
          className="gvc-steps__progress"
          style={{ width: `${((activeStep + 1) / groups.length) * 100}%` }}
        />
      </div>

      <div className="gvc-steps__tabs">
        {groups.map((group, idx) => {
          const isActive = idx === activeStep;
          const isCompleted = !!selections[group.id];
          const isPast = idx < activeStep;

          let className = 'gvc-step';
          if (isActive) className += ' gvc-step--active';
          if (isCompleted) className += ' gvc-step--completed';
          if (isPast && !isActive) className += ' gvc-step--past';

          return (
            <button
              key={group.id}
              className={className}
              onClick={() => onStepChange(idx)}
              title={group.title}
            >
              <span className="gvc-step__number">
                {isCompleted && !isActive ? '✓' : idx + 1}
              </span>
              <span className="gvc-step__label">{group.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
