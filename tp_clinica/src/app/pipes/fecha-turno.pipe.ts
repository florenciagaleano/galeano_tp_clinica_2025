import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fechaTurno',
  standalone: true
})
export class FechaTurnoPipe implements PipeTransform {
  transform(fecha: string | Date, formato: 'corta' | 'larga' | 'completa' = 'corta'): string {
    if (!fecha) return '';
    
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    
    if (isNaN(date.getTime())) return '';
    
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const dia = date.getDate();
    const mes = date.getMonth();
    const anio = date.getFullYear();
    const diaSemana = date.getDay();
    
    switch (formato) {
      case 'corta':
        return `${dia.toString().padStart(2, '0')}/${(mes + 1).toString().padStart(2, '0')}/${anio}`;
      case 'larga':
        return `${dia} de ${meses[mes]} de ${anio}`;
      case 'completa':
        return `${dias[diaSemana]}, ${dia} de ${meses[mes]} de ${anio}`;
      default:
        return `${dia}/${mes + 1}/${anio}`;
    }
  }
}
