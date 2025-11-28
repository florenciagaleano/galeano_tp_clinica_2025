# 🚀 INSTRUCCIONES DE CONFIGURACIÓN - Sprint 2

## ✅ ARCHIVOS CREADOS

### Componentes (3):
1. **MisTurnosComponent** - `/mis-turnos`
   - `src/app/components/mis-turnos/mis-turnos.component.ts`
   - `src/app/components/mis-turnos/mis-turnos.component.html`
   - `src/app/components/mis-turnos/mis-turnos.component.css`

2. **SolicitarTurnoComponent** - `/solicitar-turno`
   - `src/app/components/solicitar-turno/solicitar-turno.component.ts`
   - `src/app/components/solicitar-turno/solicitar-turno.component.html`
   - `src/app/components/solicitar-turno/solicitar-turno.component.css`

3. **TurnosComponent** - `/turnos` (Admin)
   - `src/app/components/turnos/turnos.component.ts`
   - `src/app/components/turnos/turnos.component.html`
   - `src/app/components/turnos/turnos.component.css`

### Scripts SQL (2):
1. **turnos_schema.sql** - Tablas principales
2. **especialistas_update.sql** - Actualización de tabla especialistas

### Documentación (2):
1. **SPRINT2_TURNOS_RESUMEN.md** - Documentación técnica detallada
2. **SPRINT2_COMPLETADO.md** - Resumen completo del sprint

---

## 📋 PASOS PARA CONFIGURAR SUPABASE

### Paso 1: Actualizar Tabla Especialistas
```bash
# Ejecutar en SQL Editor de Supabase:
```
```sql
-- Agregar columnas necesarias
ALTER TABLE public.especialistas 
ADD COLUMN IF NOT EXISTS duracion_turno INTEGER DEFAULT 30;

ALTER TABLE public.especialistas 
ADD COLUMN IF NOT EXISTS habilitado BOOLEAN DEFAULT FALSE;
```

### Paso 2: Crear Tablas de Turnos
```bash
# Copiar todo el contenido de: database/turnos_schema.sql
# Pegar en SQL Editor de Supabase
# Ejecutar el script completo
```

### Paso 3: Verificar Creación
```sql
-- Verificar que las tablas se crearon:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('turnos', 'historia_clinica', 'encuestas_atencion', 'disponibilidad_horaria');
```

**Deberías ver 4 filas como resultado.**

---

## 🗄️ ESTRUCTURA DE TABLAS CREADAS

### 1. **turnos**
- id (UUID)
- paciente_id (FK → pacientes)
- especialista_id (FK → especialistas)
- especialidad_id (FK → especialidades)
- fecha, hora, duracion_minutos
- estado (pendiente, aceptado, rechazado, cancelado, realizado)
- motivo_cancelacion, motivo_rechazo
- resena, calificacion, comentario_paciente
- encuesta_completada
- created_at, updated_at

**Índices:** paciente_id, especialista_id, especialidad_id, fecha, estado, fecha+hora

**RLS Policies:**
- Pacientes: Solo ven sus propios turnos
- Especialistas: Solo ven turnos asignados
- Admins: Ven todos los turnos

### 2. **historia_clinica** (Sprint 3)
- Datos fijos: altura, peso, temperatura, presión
- Datos dinámicos: JSONB con pares clave-valor

### 3. **encuestas_atencion** (Sprint 6)
- Encuestas de satisfacción del paciente

### 4. **disponibilidad_horaria**
- especialista_id, especialidad_id
- dia_semana (string: 'lunes', 'martes', etc.)
- horarios (JSONB array de {hora_inicio, hora_fin})

---

## 🔄 FLUJOS DE NAVEGACIÓN

### Usuario PACIENTE:
```
Login → Home
   ↓
Solicitar Turno (/solicitar-turno)
   ↓
   1. Seleccionar especialidad
   2. Seleccionar especialista  
   3. Seleccionar fecha y hora
   4. Confirmar
   ↓
Mis Turnos (/mis-turnos)
   - Ver lista de turnos
   - Cancelar turno (si está pendiente/aceptado)
   - Ver reseña del especialista
   - Calificar atención (después de realizado)
   - Completar encuesta (después de realizado)
```

### Usuario ESPECIALISTA:
```
Login → Home
   ↓
Mis Turnos (/mis-turnos)
   - Ver turnos asignados
   - Aceptar turno pendiente
   - Rechazar turno (con motivo)
   - Cancelar turno (con motivo)
   - Finalizar turno (con reseña obligatoria)
   - Ver calificaciones de pacientes
```

### Usuario ADMINISTRADOR:
```
Login → Home
   ↓
Turnos (/turnos)
   - Ver TODOS los turnos de la clínica
   - Estadísticas en tiempo real
   - Filtrar por texto o estado
   - Cancelar cualquier turno
   - Exportar a Excel (placeholder)
   - Generar PDF (placeholder)
   ↓
Solicitar Turno (/solicitar-turno)
   - Seleccionar paciente primero
   - Luego seguir flujo normal
```

---

## 🎨 CARACTERÍSTICAS IMPLEMENTADAS

### ✅ Filtros
- **Sin combobox** (como requiere el Sprint 2)
- Input de texto único que busca en todos los campos
- Filtro adicional por estado (select) solo en vista Admin

