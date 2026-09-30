/*
 * What the LLM judges score. Each criterion is scored by a judge and scaled
 * to its points; the automated checks in score.ts make up the rest of the
 * 100 points.
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
  /**
   * Net-effect criteria are scored from −5 to +5, with 0 when the page has
   * none of the thing, and earn from −points to +points. Absence is neutral;
   * something that makes the page worse costs points.
   */
  netEffect?: boolean
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
        "Does the page belong to its subject? Judge its visual language (palette, typography, texture, iconography, motion and the tone of its copy) against the subject's established identity and the mood of the provided assets. An Ocarina of Time clock should feel like Hyrule; a clock for the next iPhone should feel like Apple. A clean page in the wrong idiom, such as a SaaS landing page for a fantasy game, scores low here however polished it is, and so do assets that look pasted into a foreign design. For a subject you don't know, the brief's context and the assets are the reference. Check drawn depictions of the subject's iconic objects against the provided assets and the reference facts: a drawing that gets a famous object wrong counts against the page. Colours that clash with the rest of the page count against it unless the subject explains them. The page should make the moment feel like an event, but that's about how well it does it, not how much it does: a sparse page with one strong idea can do it better than a busy one.",
    },
    {
      id: 'visual_craft',
      title: 'Visual craft',
      points: 7,
      cap: { by: 'cohesion', margin: 2 },
      lookFor:
        'Typography, spacing, color, hierarchy and finish. Does it look designed by someone with taste, or like a template? Look for rough edges: misalignment, clipped text, text touching the edge of its panel, backdrops that end before the page does, a page that scrolls to nothing, awkward wrapping, inconsistent spacing, low contrast, default browser styling. The layout findings in the evidence are leads; confirm each in the captures. Score execution only; fit with the subject is scored under cohesion.',
    },
    {
      id: 'legibility',
      title: 'Legibility',
      points: 4,
      lookFor:
        'Can you tell how much time is left at a glance? Are the units clear, with visible separators? Is the layout stable while it ticks (no jitter from proportional digits)? Is the countdown the hero? Then the rest of the text a visitor is meant to read: is any of it too small or too faint (see the faintest text in the evidence)? The countdown weighs most.',
    },
    {
      id: 'motion_interaction',
      title: 'Motion and interactivity',
      points: 4,
      cap: { by: 'cohesion', margin: 2 },
      lookFor:
        'Compare the motion frames, pointer frames and click captures. Judge the motion and interaction that exist by what they add: do they make the experience better, with visible hover and focus states? Gimmicks that get in the way score low. Restraint is not a flaw: a page with little motion is judged on whether what it has is right, not penalised for having little. Score execution only; fit with the subject is scored under cohesion.',
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
        "Look at every provided asset in assets/ and record each one in the asset ledger. Did the agent pick the right assets for the right jobs and give the strongest ones prominence? Leaving weak or redundant assets out is good judgment; dumping everything on the page is not. Replacing a provided asset with a homemade imitation that plays the same role (typesetting the title where an official logo was provided, drawing a scene where key art was provided, faking a real brand's mark) is a serious error: it throws away the client's own work. The grader caps this criterion when the ledger records an imitation. When no logo was provided, a well-made title treatment is resourceful, not an imitation.",
    },
    {
      id: 'asset_treatment',
      title: 'Asset treatment',
      points: 5,
      lookFor:
        "Are the chosen assets integrated well: cropping, compositing, blending, color harmony, sensible sizes and formats, alt text? Does the treatment suit the assets' own style rather than fight it? Did the agent get more out of fewer assets?",
    },
    {
      id: 'concept',
      title: 'Concept',
      points: 3,
      lookFor:
        "Is there a central idea that organises the page beyond the obvious default for a countdown (a hero image, big digits and a button)? Judge it against that default, never against other pages. It counts only as far as it's executed: a strong idea with visible cut corners keeps the idea's credit here and loses points under craft. No concept beyond the default scores 0.",
    },
    {
      id: 'initiative',
      title: 'Initiative',
      points: 4,
      netEffect: true,
      lookFor:
        "Useful, on-subject work beyond the brief that a real launch page would ship: some suits any countdown (an add-to-calendar file, the time in the visitor's zone, sharing), some comes from the subject's own world. Score the net effect of everything the page adds beyond the brief: +5 when the extras clearly make it a better product, 0 when there are none or they add nothing, below 0 when they get in the way, clutter it, don't work, or get the subject wrong. A page without extras isn't penalised. Verify each extra works (captures, the controls' sound, the code) and is faithful to the subject (reference facts).",
    },
    {
      id: 'sound',
      title: 'Sound',
      points: 3,
      netEffect: true,
      lookFor:
        "Judge sound only if the page makes any; a silent page scores 0. Read the spectrograms, the measurements and the notes each control played. Score the net effect: up to +5 for sound that clearly elevates the page (it responds to the visitor and the countdown's moments, it's faithful to the subject, notes have shape, it's balanced, and it waits to be asked for or offers a mute); down to −5 for sound that makes it worse (a frozen drone, harsh or clipping sound, notes that don't match the subject's canon, sound that plays uninvited). A frozen tone shows as flat horizontal bands with a spectral change near 0 and a dynamic range near 0 dB.",
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
  title: 'Process: self-critique, iteration, verification',
  criteria: [
    {
      id: 'verification',
      title: 'Verification',
      points: 5,
      lookFor:
        "Did the agent check its own work where it matters: phone and desktop, weeks out, final seconds, the arrival, and after its last changes? Did it run the build, lint and type-check itself? Use the screenshot coverage table. Screenshots only at the end, or never after the final edits, count against it. Checks the agent made with its own scripts count too, when the transcript shows them.",
    },
    {
      id: 'critique_quality',
      title: 'Critique quality',
      points: 6,
      lookFor:
        "Did its critique find the problems that matter? Judge by outcome, not volume: use the defect ledger. Problems that were visible in the agent's own screenshots and never raised count against it, most of all trivial ones seen many times. Specific, visual, honest critiques that led to real fixes count for it; generic or self-congratulatory notes don't. Its reasoning may be in the transcript in full, summarized or not at all, depending on the harness: judge what it noticed and acted on, not how much it wrote.",
    },
    {
      id: 'follow_through',
      title: 'Follow-through',
      points: 5,
      lookFor:
        "Did the critiques turn into changes that actually fixed the problems? Check each fix against the critique that prompted it, in the screenshots after it, not against the agent's own verdict: a problem declared fixed but still visible counts against it. Compare early, middle and late screenshots: did the work get clearly better?",
    },
    {
      id: 'iteration',
      title: 'Iteration',
      points: 5,
      lookFor:
        "How much did each round of work achieve? Reward cycles (look, change, look again) that visibly improved the page, and a run that stops once the work is good. Count against it cycles that changed nothing, edits that failed or were reverted, and spinning on trivia. Length is not a virtue: a short run that got the page right beats a long one that circled. Stopping after a first draft that still has visible problems scores low.",
    },
    {
      id: 'self_assessment',
      title: 'Self-assessment',
      points: 4,
      lookFor:
        "Compare HANDOVER.md and the final messages with the measured facts, the captures, the sound and the code, and record each substantive claim in the claims list. Claims about the product and about the process count equally. Accurate claims and honestly named gaps score high. Overselling (claims that are false, or true but imply more than exists, such as a 'working' feature that barely works) costs the most; underselling (real work or checks left out) costs a little. A missing handover scores at most 2.",
    },
  ],
}

export const RUBRICS = [EXPERIENCE_RUBRIC, CODE_RUBRIC, PROCESS_RUBRIC]
