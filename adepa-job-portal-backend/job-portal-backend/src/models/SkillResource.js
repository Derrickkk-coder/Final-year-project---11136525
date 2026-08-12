import mongoose from 'mongoose'

// Caches Gemini's learning-resource suggestions per skill, shared across every
// seeker rather than per-user. "How to learn Java Spring Boot" doesn't change
// from one person to the next, so the first seeker who hits a given missing
// skill pays for the Gemini call and everyone after gets it from here for
// free — the same reasoning as User.cvAnalysis, just shared instead of
// per-document.
//
// Keyed on the skill alone, not skill+job — a job title is passed to Gemini as
// light framing context when the resource is first generated, but the
// underlying "how do I learn X" resources don't meaningfully change per
// posting, so keying the cache on the job too would mean re-paying for the
// same suggestions on every different role that happens to want the same
// skill.
const skillResourceSchema = new mongoose.Schema(
  {
    skill: {
      // Normalised the same way matchScore.js compares skills, so "Java" and
      // "java " land on the same cache entry.
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    resources: [
      {
        title: { type: String, required: true },
        provider: { type: String, required: true },
        url: { type: String, required: true },
        _id: false,
      },
    ],
  },
  { timestamps: true }
)

export default mongoose.model('SkillResource', skillResourceSchema)
