import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appFormatoDni]',
  standalone: true
})
export class FormatoDniDirective {

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('input', ['$event'])
  onInput(event: any) {
    let value = event.target.value.replace(/\D/g, ''); // Solo números
    
    if (value.length > 8) {
      value = value.substring(0, 8);
    }
    
    // Formatear con puntos: XX.XXX.XXX
    if (value.length > 6) {
      value = value.substring(0, 2) + '.' + value.substring(2, 5) + '.' + value.substring(5);
    } else if (value.length > 2) {
      value = value.substring(0, 2) + '.' + value.substring(2);
    }
    
    this.renderer.setProperty(this.el.nativeElement, 'value', value);
  }

  @HostListener('blur')
  onBlur() {
    const value = this.el.nativeElement.value.replace(/\D/g, '');
    if (value.length < 7) {
      this.renderer.addClass(this.el.nativeElement, 'is-invalid');
    } else {
      this.renderer.removeClass(this.el.nativeElement, 'is-invalid');
    }
  }
}
