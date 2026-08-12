// Turns a missing skill from the match breakdown into somewhere to go learn
// it — free, and via Gemini rather than a hand-maintained list, so it covers
// whatever skill an employer happens to tag rather than only the ones we
// thought to curate.
//
// The one thing this deliberately does NOT trust the model with is a working
// URL. Asking an LLM for a direct deep link is asking it to hallucinate a
// plausible-looking address — the model has no way to know if a specific
// freeCodeCamp article or YouTube video still exists at the URL it guesses,
// and a dead link here is worse than no link. So Gemini only supplies a
// provider (from a fixed list we give it) and a search phrase; this file
// builds the actual URL by hand from that provider's real search endpoint.
// The result always resolves to something, even if it's "here's a search for
// it" rather than "here's the exact page" — honest about what it is rather
// than confidently wrong.
const MODEL = 'gemini-3.6-flash'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

const MAX_RESOURCES = 3

// Every provider Gemini is allowed to name, paired with how to turn a search
// phrase into a real URL. Kept short and to well-known, reputable sources —
// the fewer providers the model can pick from, the less room there is for it
// to invent one we don't have a builder for.
//
// All but YouTube route through Google's own search with a `site:` filter
// rather than each provider's own internal search endpoint. That's on
// purpose: Google's query syntax (`q=`, `site:domain`) is stable and
// well-documented, so it's something to actually be confident builds a
// working link, rather than guessing at the URL scheme of five different
// sites' own search pages and shipping whichever guess turns out wrong.
// YouTube's is the one exception — its `results?search_query=` format is
// about as stable as URLs get, and landing on YouTube's own search gives
// thumbnails and channel context a Google site-search wouldn't.
const PROVIDERS = {
  'YouTube': (q) => `https://www.youtube.com/results?search_query=${q}`,
  'freeCodeCamp': (q) => `https://www.google.com/search?q=site:freecodecamp.org+${q}`,
  'MDN Web Docs': (q) => `https://www.google.com/search?q=site:developer.mozilla.org+${q}`,
  'Coursera': (q) => `https://www.google.com/search?q=site:coursera.org+${q}`,
  'Official documentation': (q) => `https://www.google.com/search?q=${q}+official+documentation`,
  'Free course': (q) => `https://www.google.com/search?q=${q}+free+course`,
}

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    resources: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          provider: { type: 'STRING', enum: Object.keys(PROVIDERS) },
          query: { type: 'STRING' },
        },
        required: ['title', 'provider', 'query'],
      },
    },
  },
  required: ['resources'],
}

export function normaliseSkillKey(skill) {
  return String(skill || '').toLowerCase().trim().replace(/\s+/g, ' ')
}

function buildPrompt(skill, jobTitle) {
  const providerList = Object.keys(PROVIDERS).join(', ')

  let prompt = `A job seeker in Ghana is missing the skill "${skill}" for a role they're interested in`
  if (jobTitle) prompt += ` ("${jobTitle}")`
  prompt += `. Suggest up to ${MAX_RESOURCES} free ways to learn it.

For each one, give:
- "title": what the resource actually covers, e.g. "Spring Boot fundamentals" — specific enough that two suggestions for the same skill don't read as duplicates.
- "provider": exactly one of these, spelled exactly as given: ${providerList}. Pick whichever genuinely has good free material for this specific skill — don't force a spread across providers.
- "query": a short, well-formed search phrase for that provider's own search — a few words, not a sentence.

Every suggestion must be for something realistically free (a full course, official docs, a tutorial series) — not a "free trial" of a paid product. Order by how good a starting point each one is.`

  return prompt
}

function isValidResource(r) {
  return (
    r &&
    typeof r.title === 'string' && r.title.trim() &&
    typeof r.query === 'string' && r.query.trim() &&
    Object.prototype.hasOwnProperty.call(PROVIDERS, r.provider)
  )
}

function toResource(raw) {
  const query = encodeURIComponent(raw.query.trim())
  return {
    title: raw.title.trim(),
    provider: raw.provider,
    url: PROVIDERS[raw.provider](query),
  }
}

// Fetches fresh suggestions from Gemini. Callers are expected to check
// SkillResource for a cached entry first — this function itself doesn't know
// about the cache, so it can be tested and reasoned about on its own.
export async function fetchSkillResources(skill, jobTitle = null) {
  const response = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(skill, jobTitle) }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.4,
      },
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned no content for this skill.')

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Gemini returned malformed JSON for this skill.')
  }

  const resources = (Array.isArray(parsed?.resources) ? parsed.resources : [])
    .filter(isValidResource)
    .slice(0, MAX_RESOURCES)
    .map(toResource)

  if (resources.length === 0) {
    throw new Error('Gemini returned no usable resources for this skill.')
  }

  return resources
}
