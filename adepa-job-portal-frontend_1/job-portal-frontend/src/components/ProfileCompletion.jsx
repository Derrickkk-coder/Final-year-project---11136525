import React from 'react'
import { getProfileCompletion } from '../utils/profileCompletion.js'
import ScoreRing from './ScoreRing.jsx'

export default function ProfileCompletion({ user }) {
  const { percent, missing, complete } = getProfileCompletion(user)

  return (
    <div className="panel completion">
      <ScoreRing value={percent} ariaLabel={`Profile ${percent}% complete`} />

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
