import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { Chart, BarElement, BarController, CategoryScale, LinearScale, Title, Tooltip, Legend, PieController, ArcElement, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Registrar componentes de Chart.js
Chart.register(
  BarElement,
  BarController,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  PieController,
  ArcElement,
  ChartDataLabels,
  ...registerables
);

interface LogIngreso {
  usuario: string;
  email: string;
  tipo: string;
  fecha: string;
  hora: string;
}

interface TurnoPorEspecialidad {
  especialidad: string;
  cantidad: number;
}

interface TurnoPorDia {
  fecha: string;
  cantidad: number;
}

interface TurnoPorMedico {
  medico: string;
  cantidad: number;
}

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estadisticas.component.html',
  styleUrl: './estadisticas.component.css'
})
export class EstadisticasComponent implements OnInit, AfterViewInit {
  
  loading = false;
  
  // Log de ingresos
  logsIngresos: LogIngreso[] = [];
  
  // Turnos por especialidad
  turnosPorEspecialidad: TurnoPorEspecialidad[] = [];
  
  // Turnos por día
  turnosPorDia: TurnoPorDia[] = [];
  fechaInicioDia = '';
  fechaFinDia = '';
  
  // Turnos por médico
  fechaInicio = '';
  fechaFin = '';
  turnosSolicitadosPorMedico: TurnoPorMedico[] = [];
  turnosFinalizadosPorMedico: TurnoPorMedico[] = [];

  // Charts
  chartEspecialidades: Chart | null = null;
  chartDias: Chart | null = null;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  volver() {
    this.router.navigate(['/home']);
  }

  async ngOnInit() {
    await this.cargarLogsIngresos();
    await this.cargarTurnosPorEspecialidad();
    await this.cargarTurnosPorDia();
    this.setFechasDefault();
  }

  ngAfterViewInit() {
    // Los gráficos se generarán después de cargar los datos
  }

  setFechasDefault() {
    const hoy = new Date();
    const hace30Dias = new Date(hoy);
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    
    this.fechaFin = hoy.toISOString().split('T')[0];
    this.fechaInicio = hace30Dias.toISOString().split('T')[0];
    
    this.cargarTurnosPorMedico();
  }

  async cargarLogsIngresos() {
    try {
      this.loading = true;
      const logs = await this.supabaseService.obtenerLogsIngresos();
      
      this.logsIngresos = logs.map((log: any) => {
        const fecha = new Date(log.fecha_ingreso);
        return {
          usuario: log.usuario_nombre || 'Usuario',
          email: log.usuario_email || '',
          tipo: log.tipo_usuario || '',
          fecha: fecha.toLocaleDateString('es-ES'),
          hora: fecha.toLocaleTimeString('es-ES')
        };
      });
    } catch (error) {
      console.error('Error cargando logs:', error);
    } finally {
      this.loading = false;
    }
  }

  async cargarTurnosPorEspecialidad() {
    try {
      this.loading = true;
      const { data, error } = await this.supabaseService.supabase
        .from('turnos')
        .select('especialidad_id, especialidad:especialidades(nombre)');
      
      if (error) throw error;

      // Agrupar por especialidad
      const agrupado: { [key: string]: number } = {};
      data?.forEach((turno: any) => {
        const especialidad = turno.especialidad?.nombre || 'Sin especialidad';
        agrupado[especialidad] = (agrupado[especialidad] || 0) + 1;
      });

      this.turnosPorEspecialidad = Object.entries(agrupado).map(([especialidad, cantidad]) => ({
        especialidad,
        cantidad
      })).sort((a, b) => b.cantidad - a.cantidad);
      
      // Generar gráfico después de cargar datos
      setTimeout(() => this.generarGraficoEspecialidades(), 100);

    } catch (error) {
      console.error('Error cargando turnos por especialidad:', error);
    } finally {
      this.loading = false;
    }
  }

