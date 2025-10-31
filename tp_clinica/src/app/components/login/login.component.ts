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
    { email: 'paciente@test.com', password: '123456', tipo: 'Paciente' },
    { email: 'especialista@test.com', password: '123456', tipo: 'Especialista' },
    { email: 'admin@clinica.com', password: '123456', tipo: 'Administrador' }
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
    // Aquí determinarías el tipo de usuario y redirigir
    // Por ahora, redirigir a una página de dashboard general
    if(mail.includes('admin')) {
      this.router.navigate(['/usuarios']);
      return;
    }
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
