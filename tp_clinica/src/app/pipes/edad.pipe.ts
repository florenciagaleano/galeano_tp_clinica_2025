import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'edad',
  standalone: true
})
export class EdadPipe implements PipeTransform {
  transform(fechaNacimiento: string | Date | number): string {
    if (!fechaNacimiento) return '';
    
    let fecha: Date;
    
    if (typeof fechaNacimiento === 'number') {
      // Si es un número (edad directa)
      return `${fechaNacimiento} años`;
    } else if (fechaNacimiento instanceof Date) {
      fecha = fechaNacimiento;
    } else {
      fecha = new Date(fechaNacimiento);
    }
    
    const hoy = new Date();
    let edad = hoy.getFullYear() - fecha.getFullYear();
    const mes = hoy.getMonth() - fecha.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
      edad--;
    }
    
    return `${edad} años`;
  }
}
