import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private currentLanguageSubject: BehaviorSubject<string>;
  public currentLanguage$: Observable<string>;

  constructor(private translate: TranslateService) {
    // Set the default language to French
    const defaultLanguage = 'fr';
    this.translate.setDefaultLang(defaultLanguage);
    
    // Try to get the language from localStorage, otherwise use the browser language
    const savedLanguage = localStorage.getItem('userLanguage') || 
                         this.translate.getBrowserLang() || 
                         defaultLanguage;
    
    // Ensure the language is either 'fr' or 'en'
    const initialLanguage = ['fr', 'en'].includes(savedLanguage) ? savedLanguage : defaultLanguage;
    
    this.currentLanguageSubject = new BehaviorSubject<string>(initialLanguage);
    this.currentLanguage$ = this.currentLanguageSubject.asObservable();
    
    this.setLanguage(initialLanguage);
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
   */
  public setLanguage(language: 'fr' | 'en'): void {
    if (language === 'fr' || language === 'en') {
      this.translate.use(language);
      this.currentLanguageSubject.next(language);
      localStorage.setItem('userLanguage', language);
      document.documentElement.lang = language;
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
