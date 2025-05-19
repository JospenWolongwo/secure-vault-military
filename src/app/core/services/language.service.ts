import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private currentLanguageSubject: BehaviorSubject<string>;
  public currentLanguage$: Observable<string>;
  private translate = inject(TranslateService);
  private isInitialized = false;

  constructor() {
    // Set the default language to French
    const defaultLanguage = 'fr';
    
    // Initialize with default language first
    this.currentLanguageSubject = new BehaviorSubject<string>(defaultLanguage);
    this.currentLanguage$ = this.currentLanguageSubject.asObservable();
    
    // Initialize the service
    this.initialize();
  }
  
  private initialize(): void {
    if (this.isInitialized) return;
    
    // Set default language
    this.translate.setDefaultLang('fr');
    
    // Try to get the language from localStorage, otherwise use the browser language
    const savedLanguage = localStorage.getItem('userLanguage');
    const browserLang = this.translate.getBrowserLang();
    const initialLanguage = this.getValidLanguage(savedLanguage || browserLang || 'fr');
    
    // Set the language
    this.setLanguage(initialLanguage, true);
    this.isInitialized = true;
  }
  
  private getValidLanguage(lang: string): 'fr' | 'en' {
    return ['fr', 'en'].includes(lang) ? lang as 'fr' | 'en' : 'fr';
  }

  /**
   * Gets the current language
   */
  public get currentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  /**
   * Sets the application language
   * @param language The language code ('fr' or 'en')
   * @param force Force the language change even if it's the same as the current language
   */
  public setLanguage(language: 'fr' | 'en', force: boolean = false): void {
    if ((language === 'fr' || language === 'en') && (force || language !== this.currentLanguageSubject.value)) {
      // Update the language in localStorage
      localStorage.setItem('userLanguage', language);
      
      // Update the document language
      document.documentElement.lang = language;
      
      // Update the current language subject
      this.currentLanguageSubject.next(language);
      
      // Tell the translate service to use the new language
      this.translate.use(language).subscribe({
        next: () => {
          console.log(`Language changed to ${language}`);
        },
        error: (err) => {
          console.error(`Failed to change language to ${language}:`, err);
        }
      });
    }
  }

  /**
   * Toggles between French and English
   */
  public toggleLanguage(): void {
    const newLang = this.currentLanguage === 'fr' ? 'en' : 'fr';
    this.setLanguage(newLang as 'fr' | 'en');
  }

  /**
   * Translates a key or an array of keys
   * @param key The translation key or array of keys
   * @param interpolateParams Optional parameters for interpolation
   */
  public translateKey(key: string | string[], interpolateParams?: Record<string, unknown>): string {
    return this.translate.instant(key, interpolateParams);
  }

  /**
   * Gets the translated text as an observable
   * @param key The translation key
   * @param interpolateParams Optional parameters for interpolation
   */
  public getTranslation(key: string, interpolateParams?: Record<string, unknown>): Observable<string> {
    return this.translate.get(key, interpolateParams);
  }
}
