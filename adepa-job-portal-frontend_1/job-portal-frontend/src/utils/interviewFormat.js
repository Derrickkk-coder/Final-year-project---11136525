// "Google Meet (video)" rather than a bare "Video", which doesn't tell anyone
// what they'll actually be opening.
//
// Its own module because both sides of the interview need it — the employer's
// candidate card and the seeker's upcoming-interviews panel — and they must
// describe the same interview identically. Importing it from the employer
// component would drag that whole component into the seeker's bundle.
export default function interviewFormat(interview) {
  if (!interview) return ''

  if (interview.mode === 'Video' && interview.platform) {
    return `${interview.platform} (video)`
  }

  return interview.mode
}
