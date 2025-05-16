import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
  standalone: true,
})
export class ClickOutsideDirective {
  @Output() clickOutside = new EventEmitter<MouseEvent>();

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event', '$event.target'])
  public onClick(event: MouseEvent, targetElement: HTMLElement): void {
    if (!targetElement) {
      return;
    }

    const clickedInside = this.elementRef.nativeElement.contains(targetElement);
    if (!clickedInside) {
      this.clickOutside.emit(event);
    }
  }

  @HostListener('document:touchstart', ['$event', '$event.target'])
  public onTouchStart(event: TouchEvent, targetElement: HTMLElement): void {
    if (!targetElement) {
      return;
    }

    const touchedInside = this.elementRef.nativeElement.contains(targetElement);
    if (!touchedInside) {
      // Create a custom mouse event from the touch event
      const mouseEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
      });
      this.clickOutside.emit(mouseEvent);
    }
  }
}
