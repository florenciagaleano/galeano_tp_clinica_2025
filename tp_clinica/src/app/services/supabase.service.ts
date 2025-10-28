import { Injectable } from '@angular/core';
import { createClient, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { 
  Paciente, 
  Especialista, 
  Especialidad, 
  RegistroPacienteForm, 
  RegistroEspecialistaForm,
  AuthResponse,
  TipoUsuario 
} from '../models/interfaces';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  supabase: SupabaseClient;
  private supabaseUrl = environment.supabaseUrl;
  private supabaseKey = environment.supabaseKey;
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    
    // Escuchar cambios en la sesión
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.currentUserSubject.next(session?.user ?? null);
    });
  }

  // =============================================
  // MÉTODOS DE AUTENTICACIÓN
  // =============================================

  async registrarPaciente(formData: RegistroPacienteForm): Promise<AuthResponse> {
    try {
      console.log('Iniciando registro de paciente...', { email: formData.email });
      
      // 1. Registrar usuario en auth
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: TipoUsuario.PACIENTE
          }
        }
      });

      console.log('Resultado auth:', { authData, authError });

      if (authError) {
        switch (authError.message) {
          case 'User already registered':
            return { success: false, message: 'El email ya está registrado. Intenta iniciar sesión.' };
          case 'Password should be at least 6 characters':
            return { success: false, message: 'La contraseña debe tener al menos 6 caracteres.' };
          default:
            return { success: false, message: authError.message };
        }
      }

      if (!authData.user) {
        return { success: false, message: 'Error al crear usuario' };
      }

      // 2. Subir imágenes si existen
      let imagen_perfil_1_url = '';
      let imagen_perfil_2_url = '';

      if (formData.imagen_perfil_1) {
        console.log('Subiendo imagen 1...');
        const imagen1Result = await this.subirImagen(formData.imagen_perfil_1, 'pacientes');
        console.log('Resultado imagen 1:', imagen1Result);
        if (imagen1Result.success) {
          imagen_perfil_1_url = imagen1Result.url!;
        }
      }

      if (formData.imagen_perfil_2) {
        console.log('Subiendo imagen 2...');
        const imagen2Result = await this.subirImagen(formData.imagen_perfil_2, 'pacientes');
        console.log('Resultado imagen 2:', imagen2Result);
        if (imagen2Result.success) {
          imagen_perfil_2_url = imagen2Result.url!;
        }
      }

      // 3. Crear registro en tabla pacientes
      const pacienteData: Partial<Paciente> = {
        user_id: authData.user.id,
        nombre: formData.nombre,
        apellido: formData.apellido,
        edad: formData.edad,
        dni: formData.dni,
        obra_social: formData.obra_social,
        email: formData.email,
        imagen_perfil_1: imagen_perfil_1_url,
        imagen_perfil_2: imagen_perfil_2_url
      };

      console.log('Insertando paciente:', pacienteData);

      const { data: pacienteResult, error: pacienteError } = await this.supabase
        .from('pacientes')
        .insert(pacienteData)
        .select()
        .single();

      console.log('Resultado inserción paciente:', { pacienteResult, pacienteError });

      if (pacienteError) {
        // Si falla, eliminar usuario de auth
        console.log('Error al insertar paciente, eliminando usuario de auth...');
        try {
          await this.supabase.auth.signOut();
        } catch (e) {
          console.warn('Error al hacer signOut:', e);
        }

        switch (pacienteError.message) {
          case 'Duplicate entry':
            return { success: false, message: 'El DNI ya está registrado. Usa otro DNI.' };
          default:
        }
        return { success: false, message: `Error al crear paciente: ${pacienteError.message}. Detalles: ${JSON.stringify(pacienteError)}` };
      }

      return {
        success: true,
        message: 'Paciente registrado exitosamente. Verifica tu email para activar la cuenta.',
        data: pacienteResult
      };

    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async registrarEspecialista(formData: RegistroEspecialistaForm): Promise<AuthResponse> {
    try {
      // 1. Registrar usuario en auth
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: TipoUsuario.ESPECIALISTA
          }
        }
      });

      if (authError) {
        return { success: false, message: authError.message };
      }

      if (!authData.user) {
        return { success: false, message: 'Error al crear usuario' };
      }

      // 2. Subir imagen de perfil si existe
      let imagen_perfil_url = '';
      if (formData.imagen_perfil) {
        const imagenResult = await this.subirImagen(formData.imagen_perfil, 'especialistas');
        if (imagenResult.success) {
          imagen_perfil_url = imagenResult.url!;
        }
      }

      // 3. Crear registro en tabla especialistas
      const especialistaData: Partial<Especialista> = {
        user_id: authData.user.id,
        nombre: formData.nombre,
        apellido: formData.apellido,
        edad: formData.edad,
        dni: formData.dni,
        email: formData.email,
        imagen_perfil: imagen_perfil_url
      };

      const { data: especialistaResult, error: especialistaError } = await this.supabase
        .from('especialistas')
        .insert(especialistaData)
        .select()
        .single();

      if (especialistaError) {
        await this.supabase.auth.admin.deleteUser(authData.user.id);
        return { success: false, message: `Error al crear especialista: ${especialistaError.message}` };
      }

      // 4. Agregar nueva especialidad si se especifica
      if (formData.nueva_especialidad) {
        await this.agregarEspecialidad({
          nombre: formData.nueva_especialidad,
          descripcion: `Especialidad agregada por ${formData.nombre} ${formData.apellido}`
        });
      }

      // 5. Asociar especialidades
      if (formData.especialidades.length > 0) {
        const especialidadesData = formData.especialidades.map(especialidadId => ({
          especialista_id: especialistaResult.id,
          especialidad_id: especialidadId
        }));

        const { error: especialidadesError } = await this.supabase
          .from('especialista_especialidades')
          .insert(especialidadesData);

        if (especialidadesError) {
          console.warn('Error al asociar especialidades:', especialidadesError);
        }
      }

      return {
        success: true,
        message: 'Especialista registrado exitosamente. Pendiente de aprobación por administrador.',
        data: especialistaResult
      };

    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async iniciarSesion(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, message: error.message };
      }

      return {
        success: true,
        message: 'Sesión iniciada exitosamente',
        user: data.user
      };

    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async cerrarSesion(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  async obtenerUsuarioActual(): Promise<User | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  // =============================================
  // MÉTODOS PARA ESPECIALIDADES
  // =============================================

  async obtenerEspecialidades(): Promise<Especialidad[]> {
    const { data, error } = await this.supabase
      .from('especialidades')
      .select('*')
      .eq('activa', true)
      .order('nombre');

    if (error) {
      console.error('Error al obtener especialidades:', error);
      return [];
    }

    return data || [];
  }

  async agregarEspecialidad(especialidad: Partial<Especialidad>): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase
        .from('especialidades')
        .insert(especialidad)
        .select()
        .single();

      if (error) {
        return { success: false, message: error.message };
      }

      return {
        success: true,
        message: 'Especialidad agregada exitosamente',
        data
      };

    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  // =============================================
  // MÉTODOS PARA IMÁGENES
  // =============================================

  async subirImagen(file: File, folder: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { data, error } = await this.supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (error) {
        return { success: false, error: error.message };
      }

      const { data: urlData } = this.supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      return { success: true, url: urlData.publicUrl };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // =============================================
  // MÉTODOS DE VALIDACIÓN
  // =============================================

  async verificarEmailExiste(email: string): Promise<boolean> {
    const { data: paciente } = await this.supabase
      .from('pacientes')
      .select('id')
      .eq('email', email)
      .single();

    const { data: especialista } = await this.supabase
      .from('especialistas')
      .select('id')
      .eq('email', email)
      .single();

    return !!(paciente || especialista);
  }

  async verificarDniExiste(dni: string): Promise<boolean> {
    const { data: paciente } = await this.supabase
      .from('pacientes')
      .select('id')
      .eq('dni', dni)
      .single();

    const { data: especialista } = await this.supabase
      .from('especialistas')
      .select('id')
      .eq('dni', dni)
      .single();

    return !!(paciente || especialista);
  }
}
