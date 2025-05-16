import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeStyle, SafeScript, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';

type SafeType = 'html' | 'style' | 'script' | 'url' | 'resourceUrl';

@Pipe({
  name: 'safe',
  standalone: true,
})
export class SafeHtmlPipe implements PipeTransform {
  constructor(protected sanitizer: DomSanitizer) {}

  public transform(
    value: string,
    type: SafeType = 'html'
  ): SafeHtml | SafeStyle | SafeScript | SafeUrl | SafeResourceUrl | string | null {
    if (value === null || value === undefined) {
      return '';
    }

    switch (type) {
      case 'html':
        return this.sanitizer.bypassSecurityTrustHtml(value);
      case 'style':
        return this.sanitizer.bypassSecurityTrustStyle(value);
      case 'script':
        return this.sanitizer.bypassSecurityTrustScript(value);
      case 'url':
        return this.sanitizer.bypassSecurityTrustUrl(value);
      case 'resourceUrl':
        return this.sanitizer.bypassSecurityTrustResourceUrl(value);
      default:
        return this.sanitizer.sanitize(SecurityContext.HTML, value) || '';
    }
  }
}
