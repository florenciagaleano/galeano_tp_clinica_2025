import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

// Declarar la interfaz global de reCAPTCHA
declare global {
  interface Window {
    grecaptcha: any;
    onRecaptchaLoad: () => void;
  }
}

@Component({
  selector: 'app-captcha',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './captcha.component.html',
  styleUrl: './captcha.component.css'
})
export class CaptchaComponent implements OnInit, OnDestroy {
  @Input() enabled: boolean = true;
  @Output() captchaValidated = new EventEmitter<boolean>();

  // Site Key de Google reCAPTCHA v2
  siteKey: string = '6LdKKg0sAAAAAMfPxiYcpwfjVSYDqeePiqCYgNBS';
  
  captchaToken: string | null = null;
  isVerified: boolean = false;
  isLoading: boolean = true;
  errorMessage: string = '';
  widgetId: number | null = null;

  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (this.isBrowser && this.enabled) {
      this.loadRecaptchaScript();
    } else if (!this.enabled) {
      // Si el captcha está deshabilitado, emitir validación automática
      this.isVerified = true;
      this.isLoading = false;
      this.captchaValidated.emit(true);
    }
  }

  loadRecaptchaScript() {
    // Verificar si el script ya está cargado
    if (typeof window.grecaptcha !== 'undefined') {
      this.renderRecaptcha();
      return;
    }

    // Cargar el script de reCAPTCHA
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
    script.async = true;
    script.defer = true;

    // Callback cuando se carga el script
    window.onRecaptchaLoad = () => {
      this.renderRecaptcha();
    };

    document.head.appendChild(script);
  }

  renderRecaptcha() {
    if (!this.isBrowser || typeof window.grecaptcha === 'undefined') {
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    try {
      // Esperar un momento para asegurar que el contenedor esté en el DOM
      setTimeout(() => {
        const container = document.getElementById('recaptcha-container');
        
        if (container && window.grecaptcha && window.grecaptcha.render) {
          this.widgetId = window.grecaptcha.render('recaptcha-container', {
            'sitekey': this.siteKey,
            'callback': (token: string) => this.onCaptchaSuccess(token),
            'expired-callback': () => this.onCaptchaExpired(),
            'error-callback': () => this.onCaptchaError(),
            'theme': 'light',
            'size': 'normal'
          });
          
          // Asegurar que el estado se actualiza
          this.isLoading = false;
          this.cdr.detectChanges();
        } else {
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      }, 100);
    } catch (error) {
      console.error('Error rendering reCAPTCHA:', error);
      this.errorMessage = 'Error al cargar el captcha';
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  onCaptchaSuccess(token: string) {
    this.captchaToken = token;
    this.isVerified = true;
    this.errorMessage = '';
    this.captchaValidated.emit(true);
    console.log('reCAPTCHA validado exitosamente');
  }

  onCaptchaExpired() {
    this.captchaToken = null;
    this.isVerified = false;
    this.errorMessage = 'El captcha ha expirado. Por favor, verifica nuevamente.';
    this.captchaValidated.emit(false);
  }

  onCaptchaError() {
    this.captchaToken = null;
    this.isVerified = false;
    this.errorMessage = 'Error al validar el captcha. Por favor, intenta nuevamente.';
    this.captchaValidated.emit(false);
  }

  resetCaptcha() {
    if (this.isBrowser && typeof window.grecaptcha !== 'undefined' && this.widgetId !== null) {
      window.grecaptcha.reset(this.widgetId);
      this.captchaToken = null;
      this.isVerified = false;
      this.errorMessage = '';
      this.captchaValidated.emit(false);
    }
  }

  getCaptchaState() {
    return {
      isValid: this.isVerified,
      token: this.captchaToken
    };
  }

  ngOnDestroy() {
    // Limpiar el widget cuando se destruye el componente
    if (this.isBrowser && typeof window.grecaptcha !== 'undefined' && this.widgetId !== null) {
      try {
        window.grecaptcha.reset(this.widgetId);
      } catch (error) {
        console.error('Error cleaning up reCAPTCHA:', error);
      }
    }
  }
}
