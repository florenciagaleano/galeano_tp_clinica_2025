import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Especialidad, AuthResponse } from '../models/interfaces';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EspecialidadesService {
  
  private especialidadesSubject = new BehaviorSubject<Especialidad[]>([]);
  public especialidades$ = this.especialidadesSubject.asObservable();

  constructor(private supabaseService: SupabaseService) {
    this.cargarEspecialidades();
  }

  async cargarEspecialidades(): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('especialidades')
        .select('*')
        .eq('activa', true)
        .order('nombre');

      if (error) {
        console.error('Error al cargar especialidades:', error);
        return;
      }

      this.especialidadesSubject.next(data || []);
    } catch (error) {
      console.error('Error al cargar especialidades:', error);
    }
  }

  async obtenerEspecialidades(): Promise<Especialidad[]> {
    return this.especialidadesSubject.value;
  }

  async obtenerEspecialidadPorId(id: string): Promise<Especialidad | null> {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('especialidades')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error al obtener especialidad:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error al obtener especialidad:', error);
      return null;
    }
  }

  async agregarEspecialidad(especialidad: Partial<Especialidad>): Promise<AuthResponse> {
    try {
      // Verificar si ya existe una especialidad con el mismo nombre
      const existe = await this.verificarEspecialidadExiste(especialidad.nombre!);
      
      if (existe) {
        return {
          success: false,
          message: 'Ya existe una especialidad con ese nombre'
        };
      }

      const { data, error } = await this.supabaseService.supabase
        .from('especialidades')
        .insert({
          nombre: especialidad.nombre,
          descripcion: especialidad.descripcion || '',
          activa: true
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          message: `Error al agregar especialidad: ${error.message}`
        };
      }

      // Actualizar la lista local
      await this.cargarEspecialidades();

      return {
        success: true,
        message: 'Especialidad agregada exitosamente',
        data
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  async actualizarEspecialidad(id: string, especialidad: Partial<Especialidad>): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('especialidades')
        .update({
          nombre: especialidad.nombre,
          descripcion: especialidad.descripcion,
          activa: especialidad.activa
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          message: `Error al actualizar especialidad: ${error.message}`
        };
      }

      // Actualizar la lista local
      await this.cargarEspecialidades();

      return {
        success: true,
        message: 'Especialidad actualizada exitosamente',
        data
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  async desactivarEspecialidad(id: string): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('especialidades')
        .update({ activa: false })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          message: `Error al desactivar especialidad: ${error.message}`
        };
      }

      // Actualizar la lista local
      await this.cargarEspecialidades();

      return {
        success: true,
        message: 'Especialidad desactivada exitosamente',
        data
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  async activarEspecialidad(id: string): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('especialidades')
        .update({ activa: true })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          message: `Error al activar especialidad: ${error.message}`
        };
      }

      // Actualizar la lista local
      await this.cargarEspecialidades();

      return {
        success: true,
        message: 'Especialidad activada exitosamente',
        data
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
  }

  async verificarEspecialidadExiste(nombre: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('especialidades')
        .select('id')
        .ilike('nombre', nombre.trim())
        .single();

      return !!data && !error;
    } catch (error) {
      return false;
    }
  }

  async buscarEspecialidades(termino: string): Promise<Especialidad[]> {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('especialidades')
        .select('*')
        .eq('activa', true)
        .ilike('nombre', `%${termino}%`)
        .order('nombre');

      if (error) {
        console.error('Error al buscar especialidades:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error al buscar especialidades:', error);
      return [];
    }
  }

  // Método para obtener especialistas por especialidad
  async obtenerEspecialistasPorEspecialidad(especialidadId: string) {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('especialista_especialidades')
        .select(`
          especialista_id,
          especialistas (
            id,
            nombre,
            apellido,
            email,
            imagen_perfil,
            activo,
            aprobado_por_admin
          )
        `)
        .eq('especialidad_id', especialidadId);

      if (error) {
        console.error('Error al obtener especialistas:', error);
        return [];
      }

      // Filtrar solo especialistas activos y aprobados
      const especialistasActivos = data
        ?.filter((item: any) => 
          item.especialistas?.activo && 
          item.especialistas?.aprobado_por_admin
        )
        .map((item: any) => item.especialistas) || [];

      return especialistasActivos;
    } catch (error) {
      console.error('Error al obtener especialistas:', error);
      return [];
    }
  }

  // Método para obtener estadísticas de especialidades
  async obtenerEstadisticasEspecialidades() {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('especialidades')
        .select(`
          id,
          nombre,
          especialista_especialidades (
            especialista_id,
            especialistas (
              activo,
              aprobado_por_admin
            )
          )
        `);

      if (error) {
        console.error('Error al obtener estadísticas:', error);
        return [];
      }

      return data?.map((especialidad: any) => ({
        id: especialidad.id,
        nombre: especialidad.nombre,
        totalEspecialistas: especialidad.especialista_especialidades?.length || 0,
        especialistasActivos: especialidad.especialista_especialidades?.filter(
          (ee: any) => ee.especialistas?.activo && ee.especialistas?.aprobado_por_admin
        ).length || 0
      })) || [];

    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return [];
    }
  }
}