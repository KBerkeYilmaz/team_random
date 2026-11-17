"use client";
// PROTOTYPE, never merge. Liquid workshop, round 9: the pillars' copy, as real text beside
// each liquid shape (the user picked option "A": four pillars, not one logo per service).
//
// Every beat is in the DOM all the time (readable and crawlable); the form variant drives
// each block's --show (0..1) from the scroll story every frame, and workshop.css turns that
// into opacity + a small rise. Nothing here re-renders while you scroll.
import { BEATS } from "./story";

export default function PillarCopy() {
  return (
    <div className="lw-copy" data-lw-copy-root="">
      {BEATS.map((beat) => (
        <section
          key={beat.key}
          data-lw-copy={beat.key}
          aria-label={beat.title}
          className="lw-copy-beat"
        >
          <div className="lw-copy-title">
            {beat.label && (
              <span className="lw-copy-label">
                {beat.label}
                <span aria-hidden="true"> / 04</span>
              </span>
            )}
            <h2>{beat.title}</h2>
          </div>
          {beat.services.length > 0 && (
            <ul className="lw-copy-services">
              {beat.services.map((service) => (
                <li key={service}>{service}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
