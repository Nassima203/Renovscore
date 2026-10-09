// Mise en forme d'un nombre à la française : 1 250 ou 0,12
export const formatNumber = (value, digits = 0) =>
  value.toLocaleString('fr-FR', { maximumFractionDigits: digits })
