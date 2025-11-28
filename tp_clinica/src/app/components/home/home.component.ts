import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { TipoUsuario } from '../../models/interfaces';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  usuarioLogueado: boolean = false;
  tipoUsuario: TipoUsuario | null = null;
  nombreUsuario: string = '';
  TipoUsuario = TipoUsuario; // Para usar en el template

  constructor(
    private router: Router,
    private supabaseService: SupabaseService
  ) {}

  async ngOnInit() {
    await this.verificarUsuarioLogueado();
  }

  async verificarUsuarioLogueado() {
    const datosUsuario = await this.supabaseService.obtenerDatosUsuarioActual();
    
    if (datosUsuario.tipoUsuario && datosUsuario.datos) {
      this.usuarioLogueado = true;
      this.tipoUsuario = datosUsuario.tipoUsuario;
      this.nombreUsuario = `${datosUsuario.datos.nombre} ${datosUsuario.datos.apellido}`;
    } else {
      this.usuarioLogueado = false;
      this.tipoUsuario = null;
    }
  }

  irALogin() {
    this.router.navigate(['/login']);
  }

  irARegistro() {
    this.router.navigate(['/register']);
  }

  // Métodos de navegación para PACIENTE
  irAMisTurnos() {
    this.router.navigate(['/mis-turnos']);
  }

  irASolicitarTurno() {
    this.router.navigate(['/solicitar-turno']);
  }

  irAMiPerfil() {
    this.router.navigate(['/mi-perfil']);
  }

  // Métodos de navegación para ESPECIALISTA
  irAPacientes() {
    this.router.navigate(['/pacientes']);
  }

  // Métodos de navegación para ADMINISTRADOR
  irAUsuarios() {
    this.router.navigate(['/usuarios']);
  }

  irATurnos() {
    this.router.navigate(['/turnos']);
  }

  irAEstadisticas() {
    this.router.navigate(['/estadisticas']);
  }

  async cerrarSesion() {
    await this.supabaseService.cerrarSesion();
    this.usuarioLogueado = false;
    this.tipoUsuario = null;
    this.nombreUsuario = '';
    this.router.navigate(['/home']);
  }
}
