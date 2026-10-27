/** Tipos de evento de autenticación (App\Enums\AuthEventType en la API). */
export type AuthEventType =
  | 'login_succeeded'
  | 'login_failed'
  | 'account_locked'
  | 'logout'
  | 'password_changed'
  | 'password_reset_requested'
  | 'password_reset_completed'

export const authEventTypeLabels: Record<AuthEventType, string> = {
  login_succeeded: 'Inicio de sesión',
  login_failed: 'Intento fallido',
  account_locked: 'Cuenta bloqueada',
  logout: 'Cierre de sesión',
  password_changed: 'Cambio de contraseña',
  password_reset_requested: 'Solicitud de recuperación',
  password_reset_completed: 'Contraseña restablecida',
}

/** Motivo técnico de la API → texto para el administrador. */
export const authEventDetails: Record<string, string> = {
  bad_password: 'Contraseña incorrecta',
  unknown_user: 'El usuario no existe',
  inactive_user: 'Usuario desactivado',
  account_locked: 'Intentó entrar con la cuenta bloqueada',
}

export interface AuthEvent {
  id: number
  type: AuthEventType
  type_label: string
  /** Intento fallido o bloqueo: se resalta en rojo. */
  is_warning: boolean
  user: { id: number; name: string; role_label: string } | null
  /** Lo que se escribió para entrar (correo o colegiado). */
  login: string | null
  ip_address: string | null
  user_agent: string | null
  detail: string | null
  created_at: string
}
