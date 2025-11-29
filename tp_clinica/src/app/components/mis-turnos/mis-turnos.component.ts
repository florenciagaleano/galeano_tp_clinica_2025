import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Turno, EstadoTurno, TipoUsuario } from '../../models/interfaces';
import { SupabaseService } from '../../services/supabase.service';
import { EstadoTurnoPipe } from '../../pipes/estado-turno.pipe';
import { FechaTurnoPipe } from '../../pipes/fecha-turno.pipe';
import { HighlightTurnoDirective } from '../../directives/highlight-turno.directive';

@Component({
  selector: 'app-mis-turnos',
  standalone: true,
  imports: [CommonModule, FormsModule, EstadoTurnoPipe, FechaTurnoPipe, HighlightTurnoDirective],
  templateUrl: './mis-turnos.component.html',
  styleUrl: './mis-turnos.component.css'
})
export class MisTurnosComponent implements OnInit {
  
  turnos: Turno[] = [];
  turnosFiltrados: Turno[] = [];
  loading = false;
  mensaje = '';
  mensajeTipo: 'success' | 'error' = 'success';
  
  // Filtros
  filtroTexto = '';
  filtroEspecialidad = '';
  filtroEspecialista = '';
  
  // Listas para filtros
  especialidadesDisponibles: string[] = [];
  especialistasDisponibles: string[] = [];
  
  // Usuario actual
  tipoUsuario: TipoUsuario | null = null;
  usuarioId: string | null = null;
  
  // Modal estados
  mostrandoModalCancelar = false;
  mostrandoModalRechazar = false;
  mostrandoModalFinalizar = false;
  mostrandoModalCalificar = false;
  mostrandoModalEncuesta = false;
  mostrandoModalResena = false;
  
  // Turno seleccionado para acciones
  turnoSeleccionado: Turno | null = null;
  
  // Formularios modales
  motivoCancelacion = '';
  motivoRechazo = '';
  resenaConsulta = '';
  calificacion: number | null = null;
  comentarioCalificacion = '';
  
  // Encuesta de satisfacción (Sprint 6)
  encuesta = {
    recomendaria: '',
    tiempoEspera: '',
    instalaciones: false,
    atencion: false,
    profesionalismo: false,
    satisfaccionGeneral: 5
  };
  
  // Historia Clínica - 4 datos fijos
  altura: number | null = null;
  peso: number | null = null;
  temperatura: number | null = null;
  presion = '';
  
  // Historia Clínica - 3 datos dinámicos
  datosDinamicos: { clave: string; valor: string }[] = [
    { clave: '', valor: '' },
    { clave: '', valor: '' },
    { clave: '', valor: '' }
  ];
  
  // Exponer enum para template
  EstadoTurno = EstadoTurno;
  TipoUsuario = TipoUsuario;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  volver() {
    this.router.navigate(['/home']);
  }

  async ngOnInit() {
    await this.identificarUsuario();
    await this.cargarTurnos();
  }

  async identificarUsuario() {
    // TODO: Obtener usuario actual desde el servicio de autenticación
    // Por ahora simulamos
    try {
      const { data: { user } } = await this.supabaseService.supabase.auth.getUser();
      if (user) {
        this.usuarioId = user.id;
        // Determinar tipo de usuario consultando las tablas
        await this.determinarTipoUsuario(user.id);
      }
    } catch (error) {
      console.error('Error al identificar usuario:', error);
    }
  }

  async determinarTipoUsuario(userId: string) {
    try {
      // Buscar en pacientes
      const { data: paciente } = await this.supabaseService.supabase
        .from('pacientes')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (paciente) {
        this.tipoUsuario = TipoUsuario.PACIENTE;
        this.usuarioId = paciente.id;
        return;
      }

      // Buscar en especialistas
      const { data: especialista } = await this.supabaseService.supabase
        .from('especialistas')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (especialista) {
        this.tipoUsuario = TipoUsuario.ESPECIALISTA;
        this.usuarioId = especialista.id;
        return;
      }

      console.error('Usuario no encontrado en pacientes ni especialistas');
    } catch (error) {
      console.error('Error al determinar tipo de usuario:', error);
    }
  }

