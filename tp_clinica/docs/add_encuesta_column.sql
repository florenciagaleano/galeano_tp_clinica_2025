-- Agregar columna encuesta a la tabla turnos para Sprint 6
-- Este campo almacenará la encuesta de satisfacción del paciente

ALTER TABLE turnos 
ADD COLUMN IF NOT EXISTS encuesta JSONB DEFAULT NULL;

-- Crear índice para búsquedas más rápidas
CREATE INDEX IF NOT EXISTS idx_turnos_encuesta 
ON turnos USING GIN (encuesta);

-- Comentario en la columna
COMMENT ON COLUMN turnos.encuesta IS 'Encuesta de satisfacción completada por el paciente después de la atención';

-- Verificar que la columna se creó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'turnos' AND column_name = 'encuesta';
