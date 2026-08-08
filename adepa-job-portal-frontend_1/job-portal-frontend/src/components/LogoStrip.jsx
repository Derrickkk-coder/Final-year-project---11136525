import React from 'react'

const COMPANIES = ['MTN', 'Paystack', 'Vodafone', 'Zaya Health', 'Bloom', 'InnovateX']

export default function LogoStrip() {
  return (
    <div className="logo-strip">
      <div className="container">
        <p className="logo-strip__label">Employers hiring on NextLeap</p>

        {/* The track holds the list twice so the marquee can loop seamlessly:
            translating exactly -50% puts copy 2 where copy 1 started. Only the
            first copy is announced to screen readers — the second is decorative
            duplication, not extra employers. */}
        <div className="logo-marquee">
          <div className="logo-marquee__track">
            {COMPANIES.map((name) => (
              <span className="logo-strip__item" key={name}>{name}</span>
            ))}
            {COMPANIES.map((name) => (
              <span className="logo-strip__item" key={`${name}-loop`} aria-hidden="true">{name}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
