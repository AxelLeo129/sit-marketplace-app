import { reactive, ref, watch } from 'vue'
import { api, ApiError } from '@/services/api'
import type { Collection } from '@/types/api'

type Filters = Record<string, string | number | boolean | null>

/**
 * Lista paginada de la API con filtros. Vuelve a cargar al cambiar un filtro
 * (la búsqueda espera a que el usuario deje de escribir) y regresa a la página 1.
 *
 * @example
 * type ProductFilters = { search: string; lab_id: number | null }
 * const list = usePaginatedList<Product, ProductFilters>('/products', { search: '', lab_id: null })
 */
export function usePaginatedList<T, F extends Filters = Filters>(
  endpoint: string,
  initialFilters: F,
) {
  const items = ref<T[]>([])
  const meta = ref<Collection<T>['meta']>()
  const filters = reactive({ ...initialFilters }) as F
  const page = ref(1)
  // Empieza cargando: la vista llama a load() al montarse y así no parpadea "sin resultados".
  const loading = ref(true)
  const error = ref('')

  /** Filtros con valor, como query string (los vacíos no se envían). */
  function query(): string {
    const params = new URLSearchParams({ page: String(page.value) })
    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === '' || value === false) continue
      params.set(key, value === true ? '1' : String(value))
    }
    return params.toString()
  }

  async function load(): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      const response = await api.get<Collection<T>>(`${endpoint}?${query()}`)
      items.value = response.data
      meta.value = response.meta
    } catch (e) {
      error.value = e instanceof ApiError ? e.message : 'No se pudo cargar la lista.'
    } finally {
      loading.value = false
    }
  }

  function goToPage(newPage: number): void {
    page.value = newPage
    load()
  }

  let searchTimer: ReturnType<typeof setTimeout> | undefined
  watch(
    () => ({ ...filters }),
    (current, previous) => {
      page.value = 1
      clearTimeout(searchTimer)
      // Solo la búsqueda de texto espera; los demás filtros recargan al instante.
      const delay = current.search !== previous.search ? 350 : 0
      searchTimer = setTimeout(load, delay)
    },
  )

  return { items, meta, filters, loading, error, load, goToPage }
}
