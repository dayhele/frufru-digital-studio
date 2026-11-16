/**
 * Contratos do futuro Portal do Cliente (Admin × Cliente).
 *
 * Nada aqui é usado pelo MVP. Os tipos existem para que autenticação
 * (Supabase Auth com Google OAuth) e dados (PostgreSQL) entrem depois sem
 * mexer na camada de conteúdo em `lib/cms`. Os nomes de campo seguem as
 * colunas previstas das tabelas.
 */

export type UserRole = 'admin' | 'client'

export interface PortalUser {
  id: string
  email: string
  name: string
  avatarUrl?: string
  role: UserRole
  createdAt: string
}

export interface AuthSession {
  user: PortalUser
  expiresAt: string
}

/** Implementado por um adaptador Supabase quando o portal for construído. */
export interface AuthProvider {
  getSession(): Promise<AuthSession | null>
  signInWithGoogle(): Promise<void>
  signOut(): Promise<void>
}

export type ProjectStage =
  | 'briefing'
  | 'proposta'
  | 'criação'
  | 'revisão'
  | 'finalização'
  | 'entregue'

export interface ProjectStep {
  stage: ProjectStage
  title: string
  status: 'pending' | 'active' | 'done'
  completedAt?: string
  note?: string
}

export type ContractStatus = 'rascunho' | 'enviado' | 'assinado' | 'encerrado'

export interface Contract {
  id: string
  projectId: string
  status: ContractStatus
  signedAt?: string
  /** Caminho no storage; a URL assinada é gerada sob demanda. */
  filePath: string
}

export interface ClientProject {
  id: string
  clientId: string
  title: string
  steps: ProjectStep[]
  contracts: Contract[]
  updatedAt: string
}

/** Texto do resumo de status copiado com um clique no portal. */
export function formatStatusSummary(project: ClientProject): string {
  const active = project.steps.find((step) => step.status === 'active')
  const done = project.steps.filter((step) => step.status === 'done').length
  const current = active ? `Etapa atual: ${active.title}.` : 'Sem etapa em andamento.'
  return `${project.title} — ${done}/${project.steps.length} etapas concluídas. ${current}`
}
