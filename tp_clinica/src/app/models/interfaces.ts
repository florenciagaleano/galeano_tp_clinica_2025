export interface Especialidad {
  id?: string;
  nombre: string;
  descripcion?: string;
  activa?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Paciente {
  id?: string;
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