  async cargarTurnos() {
    this.loading = true;
    try {
      if (!this.usuarioId || !this.tipoUsuario) {
        console.error('Usuario no identificado');
        return;
      }

      if (this.tipoUsuario === TipoUsuario.PACIENTE) {
        this.turnos = await this.supabaseService.obtenerTurnosPaciente(this.usuarioId);
        
        // Extraer especialidades y especialistas únicos para los filtros
        const especialidadesSet = new Set<string>();
        const especialistasSet = new Set<string>();
        
        this.turnos.forEach(turno => {
          if (turno.especialidad?.nombre) {
            especialidadesSet.add(turno.especialidad.nombre);
          }
          if (turno.especialista?.nombre && turno.especialista?.apellido) {
            const nombreCompleto = `${turno.especialista.nombre} ${turno.especialista.apellido}`;
            especialistasSet.add(nombreCompleto);
          }
        });
        
        this.especialidadesDisponibles = Array.from(especialidadesSet).sort();
        this.especialistasDisponibles = Array.from(especialistasSet).sort();
      } else if (this.tipoUsuario === TipoUsuario.ESPECIALISTA) {
        this.turnos = await this.supabaseService.obtenerTurnosEspecialista(this.usuarioId);
        
        // Para especialista, extraer especialidades y pacientes
        const especialidadesSet = new Set<string>();
        const pacientesSet = new Set<string>();
        
        this.turnos.forEach(turno => {
          if (turno.especialidad?.nombre) {
            especialidadesSet.add(turno.especialidad.nombre);
          }
          if (turno.paciente?.nombre && turno.paciente?.apellido) {
            const nombreCompleto = `${turno.paciente.nombre} ${turno.paciente.apellido}`;
            pacientesSet.add(nombreCompleto);
          }
        });
        
        this.especialidadesDisponibles = Array.from(especialidadesSet).sort();
        this.especialistasDisponibles = Array.from(pacientesSet).sort(); // Reutilizamos la variable para pacientes
      }

      this.turnosFiltrados = this.turnos;
      
    } catch (error: any) {
      this.mostrarMensaje(`Error al cargar turnos: ${error.message}`, 'error');
    } finally {
      this.loading = false;
    }
  }

  filtrarTurnos() {
    this.turnosFiltrados = this.turnos.filter(turno => {
      let cumpleFiltros = true;

      // Filtro por especialidad
      if (this.filtroEspecialidad) {
        const especialidad = turno.especialidad?.nombre || '';
        cumpleFiltros = cumpleFiltros && especialidad === this.filtroEspecialidad;
      }

      // Filtro por especialista/paciente
      if (this.filtroEspecialista) {
        if (this.tipoUsuario === TipoUsuario.PACIENTE) {
          const especialista = `${turno.especialista?.nombre || ''} ${turno.especialista?.apellido || ''}`.trim();
          cumpleFiltros = cumpleFiltros && especialista === this.filtroEspecialista;
        } else if (this.tipoUsuario === TipoUsuario.ESPECIALISTA) {
          const paciente = `${turno.paciente?.nombre || ''} ${turno.paciente?.apellido || ''}`.trim();
          cumpleFiltros = cumpleFiltros && paciente === this.filtroEspecialista;
        }
      }

      // Filtro de texto libre (busca en todos los campos)
      if (this.filtroTexto.trim()) {
        const filtro = this.filtroTexto.toLowerCase();
        const especialidad = turno.especialidad?.nombre?.toLowerCase() || '';
        const fecha = turno.fecha.toLowerCase();
        const hora = turno.hora?.toLowerCase() || '';
        const estado = turno.estado.toLowerCase();
        
        let nombrePersona = '';
        if (this.tipoUsuario === TipoUsuario.PACIENTE) {
          nombrePersona = `${turno.especialista?.nombre || ''} ${turno.especialista?.apellido || ''}`.toLowerCase();
        } else {
          nombrePersona = `${turno.paciente?.nombre || ''} ${turno.paciente?.apellido || ''}`.toLowerCase();
        }

        // Historia Clínica
        let historiaTexto = '';
        // Supabase puede devolver historia_clinica como array o objeto dependiendo de la relación
        const hcData = (turno as any).historia_clinica;
        
        if (hcData) {
          const listaHc = Array.isArray(hcData) ? hcData : [hcData];
          
          listaHc.forEach((hc: any) => {
            historiaTexto += `${hc.altura || ''} ${hc.peso || ''} ${hc.temperatura || ''} ${hc.presion || ''} `;
            
            // Datos dinámicos
            let dinamicos = hc.datos_dinamicos;
            if (typeof dinamicos === 'string') {
              try {
                dinamicos = JSON.parse(dinamicos);
              } catch (e) {
                console.error('Error parsing datos_dinamicos', e);
              }
            }
            
            if (Array.isArray(dinamicos)) {
              dinamicos.forEach((d: any) => {
                historiaTexto += `${d.clave} ${d.valor} `;
              });
            }
          });
        }
        historiaTexto = historiaTexto.toLowerCase();
        
        const coincideTexto = especialidad.includes(filtro) || 
                             nombrePersona.includes(filtro) || 
                             fecha.includes(filtro) ||
                             hora.includes(filtro) ||
                             estado.includes(filtro) ||
                             historiaTexto.includes(filtro);
        
        cumpleFiltros = cumpleFiltros && coincideTexto;
      }

      return cumpleFiltros;
    });
  }

