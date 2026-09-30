/*
 * What the LLM judges score. Each criterion is scored 0–10 by a judge and
 * scaled to its points; the automated checks in score.ts make up the rest of
 * the 100 points.
 */

export interface Criterion {
  id: string
  title: string
  points: number
  lookFor: string
  /**
   * Caps this criterion at another criterion's score plus `margin`, applied in
   * score.ts after judging. The judge scores both independently.
   */
  cap?: { by: string; margin: number }
}

export interface Rubric {
  id: 'experience' | 'code' | 'process'
  title: string
  criteria: Criterion[]
}

export const EXPERIENCE_RUBRIC: Rubric = {
  id: 'experience',
  title: 'Experience and use of assets',
  criteria: [
    {
      id: 'cohesion',
      title: 'Cohesion with the subject',
      points: 7,
      lookFor:
        "Does the page belong to its subject? Judge its visual language (palette, typography, texture, iconography, motion and the tone of its copy) against the subject's established identity and the mood of the provided assets. An Ocarina of Time clock should feel like Hyrule; a clock for the next iPhone should feel like Apple. A clean page in the wrong idiom, such as a SaaS landing page for a fantasy game, scores low here however polished it is, and so do assets that look pasted into a foreign design. For a subject you don't know, the brief's context and the assets are the reference. It should also feel like an event, with drama and a point of view, not a generic countdown with a logo on it.",
    },
    {
      id: 'visual_craft',
      title: 'Visual craft',
      points: 7,
      cap: { by: 'cohesion', margin: 2 },
      lookFor:
        'Typography, spacing, color, hierarchy and finish. Does it look designed by someone with taste, or like a template? Look for rough edges: misalignment, clipped text, awkward wrapping, inconsistent spacing, low contrast, default browser styling. Score execution only; fit with the subject is scored under cohesion.',
    },
    {
      id: 'legibility',
      title: 'Countdown legibility',
      points: 4,
      lookFor:
        'Can you tell how much time is left at a glance? Are the units clear? Is the layout stable while it ticks (no jitter from proportional digits)? Is the countdown the hero?',
    },
    {
      id: 'motion_interaction',
      title: 'Motion and interactivity',
      points: 4,
      cap: { by: 'cohesion', margin: 2 },
      lookFor:
        'Compare the motion frames, pointer frames and click captures. Is there meaningful motion and interaction that adds to the experience, with visible hover and focus states? Penalise both a static page and gimmicks that get in the way. Score execution only; fit with the subject is scored under cohesion.',
    },
    {
      id: 'responsive_and_states',
      title: 'Phone layout and edge states',
      points: 3,
      lookFor:
        'Is the 390px layout designed rather than merely squeezed? Are the final seconds and the arrival designed moments, or afterthoughts? Nothing broken, negative or overlapping.',
    },
    {
      id: 'asset_selection',
      title: 'Asset selection',
      points: 5,
      lookFor:
        'Look at every provided asset in assets/. Did the agent pick the right assets for the right jobs and give the strongest ones prominence? Leaving weak or redundant assets out is good judgment; dumping everything on the page is not.',
    },
    {
      id: 'asset_treatment',
      title: 'Asset treatment',
      points: 5,
      lookFor:
        "Are the chosen assets integrated well: cropping, compositing, blending, color harmony, sensible sizes and formats, alt text? Does the treatment suit the assets' own style rather than fight it? Did the agent get more out of fewer assets?",
    },
  ],
}

export const CODE_RUBRIC: Rubric = {
  id: 'code',
  title: 'Codebase',
  criteria: [
    {
      id: 'navigability',
      title: 'Navigability',
      points: 4,
      lookFor:
        'Could an engineer new to this codebase find the countdown math, the ?now override and each visual piece within a couple of minutes? Is the file structure sensible for its size? Does the README say what this is and how to work on it?',
    },
    {
      id: 'separation',
      title: 'Separation of concerns',
      points: 3,
      lookFor:
        'Is the time logic pure, separate from presentation and easy to test? Is there a single source of truth for the target moment? Are components cohesive, with state where it belongs?',
    },
    {
      id: 'readability',
      title: 'Readability',
      points: 4,
      lookFor:
        'Clear names, reasonably small components and functions, consistent idioms, comments that explain why rather than what, no needless cleverness. Would you approve this in review?',
    },
    {
      id: 'finish',
      title: 'Finish',
      points: 4,
      lookFor:
        'No leftovers from iteration: dead components, commented-out code, unused CSS, abandoned experiments, stale TODOs, scaffold boilerplate. Is every dependency justified? Does it read like a finished handover, not a work in progress?',
    },
  ],
}

export const PROCESS_RUBRIC: Rubric = {
  id: 'process',
  title: 'Process: self-critique, persistence, verification',
  criteria: [
    {
      id: 'verification',
      title: 'Verification',
      points: 5,
      lookFor:
        'Did the agent check its own work where it matters: phone and desktop, weeks out, final seconds, the arrival, and after its last changes? Did it run the build, lint and type-check itself? Screenshots only at the end, or never after the final edits, count against it.',
    },
    {
      id: 'critique_quality',
      title: 'Critique quality',
      points: 6,
      lookFor:
        'When it looked at its screenshots, were its critiques specific, visual and honest, naming real problems a design lead would agree with? Or generic ("looks great", "polished and modern") and self-congratulatory?',
    },
    {
      id: 'follow_through',
      title: 'Follow-through',
      points: 5,
      lookFor:
        'Did the critiques turn into changes that fixed the problems? Compare early, middle and late screenshots: did the work get clearly better? Were problems noticed and then forgotten?',
    },
    {
      id: 'persistence',
      title: 'Persistence',
      points: 5,
      lookFor:
        'Did it sustain purposeful iteration and push past its first "good enough"? Reward long, productive work; do not reward spinning on trivia or churn without improvement.',
    },
    {
      id: 'honesty',
      title: 'Honest handover',
      points: 4,
      lookFor:
        'Compare HANDOVER.md and the final messages with the measured facts. Are its claims true (for example "no type errors", "works on mobile")? Does it name known gaps? Overclaiming is penalised heavily; a missing handover scores at most 2.',
    },
  ],
}

export const RUBRICS = [EXPERIENCE_RUBRIC, CODE_RUBRIC, PROCESS_RUBRIC]
