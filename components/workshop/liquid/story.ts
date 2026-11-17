// PROTOTYPE, never merge. Liquid workshop, round 9: what the scroll story says.
//
// The user does design, build and scale work across many services (SaaS, product
// design, web, mobile, infrastructure, DevOps, SEO, advisory) but did not want "10
// logos". So the story has four pillars, one liquid shape each, with the services as
// real text beside the shape (option "A" in round 8), then contact. The grouping was my
// proposal, accepted as pitched.
//
// Shared by the engine (shapes.ts maps each key to its liquid shape) and the page (the
// copy overlay and the nav), so keys must match SHAPES in engine/shapes.ts.

export interface Beat {
  key: string;
  /** Small label above the title ("01"); empty for contact. */
  label: string;
  title: string;
  services: readonly string[];
}

export const PILLARS: readonly Beat[] = [
  {
    key: "design",
    label: "01",
    title: "Design",
    services: ["Product design", "SaaS strategy"],
  },
  {
    key: "build",
    label: "02",
    title: "Build",
    services: ["Web", "Mobile", "SaaS platforms"],
  },
  {
    key: "scale",
    label: "03",
    title: "Scale",
    services: ["Infrastructure", "DevOps", "SEO"],
  },
  {
    key: "advise",
    label: "04",
    title: "Advise",
    services: ["Technical advisory"],
  },
];

export const CONTACT: Beat = {
  key: "contact",
  label: "",
  title: "Let’s talk",
  services: [],
};

/** The story's beats, in scroll order. */
export const BEATS: readonly Beat[] = [...PILLARS, CONTACT];
