import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../core/services/language.service';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

interface LanguageOption {
  code: string;
  label: string;
  flag: string;
}

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule
  ],
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.scss']
})
export class LanguageSelectorComponent implements OnInit {
  languages: LanguageOption[] = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' }
  ];
  
  currentLanguage: string = 'fr';

  constructor(private languageService: LanguageService) { }

  ngOnInit(): void {
    this.languageService.currentLanguage$.subscribe(lang => {
      this.currentLanguage = lang;
    });
  }

  changeLanguage(lang: string): void {
    if (lang !== this.currentLanguage) {
      this.languageService.setLanguage(lang as 'fr' | 'en');
    }
  }

  get currentLanguageLabel(): string {
    const lang = this.languages.find(l => l.code === this.currentLanguage);
    return lang ? `${lang.flag} ${lang.label}` : '🌐';
  }
}
