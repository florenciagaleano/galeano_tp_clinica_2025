import { Directive, ElementRef, EventEmitter, Input, OnInit, Output, Renderer2, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appCaptchaPropio]',
  standalone: true
})
export class CaptchaPropioDirective implements OnInit, OnDestroy {
  @Input() captchaEnabled: boolean = true;
  @Output() captchaValidated = new EventEmitter<boolean>();

  private num1: number = 0;
  private num2: number = 0;
  private operacion: string = '+';
  private respuestaCorrecta: number = 0;
  private container: HTMLDivElement | null = null;
  private inputRespuesta: HTMLInputElement | null = null;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    if (this.captchaEnabled) {
      this.crearCaptcha();
    } else {
      // Si está deshabilitado, emitir validación automática
      this.captchaValidated.emit(true);
    }
  }

  private crearCaptcha() {
    // Crear contenedor principal
    this.container = this.renderer.createElement('div');
    this.renderer.addClass(this.container, 'captcha-propio-container');
    
    // Generar operación matemática
    this.generarOperacion();
    
    // Crear pregunta
    const pregunta = this.renderer.createElement('div');
    this.renderer.addClass(pregunta, 'captcha-pregunta');
    const textoPregunta = this.renderer.createText(`🔢 ¿Cuánto es ${this.num1} ${this.operacion} ${this.num2}?`);
    this.renderer.appendChild(pregunta, textoPregunta);
    
    // Crear input para respuesta
    this.inputRespuesta = this.renderer.createElement('input');
    this.renderer.setAttribute(this.inputRespuesta, 'type', 'number');
    this.renderer.setAttribute(this.inputRespuesta, 'placeholder', 'Ingrese el resultado');
    this.renderer.addClass(this.inputRespuesta, 'captcha-input');
    
    // Listener para validar al cambiar
    this.renderer.listen(this.inputRespuesta, 'input', () => {
      this.validarRespuesta();
    });
    
    // Crear botón de refrescar
    const btnRefrescar = this.renderer.createElement('button');
    this.renderer.setAttribute(btnRefrescar, 'type', 'button');
    this.renderer.addClass(btnRefrescar, 'captcha-btn-refresh');
    const iconoRefresh = this.renderer.createText('🔄');
    this.renderer.appendChild(btnRefrescar, iconoRefresh);
    
    this.renderer.listen(btnRefrescar, 'click', () => {
      this.refrescarCaptcha();
    });
    
    // Crear mensaje de estado
    const mensaje = this.renderer.createElement('div');
    this.renderer.addClass(mensaje, 'captcha-mensaje');
    this.renderer.setAttribute(mensaje, 'id', 'captcha-mensaje');
    
    // Ensamblar elementos
    this.renderer.appendChild(this.container, pregunta);
    
    const inputContainer = this.renderer.createElement('div');
    this.renderer.addClass(inputContainer, 'captcha-input-container');
    this.renderer.appendChild(inputContainer, this.inputRespuesta);
    this.renderer.appendChild(inputContainer, btnRefrescar);
    this.renderer.appendChild(this.container, inputContainer);
    
    this.renderer.appendChild(this.container, mensaje);
    
    // Agregar estilos
    this.agregarEstilos();
    
    // Insertar en el elemento host
    this.renderer.appendChild(this.el.nativeElement, this.container);
  }

  private generarOperacion() {
    // Generar números aleatorios
    this.num1 = Math.floor(Math.random() * 10) + 1; // 1-10
    this.num2 = Math.floor(Math.random() * 10) + 1; // 1-10
    
    // Elegir operación aleatoria
    const operaciones = ['+', '-', '*'];
    this.operacion = operaciones[Math.floor(Math.random() * operaciones.length)];
    
    // Calcular respuesta correcta
    switch (this.operacion) {
      case '+':
        this.respuestaCorrecta = this.num1 + this.num2;
        break;
      case '-':
        // Asegurar que el resultado no sea negativo
        if (this.num1 < this.num2) {
          [this.num1, this.num2] = [this.num2, this.num1];
        }
        this.respuestaCorrecta = this.num1 - this.num2;
        break;
      case '*':
        // Usar números más pequeños para multiplicación
        this.num1 = Math.floor(Math.random() * 5) + 1;
        this.num2 = Math.floor(Math.random() * 5) + 1;
        this.respuestaCorrecta = this.num1 * this.num2;
        break;
    }
  }

  private validarRespuesta() {
    if (!this.inputRespuesta) return;
    
    const respuestaUsuario = parseInt(this.inputRespuesta.value);
    const mensajeElement = this.container?.querySelector('#captcha-mensaje');
    
    if (isNaN(respuestaUsuario)) {
      if (mensajeElement) {
        this.renderer.setProperty(mensajeElement, 'textContent', '');
        this.renderer.removeClass(mensajeElement, 'captcha-correcto');
        this.renderer.removeClass(mensajeElement, 'captcha-incorrecto');
      }
      this.captchaValidated.emit(false);
      return;
    }
    
    if (respuestaUsuario === this.respuestaCorrecta) {
      if (mensajeElement) {
        this.renderer.setProperty(mensajeElement, 'textContent', '✓ ¡Correcto!');
        this.renderer.addClass(mensajeElement, 'captcha-correcto');
        this.renderer.removeClass(mensajeElement, 'captcha-incorrecto');
      }
      this.captchaValidated.emit(true);
    } else {
      if (mensajeElement) {
        this.renderer.setProperty(mensajeElement, 'textContent', '✗ Incorrecto, intenta de nuevo');
        this.renderer.addClass(mensajeElement, 'captcha-incorrecto');
        this.renderer.removeClass(mensajeElement, 'captcha-correcto');
      }
      this.captchaValidated.emit(false);
    }
  }

  private refrescarCaptcha() {
    // Generar nueva operación
    this.generarOperacion();
    
    // Actualizar pregunta
    const preguntaElement = this.container?.querySelector('.captcha-pregunta');
    if (preguntaElement) {
      this.renderer.setProperty(preguntaElement, 'textContent', `🔢 ¿Cuánto es ${this.num1} ${this.operacion} ${this.num2}?`);
    }
    
    // Limpiar input
    if (this.inputRespuesta) {
      this.renderer.setProperty(this.inputRespuesta, 'value', '');
    }
    
    // Limpiar mensaje
    const mensajeElement = this.container?.querySelector('#captcha-mensaje');
    if (mensajeElement) {
      this.renderer.setProperty(mensajeElement, 'textContent', '');
      this.renderer.removeClass(mensajeElement, 'captcha-correcto');
      this.renderer.removeClass(mensajeElement, 'captcha-incorrecto');
    }
    
    this.captchaValidated.emit(false);
  }

  private agregarEstilos() {
    const style = this.renderer.createElement('style');
    const css = `
      .captcha-propio-container {
        background: linear-gradient(135deg, #b9e1dc 0%, #fbfbfb 100%);
        border: 2px solid #756c83;
        border-radius: 8px;
        padding: 15px;
        margin: 15px 0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      
      .captcha-pregunta {
        font-size: 18px;
        font-weight: bold;
        color: #756c83;
        margin-bottom: 12px;
        text-align: center;
      }
      
      .captcha-input-container {
        display: flex;
        gap: 10px;
        align-items: center;
        justify-content: center;
      }
      
      .captcha-input {
        padding: 10px;
        border: 2px solid #756c83;
        border-radius: 5px;
        font-size: 16px;
        width: 150px;
        text-align: center;
        outline: none;
        transition: all 0.3s ease;
      }
      
      .captcha-input:focus {
        border-color: #f38181;
        box-shadow: 0 0 5px rgba(243, 129, 129, 0.5);
      }
      
      .captcha-btn-refresh {
        padding: 10px 15px;
        background: #f38181;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 18px;
        transition: all 0.3s ease;
      }
      
      .captcha-btn-refresh:hover {
        background: #756c83;
        transform: rotate(180deg);
      }
      
      .captcha-mensaje {
        margin-top: 10px;
        text-align: center;
        font-weight: bold;
        font-size: 14px;
        min-height: 20px;
      }
      
      .captcha-correcto {
        color: #28a745;
      }
      
      .captcha-incorrecto {
        color: #dc3545;
      }
    `;
    
    this.renderer.setProperty(style, 'textContent', css);
    this.renderer.appendChild(document.head, style);
  }

  ngOnDestroy() {
    // Limpiar el contenedor al destruir
    if (this.container) {
      this.renderer.removeChild(this.el.nativeElement, this.container);
    }
  }
}
