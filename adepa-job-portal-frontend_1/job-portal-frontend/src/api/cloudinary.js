const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
const IMAGE_PRESET = import.meta.env.VITE_CLOUDINARY_IMAGE_PRESET

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