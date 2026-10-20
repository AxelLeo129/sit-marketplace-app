/** Respuesta de la API con un solo recurso. */
export interface Resource<T> {
  data: T
}

/** Respuesta de la API con una lista (paginada o no). */
export interface Collection<T> {
  data: T[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
