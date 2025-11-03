import { Injectable } from '@angular/core';
import { createClient, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { 
  Paciente, 
  Especialista, 
  Especialidad, 
  RegistroPacienteForm, 
  RegistroEspecialistaForm,
  Administrador,
  RegistroAdministradorForm,
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
        // Mejorar manejo de errores de autenticación
        let errorMessage = 'Error en el registro';
        
        if (authError.message?.includes('User already registered') || authError.message?.includes('already registered')) {
          errorMessage = 'El email ya está registrado. Por favor, intenta iniciar sesión o usa otro email.';
        } else if (authError.message?.includes('Password should be at least 6 characters')) {
          errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
        } else if (authError.message?.includes('Invalid email')) {
          errorMessage = 'El formato del email no es válido.';
        } else if (authError.message?.includes('weak password')) {
          errorMessage = 'La contraseña es muy débil. Usa una contraseña más segura.';
        } else {
          errorMessage = `Error de autenticación: ${authError.message}`;
        }
        
        console.error('Error de autenticación:', authError);
        return { success: false, message: errorMessage };
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
        imagen_perfil_2: imagen_perfil_2_url,
        activo: true,  // Por defecto activo
        email_verificado: false
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

        // Mejorar manejo de errores de duplicación
        let errorMessage = 'Error al registrar paciente';
        
        if (pacienteError.code === '23505' || pacienteError.message?.includes('duplicate') || pacienteError.message?.includes('unique')) {
          // Error de violación de restricción de unicidad
          const details = pacienteError.details || '';
          const message = pacienteError.message || '';
          
          if (message.includes('email') || details.includes('email')) {
            errorMessage = 'El email ya está registrado. Por favor, usa otro email.';
          } else if (message.includes('dni') || details.includes('dni') || details.includes('Key (dni)')) {
            errorMessage = 'El DNI ya está registrado. Por favor, usa otro DNI.';
          } else {
            errorMessage = 'Ya existe un usuario con estos datos. Verifica el email y DNI.';
          }
        } else {
          errorMessage = `Error al crear paciente: ${pacienteError.message}`;
        }

        console.error('Error:', pacienteError);
        return { success: false, message: errorMessage };
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
        // Mejorar manejo de errores de autenticación
        let errorMessage = 'Error en el registro';
        
        if (authError.message?.includes('email') || authError.message?.includes('already registered')) {
          errorMessage = 'El email ya está registrado. Por favor, intenta iniciar sesión o usa otro email.';
        } else if (authError.message?.includes('Password should be at least 6 characters')) {
          errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
        } else if (authError.message?.includes('Invalid email')) {
          errorMessage = 'El formato del email no es válido.';
        } else if (authError.message?.includes('weak password')) {
          errorMessage = 'La contraseña es muy débil. Usa una contraseña más segura.';
        } else {
          errorMessage = `Error de autenticación: ${authError.message}`;
        }
        
        console.error('Error de autenticación:', authError);
        return { success: false, message: errorMessage };
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
        imagen_perfil: imagen_perfil_url,
        activo: true,  // Por defecto activo
        email_verificado: false,
        aprobado_por_admin: false  // Por defecto pendiente de aprobación
      };

      const { data: especialistaResult, error: especialistaError } = await this.supabase
        .from('especialistas')
        .insert(especialistaData)
        .select()
        .single();

      if (especialistaError) {
        await this.supabase.auth.admin.deleteUser(authData.user.id);
        
        // Mejorar manejo de errores de duplicación
        let errorMessage = 'Error al registrar especialista';
        
        if (especialistaError.code === '23505' || especialistaError.message?.includes('duplicate') || especialistaError.message?.includes('unique')) {
          // Error de violación de restricción de unicidad
          const details = especialistaError.details || '';
          const message = especialistaError.message || '';
          
          if (message.includes('email') || details.includes('email')) {
            errorMessage = 'El email ya está registrado. Por favor, usa otro email.';
          } else if (message.includes('dni') || details.includes('dni') || details.includes('Key (dni)')) {
            errorMessage = 'El DNI ya está registrado. Por favor, usa otro DNI.';
          } else {
            errorMessage = 'Ya existe un usuario con estos datos. Verifica el email y DNI.';
          }
        } else {
          errorMessage = `Error al crear especialista: ${especialistaError.message}`;
        }

        console.error('Error detallado:', especialistaError);
        return { success: false, message: errorMessage };
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

  async registrarAdministrador(formData: RegistroAdministradorForm): Promise<AuthResponse> {
    try {
      console.log('Iniciando registro de administrador...', { email: formData.email });
      
      // 1. Registrar usuario en auth
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: TipoUsuario.ADMIN
          }
        }
      });

      if (authError) {
        console.error('Error en auth:', authError);
        
        // Mejorar manejo de errores de autenticación
        let errorMessage = 'Error en el registro';
        
        if (authError.message?.includes('User already registered') || authError.message?.includes('already registered')) {
          errorMessage = 'El email ya está registrado. Por favor, intenta iniciar sesión o usa otro email.';
        } else if (authError.message?.includes('Password should be at least 6 characters')) {
          errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
        } else if (authError.message?.includes('Invalid email')) {
          errorMessage = 'El formato del email no es válido.';
        } else if (authError.message?.includes('weak password')) {
          errorMessage = 'La contraseña es muy débil. Usa una contraseña más segura.';
        } else {
          errorMessage = `Error de autenticación: ${authError.message}`;
        }
        
        return { success: false, message: errorMessage };
      }

      if (!authData.user) {
        return { success: false, message: 'Error al crear usuario' };
      }

      console.log('Usuario auth creado:', authData.user.id);

      // 2. Subir imagen de perfil si existe
      let imagenPerfilUrl = '';
      if (formData.imagen_perfil) {
        console.log('Subiendo imagen de administrador...');
        const imagenResult = await this.subirImagen(formData.imagen_perfil, 'administradores');
        console.log('Resultado imagen administrador:', imagenResult);
        if (imagenResult.success) {
          imagenPerfilUrl = imagenResult.url!;
        } else {
          console.warn('No se pudo subir la imagen:', imagenResult.error);
          // No fallar todo el registro por la imagen
        }
      }

      // 3. Crear registro en la tabla administradores
      const administradorData = {
        user_id: authData.user.id,
        nombre: formData.nombre,
        apellido: formData.apellido,
        edad: formData.edad,
        dni: formData.dni,
        email: formData.email,
        imagen_perfil: imagenPerfilUrl,
        activo: true,
        email_verificado: false
      };

      const { data: administradorResult, error: administradorError } = await this.supabase
        .from('administradores')
        .insert([administradorData])
        .select()
        .single();

      if (administradorError) {
        console.error('Error al crear administrador:', administradorError);
        
        // Limpiar el usuario de auth si falló la inserción
        await this.supabase.auth.admin.deleteUser(authData.user.id);
        
        // Mejorar manejo de errores de duplicación
        let errorMessage = 'Error al registrar administrador';
        
        if (administradorError.code === '23505' || administradorError.message?.includes('duplicate') || administradorError.message?.includes('unique')) {
          // Error de violación de restricción de unicidad
          const details = administradorError.details || '';
          const message = administradorError.message || '';
          
          if (message.includes('email') || details.includes('email')) {
            errorMessage = 'El email ya está registrado. Por favor, usa otro email.';
          } else if (message.includes('dni') || details.includes('dni') || details.includes('Key (dni)')) {
            errorMessage = 'El DNI ya está registrado. Por favor, usa otro DNI.';
          } else {
            errorMessage = 'Ya existe un usuario con estos datos. Verifica el email y DNI.';
          }
        } else {
          errorMessage = `Error al crear administrador: ${administradorError.message}`;
        }

        console.error('Error detallado:', administradorError);
        return { success: false, message: errorMessage };
      }

      console.log('Administrador creado exitosamente:', administradorResult);

      return {
        success: true,
        message: 'Administrador registrado exitosamente.',
        data: administradorResult
      };

    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async iniciarSesion(email: string, password: string): Promise<AuthResponse> {
    try {
      const usuarioActual = await this.obtenerUsuarioActual();
      //console.log('Usuario actual antes de iniciar sesión:', usuarioActual);

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, message: error.message };
      }

      // Verificar el estado del usuario después de la autenticación exitosa
      const validacionUsuario = await this.validarEstadoUsuario(data.user.id);
      
      if (!validacionUsuario.puedeAcceder) {
        // Cerrar la sesión inmediatamente si no puede acceder
        await this.supabase.auth.signOut();
        return { 
          success: false, 
          message: validacionUsuario.mensaje 
        };
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

  // Nuevo método para validar el estado del usuario
  private async validarEstadoUsuario(userId: string): Promise<{ puedeAcceder: boolean; mensaje: string; tipoUsuario?: TipoUsuario }> {
    try {
      // Buscar en pacientes
      const { data: paciente } = await this.supabase
        .from('pacientes')
        .select('activo')
        .eq('user_id', userId)
        .single();

      if (paciente) {
        if (!paciente.activo) {
          return {
            puedeAcceder: false,
            mensaje: 'Tu cuenta ha sido desactivada por un administrador. Contacta con soporte para más información.',
            tipoUsuario: TipoUsuario.PACIENTE
          };
        }

        return { puedeAcceder: true, mensaje: 'Acceso permitido', tipoUsuario: TipoUsuario.PACIENTE };
      }

      // Buscar en especialistas
      const { data: especialista } = await this.supabase
        .from('especialistas')
        .select('activo, aprobado_por_admin')
        .eq('user_id', userId)
        .single();

      if (especialista) {
        if (!especialista.activo) {
          return {
            puedeAcceder: false,
            mensaje: 'Tu cuenta ha sido desactivada por un administrador. Contacta con soporte para más información.',
            tipoUsuario: TipoUsuario.ESPECIALISTA
          };
        }

        if (!especialista.aprobado_por_admin) {
          return {
            puedeAcceder: false,
            mensaje: 'Tu cuenta está pendiente de aprobación por un administrador. Te notificaremos cuando sea aprobada.',
            tipoUsuario: TipoUsuario.ESPECIALISTA
          };
        }
        return { puedeAcceder: true, mensaje: 'Acceso permitido', tipoUsuario: TipoUsuario.ESPECIALISTA };
      }

      // Buscar en administradores
      const { data: administrador } = await this.supabase
        .from('administradores')
        .select('activo, email_verificado')
        .eq('user_id', userId)
        .single();

      if (administrador) {
        if (!administrador.activo) {
          return {
            puedeAcceder: false,
            mensaje: 'Tu cuenta de administrador ha sido desactivada. Contacta con el administrador principal.',
            tipoUsuario: TipoUsuario.ADMIN
          };
        }
        return { puedeAcceder: true, mensaje: 'Acceso permitido', tipoUsuario: TipoUsuario.ADMIN };
      }

      // Si no se encuentra en ninguna tabla
      return {
        puedeAcceder: false,
        mensaje: 'Usuario no encontrado en el sistema. Contacta con soporte.'
      };

    } catch (error) {
      console.error('Error al validar estado del usuario:', error);
      return {
        puedeAcceder: false,
        mensaje: 'Error al verificar el estado de la cuenta. Intenta nuevamente.'
      };
    }
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
