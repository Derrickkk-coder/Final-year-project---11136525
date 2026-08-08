import React from 'react'
import Reveal from './Reveal.jsx'

const TESTIMONIALS = [
  {
    quote: "NextLeap made it easy to apply for a role at a company that actually matched what I was looking for. Highly satisfied.",
    author: 'Ama Serwaa',
    role: 'Hired as Frontend Engineer, Zaya Health',
  },
  {
    quote: "As an employer, I could finally see every applicant in one dashboard instead of chasing emails. Worth it.",
    author: 'NextLeap Talent Team',
    role: 'Employer',
  },
  {
    quote: "I preferred NextLeap over scattered job boards — the listings felt current and the apply flow was fast.",
    author: 'Kojo Mensah',
    role: 'Applied to Backend Developer, Paystack',
  },
]

export default function Testimonials() {
  return (
    <div className="testimonial-grid">
      {TESTIMONIALS.map((t, i) => (
        <Reveal className="testimonial-card" key={t.author} delay={i * 110}>
          <div className="testimonial-card__stars" aria-hidden="true">★★★★★</div>
          <p className="testimonial-card__quote">&ldquo;{t.quote}&rdquo;</p>
          <div className="testimonial-card__author">{t.author}</div>
          <div className="testimonial-card__role">{t.role}</div>
        </Reveal>
      ))}
    </div>
  )
}
