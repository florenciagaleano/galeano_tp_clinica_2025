import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appAnimacionEntrada]',
  standalone: true
})
export class AnimacionEntradaDirective implements OnInit {
  @Input() appAnimacionEntrada: 'fade' | 'slide' | 'zoom' = 'fade';
  @Input() duracion: number = 500; // en milisegundos

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    this.renderer.setStyle(this.el.nativeElement, 'opacity', '0');
    
    switch (this.appAnimacionEntrada) {
      case 'slide':
        this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateY(-20px)');
        break;
      case 'zoom':
        this.renderer.setStyle(this.el.nativeElement, 'transform', 'scale(0.8)');
        break;
      default:
        break;
    }
    
    this.renderer.setStyle(this.el.nativeElement, 'transition', `all ${this.duracion}ms ease-out`);
    
    setTimeout(() => {
      this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
      this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateY(0) scale(1)');
    }, 50);
  }
}
