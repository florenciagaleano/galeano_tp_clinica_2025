import { TestBed } from '@angular/core/testing';
import { CaptchaPropioDirective } from './captcha-propio.directive';

describe('CaptchaPropioDirective', () => {
  it('should create an instance', () => {
    const directive = new CaptchaPropioDirective(
      TestBed.inject(ElementRef),
      TestBed.inject(Renderer2)
    );
    expect(directive).toBeTruthy();
  });
});
