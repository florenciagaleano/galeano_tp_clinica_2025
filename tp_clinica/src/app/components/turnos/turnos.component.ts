import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { Turno, EstadoTurno, Especialidad, Paciente, Especialista } from '../../models/interfaces';

interface TurnoCompleto extends Turno {
  paciente?: Paciente;
  especialista?: Especialista;
  especialidad?: Especialidad;
}

@Component({
  selector: 'app-turnos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './turnos.component.html',
  styleUrls: ['./turnos.component.css']
})
export class TurnosComponent implements OnInit {
  // Datos
  turnos: TurnoCompleto[] = [];
  turnosFiltrados: TurnoCompleto[] = [];
  
  // Filtros
  filtroEspecialidad: string = '';
  filtroEspecialista: string = '';
  especialidades: string[] = [];
  especialistas: string[] = [];
  
  // Loading y mensajes
  cargando: boolean = false;
  mensajeError: string = '';
  mensajeExito: string = '';

  // Modal
  modalCancelarVisible: boolean = false;
  turnoSeleccionado: TurnoCompleto | null = null;
  motivoCancelacion: string = '';

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.verificarAcceso();
    await this.cargarTurnos();
  }

  async verificarAcceso() {
    try {
      const { data: { user } } = await this.supabaseService.supabase.auth.getUser();
      
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }

      // Verificar que sea administrador
      const { data: admin, error } = await this.supabaseService.supabase
        .from('administradores')
        .select('*')
        .eq('email', user.email)
        .single();

      if (error || !admin) {
        this.mensajeError = 'Acceso denegado. Solo administradores pueden ver esta sección.';
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 2000);
      }
    } catch (error) {
      console.error('Error verificando acceso:', error);
      this.router.navigate(['/login']);
    }
  }

  async cargarTurnos() {
    try {
      this.cargando = true;
      this.mensajeError = '';

      console.log('Cargando turnos...');

      // Obtener todos los turnos con relaciones - usar alias singular
      const { data, error } = await this.supabaseService.supabase
        .from('turnos')
        .select(`
          *,
          paciente:paciente_id (*),
          especialista:especialista_id (*),
          especialidad:especialidad_id (*)
        `)
        .order('fecha', { ascending: false })
        .order('hora', { ascending: false });

      console.log('Resultado de turnos con joins:', { data, error });

      if (error) throw error;

      this.turnos = data || [];
      console.log('Total turnos cargados:', this.turnos.length);
      
      this.cargarListasFiltros();
      this.aplicarFiltros();

    } catch (error: any) {
      console.error('Error cargando turnos:', error);
      this.mensajeError = 'Error al cargar los turnos';
    } finally {
      this.cargando = false;
    }
  }

  cargarListasFiltros() {
    // Obtener lista única de especialidades
    const especialidadesSet = new Set<string>();
    this.turnos.forEach(turno => {
      if (turno.especialidad?.nombre) {
        especialidadesSet.add(turno.especialidad.nombre);
      }
    });
    this.especialidades = Array.from(especialidadesSet).sort();

    // Obtener lista única de especialistas
    const especialistasSet = new Set<string>();
    this.turnos.forEach(turno => {
      if (turno.especialista) {
        const nombreCompleto = `${turno.especialista.nombre} ${turno.especialista.apellido}`;
        especialistasSet.add(nombreCompleto);
      }
    });
    this.especialistas = Array.from(especialistasSet).sort();
  }

  aplicarFiltros() {
    let resultado = [...this.turnos];

    // Filtro por especialidad
    if (this.filtroEspecialidad) {
      resultado = resultado.filter(turno => 
        turno.especialidad?.nombre === this.filtroEspecialidad
      );
    }

    // Filtro por especialista
    if (this.filtroEspecialista) {
      resultado = resultado.filter(turno => {
        const nombreCompleto = `${turno.especialista?.nombre} ${turno.especialista?.apellido}`;
        return nombreCompleto === this.filtroEspecialista;
      });
    }

    this.turnosFiltrados = resultado;
  }

  onFiltroChange() {
    this.aplicarFiltros();
  }

  limpiarFiltros() {
    this.filtroEspecialidad = '';
    this.filtroEspecialista = '';
    this.aplicarFiltros();
  }

  // Modales
  abrirModalCancelar(turno: TurnoCompleto) {
    this.turnoSeleccionado = turno;
    this.motivoCancelacion = '';
    this.modalCancelarVisible = true;
    this.mensajeError = '';
  }

  cerrarModalCancelar() {
    this.modalCancelarVisible = false;
    this.turnoSeleccionado = null;
    this.motivoCancelacion = '';
  }

  async cancelarTurno() {
    if (!this.turnoSeleccionado || !this.motivoCancelacion.trim()) {
      this.mensajeError = 'Debe ingresar un motivo de cancelación';
      return;
    }

    try {
      this.cargando = true;

      const { error } = await this.supabaseService.supabase
        .from('turnos')
        .update({
          estado: 'cancelado',
          motivo_cancelacion: this.motivoCancelacion
        })
        .eq('id', this.turnoSeleccionado.id);

      if (error) throw error;

      this.mensajeExito = 'Turno cancelado correctamente';
      this.cerrarModalCancelar();
      await this.cargarTurnos();

      setTimeout(() => {
        this.mensajeExito = '';
      }, 3000);

    } catch (error: any) {
      console.error('Error cancelando turno:', error);
      this.mensajeError = 'Error al cancelar el turno';
    } finally {
      this.cargando = false;
    }
  }

  // Acciones
  puedeCancelar(turno: TurnoCompleto): boolean {
    // Solo puede cancelar si está PENDIENTE (no aceptado, realizado o rechazado)
    return turno.estado === 'pendiente';
  }

  // Utilidades
  getEstadoBadgeClass(estado: EstadoTurno): string {
    const clases: { [key: string]: string } = {
      'pendiente': 'badge-warning',
      'aceptado': 'badge-info',
      'realizado': 'badge-success',
      'cancelado': 'badge-danger',
      'rechazado': 'badge-danger'
    };
    return clases[estado] || 'badge-secondary';
  }

  getEstadoLabel(estado: EstadoTurno): string {
    const labels: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'aceptado': 'Aceptado',
      'realizado': 'Realizado',
      'cancelado': 'Cancelado',
      'rechazado': 'Rechazado'
    };
    return labels[estado] || estado;
  }

  formatearFecha(fecha: string): string {
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  }

  irASolicitarTurno() {
    this.router.navigate(['/solicitar-turno']);
  }

  exportarExcel() {
    // TODO: Implementar exportación a Excel
    console.log('Exportar a Excel');
    this.mensajeExito = 'Función de exportación en desarrollo';
    setTimeout(() => {
      this.mensajeExito = '';
    }, 3000);
  }

  generarReporte() {
    // TODO: Implementar generación de reporte PDF
    console.log('Generar reporte PDF');
    this.mensajeExito = 'Función de reporte en desarrollo';
    setTimeout(() => {
      this.mensajeExito = '';
    }, 3000);
  }

  verHistoriaClinica(pacienteId: string) {
    // TODO: Navegar a historia clínica del paciente
    console.log('Ver historia clínica de:', pacienteId);
    this.mensajeExito = 'Función de historia clínica en desarrollo (Sprint 3)';
    setTimeout(() => {
      this.mensajeExito = '';
    }, 3000);
  }

  volver() {
    this.router.navigate(['/home']);
  }
}