  limpiarFiltros() {
    this.filtroEspecialidad = '';
    this.filtroEspecialista = '';
    this.filtroTexto = '';
    this.filtrarTurnos();
  }

  // =============================================
  // ACCIONES PARA PACIENTES
  // =============================================

  abrirModalCancelar(turno: Turno) {
    this.turnoSeleccionado = turno;
    this.motivoCancelacion = '';
    this.mostrandoModalCancelar = true;
  }

  async cancelarTurno() {
    if (!this.turnoSeleccionado || !this.motivoCancelacion.trim()) {
      this.mostrarMensaje('Debes ingresar un motivo de cancelación', 'error');
      return;
    }

    this.loading = true;
    try {
      const resultado = await this.supabaseService.cancelarTurno(
        this.turnoSeleccionado.id!,
        this.motivoCancelacion
      );

      if (resultado.success) {
        this.mostrarMensaje('Turno cancelado exitosamente', 'success');
        this.cerrarModales();
        await this.cargarTurnos();
      } else {
        this.mostrarMensaje(resultado.message, 'error');
      }
      
    } catch (error: any) {
      this.mostrarMensaje(`Error al cancelar turno: ${error.message}`, 'error');
    } finally {
      this.loading = false;
    }
  }

  abrirModalCalificar(turno: Turno) {
    this.turnoSeleccionado = turno;
    this.calificacion = null;
    this.comentarioCalificacion = '';
    this.mostrandoModalCalificar = true;
  }

  async calificarAtencion() {
    if (!this.turnoSeleccionado || !this.calificacion) {
      this.mostrarMensaje('Debes seleccionar una calificación', 'error');
      return;
    }

    this.loading = true;
    try {
      const resultado = await this.supabaseService.calificarAtencion(
        this.turnoSeleccionado.id!,
        this.calificacion,
        this.comentarioCalificacion
      );

      if (resultado.success) {
        this.mostrarMensaje('Calificación registrada exitosamente', 'success');
        this.cerrarModales();
        await this.cargarTurnos();
      } else {
        this.mostrarMensaje(resultado.message, 'error');
      }
      
    } catch (error: any) {
      this.mostrarMensaje(`Error al calificar: ${error.message}`, 'error');
    } finally {
      this.loading = false;
    }
  }

  abrirModalEncuesta(turno: Turno) {
    this.turnoSeleccionado = turno;
    this.mostrandoModalEncuesta = true;
  }

