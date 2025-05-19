import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

interface Language {
  code: string;
  name: string;
  flag: string;
}

@Component({
  selector: 'app-language-switcher',
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule
  ],
  host: {
    '[class.auth]': 'isAuth'
  }
})
export class LanguageSwitcherComponent implements OnInit {
  @Input() isAuth = false; // Set to true if used on auth pages
  currentLang: string;
  languages: Language[] = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
  ];

  constructor(private translate: TranslateService) {
    this.currentLang = this.translate.currentLang || this.translate.getDefaultLang() || 'fr';
  }

  ngOnInit(): void {
    // Subscribe to language changes
    this.translate.onLangChange.subscribe(event => {
      this.currentLang = event.lang;
    });
  }

  /**
   * Switch the application language
   * @param langCode language code (e.g. 'en', 'fr')
   */
  switchLanguage(langCode: string): void {
    if (this.currentLang !== langCode) {
      this.translate.use(langCode);
      // Save the selected language in localStorage for persistence
      localStorage.setItem('preferredLanguage', langCode);
    }
  }

  /**
   * Get the current language object
   */
  getCurrentLanguage(): Language {
    return this.languages.find(lang => lang.code === this.currentLang) || this.languages[0];
  }
}
