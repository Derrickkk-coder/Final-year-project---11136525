import React, { useEffect, useState } from 'react'
import { fetchTestimonials } from '../api/testimonials.js'

// The three originals, kept as they were. Real approved comments are appended to
// these rather than replacing them, so the section is never empty.
const SEED_TESTIMONIALS = [
  {
    quote: "NextLeap made it easy to apply for a role at a company that actually matched what I was looking for. Highly satisfied.",
    name: 'Ama Serwaa',
    role: 'Hired as Frontend Engineer, Zaya Health',
    rating: 5,
  },
  {
    quote: "As an employer, I could finally see every applicant in one dashboard instead of chasing emails. Worth it.",
    name: 'NextLeap Talent Team',
    role: 'Employer',
    rating: 5,
  },
  {
    quote: "I preferred NextLeap over scattered job boards — the listings felt current and the apply flow was fast.",
    name: 'Kojo Mensah',
    role: 'Applied to Backend Developer, Paystack',
    rating: 5,
  },
]

function Stars({ rating = 5 }) {
  const filled = Math.min(Math.max(Math.round(rating), 1), 5)
  return (
    <div className="testimonial-card__stars" aria-label={`${filled} out of 5`}>
      <span aria-hidden="true">{'★'.repeat(filled)}{'☆'.repeat(5 - filled)}</span>
    </div>
  )
}

function Card({ item, ariaHidden }) {
  // An employer's company is worth showing; a seeker's role line already carries
  // where they were hired
  const subtitle = [item.role, item.company].filter(Boolean).join(' · ')

  return (
    <div className="testimonial-card" aria-hidden={ariaHidden || undefined}>
      <Stars rating={item.rating} />
      <p className="testimonial-card__quote">&ldquo;{item.quote}&rdquo;</p>
      <div className="testimonial-card__author">{item.name}</div>
      {subtitle && <div className="testimonial-card__role">{subtitle}</div>}
    </div>
  )
}

export default function Testimonials() {
  const [items, setItems] = useState(SEED_TESTIMONIALS)

  useEffect(() => {
    fetchTestimonials()
      .then((data) => {
        if (data.testimonials?.length) {
          // Newest real comments first, seeds behind them
          setItems([...data.testimonials, ...SEED_TESTIMONIALS])
        }
      })
      // Keep the seeds on failure — the section is decoration, not a reason to
      // show an error on the landing page
      .catch(() => {})
  }, [])

  return (
    <div className="testimonial-marquee">
      {/* Two copies, as in the employer logo strip: travelling exactly -50%
          lands copy 2 where copy 1 began, so the loop is seamless. The seeds
          guarantee at least three cards, so six in the track is always wider
          than the viewport and there's never a visible gap. */}
      <div className="testimonial-marquee__track">
        {items.map((item, i) => (
          <Card item={item} key={item._id || `seed-${i}`} />
        ))}
        {items.map((item, i) => (
          <Card item={item} key={`loop-${item._id || i}`} ariaHidden />
        ))}
      </div>
    </div>
  )
}
