import Testimonial from '../models/Testimonial.js'
import { moderateTestimonial } from '../utils/moderateTestimonial.js'

// Flip to false to publish submissions immediately, skipping moderation (AI
// included) entirely. Left on because this endpoint takes anonymous writes
// that render on the landing page — see the note on `status` in the model.
const REQUIRE_APPROVAL = true

// Never send the IP or moderation state to the public feed
const PUBLIC_FIELDS = 'name authorType role company quote rating createdAt'

// One submission per IP per window. In-memory and per-instance, which is honest
// about what it is: a brake on someone pasting the same comment twenty times,
// not protection against a determined attacker. A real limiter belongs at the
// edge, and would cover every route rather than this one.
const SUBMIT_WINDOW_MS = 10 * 60 * 1000
const lastSubmitByIp = new Map()

function pruneOldEntries() {
  const cutoff = Date.now() - SUBMIT_WINDOW_MS
  for (const [ip, at] of lastSubmitByIp) {
    if (at < cutoff) lastSubmitByIp.delete(ip)
  }
}

// @route   GET /api/testimonials
// @access  Public
export async function getApprovedTestimonials(req, res, next) {
  try {
    const testimonials = await Testimonial.find({ status: 'approved' })
      .select(PUBLIC_FIELDS)
      .sort({ createdAt: -1 })
      .limit(30)
      .lean()

    res.json({ success: true, testimonials })
  } catch (err) {
    next(err)
  }
}

// @route   POST /api/testimonials
// @access  Public — deliberately no account required
export async function createTestimonial(req, res, next) {
  try {
    const { name, authorType, role, company, quote, rating } = req.body

    if (!name?.trim() || !quote?.trim()) {
      return res.status(400).json({ success: false, message: 'Your name and comment are both required.' })
    }
    if (!['seeker', 'employer'].includes(authorType)) {
      return res.status(400).json({
        success: false,
        message: 'Please say whether you are a job seeker or an employer.',
      })
    }

    // req.ip is only the real client behind Render once `trust proxy` is set —
    // see app.js. Without it every submission would share the proxy's address
    // and the first one would lock out everybody else.
    const ip = req.ip || 'unknown'
    pruneOldEntries()

    if (lastSubmitByIp.has(ip)) {
      return res.status(429).json({
        success: false,
        message: "You've just left a comment — thanks. Please wait a few minutes before sending another.",
      })
    }

    const finalRating = Number(rating) || 5

    // Defaults to the old behaviour — held for a person — and only moves to
    // published if the AI both ran and was confident it's genuine positive
    // feedback. A failed call (quota, network, a malformed response) falls
    // back to exactly what happened before this feature existed, rather than
    // either blocking the submission or, worse, auto-publishing on a
    // moderation call that never actually happened.
    let status = 'pending'
    let aiSentiment = null
    let aiReason = ''

    if (REQUIRE_APPROVAL) {
      try {
        const verdict = await moderateTestimonial({ quote, authorType, rating: finalRating })
        aiSentiment = verdict.sentiment
        aiReason = verdict.reason
        if (verdict.sentiment === 'positive') status = 'approved'
      } catch (err) {
        console.error('[ai] Testimonial moderation failed, holding for a person:', err.message)
      }
    } else {
      status = 'approved'
    }

    const testimonial = await Testimonial.create({
      name,
      authorType,
      role,
      company,
      quote,
      rating: finalRating,
      status,
      submittedFromIp: ip,
      aiSentiment,
      aiReason,
    })

    lastSubmitByIp.set(ip, Date.now())

    res.status(201).json({
      success: true,
      // Says plainly whether it's live yet, so nobody reloads looking for a
      // comment still waiting on a person. The "Thank you!" heading is
      // supplied by the form, so it isn't repeated here.
      message: status === 'approved'
        ? 'Your comment is now live on the landing page.'
        : 'Your comment is under review, and will appear on the site once it has been approved.',
      published: status === 'approved',
      testimonial: { _id: testimonial._id },
    })
  } catch (err) {
    // Surface the schema's own validation copy (length limits and so on) rather
    // than a generic 500 — the messages are already written for a reader.
    if (err.name === 'ValidationError') {
      const first = Object.values(err.errors)[0]
      return res.status(400).json({ success: false, message: first?.message || 'That comment could not be saved.' })
    }
    next(err)
  }
}

// @route   GET /api/admin/testimonials?status=pending
// @access  Private (admin only)
export async function getTestimonialsAdmin(req, res, next) {
  try {
    const { status } = req.query
    const filter = status && ['pending', 'approved', 'rejected'].includes(status) ? { status } : {}

    const testimonials = await Testimonial.find(filter).sort({ createdAt: -1 }).lean()

    res.json({ success: true, testimonials })
  } catch (err) {
    next(err)
  }
}

// @route   PUT /api/admin/testimonials/:id/status
// @access  Private (admin only)
export async function setTestimonialStatus(req, res, next) {
  try {
    const { status } = req.body

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'status must be pending, approved, or rejected.',
      })
    }

    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )

    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Comment not found.' })
    }

    res.json({ success: true, testimonial })
  } catch (err) {
    next(err)
  }
}
