// AI CV review for job seekers, via Gemini's native PDF support.
//
// Unlike analyzeApplication.js — which returns prose for a human to read — this
// drives a UI made of numbers and lists, so it asks Gemini for **structured
// JSON** using responseSchema rather than parsing sentences. Prose parsing works
// until the model phrases something differently one day and the scores vanish.
//
// Nothing the model returns is trusted directly: scores are clamped, arrays are
// capped, types are coerced, and the five reported areas are fixed by us rather
// than by whatever the model decided to name them. See normaliseAnalysis.
const MODEL = 'gemini-3.6-flash'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

// Fixed so the UI always renders the same five rows in the same order, whatever
// the model calls them.
export const CV_AREAS = ['Skills', 'Experience', 'Education', 'Formatting', 'Job relevance']

const MAX_SUGGESTIONS = 6
const MAX_STRENGTHS = 4

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    overallScore: { type: 'INTEGER' },
    areas: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          score: { type: 'INTEGER' },
          comment: { type: 'STRING' },
        },
        required: ['name', 'score', 'comment'],
      },
    },
    suggestions: { type: 'ARRAY', items: { type: 'STRING' } },
    strengths: { type: 'ARRAY', items: { type: 'STRING' } },
    jobMatch: { type: 'INTEGER' },
    jobMatchNotes: { type: 'STRING' },
  },
  required: ['overallScore', 'areas', 'suggestions', 'strengths'],
}

async function fetchResumeAsBase64(resumeUrl) {
  const response = await fetch(resumeUrl)
  if (!response.ok) {
    throw new Error('Could not fetch the CV file.')
  }
  const buffer = await response.arrayBuffer()
  return Buffer.from(buffer).toString('base64')
}

function buildPrompt({ job, seekerSkills }) {
  const areaList = CV_AREAS.map((a) => `"${a}"`).join(', ')

  let prompt = `You are an experienced career adviser reviewing the attached CV for a candidate in Ghana. Be constructive, specific, and honest — a generous score that hides real problems is not useful.

Score the CV out of 100 overall, and score each of these five areas out of 100, using exactly these names: ${areaList}.

What each area means:
- Skills: are relevant, concrete skills present and clearly presented?
- Experience: is work history specific and results-oriented, with measurable achievements rather than duty lists?
- Education: is education clear, complete, and appropriately placed?
- Formatting: structure, consistency, length, readability, and whether it would survive automated screening.
- Job relevance: how well-targeted the CV is`

  if (job) {
    prompt += ` for the specific role given below.

ROLE BEING TARGETED
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}
Requirements: ${(job.requirements || []).join('; ') || 'Not specified'}
Tagged skills: ${(job.skills || []).join(', ') || 'Not specified'}

Also set "jobMatch" to a percentage (0-100) for how well this CV fits this specific role, and use "jobMatchNotes" for two or three sentences explaining that number — name what lines up and what is missing.`
  } else {
    prompt += ` for the kind of roles it is clearly aiming at. Judge focus and consistency, not fit to any one posting. Leave "jobMatch" and "jobMatchNotes" empty.`
  }

  if (seekerSkills?.length) {
    prompt += `

For context, the candidate lists these skills on their NextLeap profile: ${seekerSkills.join(', ')}. If any are absent from the CV, that is worth raising as a suggestion.`
  }

  prompt += `

Give ${MAX_STRENGTHS} or fewer genuine strengths, and between 3 and ${MAX_SUGGESTIONS} suggestions. Each suggestion must be a single concrete action the candidate can take — "Add measurable achievements to your work experience" or "Add SQL to your skills section", not "improve your CV". Do not restate the scores as suggestions.`

  return prompt
}

// ---- Guards against a model returning something unusable ----

function clampScore(value, fallback = 0) {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return fallback
  return Math.min(Math.max(n, 0), 100)
}

function cleanStrings(list, limit) {
  return (Array.isArray(list) ? list : [])
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .slice(0, limit)
}

// Builds the five areas from OUR canonical list, pulling whatever the model
// returned for each by (case-insensitive) name. An area the model omitted or
// renamed degrades to a 0 with an explanatory comment rather than disappearing
// from the table and shifting every other row.
function normaliseAreas(rawAreas) {
  const byName = new Map(
    (Array.isArray(rawAreas) ? rawAreas : []).map((a) => [
      String(a?.name || '').trim().toLowerCase(),
      a,
    ])
  )

  return CV_AREAS.map((name) => {
    const raw = byName.get(name.toLowerCase())
    return {
      name,
      score: clampScore(raw?.score),
      comment: String(raw?.comment || '').trim() || 'No assessment returned for this area.',
    }
  })
}

function normaliseAnalysis(raw, { hasJob }) {
  const areas = normaliseAreas(raw?.areas)

  // Prefer the model's overall score, but fall back to the mean of the areas so
  // the headline number is never 0 while the table shows real scores.
  let overallScore = clampScore(raw?.overallScore, -1)
  if (overallScore < 0) {
    overallScore = clampScore(areas.reduce((sum, a) => sum + a.score, 0) / areas.length)
  }

  const analysis = {
    overallScore,
    areas,
    suggestions: cleanStrings(raw?.suggestions, MAX_SUGGESTIONS),
    strengths: cleanStrings(raw?.strengths, MAX_STRENGTHS),
  }

  if (hasJob) {
    analysis.jobMatch = clampScore(raw?.jobMatch)
    analysis.jobMatchNotes = String(raw?.jobMatchNotes || '').trim()
  }

  return analysis
}

// Returns the normalised analysis. `job` is optional — pass one to get a
// CV-to-role comparison alongside the general review.
export async function analyzeCvDocument({ resumeUrl, job = null, seekerSkills = [] }) {
  const base64Cv = await fetchResumeAsBase64(resumeUrl)

  const response = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { inline_data: { mime_type: 'application/pdf', data: base64Cv } },
            { text: buildPrompt({ job, seekerSkills }) },
          ],
        },
      ],
      generationConfig: {
        // Asking for JSON against a schema, rather than parsing prose
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        // Scoring should be about as repeatable as this model gets — the same CV
        // shouldn't swing 20 points between two runs.
        temperature: 0.2,
      },
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) {
    throw new Error('Gemini returned no content for this CV.')
  }

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    // responseMimeType should make this impossible, but a truncated response
    // (e.g. hitting a token limit mid-object) would land here.
    throw new Error('Gemini returned malformed JSON for this CV.')
  }

  return normaliseAnalysis(parsed, { hasJob: Boolean(job) })
}
