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
        
        if (authError.message?.includes('especialistas_user_id_fkey') || authError.message?.includes('already registered')) {
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

  // Método para obtener datos completos del usuario actual
  async obtenerDatosUsuarioActual(): Promise<{ tipoUsuario: TipoUsuario | null; datos: any; userId: string | null }> {
    try {
      const user = await this.obtenerUsuarioActual();
      
      if (!user) {
        return { tipoUsuario: null, datos: null, userId: null };
      }

      // Buscar en pacientes usando email
      const { data: paciente } = await this.supabase
        .from('pacientes')
        .select('*')
        .eq('email', user.email)
        .single();

      if (paciente) {
        return { tipoUsuario: TipoUsuario.PACIENTE, datos: paciente, userId: user.id };
      }

      // Buscar en especialistas usando email
      const { data: especialista } = await this.supabase
        .from('especialistas')
        .select('*')
        .eq('email', user.email)
        .single();

      if (especialista) {
        return { tipoUsuario: TipoUsuario.ESPECIALISTA, datos: especialista, userId: user.id };
      }

      // Buscar en administradores usando email
      const { data: administrador } = await this.supabase
        .from('administradores')
        .select('*')
        .eq('email', user.email)
        .single();

      if (administrador) {
        return { tipoUsuario: TipoUsuario.ADMIN, datos: administrador, userId: user.id };
      }

      return { tipoUsuario: null, datos: null, userId: user.id };
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
      return { tipoUsuario: null, datos: null, userId: null };
    }
  }

  // Nuevo método para validar el estado del usuario
  private async validarEstadoUsuario(userId: string): Promise<{ puedeAcceder: boolean; mensaje: string; tipoUsuario?: TipoUsuario }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user?.email) {
        return { puedeAcceder: false, mensaje: 'Usuario no autenticado' };
      }

      // Buscar en pacientes usando email
      const { data: paciente } = await this.supabase
        .from('pacientes')
        .select('activo')
        .eq('email', user.email)
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

      // Buscar en especialistas usando email
      const { data: especialista } = await this.supabase
        .from('especialistas')
        .select('activo, aprobado_por_admin')
        .eq('email', user.email)
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

      // Buscar en administradores usando email
      const { data: administrador } = await this.supabase
        .from('administradores')
        .select('activo, email_verificado')
        .eq('email', user.email)
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

  // =============================================
  // MÉTODOS DE HISTORIA CLÍNICA
  // =============================================

  async crearHistoriaClinica(historia: any): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const { data, error } = await this.supabase
        .from('historia_clinica')
        .insert(historia)
        .select()
        .single();

      if (error) throw error;

      return { success: true, message: 'Historia clínica creada exitosamente', data };
    } catch (error: any) {
      console.error('Error al crear historia clínica:', error);
      return { success: false, message: error.message };
    }
  }

  async obtenerHistoriaClinicaPorEspecialista(especialistaId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('historia_clinica')
        .select(`
          *,
          paciente:pacientes(id, nombre, apellido, imagen_perfil_1, dni, obra_social)
        `)
        .eq('especialista_id', especialistaId)
        .order('fecha', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error al obtener historia clínica:', error);
      return [];
    }
  }

  async obtenerPacientesAtendidos(especialistaId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('historia_clinica')
        .select(`
          paciente:pacientes(id, nombre, apellido, edad, dni, obra_social, imagen_perfil_1, email)
        `)
        .eq('especialista_id', especialistaId)
        .order('fecha', { ascending: false });

      if (error) throw error;

      // Eliminar duplicados de pacientes
      const pacientesUnicos = new Map();
      data?.forEach((item: any) => {
        if (item.paciente && !pacientesUnicos.has(item.paciente.id)) {
          pacientesUnicos.set(item.paciente.id, item.paciente);
        }
      });

      return Array.from(pacientesUnicos.values());
    } catch (error) {
      console.error('Error al obtener pacientes atendidos:', error);
      return [];
    }
  }

  // =============================================
  // MÉTODOS DE LOGS
  // =============================================

  async registrarIngreso(userId: string, email: string, tipoUsuario: string, nombreCompleto: string): Promise<void> {
    try {
      await this.supabase
        .from('log_ingresos')
        .insert({
          user_id: userId,
          email: email,
          tipo_usuario: tipoUsuario,
          nombre_completo: nombreCompleto,
          fecha_ingreso: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error al registrar ingreso:', error);
    }
  }

  async obtenerLogsIngresos(fechaDesde?: string, fechaHasta?: string): Promise<any[]> {
    try {
      let query = this.supabase
        .from('logs_ingresos')
        .select('*')
        .order('fecha_ingreso', { ascending: false })
        .limit(100); // Limitar a los últimos 100 registros

      if (fechaDesde) {
        query = query.gte('fecha_ingreso', fechaDesde);
      }

      if (fechaHasta) {
        query = query.lte('fecha_ingreso', fechaHasta);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error al obtener logs:', error);
      return [];
    }
  }

  async registrarLogIngreso(email: string): Promise<void> {
    try {
      // Obtener datos del usuario
      const datosUsuario = await this.obtenerDatosUsuarioActual();
      
      if (!datosUsuario || !datosUsuario.datos) {
        console.error('No se pudieron obtener datos del usuario');
        return;
      }

      const logData = {
        usuario_email: email,
        usuario_nombre: `${datosUsuario.datos.nombre || ''} ${datosUsuario.datos.apellido || ''}`.trim(),
        tipo_usuario: datosUsuario.tipoUsuario || 'desconocido',
        fecha_ingreso: new Date().toISOString()
      };

      const { error } = await this.supabase
        .from('logs_ingresos')
        .insert(logData);

      if (error) {
        console.error('Error al registrar log de ingreso:', error);
      }
    } catch (error) {
      console.error('Error al registrar log de ingreso:', error);
    }
  }

  // =============================================
  // MÉTODOS DE ESTADÍSTICAS
  // =============================================

  async obtenerEstadisticasTurnos(): Promise<any> {
    try {
      // Turnos por especialidad
      const { data: turnosPorEspecialidad, error: errorEsp } = await this.supabase
        .from('turnos')
        .select(`
          especialidad_id,
          especialidad:especialidades(nombre)
        `);

      // Turnos por día
      const { data: turnosPorDia, error: errorDia } = await this.supabase
        .from('turnos')
        .select('fecha');

      // Turnos por médico
      const { data: turnosPorMedico, error: errorMed } = await this.supabase
        .from('turnos')
        .select(`
          especialista_id,
          estado,
          especialista:especialistas(nombre, apellido)
        `);

      if (errorEsp || errorDia || errorMed) {
        throw new Error('Error al obtener estadísticas');
      }

      return {
        turnosPorEspecialidad: turnosPorEspecialidad || [],
        turnosPorDia: turnosPorDia || [],
        turnosPorMedico: turnosPorMedico || []
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return { turnosPorEspecialidad: [], turnosPorDia: [], turnosPorMedico: [] };
    }
  }

  // =============================================
  // MÉTODOS DE TURNOS
  // =============================================

  async crearTurno(turno: {
    paciente_id: string;
    especialista_id: string;
    especialidad_id: string;
    fecha: string;
    hora: string;
    duracion_minutos: number;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const { data, error } = await this.supabase
        .from('turnos')
        .insert({
          ...turno,
          estado: 'pendiente'
        })
        .select()
        .single();

      if (error) throw error;

      return { 
        success: true, 
        message: 'Turno creado exitosamente', 
        data 
      };
    } catch (error: any) {
      console.error('Error al crear turno:', error);
      return { 
        success: false, 
        message: error.message || 'Error al crear el turno' 
      };
    }
  }

  async obtenerTurnosPaciente(pacienteId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('turnos')
        .select(`
          *,
          especialista:especialistas(id, nombre, apellido, imagen_perfil),
          especialidad:especialidades(id, nombre),
          paciente:pacientes(id, nombre, apellido),
          historia_clinica(*)
        `)
        .eq('paciente_id', pacienteId)
        .order('fecha', { ascending: false })
        .order('hora', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error al obtener turnos del paciente:', error);
      return [];
    }
  }

  async obtenerTurnosEspecialista(especialistaId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('turnos')
        .select(`
          *,
          especialista:especialistas(id, nombre, apellido, imagen_perfil),
          especialidad:especialidades(id, nombre),
          paciente:pacientes(id, nombre, apellido, imagen_perfil_1, dni, obra_social),
          historia_clinica(*)
        `)
        .eq('especialista_id', especialistaId)
        .order('fecha', { ascending: false })
        .order('hora', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error al obtener turnos del especialista:', error);
      return [];
    }
  }

  async obtenerTodosTurnos(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('turnos')
        .select(`
          *,
          especialista:especialistas(id, nombre, apellido, imagen_perfil),
          especialidad:especialidades(id, nombre),
          paciente:pacientes(id, nombre, apellido, imagen_perfil_1),
          historia_clinica(*)
        `)
        .order('fecha', { ascending: false })
        .order('hora', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error al obtener todos los turnos:', error);
      return [];
    }
  }

  async cancelarTurno(turnoId: string, motivoCancelacion: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await this.supabase
        .from('turnos')
        .update({
          estado: 'cancelado',
          motivo_cancelacion: motivoCancelacion
        })
        .eq('id', turnoId);

      if (error) throw error;

      return { 
        success: true, 
        message: 'Turno cancelado exitosamente' 
      };
    } catch (error: any) {
      console.error('Error al cancelar turno:', error);
      return { 
        success: false, 
        message: error.message || 'Error al cancelar el turno' 
      };
    }
  }

  async rechazarTurno(turnoId: string, motivoRechazo: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await this.supabase
        .from('turnos')
        .update({
          estado: 'rechazado',
          motivo_rechazo: motivoRechazo
        })
        .eq('id', turnoId);

      if (error) throw error;

      return { 
        success: true, 
        message: 'Turno rechazado exitosamente' 
      };
    } catch (error: any) {
      console.error('Error al rechazar turno:', error);
      return { 
        success: false, 
        message: error.message || 'Error al rechazar el turno' 
      };
    }
  }

  async aceptarTurno(turnoId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await this.supabase
        .from('turnos')
        .update({
          estado: 'aceptado'
        })
        .eq('id', turnoId);

      if (error) throw error;

      return { 
        success: true, 
        message: 'Turno aceptado exitosamente' 
      };
    } catch (error: any) {
      console.error('Error al aceptar turno:', error);
      return { 
        success: false, 
        message: error.message || 'Error al aceptar el turno' 
      };
    }
  }

  async finalizarTurno(turnoId: string, resena: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await this.supabase
        .from('turnos')
        .update({
          estado: 'realizado',
          resena: resena
        })
        .eq('id', turnoId);

      if (error) throw error;

      return { 
        success: true, 
        message: 'Turno finalizado exitosamente' 
      };
    } catch (error: any) {
      console.error('Error al finalizar turno:', error);
      return { 
        success: false, 
        message: error.message || 'Error al finalizar el turno' 
      };
    }
  }

  async calificarAtencion(turnoId: string, calificacion: number, comentarioPaciente: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await this.supabase
        .from('turnos')
        .update({
          calificacion: calificacion,
          comentario_paciente: comentarioPaciente
        })
        .eq('id', turnoId);

      if (error) throw error;

      return { 
        success: true, 
        message: 'Calificación guardada exitosamente' 
      };
    } catch (error: any) {
      console.error('Error al calificar atención:', error);
      return { 
        success: false, 
        message: error.message || 'Error al guardar la calificación' 
      };
    }
  }

  async completarEncuesta(turnoId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await this.supabase
        .from('turnos')
        .update({
          encuesta_completada: true
        })
        .eq('id', turnoId);

      if (error) throw error;

      return { 
        success: true, 
        message: 'Encuesta completada exitosamente' 
      };
    } catch (error: any) {
      console.error('Error al completar encuesta:', error);
      return { 
        success: false, 
        message: error.message || 'Error al completar la encuesta' 
      };
    }
  }

  // =============================================
  // HISTORIA CLÍNICA
  // =============================================
  
  async obtenerHistoriaClinicaPaciente(pacienteId: string) {
    try {
      console.log('Buscando historia para paciente_id:', pacienteId);
      
      // Primero obtener la historia sin joins
      const { data: historiaData, error: historiaError } = await this.supabase
        .from('historia_clinica')
        .select('*')
        .eq('paciente_id', pacienteId)
        .order('fecha', { ascending: false });

      if (historiaError) {
        console.error('Error en query de historia clínica:', historiaError);
        throw historiaError;
      }
      
      console.log('Historia clínica encontrada (sin joins):', historiaData);
      
      if (!historiaData || historiaData.length === 0) {
        return [];
      }

      // Obtener datos de especialistas y turnos por separado
      const resultado = await Promise.all(
        historiaData.map(async (historia: any) => {
          // Obtener especialista
          const { data: especialista } = await this.supabase
            .from('especialistas')
            .select('nombre, apellido')
            .eq('id', historia.especialista_id)
            .single();

          // Obtener turno
          const { data: turno } = await this.supabase
            .from('turnos')
            .select('fecha, hora')
            .eq('id', historia.turno_id)
            .single();

          return {
            ...historia,
            especialista,
            turno
          };
        })
      );
      
      console.log('Historia clínica con datos relacionados:', resultado);
      return resultado;
    } catch (error) {
      console.error('Error obteniendo historia clínica:', error);
      return [];
    }
  }

  // =============================================
  // EXPORTAR A EXCEL
  // =============================================
  
  async exportarUsuariosAExcel(): Promise<void> {
    try {
      const XLSX = await import('xlsx');
      
      const [pacientes, especialistas, admins] = await Promise.all([
        this.supabase.from('pacientes').select('*').order('apellido'),
        this.supabase.from('especialistas').select('*').order('apellido'),
        this.supabase.from('administradores').select('*').order('apellido')
      ]);

      const datosPacientes = (pacientes.data || []).map(p => ({
        Tipo: 'Paciente',
        Nombre: p.nombre,
        Apellido: p.apellido,
        DNI: p.dni,
        Email: p.email,
        Edad: p.edad,
        'Obra Social': p.obra_social,
        Activo: p.activo ? 'Sí' : 'No'
      }));

      const datosEspecialistas = (especialistas.data || []).map((e: any) => ({
        Tipo: 'Especialista',
        Nombre: e.nombre,
        Apellido: e.apellido,
        DNI: e.dni,
        Email: e.email,
        Edad: e.edad,
        'Obra Social': '-',
        Activo: e.activo ? 'Sí' : 'No',
        Aprobado: e.aprobado_por_admin ? 'Sí' : 'No'
      }));

      const datosAdmins = (admins.data || []).map(a => ({
        Tipo: 'Administrador',
        Nombre: a.nombre,
        Apellido: a.apellido,
        DNI: a.dni,
        Email: a.email,
        Edad: a.edad,
        'Obra Social': '-',
        Activo: '-'
      }));

      const todosLosDatos = [...datosPacientes, ...datosEspecialistas, ...datosAdmins];
      const worksheet = XLSX.utils.json_to_sheet(todosLosDatos);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');

      const fecha = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `usuarios_clinica_${fecha}.xlsx`);

    } catch (error) {
      console.error('Error exportando a Excel:', error);
      throw error;
    }
  }
}

