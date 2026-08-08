import React from 'react'
import { getProfileCompletion } from '../utils/profileCompletion.js'

// Conic-gradient ring rather than an SVG donut — one element, no viewBox maths,
// and it inherits the theme colours directly.
function Ring({ percent }) {
  const colour = percent >= 80 ? 'var(--success)' : percent >= 50 ? 'var(--teal-500)' : 'var(--coral)'

  return (
    <div
      className="completion-ring"
      style={{ background: `conic-gradient(${colour} ${percent * 3.6}deg, var(--line) 0deg)` }}
      role="img"
      aria-label={`Profile ${percent}% complete`}
    >
      <div className="completion-ring__hole">
        <span className="completion-ring__num">{percent}%</span>
      </div>
    </div>
  )
}

export default function ProfileCompletion({ user }) {
  const { percent, missing, complete } = getProfileCompletion(user)

  return (
    <div className="panel completion">
      <Ring percent={percent} />

      <div className="completion__body">
        <h2 className="completion__title">
          Profile completion: {percent}%
        </h2>

        {complete ? (
          <p className="completion__text">
            Your profile is complete. Employers reviewing your applications can see everything
            they need.
          </p>
        ) : (
          <>
            <p className="completion__text">
              A fuller profile ranks better against job requirements and gives employers more to
              go on. Still to add:
            </p>
            <ul className="completion__missing">
              {missing.slice(0, 4).map((item) => (
                <li key={item.key}>{item.label}</li>
              ))}
              {missing.length > 4 && <li>and {missing.length - 4} more</li>}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
