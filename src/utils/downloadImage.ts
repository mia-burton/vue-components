export default async function downloadImage(
  imageSrc: string,
  target: string,
  name: string,
  lang: string
) {
  const siteName = 'Miaburton'
  const options = {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  } as const
  const image = await fetch(imageSrc)
  const imageBlog = await image.blob()
  const imageURL = URL.createObjectURL(imageBlog)
  const link = document.createElement('a')
  const element = document.getElementById(target)
  const dateString = new Date().toLocaleDateString(lang, options)
  link.href = imageURL
  link.download = `${name} @${siteName} ${dateString}`
  if (element) {
    element.appendChild(link)
    link.click()
    element.removeChild(link)
  }
}
