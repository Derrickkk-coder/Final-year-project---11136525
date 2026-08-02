// Calls Google's Gemini API (free tier, no billing required) to assess how
// well an applicant's resume matches a job posting. Uses Gemini's native PDF
// support via inline_data — no separate PDF-text-extraction library needed.
//
// Uses the stable `generateContent` endpoint rather than Google's newer
// "Interactions API", which is still in Beta — generateContent is what
// Google itself recommends for production use.
const MODEL = 'gemini-3.6-flash'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

async function fetchResumeAsBase64(resumeUrl) {
  const response = await fetch(resumeUrl)
  if (!response.ok) {
    throw new Error('Could not fetch the resume file.')
  }
  const buffer = await response.arrayBuffer()
  return Buffer.from(buffer).toString('base64')
}

export async function analyzeApplicationFit({ job, resumeUrl }) {
  const base64Resume = await fetchResumeAsBase64(resumeUrl)

  const prompt = `You are helping a hiring manager quickly assess a job applicant. Based on the attached resume, evaluate this candidate's fit for the role below.

Job title: ${job.title}
Job description: ${job.description}
Requirements: ${(job.requirements || []).join('; ') || 'Not specified'}

Provide, in plain text (no markdown headers, just short labeled lines):
1. Overall fit: one of Strong match / Moderate match / Weak match
2. A 2-3 sentence summary of the candidate's relevant background
3. Key strengths: 2-3 short bullet points
4. Potential gaps or concerns: 1-2 short bullet points

Keep the entire response under 150 words. Be direct and useful for someone reviewing many applicants quickly.`

  const response = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { inline_data: { mime_type: 'application/pdf', data: base64Resume } },
            { text: prompt },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  return text?.trim() || 'No analysis could be generated for this resume.'
}