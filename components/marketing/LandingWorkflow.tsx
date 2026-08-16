import "./landing-workflow.css";

const STEPS = [
  ["Draw", "✎"],
  ["Place", "+"],
  ["Connect", "↗"],
  ["Export", "⇧"],
  ["Add to HA", "⌂"],
  ["Interact", "☝"],
] as const;

const TRUST = [
  ["↓", "No installation"],
  ["○", "No account required"],
  ["▱", "Runs locally"],
  ["{}", "Native Picture Elements YAML"],
] as const;

export function LandingWorkflow() {
  return (
    <>
      <section className="landing-workflow" aria-labelledby="landing-workflow-title">
        <div className="marketing-container">
          <h2 id="landing-workflow-title">From floor plan to dashboard in minutes</h2>
          <ol className="landing-workflow-steps">
            {STEPS.map(([label, icon], index) => (
              <li key={label}>
                <span className="landing-step-icon" aria-hidden="true">{icon}</span>
                <span>{label}</span>
                {index < STEPS.length - 1 && <span className="landing-step-arrow" aria-hidden="true">→</span>}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="landing-trust" aria-label="HAFloorplan product characteristics">
        <div className="marketing-container landing-trust-grid">
          {TRUST.map(([icon, label]) => (
            <div className="landing-trust-item" key={label}>
              <span className="landing-trust-icon" aria-hidden="true">{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
