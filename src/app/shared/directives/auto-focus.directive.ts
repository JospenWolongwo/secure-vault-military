import { AfterViewInit, Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]',
  standalone: true,
})
export class AutoFocusDirective implements AfterViewInit, OnChanges {
  @Input() appAutoFocus = true;
  @Input() focusDelay = 0;
  @Input() focusOnEnable = false;
  @Input() focusOnNavigation = false;

  private element: HTMLElement;
  private hasFocused = false;

  constructor(private elementRef: ElementRef) {
    this.element = this.elementRef.nativeElement;
  }

  ngAfterViewInit(): void {
    if (this.appAutoFocus) {
      this.focus();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['appAutoFocus'] && this.appAutoFocus) ||
      (changes['focusOnEnable'] && this.focusOnEnable)
    ) {
      this.focus();
    }
  }

  private focus(): void {
    // Use a small timeout to ensure the element is rendered
    setTimeout(() => {
      try {
        if (this.element && 'focus' in this.element) {
          this.element.focus();
          this.hasFocused = true;

          // For select elements, also open the dropdown
          if (this.element.tagName === 'SELECT') {
            this.element.click();
          }
        }
      } catch (e) {
        console.warn('Could not focus element:', e);
      }
    }, this.focusDelay);
  }
}
