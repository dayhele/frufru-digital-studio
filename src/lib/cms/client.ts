/**
 * Camada de serviço do conteúdo. Todas as leituras são assíncronas para que a
 * troca por um CMS headless (Sanity, Payload) seja só uma reimplementação
 * destas funções: os componentes não importam `mockData` diretamente.
 */
import type { MDXContent } from 'mdx/types'
import { insightPosts, packagingTemplates, projects, psdMockups, siteSettings } from './mockData'
import type {
  Discipline,
  InsightPost,
  PackagingTemplate,
  Project,
  PsdMockup,
  SiteSettings,
} from './types'

export async function getSiteSettings(): Promise<SiteSettings> {
  return siteSettings
}

export async function getProjects(filter?: { discipline?: Discipline }): Promise<Project[]> {
  const discipline = filter?.discipline
  return discipline ? projects.filter((p) => p.disciplines.includes(discipline)) : projects
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  return projects.find((p) => p.slug === slug) ?? null
}

export async function getPsdMockups(): Promise<PsdMockup[]> {
  return psdMockups
}

export async function getPackagingTemplates(): Promise<PackagingTemplate[]> {
  return packagingTemplates
}

export async function getInsightPosts(): Promise<InsightPost[]> {
  return [...insightPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

export async function getInsightBySlug(slug: string): Promise<InsightPost | null> {
  return insightPosts.find((p) => p.slug === slug) ?? null
}

/* ───────────── Corpo dos artigos (MDX) ───────────── */

type MdxModule = { default: MDXContent }

const insightBodies = import.meta.glob<MdxModule>('../../content/insights/*.mdx')

/** Carrega o corpo MDX do artigo sob demanda; `null` se o arquivo não existir. */
export async function loadInsightBody(slug: string): Promise<MDXContent | null> {
  const loader = insightBodies[`../../content/insights/${slug}.mdx`]
  if (!loader) return null
  return (await loader()).default
}
