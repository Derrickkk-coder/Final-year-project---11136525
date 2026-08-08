import client from './client.js'

export async function fetchTestimonials() {
  const { data } = await client.get('/testimonials')
  return data // { success, testimonials }
}

// No auth — anyone can leave a comment from the landing page
export async function submitTestimonial(payload) {
  const { data } = await client.post('/testimonials', payload)
  return data // { success, message, published }
}
