import React, { useState } from 'react'

// Tag-style skills editor. Enter or comma commits the current word; Backspace on
// an empty box removes the last tag. Pasting "Python, SQL, Java" splits into
// three, since that's how people have their skills written down already.
//
// De-duplicates case-insensitively here as well as on the server — the server is
// the guarantee, this is just so the UI doesn't visibly accept a duplicate and
// then silently drop it on save.
// `hint` is a prop because this input serves two audiences: a seeker listing
// their own skills, and an employer tagging a role's requirements. The default
// wording is the seeker's; the job forms pass their own. Pass null for none.
const DEFAULT_HINT =
  'Press Enter or comma after each skill. These are what your job match percentages are calculated from.'

export default function SkillsInput({
  skills = [],
  onChange,
  id = 'skills',
  hint = DEFAULT_HINT,
}) {
  const [draft, setDraft] = useState('')

  const addSkills = (raw) => {
    const incoming = raw
      .split(',')
      .map((s) => s.trim().replace(/\s+/g, ' '))
      .filter(Boolean)

    if (incoming.length === 0) return

    const existing = new Set(skills.map((s) => s.toLowerCase()))
    const additions = []

    for (const skill of incoming) {
      const key = skill.toLowerCase()
      if (existing.has(key)) continue
      existing.add(key)
      additions.push(skill)
    }

    if (additions.length > 0) onChange([...skills, ...additions])
    setDraft('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      // Enter would otherwise submit the surrounding profile form
      e.preventDefault()
      addSkills(draft)
      return
    }

    if (e.key === 'Backspace' && draft === '' && skills.length > 0) {
      onChange(skills.slice(0, -1))
    }
  }

  const removeSkill = (index) => onChange(skills.filter((_, i) => i !== index))

  return (
    <div className="skills-input">
      <div className="skills-input__tags">
        {skills.map((skill, index) => (
          <span className="skill-tag" key={`${skill}-${index}`}>
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(index)}
              aria-label={`Remove ${skill}`}
            >
              ×
            </button>
          </span>
        ))}

        <input
          id={id}
          className="skills-input__field"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addSkills(draft)}
          onPaste={(e) => {
            const text = e.clipboardData.getData('text')
            if (text.includes(',')) {
              e.preventDefault()
              addSkills(text)
            }
          }}
          placeholder={skills.length === 0 ? 'e.g. Python, SQL, React' : 'Add another…'}
        />
      </div>
      {hint && <span className="hint">{hint}</span>}
    </div>
  )
}
