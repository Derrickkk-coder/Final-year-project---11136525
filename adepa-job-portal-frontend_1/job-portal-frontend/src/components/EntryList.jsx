import React from 'react'

// Repeatable group of fields — one component behind Education, Work experience
// and Certifications, which differ only in their field list.
//
// `fields` is [{ key, label, placeholder, width?, textarea? }]. `width: 'sm'`
// makes a narrow column (years); everything else shares the row evenly.
//
// Rows are keyed by their sub-document _id where one exists (Mongoose gives
// saved entries an _id) and fall back to index for rows added since the last
// save. Both are stable for as long as the row is on screen.
export default function EntryList({
  label,
  hint,
  entries = [],
  fields,
  onChange,
  addLabel = 'Add another',
}) {
  const blank = () => Object.fromEntries(fields.map((f) => [f.key, '']))

  const updateEntry = (index, key, value) => {
    onChange(entries.map((entry, i) => (i === index ? { ...entry, [key]: value } : entry)))
  }

  const addEntry = () => onChange([...entries, blank()])

  const removeEntry = (index) => onChange(entries.filter((_, i) => i !== index))

  return (
    <div className="entry-list">
      <div className="entry-list__head">
        <div>
          <h3 className="entry-list__label">{label}</h3>
          {hint && <span className="hint">{hint}</span>}
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={addEntry}>
          + {addLabel}
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="entry-list__empty">Nothing added yet.</p>
      ) : (
        entries.map((entry, index) => (
          <div className="entry-row" key={entry._id || `new-${index}`}>
            <div className="entry-row__fields">
              {fields.map((field) => (
                <div
                  className={`form-field entry-row__field ${field.width === 'sm' ? 'is-sm' : ''}`}
                  key={field.key}
                >
                  <label htmlFor={`${label}-${index}-${field.key}`}>{field.label}</label>
                  {field.textarea ? (
                    <textarea
                      id={`${label}-${index}-${field.key}`}
                      value={entry[field.key] || ''}
                      placeholder={field.placeholder}
                      onChange={(e) => updateEntry(index, field.key, e.target.value)}
                      style={{ minHeight: 70 }}
                    />
                  ) : (
                    <input
                      id={`${label}-${index}-${field.key}`}
                      value={entry[field.key] || ''}
                      placeholder={field.placeholder}
                      onChange={(e) => updateEntry(index, field.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              className="entry-row__remove"
              onClick={() => removeEntry(index)}
              aria-label={`Remove ${label.toLowerCase()} entry ${index + 1}`}
            >
              Remove
            </button>
          </div>
        ))
      )}
    </div>
  )
}
