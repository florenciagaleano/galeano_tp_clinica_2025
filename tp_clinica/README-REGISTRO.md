# Sistema de Registro de Clínica

## Resumen del Sistema Implementado

Se ha creado un sistema completo de registro para pacientes y especialistas con las siguientes características:

### ✅ Funcionalidades Implementadas

#### Para Pacientes:
- Registro con todos los campos requeridos (Nombre, Apellido, Edad, DNI, Obra Social, Email, Contraseña)
- Subida de 2 imágenes de perfil
- Validaciones completas de formulario
- Verificación de email duplicado y DNI único

#### Para Especialistas:
- Registro con todos los campos requeridos (Nombre, Apellido, Edad, DNI, Email, Contraseña)
- Selección múltiple de especialidades existentes
- Opción para agregar nueva especialidad
- Subida de 1 imagen de perfil
- Sistema de aprobación por administrador

### 📁 Archivos Creados/Modificados

1. **Database Schema** (`database/schema.sql`)
   - Tablas: pacientes, especialistas, especialidades, especialista_especialidades
   - Políticas RLS (Row Level Security)
   - Triggers para timestamps
   - Datos iniciales de especialidades

2. **Modelos TypeScript** (`src/app/models/interfaces.ts`)
   - Interfaces para todas las entidades
   - Tipos para formularios de registro
   - Enums y tipos auxiliares

3. **Servicio Supabase** (`src/app/services/supabase.service.ts`)
   - Métodos de registro para pacientes y especialistas
   - Autenticación completa
   - Subida de imágenes
   - Validaciones de email y DNI

4. **Servicio de Especialidades** (`src/app/services/especialidades.service.ts`)
   - CRUD completo para especialidades
   - Búsqueda y filtrado
   - Estadísticas

5. **Componente de Registro** (`src/app/components/register/`)
   - Formularios reactivos con validaciones
   - Interfaz responsive
   - Manejo de errores
   - Subida de imágenes

6. **Documentación** (`docs/storage-setup.md`)
   - Instrucciones de configuración de Storage
   - Políticas de seguridad

## 🚀 Instalación y Configuración

### 1. Configurar Supabase

#### a) Ejecutar el Schema de Base de Datos
1. Ve a tu proyecto en Supabase Dashboard
2. Navega a "SQL Editor"
3. Copia y ejecuta el contenido de `database/schema.sql`

#### b) Configurar Storage
1. Ve a "Storage" en Supabase Dashboard
2. Ejecuta los comandos del archivo `docs/storage-setup.md`

#### c) Configurar Variables de Entorno
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  supabaseUrl: 'TU_SUPABASE_URL',
  supabaseKey: 'TU_SUPABASE_ANON_KEY'
};
```

### 2. Instalar Dependencias

```bash
npm install @supabase/supabase-js @angular/forms
```

### 3. Configurar el Componente en las Rutas

```typescript
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { RegisterComponent } from './components/register/register.component';

export const routes: Routes = [
  { path: 'register', component: RegisterComponent },
  // otras rutas...
];
```

### 4. Agregar FontAwesome (para los iconos)

```bash
npm install @fortawesome/fontawesome-free
```

Y en `angular.json`:
```json
"styles": [
  "node_modules/@fortawesome/fontawesome-free/css/all.min.css",
  "src/styles.css"
]
```

## 🎯 Cómo Usar el Sistema

### Registro de Pacientes
1. Selecciona "Paciente" en el formulario
2. Completa todos los campos obligatorios
3. Sube 2 imágenes de perfil (máximo 5MB cada una)
4. Confirma la contraseña
5. Haz clic en "Registrar Paciente"

### Registro de Especialistas
1. Selecciona "Especialista" en el formulario
2. Completa todos los campos obligatorios
3. Selecciona al menos una especialidad existente
4. Opcionalmente, agrega una nueva especialidad
5. Sube 1 imagen de perfil (máximo 5MB)
6. Haz clic en "Registrar Especialista"

## 🔐 Validaciones Implementadas

### Campos Obligatorios
- Nombre y Apellido: Solo letras y espacios, mínimo 2 caracteres
- Edad: Entre 1-120 años (pacientes), 23-80 años (especialistas)
- DNI: 7 u 8 dígitos numéricos únicos
- Email: Formato válido y único en el sistema
- Contraseña: Mínimo 6 caracteres
- Confirmación de contraseña: Debe coincidir

### Imágenes
- Formatos permitidos: JPG, PNG, GIF, WebP
- Tamaño máximo: 5MB por imagen
- Pacientes: 2 imágenes obligatorias
- Especialistas: 1 imagen obligatoria

### Especialidades
- Los especialistas deben seleccionar al menos una especialidad
- Pueden agregar nuevas especialidades que serán revisadas

## 🛡️ Seguridad

### Row Level Security (RLS)
- Los usuarios solo pueden ver/editar sus propios datos
- Las especialidades son visibles para todos, editables solo por admin
- Políticas específicas para cada tabla

### Autenticación
- Registro con confirmación de email
- Contraseñas hasheadas por Supabase Auth
- Tokens JWT para sesiones

### Storage
- Imágenes públicas pero con nombres aleatorios
- Políticas específicas para subida/acceso de archivos

## 📊 Base de Datos

### Tabla `pacientes`
```sql
- id (UUID, PK)
- user_id (UUID, FK a auth.users)
- nombre, apellido, edad, dni, obra_social, email
- imagen_perfil_1, imagen_perfil_2 (URLs)
- activo, email_verificado (boolean)
- timestamps
```

### Tabla `especialistas`
```sql
- id (UUID, PK)
- user_id (UUID, FK a auth.users)
- nombre, apellido, edad, dni, email
- imagen_perfil (URL)
- activo, email_verificado, aprobado_por_admin (boolean)
- timestamps
```

### Tabla `especialidades`
```sql
- id (UUID, PK)
- nombre (unique), descripcion
- activa (boolean)
- timestamps
```

### Tabla `especialista_especialidades` (Relación M:N)
```sql
- id (UUID, PK)
- especialista_id (FK)
- especialidad_id (FK)
- timestamp
```

## 🎨 Estilos y UI

- Diseño responsive con CSS Grid y Flexbox
- Gradientes y sombras modernas
- Estados de hover y focus para mejor UX
- Validación visual en tiempo real
- Animaciones suaves con CSS transitions
- Soporte para dispositivos móviles

## 🔄 Próximos Pasos Sugeridos

1. **Sistema de Login**: Implementar autenticación
2. **Panel de Administrador**: Para aprobar especialistas
3. **Perfiles de Usuario**: Páginas para ver/editar perfiles
4. **Sistema de Turnos**: Funcionalidad principal de la clínica
5. **Notificaciones**: Email/SMS para confirmaciones
6. **Dashboard**: Estadísticas y resúmenes

## 🐛 Solución de Problemas

### Error: "Storage bucket not found"
- Asegúrate de crear el bucket 'profiles' en Supabase Storage
- Verifica las políticas de acceso

### Error: "RLS policies"
- Ejecuta todas las políticas RLS del schema.sql
- Verifica que las tablas tengan RLS habilitado

### Error: "Invalid JWT"
- Verifica las credenciales de Supabase en environment.ts
- Asegúrate de que el usuario esté autenticado

## 📞 Soporte

Para dudas o problemas:
1. Revisa los logs del navegador (F12)
2. Verifica los logs de Supabase Dashboard
3. Asegúrate de que todas las configuraciones estén correctas