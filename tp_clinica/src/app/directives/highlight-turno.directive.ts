import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';
import { EstadoTurno } from '../models/interfaces';

@Directive({
  selector: '[appHighlightTurno]',
  standalone: true
})
export class HighlightTurnoDirective implements OnInit {
  @Input() appHighlightTurno!: EstadoTurno | string;

  private coloresEstado: { [key: string]: { bg: string, border: string } } = {
    'pendiente': { bg: '#fff3cd', border: '#ffc107' },
    'aceptado': { bg: '#d1ecf1', border: '#17a2b8' },
    'rechazado': { bg: '#f8d7da', border: '#dc3545' },
    'cancelado': { bg: '#e2e3e5', border: '#6c757d' },
    'realizado': { bg: '#d4edda', border: '#28a745' }
  };

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    if (!this.appHighlightTurno) return;
    
    const estado = this.appHighlightTurno.toLowerCase();
    const colores = this.coloresEstado[estado];
    
    if (colores) {
      this.renderer.setStyle(this.el.nativeElement, 'background-color', colores.bg);
      this.renderer.setStyle(this.el.nativeElement, 'border-left', `4px solid ${colores.border}`);
      this.renderer.setStyle(this.el.nativeElement, 'padding', '10px');
      this.renderer.setStyle(this.el.nativeElement, 'border-radius', '8px');
      this.renderer.setStyle(this.el.nativeElement, 'margin-bottom', '10px');
      this.renderer.setStyle(this.el.nativeElement, 'transition', 'all 0.3s ease');
    }
  }
}
