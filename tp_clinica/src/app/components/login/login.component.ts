import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { TipoUsuario } from '../../models/interfaces';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  
  loginForm!: FormGroup;
  loading = false;
  mensaje = '';
  mensajeTipo: 'success' | 'error' = 'success';

  // Usuarios de acceso rápido
  usuariosRapidos = [
    { 
      email: 'paciente@test.com', 
      password: '123456', 
      tipo: 'Paciente',
      nombre: 'Lily Test',
      imagen_perfil: 'https://jufqrifecxbmqpauujbk.supabase.co/storage/v1/object/public/profiles/pacientes/1761622517115_oeapjct1y5q.jpg'
    },
    { 
      email: 'paciente2@test.com', 
      password: '123456', 
      tipo: 'Paciente',
      nombre: 'Leandro Test2',
      imagen_perfil: 'https://jufqrifecxbmqpauujbk.supabase.co/storage/v1/object/public/profiles/pacientes/632890a6edbe7f00190ed32c.webp'
    },
    { 
      email: 'paciente3@test.com', 
      password: '123456', 
      tipo: 'Paciente',
      nombre: 'Robin Test3',
      imagen_perfil: 'https://jufqrifecxbmqpauujbk.supabase.co/storage/v1/object/public/profiles/pacientes/images%20(1).jpg'
    },
    { 
      email: 'especialista@test.com', 
      password: '123456', 
      tipo: 'Especialista',
      nombre: 'Dr. Meredith Grey',
      imagen_perfil: 'https://jufqrifecxbmqpauujbk.supabase.co/storage/v1/object/public/profiles/especialistas/meredithgrey.jpg'
    },
    { 
      email: 'especialista2@test.com', 
      password: '123456', 
      tipo: 'Especialista',
      nombre: 'Dr. Derek Sheperd',
      imagen_perfil: 'https://jufqrifecxbmqpauujbk.supabase.co/storage/v1/object/public/profiles/especialistas/patrick_dempsey_greys_anatomy_dead.webp'
    },
    { 
      email: 'admin@clinica.com', 
      password: '123456', 
      tipo: 'Administrador',
      nombre: 'Admin Principal',
      imagen_perfil: 'https://jufqrifecxbmqpauujbk.supabase.co/storage/v1/object/public/profiles/administradores/richard_admin.jpg'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  ngOnInit() {
    this.inicializarFormulario();
  }

  inicializarFormulario() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.mensaje = '';

    try {
      const { email, password } = this.loginForm.value;
      const resultado = await this.supabaseService.iniciarSesion(email, password);

      if (resultado.success) {
        this.mostrarMensaje('Inicio de sesión exitoso', 'success');
        
        // Registrar log de ingreso
        await this.supabaseService.registrarLogIngreso(email);
        
        // Redirigir según el tipo de usuario
        await this.redirigirSegunTipoUsuario(email);
      } else {
        this.mostrarMensaje("Error: credenciales inválidas", 'error');
      }

    } catch (error: any) {
      //this.mostrarMensaje(`Error: ${error.message}`, 'error');
      this.mostrarMensaje(`Error: credenciales inválidas`, 'error');
    } finally {
      this.loading = false;
    }
  }

  async redirigirSegunTipoUsuario(mail: string) {
    // Redirigir siempre al home para que vea su panel
    this.router.navigate(['/']);
  }

  async loginRapido(usuario: any) {
    this.loginForm.patchValue({
      email: usuario.email,
      password: usuario.password
    });
    await this.onSubmit();
  }

  irARegistro() {
    this.router.navigate(['/register']);
  }

  private mostrarMensaje(mensaje: string, tipo: 'success' | 'error') {
    this.mensaje = mensaje;
    this.mensajeTipo = tipo;
    
    setTimeout(() => {
      this.mensaje = '';
    }, 5000);
  }

  get formControls() {
    return this.loginForm.controls;
  }
}
