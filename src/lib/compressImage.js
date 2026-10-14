// Shrinks a photo in the browser (canvas, max 1600px, JPEG) before upload.
const MAX_SIDE = 1600
const QUALITY = 0.82

// Shrinks a phone photo before upload: longest side <= 1600px, re-encoded as JPEG (EXIF rotation applied).
export async function compressImage(file) {
  let bitmap
  try { bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }) }
  catch { throw new Error("Couldn't read that image. Try a JPEG or PNG photo.") }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff' // JPEG has no transparency
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY))
  if (!blob) throw new Error('Image compression failed')
  if (scale === 1 && file.type === 'image/jpeg' && file.size <= blob.size) return file // already small enough
  return new File([blob], `${file.name.replace(/\.[^.]+$/, '') || 'photo'}.jpg`, { type: 'image/jpeg' })
}
