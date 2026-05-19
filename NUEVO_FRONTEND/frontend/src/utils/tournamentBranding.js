import { BASE } from '../api'

export function resolveImageUrl(url) {
  if (!url) return ''
  if (url.startsWith('/uploads/')) {
    return `${BASE}${url}`
  }
  return url
}

export function getTournamentHeaderLogo(tournament) {
  const logo = tournament?.headerLogoUrl
  return logo ? resolveImageUrl(logo) : `${import.meta.env.BASE_URL}logo.png`
}

export function getTournamentBackgroundLogo(tournament) {
  const logo = tournament?.backgroundLogoUrl
  return logo ? resolveImageUrl(logo) : `${import.meta.env.BASE_URL}logo.png`
}
