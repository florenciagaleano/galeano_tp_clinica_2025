import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent),
    data: { animation: 'HomePage' }
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent),
    data: { animation: 'LoginPage' }
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent),
    data: { animation: 'RegisterPage' }
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./components/usuarios/usuarios.component').then(m => m.UsuariosComponent),
    data: { animation: 'UsuariosPage' }
  },
  {
    path: 'mis-turnos',
    loadComponent: () => import('./components/mis-turnos/mis-turnos.component').then(m => m.MisTurnosComponent),
    data: { animation: 'MisTurnosPage' }
  },
  {
    path: 'solicitar-turno',
    loadComponent: () => import('./components/solicitar-turno/solicitar-turno.component').then(m => m.SolicitarTurnoComponent),
    data: { animation: 'SolicitarTurnoPage' }
  },
  {
    path: 'turnos',
    loadComponent: () => import('./components/turnos/turnos.component').then(m => m.TurnosComponent),
    data: { animation: 'TurnosPage' }
  },
  {
    path: 'mi-perfil',
    loadComponent: () => import('./components/mi-perfil/mi-perfil.component').then(m => m.MiPerfilComponent),
    data: { animation: 'MiPerfilPage' }
  },
  {
    path: 'pacientes',
    loadComponent: () => import('./components/pacientes/pacientes.component').then(m => m.PacientesComponent),
    data: { animation: 'PacientesPage' }
  },
  {
    path: 'estadisticas',
    loadComponent: () => import('./components/estadisticas/estadisticas.component').then(m => m.EstadisticasComponent),
    data: { animation: 'EstadisticasPage' }
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
