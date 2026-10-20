# SIT Marketplace App

Aplicación web de SIT Marketplace: recetas médicas, pedidos, facturación, despacho y entrega de medicamentos. Consume la API [sit-marketplace-api](https://github.com/AxelLeo129/sit-marketplace-api).

El diseño recrea el de Vuexy (el del sistema anterior) con Tailwind: menú lateral, barra superior flotante, tarjetas con sombra suave y el color primario `#003DA5`.

**Estado:** base de la aplicación lista (inicio de sesión, recuperación de contraseña, menú por rol y perfil). Los módulos se agregan en el mismo orden que la API: catálogo y usuarios, recetas, clientes y pedidos, facturación y entregas, reportes.

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
│   └── ui/          Botón, input, tarjeta, alerta… (estilo Vuexy)
├── composables/     Lógica reutilizable (useForm: envío y errores de formularios)
├── config/          Menú lateral por rol (navigation.ts)
├── layouts/         MainLayout (menú + barra) y AuthLayout (login)
├── router/          Rutas y protección por sesión/rol
├── services/        Cliente de la API (token, errores, sesión vencida)
├── stores/          Estado global (sesión)
├── types/           Tipos de los datos de la API
└── views/           Páginas, agrupadas por módulo
```

**Agregar un módulo:** crea sus vistas en `src/views/<módulo>/`, sus rutas en `src/router/index.ts` (con `meta.roles`) y su opción del menú en `src/config/navigation.ts` con los mismos roles que valida la API.

---

### 🔐 Seguridad

- La API valida todos los permisos; las rutas y el menú por rol solo ordenan la navegación.
- El token de sesión se guarda en `localStorage` y se envía como `Bearer`. Si la API lo rechaza (venció o desactivaron al usuario), la app cierra la sesión y vuelve al login.
- Después de iniciar sesión solo se redirige a rutas internas de la app (`?redirect=`).
- Las imágenes se revisan antes de subirlas (JPG, PNG o WEBP, máximo 2 MB); la API vuelve a validarlas.

---

### 🚀 Despliegue en producción

Pendiente (Firebase Hosting).

---

MIT
Free Software, software to learn!
