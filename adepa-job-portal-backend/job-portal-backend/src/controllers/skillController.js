import SkillResource from '../models/SkillResource.js'
import { fetchSkillResources, normaliseSkillKey } from '../utils/skillResources.js'

// @route   POST /api/skills/resources
// @access  Private (seeker only)
// Body: { skill, jobTitle? }
//
// Checks the shared cache before calling Gemini at all — see SkillResource for
// why it's shared across users rather than per-seeker. jobTitle is only ever
// used on the cache-miss path, as light framing for the prompt; it's not part
// of the cache key, so it can't fragment one skill's cache across every job
// that happens to need it.
export async function suggestSkillResources(req, res, next) {
  try {
    const { skill, jobTitle } = req.body

    if (!skill?.trim()) {
      return res.status(400).json({ success: false, message: 'A skill is required.' })
    }

    const key = normaliseSkillKey(skill)

    const cached = await SkillResource.findOne({ skill: key })
    if (cached) {
      return res.json({ success: true, resources: cached.resources, cached: true })
    }

    const resources = await fetchSkillResources(skill.trim(), jobTitle?.trim() || null)

    // Best-effort: if two requests race for the same never-cached skill, the
    // unique index on `skill` rejects the second insert rather than duplicating
    // the entry — the response the client already has is still correct either
    // way, so a failed write here isn't worth surfacing as an error.
    await SkillResource.create({ skill: key, resources }).catch(() => {})

    res.json({ success: true, resources, cached: false })
  } catch (err) {
    console.error('[ai] Skill resource lookup failed:', err.message)
    res.status(502).json({
      success: false,
      message: 'Could not find learning resources right now. Please try again in a moment.',
    })
  }
}
