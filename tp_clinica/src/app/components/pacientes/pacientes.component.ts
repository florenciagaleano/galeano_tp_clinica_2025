import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-pacientes',
  imports: [CommonModule],
  templateUrl: './pacientes.component.html',
  styleUrl: './pacientes.component.css'
})
export class PacientesComponent implements OnInit {
  pacientes: any[] = [];
  historiaClinica: any[] = [];
  pacienteSeleccionado: any = null;
  mostrarHistoria = false;
  cargando = false;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  volver() {
    this.router.navigate(['/home']);
  }

  async ngOnInit() {
    await this.cargarPacientesAtendidos();
  }

  async cargarPacientesAtendidos() {
    try {
      this.cargando = true;
      const { data: { user } } = await this.supabaseService.supabase.auth.getUser();
      
      if (!user?.email) return;

      // Obtener el especialista
      const { data: especialista } = await this.supabaseService.supabase
        .from('especialistas')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!especialista) return;

      // Obtener pacientes que este especialista atendió al menos 1 vez
      const { data: turnos } = await this.supabaseService.supabase
        .from('turnos')
        .select(`
          paciente_id,
          fecha,
          hora,
          estado,
          paciente:paciente_id(*)
        `)
        .eq('especialista_id', especialista.id)
        .eq('estado', 'realizado')
        .order('fecha', { ascending: false })
        .order('hora', { ascending: false });

      // Agrupar turnos por paciente y obtener últimos 3
      const pacientesMap = new Map();
      turnos?.forEach((t: any) => {
        if (t.paciente) {
          if (!pacientesMap.has(t.paciente_id)) {
            pacientesMap.set(t.paciente_id, {
              ...t.paciente,
              ultimos_turnos: []
            });
          }
          
          const pacienteData = pacientesMap.get(t.paciente_id);
          if (pacienteData.ultimos_turnos.length < 3) {
            pacienteData.ultimos_turnos.push({
              fecha: t.fecha,
              hora: t.hora,
              estado: t.estado
            });
          }
        }
      });

      this.pacientes = Array.from(pacientesMap.values());
    } catch (error) {
      console.error('Error cargando pacientes:', error);
    } finally {
      this.cargando = false;
    }
  }

  async verHistoriaClinica(paciente: any) {
    this.pacienteSeleccionado = paciente;
    const data = await this.supabaseService.obtenerHistoriaClinicaPaciente(paciente.id);
    
    // Parsear datos_dinamicos si viene como string
    this.historiaClinica = data.map((historia: any) => ({
      ...historia,
      datos_dinamicos: typeof historia.datos_dinamicos === 'string' 
        ? JSON.parse(historia.datos_dinamicos) 
        : historia.datos_dinamicos
    }));
    
    this.mostrarHistoria = true;
  }

  cerrarHistoria() {
    this.mostrarHistoria = false;
    this.pacienteSeleccionado = null;
    this.historiaClinica = [];
  }
}
