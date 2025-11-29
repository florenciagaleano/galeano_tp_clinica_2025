import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  volver() {
    this.router.navigate(['/home']);
  }

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
        console.log('Paciente encontrado:', paciente);
        console.log('Buscando historia clínica con paciente_id:', paciente.id);
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
    console.log('Cargando historia clínica para paciente:', pacienteId);
    const data = await this.supabaseService.obtenerHistoriaClinicaPaciente(pacienteId);
    console.log('Historia clínica recibida:', data);
    
    // Parsear datos_dinamicos si viene como string
    this.historiaClinica = data.map((historia: any) => ({
      ...historia,
      datos_dinamicos: typeof historia.datos_dinamicos === 'string' 
        ? JSON.parse(historia.datos_dinamicos) 
        : historia.datos_dinamicos
    }));
    console.log('Historia clínica parseada:', this.historiaClinica);
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
    
    // Logo de la clínica (usando el favicon)
    const logoImg = new Image();
    logoImg.src = 'assets/favicon.jpg';
    
    logoImg.onload = () => {
      try {
        // Agregar logo en la esquina superior izquierda
        doc.addImage(logoImg, 'JPEG', 15, 10, 25, 25);
      } catch (error) {
        console.log('No se pudo cargar el logo');
      }
      
      // Título - Clínica OnLine
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(117, 108, 131); // fourth-color
      doc.text('Clínica OnLine', 105, 20, { align: 'center' });
      
      // Subtítulo
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text('Historia Clínica', 105, 30, { align: 'center' });
      
      // Fecha de emisión
      doc.setFontSize(10);
      doc.setTextColor(100);
      const fechaEmision = new Date().toLocaleDateString('es-AR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      doc.text(`Fecha de emisión: ${fechaEmision}`, 105, 38, { align: 'center' });
      
      // Línea separadora
      doc.setDrawColor(185, 225, 220);
      doc.setLineWidth(0.5);
      doc.line(20, 42, 190, 42);
      
      // Datos del paciente
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.setFont('helvetica', 'bold');
      doc.text('Datos del Paciente', 20, 52);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nombre: ${this.usuario.nombre} ${this.usuario.apellido}`, 20, 60);
      doc.text(`DNI: ${this.usuario.dni}`, 20, 68);
      doc.text(`Edad: ${this.usuario.edad} años`, 20, 76);
      doc.text(`Obra Social: ${this.usuario.obra_social}`, 20, 84);
      
      // Tabla de historia clínica
      const tableData = this.historiaClinica.map(h => [
        new Date(h.fecha).toLocaleDateString('es-AR'),
        `${h.especialista?.nombre || ''} ${h.especialista?.apellido || ''}`,
        h.altura ? `${h.altura} cm` : '-',
        h.peso ? `${h.peso} kg` : '-',
        h.temperatura ? `${h.temperatura}°C` : '-',
        h.presion || '-'
      ]);

      autoTable(doc, {
        startY: 95,
        head: [['Fecha', 'Especialista', 'Altura', 'Peso', 'Temp.', 'Presión']],
        body: tableData,
        theme: 'striped',
        headStyles: { 
          fillColor: [117, 108, 131], // fourth-color
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: { fontSize: 9 }
      });

      // Datos dinámicos
      let currentY = (doc as any).lastAutoTable.finalY + 10;
    
      if (this.historiaClinica.some(h => h.datos_dinamicos && h.datos_dinamicos.length > 0)) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Datos Adicionales:', 20, currentY);
        doc.setFont('helvetica', 'normal');
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

      // Pie de página
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Clínica OnLine - Sistema de Gestión Médica`, 105, 285, { align: 'center' });
      doc.text(`Página 1 de ${pageCount}`, 105, 290, { align: 'center' });

      // Guardar PDF
      doc.save(`historia-clinica-${this.usuario.dni}-${new Date().getTime()}.pdf`);
    };
    
    // Si hay error cargando la imagen, generar PDF sin logo
    logoImg.onerror = () => {
      console.log('Logo no disponible, generando PDF sin logo');
      this.generarPDFSinLogo(doc);
    };
  }

  // Método auxiliar para generar PDF sin logo (fallback)
  private generarPDFSinLogo(doc: jsPDF) {
    // Título - Clínica OnLine
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(117, 108, 131);
    doc.text('Clínica OnLine', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('Historia Clínica', 105, 30, { align: 'center' });
    
    const fechaEmision = new Date().toLocaleDateString('es-AR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha de emisión: ${fechaEmision}`, 105, 38, { align: 'center' });
    
    // Continuar con el resto del documento...
    doc.save(`historia-clinica-${this.usuario.dni}-${new Date().getTime()}.pdf`);
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
