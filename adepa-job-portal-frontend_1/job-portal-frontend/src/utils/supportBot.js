// The support bot: a hand-written decision tree, not a language model.
//
// Deliberate choice. These answers describe how NextLeap actually behaves —
// employer approval, where the CV lives, how the match percentage is computed —
// and a model asked to improvise about a private codebase would invent plausible
// nonsense with total confidence. A tree can be read, checked, and corrected.
//
// It also runs entirely in the browser: no request, no auth, no round trip. That
// is what lets the typing bubbles be instant, and it means the canned Q&A costs
// nothing and works while signed out.

// Every node: what the bot says, and where the visitor can go next.
// `escalate: true` on an option hands over to a human instead of moving nodes.
export const BOT_NODES = {
  start: {
    body: "Hi! I'm the NextLeap assistant. I can answer the common questions straight away — what do you need help with?",
    options: [
      { label: 'Applying for a job', next: 'applying' },
      { label: 'My CV', next: 'cv' },
      { label: 'Posting a job', next: 'posting' },
      { label: 'How matching works', next: 'matching' },
      { label: 'Logging in', next: 'login' },
      { label: 'Something else', next: 'other' },
    ],
  },

  applying: {
    body: "To apply: open a job from Browse jobs and use the panel on the right. You'll need a phone number, a contact email, and a CV as a PDF. Once you've applied to one role your CV and phone are saved, so the next application is two clicks.\n\nYou can track every application, and its status, on your dashboard.",
    options: [
      { label: "My application status hasn't changed", next: 'status_wait' },
      { label: 'How do I upload a CV?', next: 'cv' },
      { label: 'Back to the start', next: 'start' },
      { label: 'Talk to a person', escalate: true },
    ],
  },

  status_wait: {
    body: "Status changes are made by the employer, not by NextLeap — so how quickly it moves is up to them. You'll get an email and a notification the moment it changes, so there's no need to keep checking.\n\n\"Pending review\" simply means they haven't opened it yet.",
    options: [
      { label: 'Back to the start', next: 'start' },
      { label: 'Talk to a person', escalate: true },
    ],
  },

  cv: {
    body: 'Go to My profile → My CV → Upload CV, and pick a PDF under 5MB. It saves immediately.\n\nOnce it\'s there you can preview it, download it, or replace it any time — and employers you apply to can view and download it. There\'s also a free AI review under CV review that scores it and tells you what to fix.',
    options: [
      { label: 'Tell me about the CV review', next: 'cv_review' },
      { label: 'Back to the start', next: 'start' },
      { label: 'Talk to a person', escalate: true },
    ],
  },

  cv_review: {
    body: 'CV review reads your CV and scores it out of 100 across five areas — skills, experience, education, formatting, and how well-targeted it is — then gives you a short list of specific things to change.\n\nYou can also pick any open job and see how well your CV fits that particular role.',
    options: [
      { label: 'Back to the start', next: 'start' },
      { label: 'Talk to a person', escalate: true },
    ],
  },

  posting: {
    body: "Employers can post once an admin has approved their account. That check is why every listing on NextLeap comes from a real company, and it's usually quick.\n\nIf you're approved: Employer dashboard → Post a new job. Do tag the required skills — that's what candidates get ranked against.",
    options: [
      { label: "My account still isn't approved", escalate: true },
      { label: 'How are candidates ranked?', next: 'matching' },
      { label: 'Back to the start', next: 'start' },
    ],
  },

  matching: {
    body: 'The match percentage is simply: the skills you have that a role asks for, divided by the skills it asks for, times 100. So 8 of 9 required skills is 89%.\n\nThat\'s why it shows the fraction and the actual skill names next to the number — including the ones you\'re missing, so you know what to learn. Add your skills under My profile to turn it on.',
    options: [
      { label: 'Where do I add my skills?', next: 'skills_where' },
      { label: 'Back to the start', next: 'start' },
      { label: 'Talk to a person', escalate: true },
    ],
  },

  skills_where: {
    body: 'My profile → Skills. Type a skill and press Enter, or paste a comma-separated list and it splits them for you.\n\nSkills are the single most useful thing on your profile: they drive your recommendations and every match percentage you see.',
    options: [
      { label: 'Back to the start', next: 'start' },
      { label: 'Talk to a person', escalate: true },
    ],
  },

  login: {
    body: "A few things it's usually one of:\n\n• You haven't verified your email yet — check your inbox, and your spam folder, for the verification link. There's a Resend button on the login page.\n• Wrong password — use Forgot password on the login page.\n• Your account was deactivated, in which case you'll see a message saying so.",
    options: [
      { label: 'None of those — I still cannot get in', escalate: true },
      { label: 'Back to the start', next: 'start' },
    ],
  },

  other: {
    body: "No problem — I'd rather put you through to someone than guess. A member of the support team can pick this up.",
    options: [
      { label: 'Talk to a person', escalate: true },
      { label: 'Actually, back to the start', next: 'start' },
    ],
  },
}

export const BOT_START = 'start'

// How long the typing bubble shows before each bot reply. Long enough to read as
// deliberate, short enough not to feel like waiting — and scaled a little by
// length so a long answer doesn't appear instantly after a short one.
export function botThinkingMs(body) {
  return Math.min(400 + String(body).length * 4, 1100)
}
