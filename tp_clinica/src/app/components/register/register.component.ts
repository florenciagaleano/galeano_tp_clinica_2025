import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { CaptchaComponent } from '../captcha/captcha.component';
import { CaptchaPropioDirective } from '../../directives/captcha-propio.directive';
import { 
  RegistroPacienteForm, 
  RegistroEspecialistaForm, 
  Especialidad, 
  TipoUsuario 
} from '../../models/interfaces';
import { Router } from '@angular/router';
import { FormatoDniDirective } from '../../directives/formato-dni.directive';
import { AnimacionEntradaDirective } from '../../directives/animacion-entrada.directive';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, CaptchaComponent, CaptchaPropioDirective, FormatoDniDirective, AnimacionEntradaDirective],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  
  @ViewChild('captchaPaciente') captchaPaciente!: CaptchaComponent;
  @ViewChild('captchaEspecialista') captchaEspecialista!: CaptchaComponent;

  // Exponer el enum para uso en el template
  TipoUsuario = TipoUsuario;
  
  tipoUsuarioSeleccionado: TipoUsuario | null = null; // Inicialmente null para mostrar la selección
  formularioPaciente!: FormGroup;
  formularioEspecialista!: FormGroup;
  especialidades: Especialidad[] = [];
  loading = false;
  mensaje = '';
  mensajeTipo: 'success' | 'error' = 'success';
  captchaPacienteValido = false;
  captchaEspecialistaValido = false;
  captchaHabilitado = true;

  // Variables para nueva especialidad
  agregandoEspecialidad = false;
  mensajeEspecialidad = '';
  tipoMensajeEspecialidad: 'success' | 'error' = 'success';

  // Referencias para archivos
  imagenPerfil1: File | null = null;
  imagenPerfil2: File | null = null;
  imagenPerfilEspecialista: File | null = null;

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    // Cargar estado del captcha desde localStorage
    const captchaEstado = localStorage.getItem('captcha_habilitado');
    if (captchaEstado !== null) {
      this.captchaHabilitado = captchaEstado === 'true';
    }
    
    this.inicializarFormularios();
    await this.cargarEspecialidades();
  }

  inicializarFormularios() {
    // Formulario para Pacientes
    this.formularioPaciente = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
      apellido: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
      edad: ['', [Validators.required, Validators.min(1), Validators.max(120)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
      obra_social: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    // Formulario para Especialistas
    this.formularioEspecialista = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
      apellido: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
      edad: ['', [Validators.required, Validators.min(23), Validators.max(80)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      especialidades: [[], [Validators.required, Validators.minLength(1)]],
      nueva_especialidad: ['']
    }, { validators: this.passwordMatchValidator });
  }

  async cargarEspecialidades() {
    this.especialidades = await this.supabaseService.obtenerEspecialidades();
  }

  // Validador personalizado para confirmar contraseña
  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (!password || !confirmPassword) {
      return null;
    }
    
    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  seleccionarTipoUsuario(tipo: TipoUsuario) {
    this.tipoUsuarioSeleccionado = tipo;
    this.mensaje = '';
  }

  volverASeleccion() {
    this.tipoUsuarioSeleccionado = null;
    this.mensaje = '';
    // Limpiar formularios
    this.formularioPaciente.reset();
    this.formularioEspecialista.reset();
    // Limpiar archivos
    this.imagenPerfil1 = null;
    this.imagenPerfil2 = null;
    this.imagenPerfilEspecialista = null;
    // Resetear captchas
    this.captchaPacienteValido = false;
    this.captchaEspecialistaValido = false;
  }

  onCaptchaPacienteValidado(isValid: boolean) {
    this.captchaPacienteValido = isValid;
  }

  onCaptchaEspecialistaValidado(isValid: boolean) {
    this.captchaEspecialistaValido = isValid;
  }

  // Manejo de archivos
  onImagenSeleccionada(event: any, tipo: 'perfil1' | 'perfil2' | 'especialista') {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        this.mostrarMensaje('Solo se permiten archivos de imagen', 'error');
        return;
      }

      // Validar tamaño (máximo 5MB)
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
        case 'especialista':
          this.imagenPerfilEspecialista = file;
          break;
      }
    }
  }

  // Manejo de especialidades
  onEspecialidadChange(especialidadId: string, event: Event) {
    const target = event.target as HTMLInputElement;
    const checked = target.checked;
    
    const especialidades = this.formularioEspecialista.get('especialidades')?.value || [];
    
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
    
    this.formularioEspecialista.patchValue({ especialidades });
  }

  isEspecialidadSelected(especialidadId: string): boolean {
    const especialidades = this.formularioEspecialista.get('especialidades')?.value || [];
    return especialidades.includes(especialidadId);
  }

  async onSubmit() {
    if (this.loading) return;

    let formulario: FormGroup;
    let captchaValido: boolean;
    
    if (this.tipoUsuarioSeleccionado === TipoUsuario.PACIENTE) {
      formulario = this.formularioPaciente;
      captchaValido = this.captchaPacienteValido;
    } else {
      formulario = this.formularioEspecialista;
      captchaValido = this.captchaEspecialistaValido;
    }

    if (formulario.invalid) {
      formulario.markAllAsTouched();
      this.mostrarMensaje('Por favor complete todos los campos correctamente', 'error');
      return;
    }

    if (!captchaValido) {
      this.mostrarMensaje('Por favor verifica el captcha para continuar', 'error');
      return;
    }

    this.loading = true;

    try {
      let resultado;

      if (this.tipoUsuarioSeleccionado === TipoUsuario.PACIENTE) {
        resultado = await this.registrarPaciente();
      } else {
        resultado = await this.registrarEspecialista();
      }

      if (resultado.success) {
        this.mostrarMensaje(resultado.message, 'success');
        formulario.reset();
        this.limpiarImagenes();
        
        // Navegar al login después de registro exitoso
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000); // Esperar 2 segundos para que el usuario vea el mensaje

      } else {
        this.mostrarMensaje(resultado.message, 'error');
      }

    } catch (error: any) {
      this.mostrarMensaje(`Error: ${error.message}`, 'error');
    } finally {
      this.loading = false;
    }
  }

  private async registrarPaciente() {
    const formData: RegistroPacienteForm = {
      ...this.formularioPaciente.value,
      imagen_perfil_1: this.imagenPerfil1!,
      imagen_perfil_2: this.imagenPerfil2!
    };

    return await this.supabaseService.registrarPaciente(formData);
  }

  private async registrarEspecialista() {
    const formData: RegistroEspecialistaForm = {
      ...this.formularioEspecialista.value,
      imagen_perfil: this.imagenPerfilEspecialista!
    };

    return await this.supabaseService.registrarEspecialista(formData);
  }

  private limpiarImagenes() {
    this.imagenPerfil1 = null;
    this.imagenPerfil2 = null;
    this.imagenPerfilEspecialista = null;
  }

  private mostrarMensaje(mensaje: string, tipo: 'success' | 'error') {
    this.mensaje = mensaje;
    this.mensajeTipo = tipo;
    
    // Limpiar mensaje después de 5 segundos
    setTimeout(() => {
      this.mensaje = '';
    }, 5000);
  }

  // Getters para facilitar el acceso a los controles del formulario
  get formPaciente() {
    return this.formularioPaciente.controls;
  }

  get formEspecialista() {
    return this.formularioEspecialista.controls;
  }

  // Utilidades para mostrar errores
  mostrarError(control: AbstractControl | null): boolean {
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  obtenerMensajeError(controlName: string, formulario: FormGroup): string {
    const control = formulario.get(controlName);
    
    if (!control || !control.errors) return '';

    const errors = control.errors;

    if (errors['required']) return `${controlName} es requerido`;
    if (errors['email']) return 'Email inválido';
    if (errors['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    if (errors['maxlength']) return `Máximo ${errors['maxlength'].requiredLength} caracteres`;
    if (errors['min']) return `Valor mínimo: ${errors['min'].min}`;
    if (errors['max']) return `Valor máximo: ${errors['max'].max}`;
    if (errors['pattern']) {
      if (controlName === 'dni') return 'DNI debe tener 7 u 8 dígitos';
      if (controlName === 'nombre' || controlName === 'apellido') return 'Solo se permiten letras y espacios';
      return 'Formato inválido';
    }
    if (errors['passwordMismatch']) return 'Las contraseñas no coinciden';

    return 'Campo inválido';
  }

  // Método para agregar nueva especialidad
  async agregarNuevaEspecialidad() {
    const nombreEspecialidad = this.formularioEspecialista.get('nueva_especialidad')?.value?.trim();
    
    if (!nombreEspecialidad) {
      this.mostrarMensajeEspecialidad('Por favor ingrese el nombre de la especialidad', 'error');
      return;
    }

    this.agregandoEspecialidad = true;
    this.mensajeEspecialidad = '';

    try {
      const resultado = await this.supabaseService.agregarEspecialidad({
        nombre: nombreEspecialidad,
        descripcion: `Especialidad agregada por usuario: ${nombreEspecialidad}`
      });

      if (resultado.success) {
        this.mostrarMensajeEspecialidad('Especialidad agregada exitosamente', 'success');
        
        // Limpiar el campo
        this.formularioEspecialista.patchValue({ nueva_especialidad: '' });
        
        // Recargar las especialidades
        await this.cargarEspecialidades();
        
        // Seleccionar automáticamente la nueva especialidad
        if (resultado.data) {
          const especialidadesActuales = this.formularioEspecialista.get('especialidades')?.value || [];
          especialidadesActuales.push(resultado.data.id);
          this.formularioEspecialista.patchValue({ especialidades: especialidadesActuales });
        }
        
      } else {
        this.mostrarMensajeEspecialidad(resultado.message, 'error');
      }

    } catch (error: any) {
      this.mostrarMensajeEspecialidad(`Error: ${error.message}`, 'error');
    } finally {
      this.agregandoEspecialidad = false;
    }
  }

  private mostrarMensajeEspecialidad(mensaje: string, tipo: 'success' | 'error') {
    this.mensajeEspecialidad = mensaje;
    this.tipoMensajeEspecialidad = tipo;
    
    // Limpiar mensaje después de 5 segundos
    setTimeout(() => {
      this.mensajeEspecialidad = '';
    }, 5000);
  }
}
