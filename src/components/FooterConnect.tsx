import { ArrowUpRight, Mail, Send } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { getSiteSettings } from '@/lib/cms/client'
import { useCms } from '@/lib/cms/useCms'
import { isValidEmail, leadsConfigured, submitLead, type LeadKind } from '@/lib/leads'
import { Button, buttonClasses } from './ui/Button'
import { inputClasses, labelClasses } from './ui/field'

export function FooterConnect() {
  const settings = useCms(getSiteSettings)

  return (
    <footer className="border-t-[3px] border-ink bg-pink px-4 pb-8 pt-20 sm:px-6 lg:pt-28">
      <div className="mx-auto max-w-6xl">
        {settings.status === 'loading' ? <p role="status">Carregando contato…</p> : null}
        {settings.status === 'error' ? (
          <p role="alert">Não foi possível carregar os contatos. Recarregue a página para tentar de novo.</p>
        ) : null}
        {settings.status === 'ready' ? (
          <>
            <section id="contact" aria-labelledby="contact-title" className="scroll-mt-28">
              <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
                <div>
                  <h2 id="contact-title" className="max-w-lg font-display text-5xl leading-[1.05] sm:text-6xl">
                    vamos dar forma à sua próxima ideia?
                  </h2>
                  <p className="mt-5 max-w-lg text-lg leading-relaxed">
                    Conte o que você quer criar, o momento da sua marca e os prazos. A conversa começa por aqui.
                  </p>
                  <a href={`mailto:${settings.data.email}`} className="mt-6 inline-flex max-w-full items-center gap-2 break-all text-lg font-bold underline underline-offset-4">
                    <Mail aria-hidden size={20} className="shrink-0" /> {settings.data.email}
                  </a>
                  <ul className="mt-5 flex flex-wrap gap-4">
                    {settings.data.socials.map((social) => (
                      <li key={social.url}>
                        <a href={social.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded font-bold underline underline-offset-4">
                          {social.label} {social.handle} <ArrowUpRight aria-hidden size={18} />
                          <span className="sr-only"> (nova aba)</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <LeadForm kind="project-inquiry" contactEmail={settings.data.email} />
              </div>
            </section>

            <section id="newsletter" aria-labelledby="newsletter-title" className="mt-20 grid scroll-mt-28 gap-8 border-t-[3px] border-ink pt-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
              <div>
                <h2 id="newsletter-title" className="font-display text-4xl leading-tight sm:text-5xl">uma dose de FruFru na sua caixa de entrada.</h2>
                <p className="mt-4 max-w-lg text-lg leading-relaxed">{settings.data.newsletterPitch}</p>
                <p className="mt-3 max-w-lg text-sm">Os packs ainda estão em preparação. Entrar na lista não inicia um download.</p>
              </div>
              <LeadForm kind="newsletter" contactEmail={settings.data.email} />
            </section>

            <div className="mt-16 flex flex-wrap items-center justify-between gap-5 border-t-2 border-ink pt-6 text-sm font-semibold">
              <a href="#conteudo" className="rounded" aria-label={`${settings.data.studioName}, voltar ao conteúdo`}>
                <img src="/brand/wordmark.png" alt={settings.data.studioName} width={1024} height={196} loading="lazy" className="h-7 w-auto" />
              </a>
              <p>© {new Date().getFullYear()} {settings.data.studioName}</p>
              <a href="#work" className={buttonClasses({ variant: 'cream', size: 'sm' })}>Ver trabalhos <ArrowUpRight aria-hidden size={16} /></a>
            </div>
          </>
        ) : null}
      </div>
    </footer>
  )
}

function LeadForm({ kind, contactEmail }: { kind: Extract<LeadKind, 'newsletter' | 'project-inquiry'>; contactEmail: string }) {
  const id = useId()
  const project = kind === 'project-inquiry'
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending) return
    const form = event.currentTarget
    const data = new FormData(form)
    const email = String(data.get('email') ?? '').trim()
    const name = String(data.get('name') ?? '').trim()
    const message = String(data.get('message') ?? '').trim()
    const consent = data.get('consent') === 'on'
    if (!isValidEmail(email) || !consent || (project && (!name || !message))) {
      setError('Preencha os campos obrigatórios, confira o e-mail e autorize o envio.')
      return
    }
    setSending(true)
    setError('')
    const result = await submitLead({ kind, email, consent, ...(project ? { name, message } : {}), meta: { source: 'footer' } })
    setSending(false)
    if (result.ok) {
      setSent(true)
      form.reset()
    } else {
      setError(result.reason === 'not-configured'
        ? 'O serviço de envio ainda não está configurado. Use o e-mail direto abaixo.'
        : result.reason === 'network'
          ? 'Não foi possível conectar ao serviço. Seus dados continuam aqui; tente novamente ou use o e-mail direto.'
          : 'O serviço não aceitou o envio. Confira os dados e tente novamente ou use o e-mail direto.')
    }
  }

  return (
    <form onSubmit={submit} aria-label={project ? 'Contar meu projeto' : 'Assinar newsletter'} className="rounded-2xl border-[3px] border-ink bg-cream p-5 shadow-brutal sm:p-6">
      {sent ? (
        <div role="status">
          <h3 className="font-display text-2xl">{project ? 'Mensagem recebida pelo serviço.' : 'Inscrição recebida pelo serviço.'}</h3>
          <p className="mt-3 leading-relaxed">{project ? 'Obrigado por contar sua ideia. Aguarde o contato do estúdio.' : 'Confira sua caixa de entrada para eventuais próximos passos.'}</p>
          <Button variant="butter" className="mt-5" onClick={() => setSent(false)}>{project ? 'Enviar outra mensagem' : 'Cadastrar outro e-mail'}</Button>
        </div>
      ) : (
        <>
          {project ? (
            <div className="mb-4">
              <label htmlFor={`${id}-name`} className={labelClasses}>Seu nome</label>
              <input id={`${id}-name`} name="name" autoComplete="name" required maxLength={120} className={inputClasses} />
            </div>
          ) : null}
          <label htmlFor={`${id}-email`} className={labelClasses}>Seu e-mail</label>
          <input id={`${id}-email`} name="email" type="email" autoComplete="email" required maxLength={254} className={inputClasses} />
          {project ? (
            <div className="mt-4">
              <label htmlFor={`${id}-message`} className={labelClasses}>O que vamos criar?</label>
              <textarea id={`${id}-message`} name="message" required maxLength={5000} rows={4} className={inputClasses} />
            </div>
          ) : null}
          <label className="mt-5 flex items-start gap-3 text-sm leading-relaxed">
            <input name="consent" type="checkbox" required className="mt-1 size-5 shrink-0 accent-ink" />
            <span>{project ? 'Autorizo o uso destes dados para responder ao meu pedido de projeto.' : 'Quero receber novidades e packs por e-mail. Posso solicitar a saída da lista a qualquer momento.'}</span>
          </label>
          {!leadsConfigured ? <p className="mt-4 text-sm font-semibold">Envio indisponível: serviço ainda não configurado. Nenhum dado será enviado; fale pelo e-mail abaixo.</p> : null}
          {error ? <p role="alert" className="mt-4 text-sm font-bold">{error}</p> : null}
          <Button type="submit" disabled={sending} className="mt-5 w-full" variant={project ? 'pink' : 'pistachio'}>
            <Send aria-hidden size={18} /> {sending ? 'Enviando…' : project ? 'Enviar meu projeto' : 'Entrar na lista'}
          </Button>
        </>
      )}
      <a href={`mailto:${contactEmail}`} className="mt-5 block break-all text-sm font-bold underline underline-offset-4">Prefere e-mail? {contactEmail}</a>
    </form>
  )
}
