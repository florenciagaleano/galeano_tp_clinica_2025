import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { Especialidad, Especialista, Paciente, TipoUsuario, DisponibilidadHoraria, HorarioDisponible } from '../../models/interfaces';

interface EspecialistaConEspecialidades extends Especialista {
  especialidades: Especialidad[];
}

@Component({
  selector: 'app-solicitar-turno',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitar-turno.component.html',
  styleUrls: ['./solicitar-turno.component.css']
})
export class SolicitarTurnoComponent implements OnInit {
  // Usuario actual
  usuarioActual: any = null;
  esAdmin: boolean = false;
  esPaciente: boolean = true;

  // Paso del wizard
  pasoActual: number = 1; // 1: especialista, 2: especialidad, 3: fecha, 4: hora

  // Datos para solicitar turno
  especialistaSeleccionado: EspecialistaConEspecialidades | null = null;
  especialidadSeleccionada: Especialidad | null = null;
  fechaSeleccionada: Date | null = null;
  horaSeleccionada: string | null = null;
  pacienteSeleccionado: Paciente | null = null; // Solo para admin

  // Listas
  especialistas: EspecialistaConEspecialidades[] = [];
  especialidadesDelEspecialista: Especialidad[] = [];
  pacientes: Paciente[] = []; // Solo para admin
  
  // URL base del storage para imágenes de especialidades
  supabaseStorageUrl: string = 'https://jufqrifecxbmqpauujbk.supabase.co/storage/v1/object/public/especialidades';
  
  // Fechas disponibles (próximos 15 días)
  fechasDisponibles: Date[] = [];
  horariosDisponibles: HorarioDisponible[] = [];

  // Loading y mensajes
  cargando: boolean = false;
  mensajeError: string = '';
  mensajeExito: string = '';

  // Disponibilidad del especialista
  disponibilidad: DisponibilidadHoraria[] = [];

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.identificarUsuario();
    await this.cargarEspecialistas();
    this.generarFechasDisponibles();
    
    // Obtener URL del storage de Supabase y verificar
    try {
      const { data } = this.supabaseService.supabase.storage.from('especialidades').getPublicUrl('default.png');
      if (data && data.publicUrl) {
        this.supabaseStorageUrl = data.publicUrl.replace('/default.png', '');
        console.log('URL base del storage configurada:', this.supabaseStorageUrl);
      }
    } catch (error) {
      console.error('Error obteniendo URL del storage:', error);
      console.log('Usando URL hardcodeada por defecto');
    }
    
