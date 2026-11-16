/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Endpoint que recebe os leads como JSON via POST. */
  readonly VITE_LEADS_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
