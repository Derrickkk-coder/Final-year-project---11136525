import React from 'react'

const COMPANIES = ['MTN', 'Paystack', 'Vodafone', 'Zaya Health', 'Bloom', 'Kola Studio']

export default function LogoStrip() {
  return (
    <div className="logo-strip">
      <div className="container">
        <p className="logo-strip__label">Employers hiring on Adepa</p>
        <div className="logo-strip__row">
          {COMPANIES.map((name) => (
            <span className="logo-strip__item" key={name}>{name}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
