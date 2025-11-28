export interface Especialidad {
  id?: string;
  nombre: string;
  descripcion?: string;
  activa?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Paciente {
  id: string; // ID es obligatorio
  user_id?: string;
  nombre: string;
  apellido: string;
  edad: number;
  dni: string;
  obra_social: string;
  email: string;
  imagen_perfil_1?: string;
  imagen_perfil_2?: string;
  activo?: boolean;
  email_verificado?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Especialista {
  id?: string;
  user_id?: string;
  nombre: string;
  apellido: string;
  edad: number;
  dni: string;
  email: string;
  imagen_perfil?: string;
  duracion_turno?: number; // Duración del turno en minutos (por defecto 30)
  activo?: boolean;
  email_verificado?: boolean;
  aprobado_por_admin?: boolean;
  especialidades?: Especialidad[];
  created_at?: string;
  updated_at?: string;
}

export interface EspecialistaEspecialidad {
  id?: string;
  especialista_id: string;
  especialidad_id: string;
  created_at?: string;
}

// Interfaces para formularios de registro
export interface RegistroPacienteForm {
  nombre: string;
  apellido: string;
  edad: number;
  dni: string;
  obra_social: string;
  email: string;
  password: string;
  confirmPassword: string;
  imagen_perfil_1?: File;
  imagen_perfil_2?: File;
}

export interface RegistroEspecialistaForm {
  nombre: string;
  apellido: string;
  edad: number;
  dni: string;
  email: string;
  password: string;
  confirmPassword: string;
  especialidades: string[]; // Array de IDs de especialidades
  nueva_especialidad?: string; // Para agregar nueva especialidad
  imagen_perfil?: File;
}

// Enum para tipos de usuario
export enum TipoUsuario {
  PACIENTE = 'paciente',
  ESPECIALISTA = 'especialista',
  ADMIN = 'admin'
}

// Interface para respuesta de autenticación
export interface AuthResponse {
  success: boolean;
  message: string;
  user?: any;
  data?: any;
}

// Interface para validación de formularios
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// =============================================
// ADMINISTRADOR
// =============================================

export interface Administrador {
  id?: string;
  user_id?: string;
  nombre: string;
  apellido: string;
  edad: number;
  dni: string;
  email: string;
  imagen_perfil?: string;
  activo?: boolean;
  email_verificado?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RegistroAdministradorForm {
  nombre: string;
  apellido: string;
  edad: number;
  dni: string;
  email: string;
  password: string;
  imagen_perfil?: File;
}

// =============================================
// TURNOS
// =============================================

export enum EstadoTurno {
  PENDIENTE = 'pendiente',
  ACEPTADO = 'aceptado',
  RECHAZADO = 'rechazado',
  CANCELADO = 'cancelado',
  REALIZADO = 'realizado'
}

export interface Turno {
  id?: string;
  paciente_id: string;
  especialista_id: string;
  especialidad_id: string;
  fecha: string; // Formato ISO 8601
  hora: string; // Formato HH:mm
  duracion_minutos?: number; // Por defecto 30
  estado: EstadoTurno;
  motivo_cancelacion?: string;
  motivo_rechazo?: string;
  resena?: string; // Comentario del especialista sobre la consulta
  calificacion?: number; // Calificación del paciente (1-5)
  comentario_paciente?: string; // Comentario del paciente
  encuesta_completada?: boolean;
  created_at?: string;
  updated_at?: string;
  // Datos relacionados (para visualización)
  paciente?: Paciente;
  especialista?: Especialista;
  especialidad?: Especialidad;
}

export interface HistoriaClinica {
  id?: string;
  paciente_id: string;
  especialista_id: string;
  turno_id?: string;
  fecha: string;
  altura?: number; // en cm
  peso?: number; // en kg
  temperatura?: number; // en °C
  presion?: string; // ej: "120/80"
  datos_dinamicos?: DatoDinamico[]; // Máximo 3
  created_at?: string;
  updated_at?: string;
  // Datos relacionados (para visualización)
  especialista?: Especialista;
  turno?: Turno;
}

export interface DatoDinamico {
  clave: string;
  valor: string;
}

export interface EncuestaAtencion {
  id?: string;
  turno_id: string;
  paciente_id: string;
  especialista_id: string;
  fecha: string;
  // Respuestas de la encuesta
  respuesta_texto?: string;
  calificacion_estrellas?: number; // 1-5
  respuesta_radio?: string;
  respuestas_checkbox?: string[]; // múltiples opciones
  respuesta_rango?: number; // 0-100
  created_at?: string;
}

export interface SolicitudTurno {
  paciente_id: string;
  especialista_id: string;
  especialidad_id: string;
  fecha: string;
  hora: string;
  duracion_minutos?: number;
}

export interface DisponibilidadHoraria {
  id?: string;
  especialista_id: string;
  especialidad_id: string;
  dia_semana: string; // 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'
  horarios: HorarioDisponible[]; // Array de horarios disponibles para ese día
  activa?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HorarioDisponible {
  hora_inicio: string; // HH:mm
  hora_fin: string; // HH:mm
}