    if (this.esAdmin) {
      await this.cargarPacientes();
    }
  }

  async identificarUsuario() {
    try {
      const { data: { user } } = await this.supabaseService.supabase.auth.getUser();
      
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }

      this.usuarioActual = user;

      // Verificar si es admin
      const { data: admin } = await this.supabaseService.supabase
        .from('administradores')
        .select('*')
        .eq('email', user.email)
        .single();

      if (admin) {
        this.esAdmin = true;
        this.esPaciente = false;
      } else {
        this.esAdmin = false;
        this.esPaciente = true;
      }

    } catch (error) {
      console.error('Error identificando usuario:', error);
      this.mensajeError = 'Error al identificar usuario';
    }
  }

  async cargarEspecialistas() {
    try {
      this.cargando = true;
      
      // Obtener todos los especialistas habilitados
      const { data: especialistas, error: errorEsp } = await this.supabaseService.supabase
        .from('especialistas')
        .select('*')
        .eq('aprobado_por_admin', true)
        .order('apellido');

      if (errorEsp) throw errorEsp;

      // Para cada especialista, obtener sus especialidades
      const especialistasConEspecialidades: EspecialistaConEspecialidades[] = [];

      for (const esp of especialistas || []) {
        const { data: espEspecialidades, error: errorEspEsp } = await this.supabaseService.supabase
          .from('especialista_especialidades')
          .select(`
            especialidad_id,
            especialidades (
              id,
              nombre
            )
          `)
          .eq('especialista_id', esp.id);

        if (errorEspEsp) {
          console.error('Error obteniendo especialidades del especialista:', errorEspEsp);
          continue;
        }

        const especialidadesDelEspecialista = espEspecialidades?.map((ee: any) => ee.especialidades) || [];
        
        especialistasConEspecialidades.push({
          ...esp,
          especialidades: especialidadesDelEspecialista
        });
      }

      this.especialistas = especialistasConEspecialidades;

    } catch (error) {
      console.error('Error cargando especialistas:', error);
      this.mensajeError = 'Error al cargar especialistas';
    } finally {
      this.cargando = false;
    }
  }

  async cargarPacientes() {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('pacientes')
        .select('*')
        .order('apellido');

      if (error) throw error;
      this.pacientes = data || [];
    } catch (error) {
      console.error('Error cargando pacientes:', error);
      this.mensajeError = 'Error al cargar pacientes';
    }
  }

  generarFechasDisponibles() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    this.fechasDisponibles = [];
    
    for (let i = 0; i < 15; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      
      // Excluir domingos (0) y verificar horario de la clínica
      const diaSemana = fecha.getDay();
      if (diaSemana !== 0) { // No es domingo
        this.fechasDisponibles.push(fecha);
      }
    }
  }

  filtrarFechasConDisponibilidad() {
    if (!this.disponibilidad || this.disponibilidad.length === 0) {
      this.fechasDisponibles = [];
      this.mensajeError = 'Aún no se abrió la agenda. Pruebe en otro momento';
      return;
    }

    // Obtener los días de la semana donde hay disponibilidad
    const diasConDisponibilidad = this.disponibilidad.map(d => d.dia_semana);
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    this.fechasDisponibles = [];
    
    for (let i = 0; i < 15; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      
      const diaSemana = this.getDiaSemanaString(fecha.getDay());
      
      // Solo agregar si el especialista tiene disponibilidad ese día
      if (diasConDisponibilidad.includes(diaSemana)) {
        this.fechasDisponibles.push(fecha);
      }
    }

    // Si después de filtrar no hay fechas disponibles
    if (this.fechasDisponibles.length === 0) {
      this.mensajeError = 'Aún no se abrió la agenda. Pruebe en otro momento';
    }
  }

  async cargarDisponibilidad() {
    if (!this.especialistaSeleccionado || !this.especialidadSeleccionada) return;

    try {
      this.cargando = true;

      const { data, error } = await this.supabaseService.supabase
        .from('disponibilidad_horaria')
        .select('*')
        .eq('especialista_id', this.especialistaSeleccionado.id)
        .eq('especialidad_id', this.especialidadSeleccionada.id);

      if (error) throw error;
      this.disponibilidad = data || [];
      
      // Filtrar fechas según la disponibilidad del especialista
      this.filtrarFechasConDisponibilidad();

    } catch (error) {
      console.error('Error cargando disponibilidad:', error);
      this.mensajeError = 'Error al cargar disponibilidad del especialista';
    } finally {
      this.cargando = false;
    }
  }

  async cargarHorariosDisponibles() {
    if (!this.fechaSeleccionada || !this.especialistaSeleccionado) return;

    try {
      this.cargando = true;
      this.horariosDisponibles = [];

      const diaSemana = this.getDiaSemanaString(this.fechaSeleccionada.getDay());
      
      // Buscar disponibilidad para ese día
      const disponibilidadDelDia = this.disponibilidad.find(d => d.dia_semana === diaSemana);
      
      if (!disponibilidadDelDia) {
        // Ya no debería llegar aquí porque filtramos las fechas
        this.cargando = false;
        return;
      }

      // Obtener turnos ya ocupados para esa fecha
      const fechaStr = this.formatearFecha(this.fechaSeleccionada);
      const { data: turnosOcupados, error } = await this.supabaseService.supabase
        .from('turnos')
        .select('hora, duracion_minutos')
        .eq('especialista_id', this.especialistaSeleccionado.id)
        .eq('fecha', fechaStr)
        .in('estado', ['pendiente', 'aceptado']); // Solo turnos activos

      if (error) throw error;

      // Generar horarios disponibles basados en la disponibilidad
      const horarios = disponibilidadDelDia.horarios || [];
      const turnosDuracion = this.especialistaSeleccionado.duracion_turno || 30;

      for (const horario of horarios) {
        const horaInicio = this.convertirHoraAMinutos(horario.hora_inicio);
        const horaFin = this.convertirHoraAMinutos(horario.hora_fin);

        // Generar slots cada "turnosDuracion" minutos
        for (let minutos = horaInicio; minutos < horaFin; minutos += turnosDuracion) {
          const horaStr = this.convertirMinutosAHora(minutos);
          
          // Verificar si está ocupado
          const estaOcupado = turnosOcupados?.some((turno: any) => {
            return turno.hora === horaStr;
          });

          if (!estaOcupado) {
            this.horariosDisponibles.push({
              hora_inicio: horaStr,
              hora_fin: this.convertirMinutosAHora(minutos + turnosDuracion)
            });
          }
        }
      }

      if (this.horariosDisponibles.length === 0) {
        this.mensajeError = 'No hay horarios disponibles para esta fecha';
      }

    } catch (error) {
      console.error('Error cargando horarios:', error);
      this.mensajeError = 'Error al cargar horarios disponibles';
    } finally {
      this.cargando = false;
    }
  }

  // Navegación del wizard
  async seleccionarEspecialista(especialista: EspecialistaConEspecialidades) {
    this.especialistaSeleccionado = especialista;
    this.especialidadSeleccionada = null;
    this.fechaSeleccionada = null;
    this.horaSeleccionada = null;
    this.mensajeError = '';
    
    // Guardar las especialidades del especialista seleccionado
    this.especialidadesDelEspecialista = especialista.especialidades || [];
    
    this.pasoActual = 2;
  }

  async seleccionarEspecialidad(especialidad: Especialidad) {
    this.especialidadSeleccionada = especialidad;
    this.fechaSeleccionada = null;
    this.horaSeleccionada = null;
    this.mensajeError = '';
    
    await this.cargarDisponibilidad();
    this.pasoActual = 3;
  }

  async seleccionarFecha(fecha: Date) {
    this.fechaSeleccionada = fecha;
    this.horaSeleccionada = null;
    this.mensajeError = '';
    
    await this.cargarHorariosDisponibles();
    this.pasoActual = 4;
  }

  seleccionarHora(hora: string) {
    this.horaSeleccionada = hora;
    this.mensajeError = '';
  }

  seleccionarPaciente(paciente: Paciente) {
    this.pacienteSeleccionado = paciente;
  }

  volverPaso() {
    this.mensajeError = '';
    if (this.pasoActual > 1) {
      this.pasoActual--;
      
      if (this.pasoActual === 1) {
        this.especialistaSeleccionado = null;
        this.especialidadSeleccionada = null;
        this.fechaSeleccionada = null;
        this.horaSeleccionada = null;
        this.especialidadesDelEspecialista = [];
      } else if (this.pasoActual === 2) {
        this.especialidadSeleccionada = null;
        this.fechaSeleccionada = null;
        this.horaSeleccionada = null;
      } else if (this.pasoActual === 3) {
        this.fechaSeleccionada = null;
        this.horaSeleccionada = null;
      }
    }
  }
  
  getImagenEspecialidad(nombreEspecialidad: string): string {
    
    const nombreNormalizado = nombreEspecialidad
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
      .replace(/\s+/g, '_'); // Reemplazar espacios por guión bajo
          console.log('Imagen especialidad URL:', `${this.supabaseStorageUrl}/${nombreNormalizado}.png`);

    return `${this.supabaseStorageUrl}/${nombreNormalizado}.jpg`;
  }

  async confirmarTurno() {
    if (!this.especialidadSeleccionada || !this.especialistaSeleccionado || 
        !this.fechaSeleccionada || !this.horaSeleccionada) {
      this.mensajeError = 'Debe completar todos los pasos';
      return;
    }

    if (this.esAdmin && !this.pacienteSeleccionado) {
      this.mensajeError = 'Debe seleccionar un paciente';
      return;
    }

    try {
      this.cargando = true;
      this.mensajeError = '';

      // Obtener ID del paciente
      let pacienteId: string;
      
      if (this.esAdmin) {
        pacienteId = this.pacienteSeleccionado!.id;
      } else {
        // Obtener el paciente actual
        const { data: paciente, error: errorPaciente } = await this.supabaseService.supabase
          .from('pacientes')
          .select('id')
          .eq('email', this.usuarioActual.email)
          .single();

        if (errorPaciente || !paciente) {
          throw new Error('No se pudo obtener el paciente');
        }
        pacienteId = paciente.id;
      }

      // Crear el turno usando el servicio
      const resultado = await this.supabaseService.crearTurno({
        paciente_id: pacienteId,
        especialista_id: this.especialistaSeleccionado.id!,
        especialidad_id: this.especialidadSeleccionada.id!,
        fecha: this.formatearFecha(this.fechaSeleccionada),
        hora: this.horaSeleccionada,
        duracion_minutos: this.especialistaSeleccionado.duracion_turno || 30
      });

      if (!resultado.success) {
        throw new Error(resultado.message);
      }

      this.mensajeExito = '¡Turno solicitado con éxito!';
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        if(this.esAdmin) {
          this.router.navigate(['/turnos']);
        }else{
          this.router.navigate(['/mis-turnos']);
        }
      }, 2000);

    } catch (error: any) {
      console.error('Error al crear turno:', error);
      this.mensajeError = error.message || 'Error al solicitar el turno';
    } finally {
      this.cargando = false;
    }
  }

  // Utilidades
  getDiaSemanaString(dia: number): string {
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    return dias[dia];
  }

  formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatearFechaLegible(fecha: Date): string {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    return `${dias[fecha.getDay()]} ${fecha.getDate()} ${meses[fecha.getMonth()]}`;
  }

  esFechaHoy(fecha: Date): boolean {
    const hoy = new Date();
    return fecha.getDate() === hoy.getDate() &&
           fecha.getMonth() === hoy.getMonth() &&
           fecha.getFullYear() === hoy.getFullYear();
  }

  esFechaSeleccionada(fecha: Date): boolean {
    if (!this.fechaSeleccionada) return false;
    return fecha.getDate() === this.fechaSeleccionada.getDate() &&
           fecha.getMonth() === this.fechaSeleccionada.getMonth() &&
           fecha.getFullYear() === this.fechaSeleccionada.getFullYear();
  }

  convertirHoraAMinutos(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  }

  convertirMinutosAHora(minutos: number): string {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  cancelar() {
    this.router.navigate(['/home']);
  }
}
