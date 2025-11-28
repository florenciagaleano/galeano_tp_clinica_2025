import { Pipe, PipeTransform } from '@angular/core';
import { EstadoTurno } from '../models/interfaces';

@Pipe({
  name: 'estadoTurno',
  standalone: true
})
export class EstadoTurnoPipe implements PipeTransform {
  transform(estado: EstadoTurno | string): string {
    if (!estado) return '';
    
    const estadosMap: { [key: string]: string } = {
      'pendiente': '⏳ Pendiente',
      'aceptado': '✅ Aceptado',
      'rechazado': '❌ Rechazado',
      'cancelado': '🚫 Cancelado',
      'realizado': '✔️ Realizado'
    };
    
    return estadosMap[estado.toLowerCase()] || estado;
  }
}
