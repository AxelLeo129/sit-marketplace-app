import { computed, ref } from 'vue'
import { api } from '@/services/api'
import type { Collection } from '@/types/api'
import type { Category, Lab, Presentation } from '@/types/catalog'

/**
 * Categorías, laboratorios y presentaciones para llenar filtros y formularios.
 */
export function useCatalogOptions() {
  const categories = ref<Category[]>([])
  const labs = ref<Lab[]>([])
  const presentations = ref<Presentation[]>([])

  async function load(): Promise<void> {
    const [categoryList, labList, presentationList] = await Promise.all([
      api.get<Collection<Category>>('/categories'),
      api.get<Collection<Lab>>('/labs'),
      api.get<Collection<Presentation>>('/presentations'),
    ])
    categories.value = categoryList.data
    labs.value = labList.data
    presentations.value = presentationList.data
  }

  // Formato que espera BaseSelect.
  const categoryOptions = computed(() =>
    categories.value.map((item) => ({ value: item.id, label: item.name })),
  )
  const labOptions = computed(() =>
    labs.value.map((item) => ({ value: item.id, label: item.name })),
  )
  const presentationOptions = computed(() =>
    presentations.value.map((item) => ({ value: item.id, label: item.label })),
  )

  return { categories, categoryOptions, labOptions, presentationOptions, load }
}
