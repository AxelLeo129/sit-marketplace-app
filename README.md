# SIT Marketplace App

Aplicación web de SIT Marketplace: recetas médicas, pedidos, facturación, despacho y entrega de medicamentos. Consume la API [sit-marketplace-api](https://github.com/AxelLeo129/sit-marketplace-api).

El diseño recrea el de Vuexy (el del sistema anterior) con Tailwind: menú lateral, barra superior flotante, tarjetas con sombra suave y el color primario `#003DA5`.

#### 🧩 Módulos

| Módulo | Quién | Estado |
|---|---|---|
| Inicio de sesión, recuperar contraseña y Mi perfil | Todos | ✅ |
| Catálogo: productos (con imagen), categorías, laboratorios y presentaciones | Admin | ✅ |
| Usuarios | Admin (todos) y visitador ("Mis médicos") | ✅ |
| Recetas: emitir, editar, imprimir y enviar por correo (médico); reagendar y cancelar (call-center) | Médico, call-center, admin | ✅ |
| Clientes y pedidos: crear el pedido desde la receta (cliente, direcciones, medicamentos, pago), listado, detalle con montos según el rol y cancelación | Call-center y admin (crean); facturación, despachador y mensajero (consultan) | ✅ |
| Facturación, despacho y entrega: facturar, asignar o reasignar mensajero, salir a ruta, entregar o reportar entrega fallida | Facturación, despachador, mensajero ("Mis entregas") | ✅ |
| Reportes: ventas con gráficas y comisiones por beneficiario (admin); "Mis comisiones" | Admin y quienes cobran comisión | ✅ |
| Inicio con resumen por rol (pendientes, ventas del mes, comisiones) | Todos | ✅ |
| Registro de accesos (inicios de sesión, intentos fallidos, bloqueos) | Admin | ✅ |

Las gráficas usan un solo color (`--color-chart`, un paso más claro que el primario, validado contra fondo blanco), muestran el detalle al pasar el mouse o con el teclado y tienen "Ver como tabla".

---

### 👨‍💻 Colaboradores

<table>
  <tr>
    <td align="center"><a style="color: black" href="https://github.com/AxelLeo129"><img src="https://github.com/AxelLeo129.png" width="100" height="100" alt="Axel Leonardo"><br>Axel Leonardo</a></td>
  </tr>
</table>

---

### 🧰 Tecnologías utilizadas

- Vue **3** (Composition API, `<script setup>`) + TypeScript
- Vite
- Pinia (estado de la sesión)
- Vue Router (rutas protegidas por sesión y rol)
- Tailwind CSS **4** (tema en `src/assets/main.css`)
- Lucide (íconos, derivados de Feather, los de Vuexy)
- Vitest + happy-dom (pruebas unitarias)

---

### 🔧 Requisitos previos

- Node.js **22.12** o superior
- La API corriendo (con Laragon: http://sit-marketplace-api.test) con `CORS_ALLOWED_ORIGINS` y `FRONTEND_URL` apuntando a esta app (`http://localhost:5173` en desarrollo)

---

### 📦 Instalación

1. 📥 Clonar repositorio
    ```bash
    git clone https://github.com/AxelLeo129/sit-marketplace-app
    cd sit-marketplace-app
    ```

2. 📥 Instalar dependencias
    ```bash
    npm install
    ```

3. ⚙️ Variables de entorno
    ```bash
    cp .env.example .env
    ```
    | Variable | Descripción |
    |---|---|
    | `VITE_API_URL` | URL base de la API, p. ej. `http://sit-marketplace-api.test/api` |

    Todo lo que empieza con `VITE_` queda visible en el navegador: nunca pongas secretos aquí.

---

### ▶️ Iniciar servidor en desarrollo

```bash
npm run dev
```

La app estará disponible en 👉 http://localhost:5173

Con los datos demo de la API puedes entrar con cualquier rol excepto administrador: `<rol>@demo.test` y contraseña `password` (el médico también con el colegiado `12345`). El administrador es el que define la API en `ADMIN_EMAIL` y `ADMIN_PASSWORD`.

---

### ✅ Calidad

| Comando | Qué hace |
|---|---|
| `npm run test:unit` | Pruebas unitarias |
| `npm run type-check` | Revisión de tipos |
| `npm run lint` | Oxlint + ESLint |
| `npm run format` | Formatea con Prettier |
| `npm run build` | Revisa tipos y compila para producción en `dist/` |

---

### 🗂️ Estructura

```
src/
├── assets/          Tema (main.css) e imágenes
├── components/      Componentes compartidos
│   ├── charts/      Indicadores, columnas y barras (una serie, con tooltip y vista de tabla)
│   └── ui/          Botón, input, select, modal, tabla, paginación… (estilo Vuexy)
├── composables/     useForm (envío y errores), usePaginatedList (listas con filtros), useCatalogOptions
├── config/          Menú lateral por rol (navigation.ts)
├── layouts/         MainLayout (menú + barra) y AuthLayout (login)
├── router/          Rutas y protección por sesión/rol
├── services/        Cliente de la API (token, errores, sesión vencida)
├── stores/          Estado global (sesión y notificaciones)
├── types/           Tipos de los datos de la API
├── utils/           Formatos de moneda (Q), fechas y rangos de reportes (hora de Guatemala)
└── views/           Páginas, agrupadas por módulo (auth, profile, catalog, users, prescriptions, orders, reports, security)
```

**Agregar un módulo:** crea sus vistas en `src/views/<módulo>/` (los formularios en modal van en `components/` de esa carpeta), sus rutas en `src/router/index.ts` (con `meta.roles`) y su opción del menú en `src/config/navigation.ts` con los mismos roles que valida la API. Para listas paginadas usa `usePaginatedList`; para formularios, `useForm`; para avisos, `useToastStore`.

---

### 🔐 Seguridad

- La API valida todos los permisos; las rutas y el menú por rol solo ordenan la navegación.
- El token de sesión se guarda en `localStorage` y se envía como `Bearer`. Si la API lo rechaza (venció o desactivaron al usuario), la app cierra la sesión y vuelve al login. *(Pendiente: moverlo a una cookie HttpOnly cuando se defina el dominio de producción.)*
- Después de iniciar sesión solo se redirige a rutas internas de la app (`?redirect=`).
- Las imágenes se revisan antes de subirlas (JPG, PNG o WEBP, máximo 2 MB); la API vuelve a validarlas y las recodifica.
- **Content Security Policy** en Hosting: scripts, estilos y fuentes solo de la propia app; imágenes solo de la app y de Firebase Storage; llamadas solo a la API. Es la defensa principal contra XSS.
- La fuente Montserrat se sirve desde la propia app (`@fontsource/montserrat`), sin Google Fonts.
- HSTS, `nosniff`, sin iframes (`X-Frame-Options: DENY`), `Referrer-Policy` y `Permissions-Policy`.
- El administrador tiene **Administración → Registro de accesos**: inicios de sesión, intentos fallidos, bloqueos y cambios de contraseña con IP y navegador.

---

### 🚀 Despliegue en producción (Firebase Hosting)

La app se publica en Firebase Hosting. Este repositorio también tiene las reglas de Cloud Storage (`storage.rules`) que usa la API para las imágenes.

| Archivo | Para qué |
|---|---|
| `firebase.json` | Publica `dist/`, envía todas las rutas a `index.html` (rutas de Vue), cachea `assets/` un año y agrega encabezados de seguridad y la CSP |
| `scripts/check-csp.mjs` | Antes de publicar, comprueba que la URL de la API de `.env.production` esté permitida en la CSP |
| `storage.rules` | Solo la API escribe; el navegador solo puede ver `avatars/`, `clinic-logos/` y `products/` |
| `.env.production.example` | Plantilla de la URL de la API en producción |

**Primera vez:**
```bash
npx firebase-tools login
npx firebase-tools use --add      # elige el proyecto; crea .firebaserc
cp .env.production.example .env.production   # y pon la URL real de la API
```
En `firebase.json`, cambia `https://api.example.com` (en `connect-src` de la CSP) por el dominio real de la API. `npm run deploy` no publica si no coinciden.

**Dominio propio:** la app va en `app.tu-dominio.com` y la API en `api.tu-dominio.com` (Railway, ver el README de la API). En la consola de Firebase: **Hosting → Agregar dominio personalizado →** `app.tu-dominio.com` y crea en el DNS los registros que indica; Firebase emite el certificado HTTPS (puede tardar unas horas).

**Publicar:**
| Comando | Qué hace |
|---|---|
| `npm run deploy` | Revisa la CSP y los tipos, compila y publica en Hosting |
| `npm run deploy:rules` | Publica las reglas de Storage |

Antes de publicar, la API debe estar en internet con HTTPS y tener en sus variables la URL de la app en `CORS_ALLOWED_ORIGINS` y `FRONTEND_URL` (`https://app.tu-dominio.com`).

---

MIT
Free Software, software to learn!