  async guardarEncuesta() {
    if (!this.turnoSeleccionado) return;

    // Validación básica
    if (!this.encuesta.recomendaria) {
      this.mostrarMensaje('Debes indicar si recomendarías la clínica', 'error');
      return;
    }

    if (!this.encuesta.tiempoEspera) {
      this.mostrarMensaje('Debes seleccionar el tiempo de espera', 'error');
      return;
    }

    try {
      // Guardar encuesta en la base de datos
      const { error } = await this.supabaseService.supabase
        .from('turnos')
        .update({ 
          encuesta: this.encuesta,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.turnoSeleccionado.id);

      if (error) throw error;

      this.mostrarMensaje('Encuesta guardada exitosamente', 'success');
      this.cerrarModales();
      await this.cargarTurnos();
    } catch (error) {
      console.error('Error guardando encuesta:', error);
      this.mostrarMensaje('Error al guardar la encuesta', 'error');
    }
  }

  abrirModalResena(turno: Turno) {
    this.turnoSeleccionado = turno;
    this.mostrandoModalResena = true;
  }

  // =============================================
  // ACCIONES PARA ESPECIALISTAS
  // =============================================

  abrirModalRechazar(turno: Turno) {
    this.turnoSeleccionado = turno;
    this.motivoRechazo = '';
    this.mostrandoModalRechazar = true;
  }

  async rechazarTurno() {
    if (!this.turnoSeleccionado || !this.motivoRechazo.trim()) {
      this.mostrarMensaje('Debes ingresar un motivo de rechazo', 'error');
      return;
    }

    this.loading = true;
    try {
      const resultado = await this.supabaseService.rechazarTurno(
        this.turnoSeleccionado.id!,
        this.motivoRechazo
      );

      if (resultado.success) {
        this.mostrarMensaje('Turno rechazado exitosamente', 'success');
        this.cerrarModales();
        await this.cargarTurnos();
      } else {
        this.mostrarMensaje(resultado.message, 'error');
      }
      
    } catch (error: any) {
      this.mostrarMensaje(`Error al rechazar turno: ${error.message}`, 'error');
    } finally {
      this.loading = false;
    }
  }

  async aceptarTurno(turno: Turno) {
    this.loading = true;
    try {
      const resultado = await this.supabaseService.aceptarTurno(turno.id!);

      if (resultado.success) {
        this.mostrarMensaje('Turno aceptado exitosamente', 'success');
        await this.cargarTurnos();
      } else {
        this.mostrarMensaje(resultado.message, 'error');
      }
      
    } catch (error: any) {
      this.mostrarMensaje(`Error al aceptar turno: ${error.message}`, 'error');
    } finally {
      this.loading = false;
    }
  }

  abrirModalFinalizar(turno: Turno) {
    this.turnoSeleccionado = turno;
    this.resenaConsulta = '';
    this.mostrandoModalFinalizar = true;
  }

  async finalizarTurno() {
    if (!this.turnoSeleccionado || !this.resenaConsulta.trim()) {
      this.mostrarMensaje('Debes ingresar una reseña de la consulta', 'error');
      return;
    }

    // Validar datos fijos de historia clínica
    if (!this.altura || !this.peso || !this.temperatura || !this.presion) {
      this.mostrarMensaje('Debes completar todos los datos de la historia clínica (altura, peso, temperatura, presión)', 'error');
      return;
    }

    this.loading = true;
    try {
      // 1. Finalizar el turno
      const resultado = await this.supabaseService.finalizarTurno(
        this.turnoSeleccionado.id!,
        this.resenaConsulta
      );

      if (!resultado.success) {
        this.mostrarMensaje(resultado.message, 'error');
        return;
      }

      // 2. Guardar historia clínica
      const datosDinamicosFiltrados = this.datosDinamicos
        .filter(d => d.clave.trim() && d.valor.trim())
        .map(d => ({ clave: d.clave.trim(), valor: d.valor.trim() }));

      const { error: errorHistoria } = await this.supabaseService.supabase
        .from('historia_clinica')
        .insert({
          paciente_id: this.turnoSeleccionado.paciente_id,
          especialista_id: this.turnoSeleccionado.especialista_id,
          turno_id: this.turnoSeleccionado.id,
          fecha: new Date().toISOString().split('T')[0],
          altura: this.altura,
          peso: this.peso,
          temperatura: this.temperatura,
          presion: this.presion,
          datos_dinamicos: datosDinamicosFiltrados.length > 0 ? datosDinamicosFiltrados : null
        });

      if (errorHistoria) {
        console.error('Error guardando historia clínica:', errorHistoria);
        this.mostrarMensaje('Turno finalizado pero hubo un error al guardar la historia clínica', 'error');
      } else {
        this.mostrarMensaje('Turno finalizado exitosamente con historia clínica', 'success');
      }

      this.cerrarModales();
      await this.cargarTurnos();
      
    } catch (error: any) {
      this.mostrarMensaje(`Error al finalizar turno: ${error.message}`, 'error');
    } finally {
      this.loading = false;
    }
  }

  // =============================================
  // UTILIDADES
  // =============================================

  puedeRealizarAccion(turno: Turno, accion: string): boolean {
    if (this.tipoUsuario === TipoUsuario.PACIENTE) {
      switch (accion) {
        case 'cancelar':
          return turno.estado === EstadoTurno.PENDIENTE || 
            turno.estado === EstadoTurno.ACEPTADO;        
        case 'ver_resena':
          return !!turno.resena;
        case 'calificar':
          return turno.estado === EstadoTurno.REALIZADO && !turno.calificacion;
        case 'encuesta':
          return turno.estado === EstadoTurno.REALIZADO && 
                 !!turno.resena && 
                 !turno.encuesta_completada;
        default:
          return false;
      }
    } else if (this.tipoUsuario === TipoUsuario.ESPECIALISTA) {
      switch (accion) {
        case 'cancelar':
          return turno.estado === EstadoTurno.PENDIENTE;
        case 'aceptar':
          return turno.estado === EstadoTurno.PENDIENTE;
        case 'rechazar':
          return turno.estado === EstadoTurno.PENDIENTE;
        case 'finalizar':
          return turno.estado === EstadoTurno.ACEPTADO;
        case 'ver_resena':
          return !!turno.resena;
        default:
          return false;
      }
    }
    return false;
  }

  getEstadoBadgeClass(estado: EstadoTurno): string {
    switch (estado) {
      case EstadoTurno.PENDIENTE:
        return 'badge-warning';
      case EstadoTurno.ACEPTADO:
        return 'badge-info';
      case EstadoTurno.REALIZADO:
        return 'badge-success';
      case EstadoTurno.RECHAZADO:
      case EstadoTurno.CANCELADO:
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  cerrarModales() {
    this.mostrandoModalCancelar = false;
    this.mostrandoModalRechazar = false;
    this.mostrandoModalFinalizar = false;
    this.mostrandoModalCalificar = false;
    this.mostrandoModalEncuesta = false;
    this.mostrandoModalResena = false;
    this.turnoSeleccionado = null;
    
    // Limpiar campos de historia clínica
    this.altura = null;
    this.peso = null;
    this.temperatura = null;
    this.presion = '';
    this.datosDinamicos = [
      { clave: '', valor: '' },
      { clave: '', valor: '' },
      { clave: '', valor: '' }
    ];
    this.resenaConsulta = '';
    this.motivoCancelacion = '';
    this.motivoRechazo = '';
    this.calificacion = null;
    this.comentarioCalificacion = '';
    
    // Limpiar encuesta
    this.encuesta = {
      recomendaria: '',
      tiempoEspera: '',
      instalaciones: false,
      atencion: false,
      profesionalismo: false,
      satisfaccionGeneral: 5
    };
  }

  mostrarMensaje(mensaje: string, tipo: 'success' | 'error') {
    this.mensaje = mensaje;
    this.mensajeTipo = tipo;
    
    setTimeout(() => {
      this.mensaje = '';
    }, 5000);
  }
}
