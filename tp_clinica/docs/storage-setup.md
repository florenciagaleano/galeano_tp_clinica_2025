# Configuración de Storage en Supabase

## Pasos para configurar el almacenamiento de imágenes

### 1. Crear los buckets de storage

Ejecuta estos comandos en el SQL Editor de Supabase:

```sql
-- Crear bucket para perfiles de pacientes y especialistas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Crear bucket para avatars (opcional, para futuras funcionalidades)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
```

### 2. Configurar políticas de storage

```sql
-- Política para permitir que los usuarios suban imágenes
CREATE POLICY "Usuarios pueden subir sus imágenes" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'profiles' AND auth.role() = 'authenticated');

-- Política para permitir que los usuarios vean las imágenes
CREATE POLICY "Imágenes son públicamente visibles" ON storage.objects
FOR SELECT USING (bucket_id = 'profiles');

-- Política para permitir que los usuarios actualicen sus imágenes
CREATE POLICY "Usuarios pueden actualizar sus imágenes" ON storage.objects
FOR UPDATE WITH CHECK (bucket_id = 'profiles' AND auth.role() = 'authenticated');

-- Política para permitir que los usuarios eliminen sus imágenes
CREATE POLICY "Usuarios pueden eliminar sus imágenes" ON storage.objects
FOR DELETE USING (bucket_id = 'profiles' AND auth.role() = 'authenticated');
```

### 3. Configurar CORS (si es necesario)

En la configuración de tu proyecto Supabase, asegúrate de que las siguientes URLs estén permitidas:

- `http://localhost:4200` (para desarrollo)
- Tu dominio de producción

### 4. Instalar dependencias de Angular

Asegúrate de tener instaladas las dependencias necesarias:

```bash
npm install @supabase/supabase-js
npm install @angular/forms
```

### 5. Configurar variables de entorno

En `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'TU_SUPABASE_URL',
  supabaseKey: 'TU_SUPABASE_ANON_KEY'
};
```

En `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  supabaseUrl: 'TU_SUPABASE_URL',
  supabaseKey: 'TU_SUPABASE_ANON_KEY'
};
```

## Estructura de archivos en Storage

Los archivos se organizarán de la siguiente manera:

```
profiles/
├── pacientes/
│   ├── timestamp_randomid_1.jpg
│   ├── timestamp_randomid_2.jpg
│   └── ...
└── especialistas/
    ├── timestamp_randomid.jpg
    └── ...
```

## Limitaciones y consideraciones

1. **Tamaño máximo**: 5MB por imagen
2. **Formatos permitidos**: JPG, PNG, GIF, WebP
3. **Naming convention**: timestamp_randomid.extension
4. **Seguridad**: Las imágenes son públicas pero el nombre es aleatorio
5. **Cleanup**: Considera implementar limpieza de imágenes huérfanas

## Testing

Para probar la funcionalidad:

1. Registra un paciente con 2 imágenes
2. Registra un especialista con 1 imagen
3. Verifica que las imágenes se suban correctamente a Storage
4. Verifica que las URLs se guarden en la base de datos
5. Verifica que las imágenes sean accesibles públicamente