  async cargarTurnosPorDia() {
    try {
      this.loading = true;
      
      let query = this.supabaseService.supabase
        .from('turnos')
        .select('fecha')
        .order('fecha', { ascending: false });
      
      // Aplicar filtros de fecha si están definidos
      if (this.fechaInicioDia && this.fechaFinDia) {
        query = query.gte('fecha', this.fechaInicioDia).lte('fecha', this.fechaFinDia);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;

      // Agrupar por día
      const agrupado: { [key: string]: number } = {};
      data?.forEach((turno: any) => {
        agrupado[turno.fecha] = (agrupado[turno.fecha] || 0) + 1;
      });

      this.turnosPorDia = Object.entries(agrupado).map(([fecha, cantidad]) => ({
        fecha,
        cantidad
      })).sort((a, b) => b.fecha.localeCompare(a.fecha));
      
      // Si no hay filtro de fecha, mostrar solo últimos 15 días
      if (!this.fechaInicioDia && !this.fechaFinDia) {
        this.turnosPorDia = this.turnosPorDia.slice(0, 15);
      }
      
      // Generar gráfico después de cargar datos
      setTimeout(() => this.generarGraficoDias(), 100);

    } catch (error) {
      console.error('Error cargando turnos por día:', error);
    } finally {
      this.loading = false;
    }
  }

  async cargarTurnosPorMedico() {
    if (!this.fechaInicio || !this.fechaFin) return;

    try {
      this.loading = true;
      
      // Turnos solicitados
      const { data: solicitados, error: errorSolicitados } = await this.supabaseService.supabase
        .from('turnos')
        .select('especialista_id, especialista:especialistas(nombre, apellido)')
        .gte('fecha', this.fechaInicio)
        .lte('fecha', this.fechaFin);
      
      if (errorSolicitados) throw errorSolicitados;

      // Agrupar solicitados
      const agrupadoSolicitados: { [key: string]: number } = {};
      solicitados?.forEach((turno: any) => {
        const medico = turno.especialista 
          ? `${turno.especialista.nombre} ${turno.especialista.apellido}`
          : 'Sin asignar';
        agrupadoSolicitados[medico] = (agrupadoSolicitados[medico] || 0) + 1;
      });

      this.turnosSolicitadosPorMedico = Object.entries(agrupadoSolicitados).map(([medico, cantidad]) => ({
        medico,
        cantidad
      })).sort((a, b) => b.cantidad - a.cantidad);

      // Turnos finalizados
      const { data: finalizados, error: errorFinalizados } = await this.supabaseService.supabase
        .from('turnos')
        .select('especialista_id, especialista:especialistas(nombre, apellido)')
        .eq('estado', 'realizado')
        .gte('fecha', this.fechaInicio)
        .lte('fecha', this.fechaFin);
      
      if (errorFinalizados) throw errorFinalizados;

      // Agrupar finalizados
      const agrupadoFinalizados: { [key: string]: number } = {};
      finalizados?.forEach((turno: any) => {
        const medico = turno.especialista 
          ? `${turno.especialista.nombre} ${turno.especialista.apellido}`
          : 'Sin asignar';
        agrupadoFinalizados[medico] = (agrupadoFinalizados[medico] || 0) + 1;
      });

      this.turnosFinalizadosPorMedico = Object.entries(agrupadoFinalizados).map(([medico, cantidad]) => ({
        medico,
        cantidad
      })).sort((a, b) => b.cantidad - a.cantidad);

    } catch (error) {
      console.error('Error cargando turnos por médico:', error);
    } finally {
      this.loading = false;
    }
  }

  // ========== GENERACIÓN DE GRÁFICOS ==========
  generarGraficoEspecialidades() {
    if (this.turnosPorEspecialidad.length === 0) {
      return;
    }
    
    const canvas = document.getElementById('chartEspecialidades') as HTMLCanvasElement;
    if (!canvas) {
      console.warn('Canvas chartEspecialidades aún no está en el DOM');
      return;
    }

    // Destruir gráfico anterior si existe
    if (this.chartEspecialidades) {
      this.chartEspecialidades.destroy();
    }

    const labels = this.turnosPorEspecialidad.map(t => t.especialidad);
    const data = this.turnosPorEspecialidad.map(t => t.cantidad);
    const colores = ['#9ddcdc', '#b30753', '#ff9d76', '#caffbf', '#e41655', '#bff4ed', '#e67a7a', '#ffd166', '#06ffa5', '#adadad'];

    this.chartEspecialidades = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colores.slice(0, data.length),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: {
              font: { size: 12 },
              color: '#333'
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const porcentaje = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${porcentaje}%)`;
              }
            }
          },
          datalabels: {
            color: '#fff',
            font: { weight: 'bold', size: 14 },
            formatter: (value, context) => {
              const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
              const porcentaje = ((value / total) * 100).toFixed(1);
              return `${porcentaje}%`;
            }
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  generarGraficoDias() {
    if (this.turnosPorDia.length === 0) {
      return;
    }
    
    const canvas = document.getElementById('chartDias') as HTMLCanvasElement;
    if (!canvas) {
      console.warn('Canvas chartDias aún no está en el DOM');
      return;
    }

    // Destruir gráfico anterior si existe
    if (this.chartDias) {
      this.chartDias.destroy();
    }

    const labels = this.turnosPorDia.map(t => {
      const fecha = new Date(t.fecha);
      return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    });
    const data = this.turnosPorDia.map(t => t.cantidad);

    this.chartDias = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Turnos',
          data: data,
          backgroundColor: '#f38181',
          borderColor: '#756c83',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => `Turnos: ${context.parsed.x}`
            }
          },
          datalabels: {
            anchor: 'end',
            align: 'end',
            color: '#333',
            font: { weight: 'bold', size: 12 },
            formatter: (value) => value
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  // ========== DESCARGAS EXCEL ==========
  descargarLogsExcel() {
    const ws = XLSX.utils.json_to_sheet(this.logsIngresos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Logs de Ingreso');
    XLSX.writeFile(wb, `logs_ingresos_${new Date().getTime()}.xlsx`);
  }

  descargarTurnosPorEspecialidadExcel() {
    const ws = XLSX.utils.json_to_sheet(this.turnosPorEspecialidad);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Turnos por Especialidad');
    XLSX.writeFile(wb, `turnos_especialidad_${new Date().getTime()}.xlsx`);
  }

  descargarTurnosPorDiaExcel() {
    const ws = XLSX.utils.json_to_sheet(this.turnosPorDia);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Turnos por Día');
    XLSX.writeFile(wb, `turnos_dia_${new Date().getTime()}.xlsx`);
  }

  descargarTurnosSolicitadosExcel() {
    const ws = XLSX.utils.json_to_sheet(this.turnosSolicitadosPorMedico);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Turnos Solicitados');
    XLSX.writeFile(wb, `turnos_solicitados_${new Date().getTime()}.xlsx`);
  }

  descargarTurnosFinalizadosExcel() {
    const ws = XLSX.utils.json_to_sheet(this.turnosFinalizadosPorMedico);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Turnos Finalizados');
    XLSX.writeFile(wb, `turnos_finalizados_${new Date().getTime()}.xlsx`);
  }

  // ========== DESCARGAS PDF CON GRÁFICOS ==========
  descargarTurnosPorEspecialidadPDF() {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text('Turnos por Especialidad', 15, 20);
    
    // Fecha de emisión
    doc.setFontSize(10);
    const fechaEmision = new Date().toLocaleDateString('es-AR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.text(`Fecha de emisión: ${fechaEmision}`, 15, 28);
    
    // Capturar gráfico
    const canvas = document.getElementById('chartEspecialidades') as HTMLCanvasElement;
    if (canvas) {
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 15, 35, 180, 100);
    }
    
    // Agregar tabla de datos
    let yPos = canvas ? 145 : 35;
    doc.setFontSize(12);
    doc.text('Detalle:', 15, yPos);
    
    yPos += 7;
    doc.setFontSize(10);
    this.turnosPorEspecialidad.forEach(item => {
      doc.text(`${item.especialidad}: ${item.cantidad} turnos`, 20, yPos);
      yPos += 6;
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
    });
    
    doc.save(`turnos_especialidad_${new Date().getTime()}.pdf`);
  }

  descargarTurnosPorDiaPDF() {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text('Turnos por Día', 15, 20);
    
    // Fecha de emisión
    doc.setFontSize(10);
    const fechaEmision = new Date().toLocaleDateString('es-AR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.text(`Fecha de emisión: ${fechaEmision}`, 15, 28);
    
    // Rango de fechas si está filtrado
    if (this.fechaInicioDia && this.fechaFinDia) {
      doc.text(`Período: ${this.fechaInicioDia} a ${this.fechaFinDia}`, 15, 34);
    }
    
    // Capturar gráfico
    const canvas = document.getElementById('chartDias') as HTMLCanvasElement;
    if (canvas) {
      const imgData = canvas.toDataURL('image/png');
      const yPosChart = this.fechaInicioDia && this.fechaFinDia ? 40 : 35;
      doc.addImage(imgData, 'PNG', 15, yPosChart, 180, 120);
    }
    
    // Agregar tabla de datos
    let yPos = canvas ? 170 : 35;
    if (this.fechaInicioDia && this.fechaFinDia) {
      yPos += 5;
    }
    
    doc.setFontSize(12);
    doc.text('Detalle:', 15, yPos);
    
    yPos += 7;
    doc.setFontSize(10);
    this.turnosPorDia.forEach(item => {
      doc.text(`${item.fecha}: ${item.cantidad} turnos`, 20, yPos);
      yPos += 6;
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
    });
    
    doc.save(`turnos_dia_${new Date().getTime()}.pdf`);
  }
}
