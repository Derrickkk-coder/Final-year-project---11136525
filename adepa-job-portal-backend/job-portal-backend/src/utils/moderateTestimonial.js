// Sentiment gate for the anonymous, no-account comment box on the landing
// page. Every comment used to sit in "pending" until an admin looked at it,
// however glowing — this lets a genuinely positive one publish itself
// straight away, and holds anything else for a human.
//
// Deliberately a two-way call, not three: the safe default is "needs a
// person," so spam, gibberish, complaints, and anything ambiguous or mixed
// all land in the same "not positive" bucket as outright negative — there's
// no separate leniency for "eh, harmless" content sneaking onto the landing
// page unread. Only a comment the model is confident reads as genuine
// positive feedback skips the queue.
const MODEL = 'gemini-3.6-flash'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    sentiment: { type: 'STRING', enum: ['positive', 'not_positive'] },
    reason: { type: 'STRING' },
  },
  required: ['sentiment', 'reason'],
}

function buildPrompt({ quote, authorType, rating }) {
  return `You are moderating a public testimonial submitted anonymously to a Ghanaian job portal called NextLeap, from someone identifying as a ${authorType === 'employer' ? 'employer' : 'job seeker'} who gave it a ${rating}-out-of-5 star rating.

Comment: "${quote}"

Classify it as "positive" only if it is genuine, on-topic, positive feedback about using NextLeap — something safe to publish on the landing page without a person reviewing it first.

Classify it as "not_positive" for anything else: criticism or complaints (even fair ones — those still deserve a human's judgement before going up as a "testimonial"), neutral or mixed comments, spam or advertising, gibberish, anything abusive or inappropriate, or anything unrelated to actually using the platform. When genuinely unsure, choose "not_positive" — the cost of a good comment waiting a bit for a human is much lower than the cost of something bad publishing itself.

Give a one-sentence "reason" either way, written for the admin who will see it in the moderation queue, e.g. "Genuine praise for the AI CV reviewer" or "Reads as a complaint about slow employer replies, not praise" or "Looks like spam, unrelated to NextLeap".`
}

// Throws on any failure — malformed response, network error, missing key —
// rather than guessing. The caller decides what "the AI didn't answer" should
// mean for a comment (see testimonialController.js: it falls back to holding
// the comment for a person, the same as if this feature didn't exist).
export async function moderateTestimonial({ quote, authorType, rating }) {
  const response = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt({ quote, authorType, rating }) }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        // Low but not zero — this is a moderation gate, not a creative task,
        // so it should give the same verdict on the same comment almost every
        // time, but a hard 0 has a way of getting stuck oddly on edge cases.
        temperature: 0.1,
      },
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned no content for this comment.')

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Gemini returned malformed JSON for this comment.')
  }

  if (!['positive', 'not_positive'].includes(parsed?.sentiment)) {
    throw new Error('Gemini returned an unrecognised sentiment value.')
  }

  return {
    sentiment: parsed.sentiment,
    reason: String(parsed.reason || '').trim().slice(0, 300),
  }
}
