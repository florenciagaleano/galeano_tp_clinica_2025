import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Paciente, Especialista, Administrador, TipoUsuario, HistoriaClinica } from '../../models/interfaces';
import { EdadPipe, FechaTurnoPipe } from '../../pipes';
import { AnimacionEntradaDirective } from '../../directives';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, EdadPipe, FechaTurnoPipe, AnimacionEntradaDirective],
  templateUrl: './mi-perfil.component.html',
  styleUrl: './mi-perfil.component.css'
})
export class MiPerfilComponent implements OnInit {
    // Formulario de disponibilidad horaria
    formDisponibilidad = {
      especialidadId: '',
      diaSemana: '',
      horaInicio: '',
      horaFin: '',
      horarios: [] as { horaInicio: string; horaFin: string }[]
    };
  usuario: any = null;
  tipoUsuario: TipoUsuario | null = null;
  historiaClinica: HistoriaClinica[] = [];
  cargando = true;
  mostrarModalDisponibilidad = false;

  // Para especialistas
  especialidades: any[] = [];
  disponibilidadHoraria: any[] = [];

  diasSemana = [
    { valor: 'lunes', label: 'Lunes' },
    { valor: 'martes', label: 'Martes' },
    { valor: 'miercoles', label: 'Miércoles' },
    { valor: 'jueves', label: 'Jueves' },
    { valor: 'viernes', label: 'Viernes' },
    { valor: 'sabado', label: 'Sábado' }
  ];

  constructor(private supabaseService: SupabaseService) {}

  async ngOnInit() {
    await this.cargarDatosUsuario();
  }

  async cargarDatosUsuario() {
    try {
      this.cargando = true;
      const { data: { user } } = await this.supabaseService.supabase.auth.getUser();
      
      if (!user) {
        console.error('No hay usuario autenticado');
        return;
      }

      // Buscar en pacientes usando email
      const { data: paciente } = await this.supabaseService.supabase
        .from('pacientes')
        .select('*')
        .eq('email', user.email)
        .single();

      if (paciente) {
        this.usuario = paciente;
        this.tipoUsuario = TipoUsuario.PACIENTE;
        await this.cargarHistoriaClinica(paciente.id);
        return;
      }

      // Buscar en especialistas usando email
      const { data: especialista } = await this.supabaseService.supabase
        .from('especialistas')
        .select(`
          *,
          especialista_especialidades(
            especialidad:especialidades(*)
          )
        `)
        .eq('email', user.email)
        .single();

      if (especialista) {
        this.usuario = especialista;
        this.tipoUsuario = TipoUsuario.ESPECIALISTA;
        this.especialidades = especialista.especialista_especialidades?.map((ee: any) => ee.especialidad) || [];
        await this.cargarDisponibilidadHoraria(especialista.id);
        return;
      }

      // Buscar en administradores usando email
      const { data: admin } = await this.supabaseService.supabase
        .from('administradores')
        .select('*')
        .eq('email', user.email)
        .single();

      if (admin) {
        this.usuario = admin;
        this.tipoUsuario = TipoUsuario.ADMIN;
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
    } finally {
      this.cargando = false;
    }
  }

  async cargarHistoriaClinica(pacienteId: string) {
    const data = await this.supabaseService.obtenerHistoriaClinicaPaciente(pacienteId);
    
    // Parsear datos_dinamicos si viene como string
    this.historiaClinica = data.map((historia: any) => ({
      ...historia,
      datos_dinamicos: typeof historia.datos_dinamicos === 'string' 
        ? JSON.parse(historia.datos_dinamicos) 
        : historia.datos_dinamicos
    }));
  }

  async cargarDisponibilidadHoraria(especialistaId: string) {
    try {
      const { data } = await this.supabaseService.supabase
        .from('disponibilidad_horaria')
        .select(`
          *,
          especialidad:especialidades(nombre)
        `)
        .eq('especialista_id', especialistaId)
        .eq('activa', true);

      this.disponibilidadHoraria = data || [];
    } catch (error) {
      console.error('Error al cargar disponibilidad:', error);
    }
  }

  descargarHistoriaClinicaPDF() {
    if (!this.usuario || this.historiaClinica.length === 0) {
      alert('No hay historia clínica para descargar');
      return;
    }

    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.setTextColor(117, 108, 131); // fourth-color
    doc.text('Clínica OnLine', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text('Historia Clínica', 105, 30, { align: 'center' });
    
    // Fecha de emisión
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}`, 105, 38, { align: 'center' });
    
    // Datos del paciente
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Paciente: ${this.usuario.nombre} ${this.usuario.apellido}`, 20, 50);
    doc.text(`DNI: ${this.usuario.dni}`, 20, 58);
    doc.text(`Edad: ${this.usuario.edad} años`, 20, 66);
    doc.text(`Obra Social: ${this.usuario.obra_social}`, 20, 74);
    
    // Tabla de historia clínica
    const tableData = this.historiaClinica.map(h => [
      new Date(h.fecha).toLocaleDateString('es-AR'),
      `${h.especialista?.nombre} ${h.especialista?.apellido}`,
      h.altura ? `${h.altura} cm` : '-',
      h.peso ? `${h.peso} kg` : '-',
      h.temperatura ? `${h.temperatura}°C` : '-',
      h.presion || '-'
    ]);

    autoTable(doc, {
      startY: 85,
      head: [['Fecha', 'Especialista', 'Altura', 'Peso', 'Temp.', 'Presión']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [185, 225, 220] }, // second-color
      styles: { fontSize: 9 }
    });

    // Datos dinámicos
    let currentY = (doc as any).lastAutoTable.finalY + 10;
    
    if (this.historiaClinica.some(h => h.datos_dinamicos && h.datos_dinamicos.length > 0)) {
      doc.setFontSize(12);
      doc.text('Datos Adicionales:', 20, currentY);
      currentY += 8;
      
      this.historiaClinica.forEach(h => {
        if (h.datos_dinamicos && h.datos_dinamicos.length > 0) {
          doc.setFontSize(10);
          doc.text(`${new Date(h.fecha).toLocaleDateString('es-AR')}:`, 25, currentY);
          currentY += 6;
          
          h.datos_dinamicos.forEach((dato: any) => {
            doc.text(`  • ${dato.clave}: ${dato.valor}`, 30, currentY);
            currentY += 5;
          });
          currentY += 3;
        }
      });
    }

    // Guardar PDF
    doc.save(`historia-clinica-${this.usuario.dni}.pdf`);
  }

