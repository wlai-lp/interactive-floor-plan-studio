import type { Metadata } from "next";
import Link from "next/link";
import "../blog.css";

export const metadata: Metadata = {
  title: "Getting Started with HAFloorplan",
  description: "Create a working Home Assistant Picture Elements floor plan with HAFloorplan in five steps.",
};

const Screenshot = ({ src, alt, caption, width, height }: { src: string; alt: string; caption: string; width: number; height: number }) => <figure className="tutorial-screenshot">
  <a href={src} target="_blank" rel="noreferrer" aria-label={`${alt} — open full-size screenshot`}>
    <img src={src} alt={alt} width={width} height={height} loading="lazy" />
  </a>
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
      <p>Choose <strong>Open Editor</strong> and work in the visual floor-plan editor. Your rooms define the floor plan, and devices are placed where you want their Home Assistant controls to appear.</p>
      <Screenshot
        src="https://github.com/user-attachments/assets/bb21106d-72c8-47fe-a972-45bbb928101a"
        alt="Current HAFloorplan editor showing the floor-plan canvas, device controls, and inspector"
        width={1166}
        height={970}
        caption="The current HAFloorplan editor. Build or import the floor plan, then add or select the Light or Power Plug you want to configure."
      />
    </section>

    <section className="step">
      <h2>2. Enter the Title and Home Assistant Entity ID</h2>
      <p>Select the Light or Power Plug on the floor plan. In the device inspector, enter a friendly <strong>Title</strong> and the exact <strong>Entity ID</strong> you identified before starting. These are the two required values for the current MVP.</p>
      <Screenshot
        src="https://github.com/user-attachments/assets/db45e10e-5ceb-4498-b081-5eb7ca8cabfc"
        alt="HAFloorplan device inspector showing the Title and Home Assistant Entity ID fields"
        width={593}
        height={520}
        caption="Configure the selected device using the Title and Home Assistant Entity ID fields shown in the current inspector."
      />
      <p>The Entity ID is the critical connection to Home Assistant. HAFloorplan handles the normal Picture Elements control structure for you, so you do not need to write the Lovelace action YAML yourself.</p>
    </section>

    <section className="step">
      <h2>3. Export for Home Assistant and copy the YAML</h2>
      <p>Open the editor <strong>Actions</strong> menu and choose <strong>Export for Home Assistant</strong>. HAFloorplan checks the project and opens the export screen with the generated Picture Elements configuration.</p>
      <Screenshot
        src="https://github.com/user-attachments/assets/a6cd27ca-b734-4adf-a9cf-20cab32cc465"
        alt="HAFloorplan Actions menu with Export for Home Assistant available"
        width={593}
        height={520}
        caption="Use Actions → Export for Home Assistant after the device has a Title and Entity ID."
      />
      <p>On the export screen, click <strong>Copy YAML to Clipboard</strong>. Copy the complete generated configuration; there is no need to select individual YAML sections.</p>
      <Screenshot
        src="https://github.com/user-attachments/assets/9be60fa4-06fd-40f3-96a6-e8659baa4439"
        alt="HAFloorplan Home Assistant export screen with generated YAML and Copy YAML to Clipboard control"
        width={1180}
        height={829}
        caption="The Home Assistant export screen is the handoff point: copy the complete generated YAML to the clipboard."
      />
    </section>

    <section className="step">
      <h2>4. Create a Panel view and paste the YAML in Home Assistant</h2>
      <p>In Home Assistant, edit the dashboard where you want the floor plan and create a view configured as <strong>Panel</strong>. A Panel view lets one card use the dashboard view as its primary full-width surface, which is the intended layout for this floor-plan workflow.</p>
      <Screenshot
        src="https://github.com/user-attachments/assets/83785b7f-eaad-410a-ab36-50875ad292d5"
        alt="Home Assistant dashboard view configuration showing the Panel layout option"
        width={810}
        height={421}
        caption="Configure the Home Assistant dashboard view as Panel before adding the HAFloorplan card."
      />
      <p>Add any card as a temporary starting card. Open that card&apos;s menu, choose <strong>Show code editor</strong>, replace the card configuration with the complete YAML copied from HAFloorplan, and save.</p>
      <Screenshot
        src="https://github.com/user-attachments/assets/8f9fcb13-4b50-449c-b977-0e1be9897f09"
        alt="Home Assistant card editor showing Show code editor and the YAML editing area"
        width={1150}
        height={1033}
        caption="Switch the temporary card to Show code editor, paste the complete HAFloorplan YAML, then save the card."
      />
      <p>Treat the generated YAML as the complete card configuration for this MVP path. You should not need to understand or edit the generated Picture Elements structure.</p>
    </section>

    <section className="step">
      <h2>5. Verify the rendered floor plan</h2>
      <p>After saving, Home Assistant should render the floor plan as a Picture Elements card. The Light or Switch appears at the location you placed it in HAFloorplan. Tap the entity control and verify that it operates the Home Assistant entity you mapped.</p>
      <Screenshot
        src="https://github.com/user-attachments/assets/c0831798-311b-4ac6-8fc7-0190ec303456"
        alt="Home Assistant dashboard showing the completed HAFloorplan Picture Elements floor-plan card"
        width={1512}
        height={1229}
        caption="Success: the generated floor plan is rendered in Home Assistant with the mapped device controls positioned on the floor plan."
      />
    </section>

    <section className="success-box">
      <h2>You are done</h2>
      <p>Your Home Assistant dashboard now contains a native Picture Elements floor-plan card generated by HAFloorplan. The important connection is the Entity ID: HAFloorplan handles the YAML structure and places the Home Assistant control at the position you selected.</p>
    </section>

    <div className="cta-row"><Link className="cta-primary" href="/editor">Open Editor</Link><Link className="cta-secondary" href="/blog">Browse all articles</Link></div>
  </article>;
}
