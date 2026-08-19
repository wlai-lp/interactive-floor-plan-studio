import type { Metadata } from "next";
import Link from "next/link";
import "../blog.css";

export const metadata: Metadata = {
  title: "I Built My Home Assistant Floor Plan with HAFloorplan — Here’s What Worked and What Didn’t",
  description: "An early HAFloorplan user shares a candid first experience: what felt easy, what worked in Home Assistant, and what still needs improvement.",
};

export default function EarlyUserExperiencePage() {
  return <article className="article-page">
    <Link className="blog-back" href="/blog">← All articles</Link>
    <span className="blog-eyebrow">USER EXPERIENCE · EARLY FEEDBACK</span>
    <h1>I Built My Home Assistant Floor Plan with HAFloorplan — Here’s What Worked and What Didn’t</h1>

    <p className="article-lede">
      I recently tried HAFloorplan to recreate my floor and turn it into a Home Assistant floor-plan dashboard. This is an early-user account of what worked for me, what still felt rough, and how I would rate the experience today.
    </p>

    <aside className="prereq">
      <strong>A note about this article</strong>
      <p>This first-person account is based on feedback from an actual early HAFloorplan user and has been lightly edited for clarity. No name, background, setup details, timing, or recommendations have been added beyond what the user actually reported.</p>
    </aside>

    <section className="step">
      <h2>The short demo was enough to get me started</h2>
      <p>At first I needed to see how the room-drawing workflow worked. After watching the short demo on the landing page, drawing rooms felt pretty intuitive.</p>
      <p>That was important because I did not want to spend a lot of time learning another design tool before I could start building the floor plan.</p>
    </section>

    <section className="step">
      <h2>I was able to recreate my whole floor relatively quickly</h2>
      <p>Once I understood the drawing interaction, I was able to recreate my whole floor relatively quickly. The core workflow made sense, and I could keep adding and arranging rooms until the overall layout represented my floor.</p>
      <p>For ease of use, I would give the current experience a <strong>B</strong>.</p>
    </section>

    <section className="step">
      <h2>Adding Home Assistant entities was easy</h2>
      <p>The Home Assistant part was straightforward. Adding HA entities was easy, and I did not run into a problem getting the devices into the project.</p>
      <p>That matters because the point of the floor plan, for me, is not only to draw the rooms. It needs to become something I can actually use in Home Assistant.</p>
    </section>

    <section className="step">
      <h2>The generated YAML worked without an issue</h2>
      <p>The strongest part of the experience was the handoff to Home Assistant. The generated YAML worked without an issue.</p>
      <p>I would give the Home Assistant side of the experience a <strong>B</strong>. The basic workflow did what I expected: I could create the floor plan, add the entities, generate the configuration, and use it in Home Assistant.</p>
    </section>

    <section className="step">
      <h2>Where the editor still needs work</h2>
      <p>The biggest improvements I would like are around drawing and arranging the rooms.</p>
      <ul>
        <li><strong>A rectangle drawing tool.</strong> For rectangular rooms, being able to draw a rectangle directly would be easier than the current room-drawing workflow.</li>
        <li><strong>Snap rooms together while dragging.</strong> It would be much easier to line up neighboring rooms if their edges could snap together as I move them.</li>
        <li><strong>Display the room name on the floor plan.</strong> I want to be able to see text identifying each room directly in the finished floor plan.</li>
      </ul>
      <p>Those details are part of why I would currently give the <strong>actual result a C</strong>. I could build the floor and get it into Home Assistant, but the finished visual result still has room to improve.</p>
    </section>

    <section className="success-box">
      <h2>My current score</h2>
      <p><strong>Ease of use: B</strong></p>
      <p><strong>Actual result: C</strong></p>
      <p><strong>Home Assistant experience: B</strong></p>
      <p>Overall, the core idea worked for me: the short demo helped me understand the editor, I recreated my floor, adding Home Assistant entities was easy, and the generated YAML worked. The next improvements I would most like to see are simpler rectangle drawing, room snapping, and visible room labels.</p>
    </section>

    <div className="cta-row">
      <Link className="cta-primary" href="/editor">Try the Editor</Link>
      <Link className="cta-secondary" href="/blog/getting-started">Read Getting Started</Link>
    </div>
  </article>;
}