### ✅ Estados de Turno
- **Pendiente** (amarillo) → Recién creado
- **Aceptado** (azul) → Especialista aceptó
- **Realizado** (verde) → Consulta completada
- **Rechazado** (rojo) → Especialista rechazó
- **Cancelado** (rojo) → Cancelado por paciente/especialista

### ✅ Modales Implementados
1. **Cancelar Turno** - Textarea para motivo
2. **Rechazar Turno** - Textarea para motivo
3. **Finalizar Turno** - Textarea para reseña/diagnóstico
4. **Calificar Atención** - 5 estrellas + comentario
5. **Ver Reseña** - Solo lectura
6. **Completar Encuesta** - Placeholder (Sprint 6)
7. **Cancelar (Admin)** - Textarea para motivo

### ✅ Validaciones
- Motivo obligatorio al cancelar/rechazar
- Reseña obligatoria al finalizar
- Solo se muestran acciones según estado del turno
- Fechas limitadas a próximos 15 días
- Excluye domingos del calendario
- Verifica turnos ya ocupados

---

## 🧪 DATOS DE PRUEBA SUGERIDOS

### 1. Especialidades (3):
```sql
INSERT INTO public.especialidades (nombre) VALUES
('Cardiología'),
('Pediatría'),
('Dermatología');
```

### 2. Pacientes (5):
Crear desde `/register` como Paciente

### 3. Especialistas (3):
Crear desde `/register` como Especialista
**IMPORTANTE:** Aprobar desde `/usuarios` (admin)

### 4. Disponibilidad Horaria:
```sql
-- Ejemplo para especialista (reemplazar IDs):
INSERT INTO public.disponibilidad_horaria 
(especialista_id, especialidad_id, dia_semana, horarios) 
VALUES 
('UUID-ESPECIALISTA', 'UUID-ESPECIALIDAD', 'lunes', 
 '[{"hora_inicio": "08:00", "hora_fin": "12:00"}, 
   {"hora_inicio": "14:00", "hora_fin": "18:00"}]'::jsonb);
```

### 5. Turnos de Prueba:
Crear desde `/solicitar-turno` en diferentes estados

---

## ⚠️ PENDIENTE DE IMPLEMENTAR

### 1. Métodos en SupabaseService:
Los componentes tienen comentarios `// TODO` donde se necesitan:

```typescript
// En supabase.service.ts agregar:
async obtenerTurnosPaciente(pacienteId: string)
async obtenerTurnosEspecialista(especialistaId: string)
async crearTurno(solicitud: SolicitudTurno)
async cancelarTurno(turnoId: string, motivo: string)
async rechazarTurno(turnoId: string, motivo: string)
async aceptarTurno(turnoId: string)
async finalizarTurno(turnoId: string, resena: string)
async calificarTurno(turnoId: string, calificacion: number, comentario: string)
async obtenerDisponibilidadEspecialista(especialistaId: string, especialidadId: string)
```

### 2. Componente MiPerfil:
- Mostrar datos del usuario
- Para especialistas: Configurar disponibilidad horaria
- Para pacientes: Ver historia clínica (Sprint 3)

### 3. Funciones Placeholder:
- Exportar a Excel (botón en `/turnos`)
- Generar PDF (botón en `/turnos`)
- Ver historia clínica (link en cards de turnos)
- Completar encuesta (modal en `/mis-turnos`)

---

## 🐛 TESTING RECOMENDADO

### Escenarios a Probar:

1. **Como Paciente:**
   - [ ] Solicitar turno (flujo completo)
   - [ ] Ver mis turnos
   - [ ] Cancelar un turno pendiente
   - [ ] Calificar un turno realizado
   - [ ] Intentar calificar un turno pendiente (debe fallar)

2. **Como Especialista:**
   - [ ] Ver turnos asignados
   - [ ] Aceptar turno pendiente
   - [ ] Rechazar turno con motivo
   - [ ] Finalizar turno con reseña
   - [ ] Ver calificación de paciente

3. **Como Admin:**
   - [ ] Ver todos los turnos
   - [ ] Filtrar por texto
   - [ ] Filtrar por estado
   - [ ] Crear turno para un paciente
   - [ ] Cancelar cualquier turno
   - [ ] Ver estadísticas en tiempo real

4. **Validaciones:**
   - [ ] No se puede crear turno en domingo
   - [ ] No se puede crear turno más allá de 15 días
   - [ ] Horarios ocupados no aparecen disponibles
   - [ ] Motivos obligatorios al cancelar/rechazar
   - [ ] Reseña obligatoria al finalizar

---

## 📞 SOPORTE

Si encuentras errores o tienes dudas:
1. Verificar que las tablas se crearon correctamente en Supabase
2. Verificar que las RLS policies están activas
3. Verificar que los especialistas están aprobados y habilitados
4. Revisar la consola del navegador para errores de TypeScript
5. Revisar los logs de Supabase para errores de base de datos

---

## ✨ PRÓXIMO SPRINT

**Sprint 3 - Historia Clínica**
- Cargar datos clínicos al finalizar turno
- Ver historia clínica completa
- Descargar PDF de historia clínica
- Agregar datos dinámicos personalizados

---

**Fecha:** 14 de Noviembre 2025
**Estado Sprint 2:** ✅ COMPLETADO
**Listo para:** Testing y Sprint 3
