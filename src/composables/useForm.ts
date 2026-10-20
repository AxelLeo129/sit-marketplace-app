import { reactive, ref } from 'vue'
import { ApiError } from '@/services/api'

/**
 * Estado de un formulario que se envía a la API: datos, errores por campo,
 * mensaje general y si está enviando.
 *
 * @example
 * const form = useForm({ email: '' })
 * await form.submit(() => api.post('/forgot-password', form.data))
 */
export function useForm<T extends object>(initial: T) {
  const data = reactive({ ...initial })
  const errors = ref<Record<string, string>>({})
  const message = ref('')
  const processing = ref(false)

  /**
   * Ejecuta la petición. Si la API responde con error, llena `errors` (422)
   * o `message` (otros) y devuelve undefined en lugar de lanzar.
   */
  async function submit<R>(action: () => Promise<R>): Promise<R | undefined> {
    processing.value = true
    errors.value = {}
    message.value = ''

    try {
      return await action()
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error
      }

      errors.value = error.fieldErrors()
      // Con errores por campo, el detalle ya se ve junto a cada input.
      message.value = Object.keys(errors.value).length > 0 ? '' : error.message
      return undefined
    } finally {
      processing.value = false
    }
  }

  /** Vuelve a los valores iniciales. */
  function reset(): void {
    Object.assign(data, initial)
    errors.value = {}
    message.value = ''
  }

  return { data, errors, message, processing, submit, reset }
}