  abrirModalDisponibilidad() {
    this.mostrarModalDisponibilidad = true;
  }

  cerrarModalDisponibilidad() {
    this.mostrarModalDisponibilidad = false;
    // Resetear formulario
    this.formDisponibilidad = {
      especialidadId: '',
      diaSemana: '',
      horaInicio: '',
      horaFin: '',
      horarios: []
    };
  }

  async guardarDisponibilidad() {
    console.log('=== guardarDisponibilidad llamado ===');
    console.log('FormDisponibilidad:', this.formDisponibilidad);
    console.log('Usuario:', this.usuario);
    
    if (!this.usuario) {
      console.log('No hay usuario');
      alert('Completa todos los campos y agrega al menos un horario.');
      return;
    }
    if (!this.formDisponibilidad.especialidadId) {
      console.log('Falta especialidadId');
      alert('Completa todos los campos y agrega al menos un horario.');
      return;
    }
    if (!this.formDisponibilidad.diaSemana) {
      console.log('Falta diaSemana');
      alert('Completa todos los campos y agrega al menos un horario.');
      return;
    }
    if (this.formDisponibilidad.horarios.length === 0) {
      console.log('No hay horarios');
      alert('Completa todos los campos y agrega al menos un horario.');
      return;
    }
    console.log("Entro");
    try {
      // Guardar todos los horarios como un array JSONB en la columna 'horarios'
      const horariosJson = this.formDisponibilidad.horarios.map(h => ({
        hora_inicio: h.horaInicio,
        hora_fin: h.horaFin
      }));
      const { data, error } = await this.supabaseService.supabase
        .from('disponibilidad_horaria')
        .insert({
          especialista_id: this.usuario.id,
          especialidad_id: this.formDisponibilidad.especialidadId,
          dia_semana: this.formDisponibilidad.diaSemana,
          horarios: horariosJson,
          activa: true
        })
        .select();
      if (error) {
        console.error('Error al guardar disponibilidad:', error);
      } else {
        console.log('Disponibilidad guardada:', data);
      }
      await this.cargarDisponibilidadHoraria(this.usuario.id);
      this.cerrarModalDisponibilidad();
    } catch (error) {
      alert('Error al guardar la disponibilidad horaria');
      console.error(error);
    }
  }

  // Métodos para agregar/eliminar horarios en el formulario
  public agregarHorario(): void {
    console.log('=== agregarHorario llamado ===');
    console.log('horaInicio:', this.formDisponibilidad.horaInicio);
    console.log('horaFin:', this.formDisponibilidad.horaFin);
    
    if (!this.formDisponibilidad.horaInicio || !this.formDisponibilidad.horaFin) {
      console.log('Faltan horas, retornando');
      return;
    }
    
    this.formDisponibilidad.horarios.push({
      horaInicio: this.formDisponibilidad.horaInicio,
      horaFin: this.formDisponibilidad.horaFin
    });
    
    console.log('Horario agregado. Lista actual:', this.formDisponibilidad.horarios);
    
    this.formDisponibilidad.horaInicio = '';
    this.formDisponibilidad.horaFin = '';
  }

  public eliminarHorario(index: number): void {
    this.formDisponibilidad.horarios.splice(index, 1);
  }

  get nombreCompleto(): string {
    return this.usuario ? `${this.usuario.nombre} ${this.usuario.apellido}` : '';
  }

  get imagenPerfil(): string {
    if (!this.usuario) return '';
    if (this.tipoUsuario === TipoUsuario.PACIENTE) {
      return this.usuario.imagen_perfil_1 || '/assets/users/default-avatar.png';
    }
    return this.usuario.imagen_perfil || '/assets/users/default-avatar.png';
  }
}
