export function getTournamentHeaderLogo(tournament) {
  return tournament?.headerLogoUrl || '/logo.png'
}

export function getTournamentBackgroundLogo(tournament) {
  return tournament?.backgroundLogoUrl || '/logo.png'
}
