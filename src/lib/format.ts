const dateFormat = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

/** Datas do CMS chegam como AAAA-MM-DD; formatar em UTC evita voltar um dia no fuso do Brasil. */
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso))
}
