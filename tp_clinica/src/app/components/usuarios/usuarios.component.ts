import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { 
  Paciente, 
  Especialista, 
  Administrador,
  TipoUsuario,
  RegistroPacienteForm,
  RegistroEspecialistaForm,
  RegistroAdministradorForm,
  Especialidad
} from '../../models/interfaces';

interface UsuarioCompleto {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  tipo: TipoUsuario;
  activo: boolean;
  email_verificado: boolean;
  aprobado_por_admin?: boolean;
  imagen_perfil?: string;
  imagen_perfil_1?: string;
  imagen_perfil_2?: string;
  edad: number;
  obra_social?: string;
  especialidades?: Especialidad[];
  created_at: string;
}

@Component({
  selector: 'app-usuarios',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit {

  usuarios: UsuarioCompleto[] = [];
  usuariosFiltrados: UsuarioCompleto[] = [];
  especialidades: Especialidad[] = [];
  loading = false;
  mensaje = '';
  mensajeTipo: 'success' | 'error' = 'success';

  // Formularios
  formularioFiltro!: FormGroup;
  formularioNuevoUsuario!: FormGroup;
  
  // Estados
  mostrandoFormulario = false;
  tipoUsuarioNuevo: TipoUsuario = TipoUsuario.PACIENTE;
  editandoUsuario: UsuarioCompleto | null = null;

  // Referencias para archivos
  imagenPerfil1: File | null = null;
  imagenPerfil2: File | null = null;
  imagenPerfil: File | null = null;

  // Enums para el template
  TipoUsuario = TipoUsuario;

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService
  ) {}

  async ngOnInit() {
    this.inicializarFormularios();
    await this.cargarDatos();
  }

  inicializarFormularios() {
    // Formulario de filtro
    this.formularioFiltro = this.fb.group({
      busqueda: [''],
      tipoUsuario: ['todos'],
      estado: ['todos']
    });

    // Formulario para nuevo usuario
    this.formularioNuevoUsuario = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      edad: ['', [Validators.required, Validators.min(18), Validators.max(100)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      obra_social: [''], // Solo para pacientes
      especialidades: [[]], // Solo para especialistas
      activo: [true]
    });

    // Suscribirse a cambios en el filtro
    this.formularioFiltro.valueChanges.subscribe(() => {
      this.filtrarUsuarios();
    });
  }

  async cargarDatos() {
    this.loading = true;
    try {
      await Promise.all([
        this.cargarUsuarios(),
        this.cargarEspecialidades()
      ]);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.mostrarMensaje('Error al cargar datos', 'error');
    } finally {
      this.loading = false;
    }
  }

  async cargarUsuarios() {
    try {
      // Cargar pacientes
      const { data: pacientes, error: errorPacientes } = await this.supabaseService.supabase
        .from('pacientes')
        .select('*')
        .order('created_at', { ascending: false });

      // Cargar especialistas
      const { data: especialistas, error: errorEspecialistas } = await this.supabaseService.supabase
        .from('especialistas')
        .select(`
          *,
          especialista_especialidades (
            especialidades (
              id,
              nombre
            )
          )
        `)
        .order('created_at', { ascending: false });

      // Cargar administradores
      const { data: administradores, error: errorAdministradores } = await this.supabaseService.supabase
        .from('administradores')
        .select('*')
        .order('created_at', { ascending: false });

      if (errorPacientes || errorEspecialistas || errorAdministradores) {
        throw new Error('Error al cargar usuarios');
      }

      // Combinar y formatear usuarios
      this.usuarios = [
        ...(pacientes || []).map(p => ({
          ...p,
          tipo: TipoUsuario.PACIENTE
        })),
        ...(especialistas || []).map(e => ({
          ...e,
          tipo: TipoUsuario.ESPECIALISTA,
          especialidades: e.especialista_especialidades?.map((ee: any) => ee.especialidades) || []
        })),
        ...(administradores || []).map(a => ({
          ...a,
          tipo: TipoUsuario.ADMIN
        }))
      ];

      this.filtrarUsuarios();

    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      this.mostrarMensaje('Error al cargar usuarios', 'error');
    }
  }

  async cargarEspecialidades() {
    this.especialidades = await this.supabaseService.obtenerEspecialidades();
  }

  filtrarUsuarios() {
    const filtro = this.formularioFiltro.value;
    let usuariosFiltrados = [...this.usuarios];

    // Filtro por búsqueda
    if (filtro.busqueda) {
      const busqueda = filtro.busqueda.toLowerCase();
      usuariosFiltrados = usuariosFiltrados.filter(usuario =>
        usuario.nombre.toLowerCase().includes(busqueda) ||
        usuario.apellido.toLowerCase().includes(busqueda) ||
        usuario.email.toLowerCase().includes(busqueda) ||
        usuario.dni.includes(busqueda)
      );
    }

    // Filtro por tipo de usuario
    if (filtro.tipoUsuario !== 'todos') {
      usuariosFiltrados = usuariosFiltrados.filter(usuario =>
        usuario.tipo === filtro.tipoUsuario
      );
    }

    // Filtro por estado
    if (filtro.estado !== 'todos') {
      usuariosFiltrados = usuariosFiltrados.filter(usuario => {
        switch (filtro.estado) {
          case 'activos':
            return usuario.activo;
          case 'inactivos':
            return !usuario.activo;
          case 'pendientes':
            return usuario.tipo === TipoUsuario.ESPECIALISTA && !usuario.aprobado_por_admin;
          case 'aprobados':
            return usuario.tipo === TipoUsuario.ESPECIALISTA && usuario.aprobado_por_admin;
          default:
            return true;
        }
      });
    }

    this.usuariosFiltrados = usuariosFiltrados;
  }

  async aprobarEspecialista(usuario: UsuarioCompleto) {
    try {
      const { error } = await this.supabaseService.supabase
        .from('especialistas')
        .update({ aprobado_por_admin: true })
        .eq('id', usuario.id);

      if (error) throw error;

      this.mostrarMensaje(`Especialista ${usuario.nombre} ${usuario.apellido} aprobado`, 'success');
      await this.cargarUsuarios();

    } catch (error) {
      console.error('Error al aprobar especialista:', error);
      this.mostrarMensaje('Error al aprobar especialista', 'error');
    }
  }

  async toggleActivarUsuario(usuario: UsuarioCompleto) {
    try {
      const tabla = usuario.tipo === TipoUsuario.PACIENTE ? 'pacientes' : 'especialistas';
      const nuevoEstado = !usuario.activo;

      const { error } = await this.supabaseService.supabase
        .from(tabla)
        .update({ activo: nuevoEstado })
        .eq('id', usuario.id);

      if (error) throw error;

      const accion = nuevoEstado ? 'activado' : 'desactivado';
      this.mostrarMensaje(`Usuario ${accion} exitosamente`, 'success');
      await this.cargarUsuarios();

    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error);
      this.mostrarMensaje('Error al cambiar estado del usuario', 'error');
    }
  }

  mostrarFormularioNuevoUsuario(tipo: TipoUsuario) {
    this.tipoUsuarioNuevo = tipo;
    this.mostrandoFormulario = true;
    this.editandoUsuario = null;
    this.formularioNuevoUsuario.reset();
    
    // Configurar validaciones según el tipo
    if (tipo === TipoUsuario.PACIENTE) {
      this.formularioNuevoUsuario.get('obra_social')?.setValidators([Validators.required]);
      this.formularioNuevoUsuario.get('especialidades')?.clearValidators();
    } else if (tipo === TipoUsuario.ESPECIALISTA) {
      this.formularioNuevoUsuario.get('especialidades')?.setValidators([Validators.required]);
      this.formularioNuevoUsuario.get('obra_social')?.clearValidators();
    } else if (tipo === TipoUsuario.ADMIN) {
      this.formularioNuevoUsuario.get('especialidades')?.clearValidators();
      this.formularioNuevoUsuario.get('obra_social')?.clearValidators();
    }
    
    this.formularioNuevoUsuario.updateValueAndValidity();
  }

  cancelarFormulario() {
    this.mostrandoFormulario = false;
    this.editandoUsuario = null;
    this.formularioNuevoUsuario.reset();
    this.limpiarArchivos();
  }

  async guardarUsuario() {
    if (this.formularioNuevoUsuario.invalid) {
      this.formularioNuevoUsuario.markAllAsTouched();
      return;
    }

    this.loading = true;
    try {
      const datosFormulario = this.formularioNuevoUsuario.value;

      if (this.tipoUsuarioNuevo === TipoUsuario.PACIENTE) {
        const formData: RegistroPacienteForm = {
          ...datosFormulario,
          imagen_perfil_1: this.imagenPerfil1!,
          imagen_perfil_2: this.imagenPerfil2!
        };

        const resultado = await this.supabaseService.registrarPaciente(formData);
        
        if (resultado.success) {
          this.mostrarMensaje('Paciente creado exitosamente', 'success');
          this.cancelarFormulario();
          await this.cargarUsuarios();
        } else {
          this.mostrarMensaje(resultado.message, 'error');
        }

      } else if (this.tipoUsuarioNuevo === TipoUsuario.ESPECIALISTA) {
        const formData: RegistroEspecialistaForm = {
          ...datosFormulario,
          imagen_perfil: this.imagenPerfil!
        };

        const resultado = await this.supabaseService.registrarEspecialista(formData);
        
        if (resultado.success) {
          this.mostrarMensaje('Especialista creado exitosamente', 'success');
          this.cancelarFormulario();
          await this.cargarUsuarios();
        } else {
          this.mostrarMensaje(resultado.message, 'error');
        }

      } else if (this.tipoUsuarioNuevo === TipoUsuario.ADMIN) {
        const formData: RegistroAdministradorForm = {
          ...datosFormulario,
          imagen_perfil: this.imagenPerfil
        };

        const resultado = await this.supabaseService.registrarAdministrador(formData);
        
        if (resultado.success) {
          this.mostrarMensaje('Administrador creado exitosamente', 'success');
          this.cancelarFormulario();
          await this.cargarUsuarios();
        } else {
          this.mostrarMensaje(resultado.message, 'error');
        }
      }

    } catch (error: any) {
      this.mostrarMensaje(`Error: ${error.message}`, 'error');
    } finally {
      this.loading = false;
    }
  }

  onImagenSeleccionada(event: any, tipo: 'perfil1' | 'perfil2' | 'perfil') {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        this.mostrarMensaje('Solo se permiten archivos de imagen', 'error');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.mostrarMensaje('La imagen no puede superar los 5MB', 'error');
        return;
      }

      switch (tipo) {
        case 'perfil1':
          this.imagenPerfil1 = file;
          break;
        case 'perfil2':
          this.imagenPerfil2 = file;
          break;
        case 'perfil':
          this.imagenPerfil = file;
          break;
      }
    }
  }

  onEspecialidadChange(especialidadId: string, event: Event) {
    const target = event.target as HTMLInputElement;
    const checked = target.checked;
    const especialidades = this.formularioNuevoUsuario.get('especialidades')?.value || [];
    
    if (checked) {
      if (!especialidades.includes(especialidadId)) {
        especialidades.push(especialidadId);
      }
    } else {
      const index = especialidades.indexOf(especialidadId);
      if (index > -1) {
        especialidades.splice(index, 1);
      }
    }
    
    this.formularioNuevoUsuario.patchValue({ especialidades });
  }

  isEspecialidadSelected(especialidadId: string | undefined): boolean {
    if (!especialidadId) return false;
    const especialidades = this.formularioNuevoUsuario.get('especialidades')?.value || [];
    return especialidades.includes(especialidadId);
  }

  private limpiarArchivos() {
    this.imagenPerfil1 = null;
    this.imagenPerfil2 = null;
    this.imagenPerfil = null;
  }

  private mostrarMensaje(mensaje: string, tipo: 'success' | 'error') {
    this.mensaje = mensaje;
    this.mensajeTipo = tipo;
    
    setTimeout(() => {
      this.mensaje = '';
    }, 5000);
  }

  get formControls() {
    return this.formularioNuevoUsuario.controls;
  }
}
