# 🏥 Clínica Online

Sistema integral de gestión de turnos y atención médica desarrollado con **Angular 19** y **Supabase**. Este proyecto fue realizado como Trabajo Práctico para la materia Laboratorio IV de la UTN.

## 📋 Descripción

La Clínica Online es una plataforma web completa que permite la gestión eficiente de turnos médicos, perfiles de usuarios, historias clínicas y estadísticas administrativas. El sistema cuenta con tres tipos de usuarios (Pacientes, Especialistas y Administradores), cada uno con funcionalidades específicas adaptadas a sus necesidades.

### ✨ Características Principales

- 🔐 **Sistema de Autenticación:** Login seguro con validación de email y permisos según tipo de usuario.
- 👥 **Gestión de Usuarios:** Registro diferenciado para pacientes y especialistas, con aprobación administrativa.
- 📅 **Sistema de Turnos:** Solicitud, gestión y seguimiento completo de citas médicas.
- 📊 **Historias Clínicas:** Registro detallado con datos fijos y dinámicos de cada consulta.
- 📈 **Estadísticas y Reportes:** Gráficos interactivos y exportación de datos en Excel/PDF.
- 🎨 **Interfaz Moderna:** Diseño responsive con animaciones y experiencia de usuario optimizada.
- 🔍 **Búsqueda Avanzada:** Filtros inteligentes que buscan en todos los campos, incluida la historia clínica.

### 🛠️ Tecnologías Utilizadas

- **Frontend:** Angular 19 (Standalone Components)
- **Backend/Auth:** Supabase (PostgreSQL + Auth)
- **Hosting:** Firebase Hosting
- **Librerías:**
  - Chart.js (Gráficos estadísticos)
  - jsPDF (Generación de PDFs)
  - XLSX (Exportación Excel)
  - Font Awesome (Iconos)
- **Estilos:** CSS3 + SCSS con paleta de colores personalizada

## Ingreso
### Login
Acceso al sistema con validación de credenciales. Cuenta con botones de acceso rápido para facilitar el ingreso de usuarios de prueba (Pacientes, Especialistas y Administradores).

![Login](imagenes/login.png)

## Registro
Permite el alta de nuevos usuarios en el sistema.
*   **Pacientes:** Requiere datos personales, obra social y dos imágenes de perfil.
*   **Especialistas:** Requiere datos personales, especialidad(es) y una imagen de perfil. Su cuenta debe ser habilitada por un administrador.

![Registro](imagenes/registro.png)

## Home
Pantalla principal que varía según el tipo de usuario, ofreciendo accesos directos a las funcionalidades más relevantes.
*   **Acceso:** Todos los usuarios.

![Home](imagenes/home_general.png)

## Mi Perfil
Visualización y edición de datos personales.
*   **Pacientes:** Pueden ver su historia clínica y descargarla en PDF.

![Mi Perfil Paciente](imagenes/mi_perfil_paciente.png)

*   **Especialistas:** Pueden configurar sus horarios de disponibilidad ("Mis Horarios").

![Mi Perfil Especialista](imagenes/mi_perfil_especialista.png)

## Mis Turnos
Gestión de citas médicas.
*   **Pacientes:** Ver estado de turnos, cancelar, ver reseñas, completar encuestas y calificar atención. Filtros por especialidad, especialista y datos de historia clínica.

![Mis Turnos Paciente](imagenes/mis_turnos_paciente.png)

*   **Especialistas:** Ver turnos asignados, aceptar, cancelar, rechazar, finalizar turnos y cargar historia clínica. Filtros por especialidad, paciente y datos de historia clínica.

![Mis Pacientes Especialista](imagenes/mis_pacientes_especialista.png)

## Solicitar Turno
Proceso paso a paso para agendar una nueva cita. Selección de especialidad, especialista y horario disponible.
*   **Acceso:** Pacientes y Administradores (pueden solicitar turnos para pacientes).

![Solicitar Turno](imagenes/solicitar_turno.png)

## Gestión de Usuarios
Panel para administrar los usuarios del sistema. Permite habilitar/inhabilitar especialistas, crear nuevos usuarios (incluyendo administradores) y descargar la lista de usuarios en Excel.
*   **Acceso:** Solo Administradores.

![Gestión Usuarios](imagenes/gestion_usuarios_admin.png)

## Gestión de Turnos
Vista global de todos los turnos de la clínica. Permite cancelar turnos si es necesario.
*   **Acceso:** Solo Administradores.

![Gestión Turnos](imagenes/gestion_turnos_admin.png)

## Estadísticas e Informes
Panel con gráficos y reportes sobre el funcionamiento de la clínica (Log de ingresos, turnos por especialidad, turnos por día, turnos por médico, etc.). Permite descargar informes en Excel.
*   **Acceso:** Solo Administradores.

![Estadísticas](imagenes/estadisticas_admin.png)

## 🚀 Instalación y Configuración

### Requisitos Previos

