"use client";
// PROTOTYPE, never merge. Liquid workshop, round 9: the pillars' copy, as real text beside
// each liquid shape (the user picked option "A": four pillars, not one logo per service).
//
// Round 10 ("it feels a bit instant", "more breathing room"): the copy no longer fades
// with the scrub. The form variant sets each block's data-state ("in", or the side it
// rests on: "above" once the story has passed it, otherwise none, i.e. below), and
// workshop.css plays a timed entrance: the label, then the title letter by letter, then
// the services, each rising out of a mask. Exits leave the way the scroll goes. Every beat
// stays in the DOM (readable and crawlable); the title's letters are aria-hidden behind a
// screen-reader copy of the whole word. Nothing here re-renders while you scroll.
// Round 11: hovering (or tapping) a service turns the pillar's liquid into its shape.
import { Fragment, type CSSProperties } from "react";

import { BEATS, PILLARS } from "./story";

/** Inline custom properties (the stagger indices the CSS reads). */
const vars = (v: Record<string, number>) => v as CSSProperties;

/**
 * A title's words, each with the index of its first letter: every word gets its own mask
 * (so a long title can still wrap between words), while the letter stagger runs on
 * across them.
 */
function words(title: string) {
  let from = 0;
  return title.split(" ").map((word) => {
    const entry = { word, from };
    from += Array.from(word).length;
    return entry;
  });
}

// Round 11, services that react on hover: the hovered service's key on <html>, which the
// form variant reads every frame (it only acts while that service's pillar holds, and it
// clears the key when the story moves on). Decorative: the list reads the same without it.
const hovered = () => document.documentElement.dataset.lwHover;
const hover = (key: string) => {
  document.documentElement.dataset.lwHover = key;
};
const unhover = (key: string) => {
  if (hovered() === key) delete document.documentElement.dataset.lwHover;
};

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
              <span className="lw-copy-label lw-mask">
                <span className="lw-rise">
                  {beat.label}
                  <span aria-hidden="true"> / 0{PILLARS.length}</span>
                </span>
              </span>
            )}
            <h2>
              <span className="sr-only">{beat.title}</span>
              <span aria-hidden="true">
                {words(beat.title).map(({ word, from }, w) => (
                  <Fragment key={w}>
                    {w > 0 && " "}
                    <span className="lw-mask lw-copy-word">
                      {Array.from(word).map((ch, i) => (
                        <span
                          key={i}
                          className="lw-char"
                          style={vars({ "--c": from + i })}
                        >
                          {ch}
                        </span>
                      ))}
                    </span>
                  </Fragment>
                ))}
              </span>
            </h2>
          </div>
          {beat.services.length > 0 && (
            <ul className="lw-copy-services">
              {beat.services.map((service, i) => (
                <li
                  key={service.key}
                  className="lw-mask"
                  onPointerEnter={(event) => {
                    if (event.pointerType !== "touch") hover(service.key);
                  }}
                  onPointerLeave={(event) => {
                    if (event.pointerType !== "touch") unhover(service.key);
                  }}
                  onPointerUp={(event) => {
                    // A tap shows it (and a second tap hides it again).
                    if (event.pointerType !== "touch") return;
                    if (hovered() === service.key) unhover(service.key);
                    else hover(service.key);
                  }}
                >
                  <span className="lw-rise" style={vars({ "--i": i })}>
                    {service.label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
