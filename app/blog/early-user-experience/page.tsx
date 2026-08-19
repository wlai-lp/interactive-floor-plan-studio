import type { Metadata } from "next";
import Link from "next/link";
import "../blog.css";

export const metadata: Metadata = {
  title: "I Built My Home Assistant Floor Plan with HAFloorplan — Here’s What Worked and What Didn’t",
  description: "An early HAFloorplan user shares a candid first experience: starting from no floor-plan dashboard, building a floor, exporting working YAML, and what still needs improvement.",
};

export default function EarlyUserExperiencePage() {
  return <article className="article-page">
    <Link className="blog-back" href="/blog">← All articles</Link>
    <span className="blog-eyebrow">USER EXPERIENCE · EARLY FEEDBACK</span>
    <h1>I Built My Home Assistant Floor Plan with HAFloorplan — Here’s What Worked and What Didn’t</h1>

    <p className="article-lede">
      I wanted a floor-plan dashboard in Home Assistant, but before trying HAFloorplan I was not using one at all. For me, there was no easy solution for creating the floor plan and integrating it with Home Assistant. I tried HAFloorplan to see whether I could finally build one myself.
    </p>

    <aside className="prereq">
      <strong>A note about this article</strong>
      <p>This first-person account is based on feedback from an actual early HAFloorplan user and has been lightly edited for clarity. The ratings, criticism, recommendations, and requested improvements come from the user&apos;s own feedback.</p>
    </aside>

    <section className="step">
      <h2>I had wanted a floor-plan dashboard, but I did not know how to start</h2>
      <p>Before HAFloorplan, I was not using any Home Assistant floor-plan solution. The main reason was simple: I did not have an easy way to create an actual floor plan and integrate it with Home Assistant.</p>
      <p>That was the biggest barrier for me. The idea of a floor-plan dashboard was appealing, but getting from an idea to a usable dashboard felt like too much work.</p>
    </section>

    <section className="step">
      <h2>The short demo was enough to get me started</h2>
      <p>After watching the short demo on the landing page, drawing rooms felt pretty intuitive. Once I understood the basic interaction, I was able to recreate my whole floor relatively quickly.</p>
      <p>For ease of use, I would give the current experience a <strong>B</strong>.</p>
    </section>

    <section className="step">
      <h2>Building the floor plan was the part that mattered most</h2>
      <p>The thing that normally takes the most effort is creating an actual floor plan and then integrating it with Home Assistant. HAFloorplan gave me one place to draw the rooms and then add the Home Assistant entities I wanted to use.</p>
      <p>Adding HA entities was easy. I did not have trouble mapping the devices I wanted into the project.</p>
    </section>

    <section className="step">
      <h2>The generated YAML worked without an issue</h2>
      <p>The strongest part of the experience was the handoff to Home Assistant. The generated YAML worked without an issue.</p>
      <p>I would give the Home Assistant side of the experience a <strong>B</strong>. I was able to create the floor plan, add the entities, generate the configuration, and get the result into Home Assistant.</p>
    </section>

    <section className="step">
      <h2>The final result still feels too raw</h2>
      <p>I would currently give the <strong>actual result a C</strong>. It works, but visually the finished floor plan still feels too raw.</p>
      <p>The three improvements that would make the biggest difference for me are:</p>
      <ul>
        <li><strong>A rectangle drawing tool.</strong> Most of the rooms I need are rectangular, so drawing a rectangle directly would make room creation faster and more precise.</li>
        <li><strong>Snap rooms together while dragging.</strong> Neighboring rooms should line up naturally instead of requiring small manual adjustments.</li>
        <li><strong>Display the room name on the floor plan.</strong> The finished Home Assistant view should make it immediately clear which room is which.</li>
      </ul>
      <p>If rectangle drawing, room snapping, and room labels were added, I would raise my result score from a <strong>C to a B</strong>.</p>
    </section>

    <section className="step">
      <h2>Who I would recommend it to</h2>
      <p>I would recommend HAFloorplan to Home Assistant users who want to build a floor plan but do not know how to start.</p>
      <p>I would also encourage early users to give feedback. The core workflow already works, and feedback on the drawing and finished presentation can help improve the product.</p>
    </section>

    <section className="success-box">
      <h2>My current score</h2>
      <p><strong>Ease of use: B</strong></p>
      <p><strong>Actual result: C</strong> — potentially a B with rectangle drawing, snapping, and room labels.</p>
      <p><strong>Home Assistant experience: B</strong></p>
      <p>For me, the most important thing is that I went from not having a floor-plan dashboard at all to having one working in Home Assistant. The editor made it possible to get started, and the generated YAML worked. The next step is making the finished floor plan look more polished.</p>
    </section>

    <div className="cta-row">
      <Link className="cta-primary" href="/editor">Try the Editor</Link>
      <Link className="cta-secondary" href="/blog/getting-started">Read Getting Started</Link>
    </div>
  </article>;
}
