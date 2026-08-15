import type { Metadata } from "next";
import Link from "next/link";
import "../blog.css";

export const metadata: Metadata = {
  title: "Getting Started with HAFloorplan",
  description: "Create a working Home Assistant Picture Elements floor plan with HAFloorplan in five steps.",
};

const Window = ({ title, children, caption }: { title: string; children: React.ReactNode; caption: string }) => <figure className="tutorial-visual">
  <div className="visual-bar"><span className="visual-dot"/><span className="visual-dot"/><span className="visual-dot"/><strong>{title}</strong></div>
  <div className="visual-body">{children}</div>
  <figcaption>{caption}</figcaption>
</figure>;

export default function GettingStartedPage() {
  return <article className="article-page">
    <Link className="blog-back" href="/blog">← All articles</Link>
    <span className="blog-eyebrow">GETTING STARTED · 5 STEPS</span>
    <h1>Getting Started with HAFloorplan</h1>
    <p className="article-lede">HAFloorplan turns the devices you place on your floor plan into a native Home Assistant <code>picture-elements</code> card. You do not need to hand-write the YAML. This guide takes you from the editor to a working dashboard card using the current Light/Switch MVP.</p>

    <aside className="prereq">
      <strong>Prerequisite: identify a Home Assistant entity first.</strong>
      <p>Before you begin, choose at least one entity that already exists in Home Assistant. For a light, use an Entity ID such as <code>light.living_room</code>. For a switch or power plug, use an Entity ID such as <code>switch.floor_lamp</code>. HAFloorplan uses this value to connect the control on the floor plan to the real Home Assistant entity.</p>
    </aside>

    <section className="step">
      <h2>1. Open the HAFloorplan editor</h2>
      <p>Open HAFloorplan and start in the floor-plan editor. Your project is created and edited here: rooms define the floor plan, and devices are placed at the location where you want them to appear in Home Assistant.</p>
      <Window title="HAFloorplan editor" caption="The editor is the starting point for the MVP workflow. Add or select the Light or Power Plug you want to configure.">
        <div className="ui-panel">
          <div className="ui-row"><span className="ui-label">SEMANTIC EDITOR</span><div className="ui-input">Sample project</div></div>
          <div className="focus-target ui-button primary">Open / use editor</div>
          <div className="floorplan-demo"><span className="room-label">Living room</span><span className="entity-node">⌁</span></div>
        </div>
      </Window>
    </section>

    <section className="step">
      <h2>2. Enter the Title and Home Assistant Entity ID</h2>
      <p>Select the Light or Power Plug on the floor plan. In the device configuration, enter a friendly title and the exact Home Assistant Entity ID you identified before starting. The Entity ID is the critical value: it tells the generated Picture Elements card which Home Assistant entity to control.</p>
      <Window title="Device configuration" caption="Enter a human-friendly title, then the exact Home Assistant Entity ID. The highlighted fields are the values to verify before export.">
        <div className="ui-panel">
          <div className="ui-row"><span className="ui-label">Title</span><div className="focus-target ui-input">Living room light</div></div>
          <div className="ui-row"><span className="ui-label">Home Assistant Entity ID</span><div className="focus-target focus-sequence second ui-input">light.living_room</div></div>
          <div className="ui-row"><span className="ui-label">Default behavior</span><div className="ui-input">Tap: Toggle · Hold: More info</div></div>
        </div>
      </Window>
      <p>For the MVP, HAFloorplan supplies the normal control behavior automatically. You should not need to understand the underlying Lovelace action syntax.</p>
    </section>

    <section className="step">
      <h2>3. Export for Home Assistant and copy the YAML</h2>
      <p>When the device is configured, open <strong>Export to Home Assistant</strong>. HAFloorplan validates the project and generates the complete Picture Elements configuration. Click <strong>Copy YAML to clipboard</strong>.</p>
      <Window title="Export to Home Assistant" caption="The animation draws attention to the generated YAML action. Copy the complete configuration; you do not need to edit it for the normal MVP flow.">
        <div className="ui-panel">
          <h3>Generated YAML</h3>
          <div className="yaml-box">type: picture-elements{"\n"}image: data:image/svg+xml;base64,...{"\n"}elements:{"\n"}  - type: state-icon{"\n"}    entity: light.living_room</div>
          <div className="focus-target ui-button primary">Copy YAML to clipboard</div>
        </div>
      </Window>
    </section>

    <section className="step">
      <h2>4. Paste the YAML into your Home Assistant dashboard</h2>
      <p>Open the Home Assistant dashboard where you want the floor plan. Edit the dashboard and add a card. In the card editor, choose <strong>Show code editor</strong>. Replace the card configuration with the YAML from HAFloorplan, then save the card.</p>
      <Window title="Home Assistant card editor" caption="Choose Show code editor, then paste the complete HAFloorplan YAML into the card configuration area and save.">
        <div className="ui-panel">
          <div className="focus-target ui-menu">⋮ &nbsp; Show code editor</div>
          <div className="focus-target focus-sequence second yaml-box">type: picture-elements{"\n"}image: data:image/svg+xml;base64,...{"\n"}elements:{"\n"}  - type: state-icon{"\n"}    entity: light.living_room</div>
          <div className="ui-button primary">Save</div>
        </div>
      </Window>
      <p>For this workflow, treat the generated YAML as a complete card configuration. You do not need to copy individual pieces out of it.</p>
    </section>

    <section className="step">
      <h2>5. Verify the rendered floor plan</h2>
      <p>After saving, Home Assistant should render the floor plan as a Picture Elements card. The Light or Switch appears at the location you placed it in HAFloorplan. Tap the entity control and verify that it operates the Home Assistant entity you mapped.</p>
      <Window title="Home Assistant dashboard" caption="Success: the floor plan renders and the mapped entity appears at the configured location. The highlighted entity should control light.living_room.">
        <div className="ui-panel">
          <div className="floorplan-demo">
            <span className="room-label">Living room</span>
            <span className="focus-target entity-node" aria-label="Living room light entity">💡</span>
          </div>
        </div>
      </Window>
    </section>

    <section className="success-box">
      <h2>You are done</h2>
      <p>Your Home Assistant dashboard now contains a native Picture Elements floor-plan card generated by HAFloorplan. The important connection is the Entity ID: HAFloorplan handles the YAML structure and places the Home Assistant control at the position you selected.</p>
    </section>

    <div className="cta-row"><Link className="cta-primary" href="/">Open HAFloorplan</Link><Link className="cta-secondary" href="/blog">Browse all articles</Link></div>
  </article>;
}