- Node.js (versión 18 o superior)
- npm (versión 9 o superior)
- Angular CLI (`npm install -g @angular/cli`)
- Cuenta en Supabase (para base de datos y autenticación)

### Pasos de Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd tp_clinica
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   
   Crear el archivo `src/environments/environment.ts` con las credenciales de Supabase:
   ```typescript
   export const environment = {
     production: false,
     supabaseUrl: 'TU_SUPABASE_URL',
     supabaseKey: 'TU_SUPABASE_ANON_KEY'
   };
   ```

4. **Ejecutar el servidor de desarrollo:**
   ```bash
   npm start
   ```
   
   La aplicación estará disponible en `http://localhost:4200`

5. **Compilar para producción:**
   ```bash
   npm run build
   ```

### 🗄️ Configuración de Base de Datos (Supabase)

El proyecto requiere las siguientes tablas en Supabase:

- `pacientes` - Datos de pacientes registrados
- `especialistas` - Datos de profesionales médicos
- `administradores` - Usuarios administradores del sistema
- `especialidades` - Especialidades médicas disponibles
- `turnos` - Registro de citas médicas
- `historia_clinica` - Historiales médicos de pacientes
- `disponibilidad_horaria` - Horarios de atención de especialistas
- `logs_ingresos` - Registro de accesos al sistema

**Scripts SQL disponibles en:** `docs/` (para crear las tablas necesarias)

## 👤 Usuarios de Prueba

El sistema incluye usuarios precargados para pruebas:

### Pacientes
- Email: `paciente1@test.com` | Password: `123456`
- Email: `paciente2@test.com` | Password: `123456`

### Especialistas
- Email: `especialista1@test.com` | Password: `123456`
- Email: `especialista2@test.com` | Password: `123456`

### Administrador
- Email: `admin@clinica.com` | Password: `123456`

## 📂 Estructura del Proyecto

```
tp_clinica/
├── src/
│   ├── app/
│   │   ├── components/        # Componentes de la aplicación
│   │   │   ├── home/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── mi-perfil/
│   │   │   ├── mis-turnos/
│   │   │   ├── solicitar-turno/
│   │   │   ├── turnos/
│   │   │   ├── usuarios/
│   │   │   ├── pacientes/
│   │   │   └── estadisticas/
│   │   ├── directives/        # Directivas personalizadas
│   │   ├── pipes/             # Pipes personalizados
│   │   ├── services/          # Servicios (Supabase, Auth, etc.)
│   │   ├── models/            # Interfaces y tipos
│   │   ├── animations/        # Animaciones de rutas
│   │   └── styles/            # Estilos globales
│   ├── assets/                # Recursos estáticos
│   └── environments/          # Configuración de entornos
├── docs/                      # Documentación y scripts SQL
└── imagenes/                  # Capturas de pantalla

```

## 🎯 Funcionalidades por Tipo de Usuario

### 👨‍⚕️ Pacientes
- Registrarse con datos personales y obra social
- Solicitar turnos con especialistas
- Ver estado de sus turnos
- Cancelar turnos pendientes
- Calificar atención recibida
- Completar encuestas de satisfacción
- Ver y descargar su historia clínica en PDF

### 🩺 Especialistas
- Registrarse con especialidades
- Configurar horarios de disponibilidad
- Gestionar turnos asignados (aceptar/rechazar/cancelar)
- Finalizar consultas y cargar historias clínicas
- Ver listado de pacientes atendidos
- Descargar reportes de atenciones por especialidad

### 🔧 Administradores
- Aprobar cuentas de especialistas
- Crear usuarios (pacientes, especialistas, administradores)
- Gestionar todos los turnos de la clínica
- Ver estadísticas completas del sistema
- Descargar reportes en Excel/PDF
- Cancelar turnos en caso necesario

## 📊 Características Técnicas

- **Arquitectura:** Standalone Components (Angular 19)
- **Estado:** Signals y RxJS
- **Routing:** Lazy Loading con animaciones personalizadas
- **Directivas:** 3 directivas personalizadas (highlight, formato-dni, animación-entrada)
- **Pipes:** 3 pipes personalizados (estado-turno, fecha-turno, especialidades)
- **Animaciones:** Transiciones entre rutas con efectos slide y fade
- **Seguridad:** Guards de autenticación y autorización por roles
- **Responsive:** Diseño adaptable a dispositivos móviles

## 🎨 Paleta de Colores

```css
--first-color: #fbfbfb;   /* Fondo principal */
--second-color: #b9e1dc;  /* Acentos secundarios */
--third-color: #f38181;   /* Alertas y destacados */
--fourth-color: #756c83;  /* Botones y elementos principales */
```

## 📝 Licencia

Este proyecto fue desarrollado con fines educativos para la UTN - Laboratorio IV.

---

**Desarrollado por:** [Tu Nombre]  
**Año:** 2025  
**Institución:** Universidad Tecnológica Nacional
