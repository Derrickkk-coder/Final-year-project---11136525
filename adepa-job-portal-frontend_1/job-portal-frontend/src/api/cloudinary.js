const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
const IMAGE_PRESET = import.meta.env.VITE_CLOUDINARY_IMAGE_PRESET

// Turns a Cloudinary delivery URL into one that downloads instead of opening
// in the browser's PDF viewer, by inserting the `fl_attachment` flag into the
// transformation segment. Same asset, different Content-Disposition.
//
// Returns the URL untouched if it isn't a Cloudinary upload URL — a CV uploaded
// before this existed, or stored elsewhere, still gets a working link.
export function toDownloadUrl(url, filename) {
  if (!url || !url.includes('/upload/')) return url

  const flag = filename
    ? `fl_attachment:${encodeURIComponent(filename.replace(/\.pdf$/i, ''))}`
    : 'fl_attachment'

  return url.replace('/upload/', `/upload/${flag}/`)
}

export async function uploadResumeToCloudinary(file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Resume upload failed. Please try again.')
  }

  const data = await response.json()
  return data.secure_url
}

// Profile pictures use a separate preset (restricted to jpg/png/webp,
// unlike the resume preset which is restricted to pdf).
export async function uploadImageToCloudinary(file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', IMAGE_PRESET)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Image upload failed. Please try again.')
  }

  const data = await response.json()
  return data.secure_url
}