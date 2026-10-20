import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { usePaginatedList } from '@/composables/usePaginatedList'

type Filters = { search: string; lab_id: number | null; include_inactive: boolean }

const page = (current: number) => ({
  data: [{ id: current }],
  meta: { current_page: current, last_page: 3, per_page: 20, total: 50 },
})

describe('usePaginatedList', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    fetchMock = vi.fn().mockImplementation(async () => new Response(JSON.stringify(page(1))))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  /** Query string de la última petición. */
  const lastQuery = () =>
    new URL(fetchMock.mock.calls[fetchMock.mock.calls.length - 1]![0] as string, 'http://x').search

  it('envía solo los filtros con valor', async () => {
    const list = usePaginatedList<{ id: number }, Filters>('/products', {
      search: '',
      lab_id: 3,
      include_inactive: true,
    })

    await list.load()

    expect(lastQuery()).toBe('?page=1&lab_id=3&include_inactive=1')
    expect(list.items.value).toEqual([{ id: 1 }])
  })

  it('vuelve a la página 1 al cambiar un filtro y espera a que termine de escribir', async () => {
    const list = usePaginatedList<{ id: number }, Filters>('/products', {
      search: '',
      lab_id: null,
      include_inactive: false,
    })
    list.goToPage(2)
    expect(lastQuery()).toBe('?page=2')

    list.filters.search = 'ibu'
    await nextTick()
    expect(fetchMock).toHaveBeenCalledTimes(1) // Aún no: espera la pausa al escribir.

    await vi.advanceTimersByTimeAsync(400)
    expect(lastQuery()).toBe('?page=1&search=ibu')
  })
})
