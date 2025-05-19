import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-auth-language-switcher',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    TranslateModule
  ],
  template: `
    <div class="auth-language-switcher">
      <button mat-button class="language-button" [matMenuTriggerFor]="languageMenu">
        <div class="button-content">
          <span class="flag">{{ getCurrentLanguage().flag }}</span>
          <span class="lang-name">{{ getCurrentLanguage().name }}</span>
          <mat-icon class="dropdown-icon">keyboard_arrow_down</mat-icon>
        </div>
      </button>

      <mat-menu #languageMenu="matMenu" class="language-menu">
        <button mat-menu-item *ngFor="let lang of languages" (click)="switchLanguage(lang.code)" 
                [class.active]="currentLang === lang.code">
          <span class="flag">{{ lang.flag }}</span>
          <span class="lang-name">{{ lang.name }}</span>
        </button>
      </mat-menu>
    </div>
  `,
  styles: [`
    .auth-language-switcher {
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 100;
    }

    .language-button {
      padding: 0;
      height: 32px;
      min-width: 110px;
      border-radius: 0;
      background-color: rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
      overflow: hidden;
      line-height: 32px;
    }
    
    .button-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      height: 100%;
      padding: 0 10px;
    }

    .language-button:hover {
      background-color: rgba(0, 0, 0, 0.08);
    }

    .flag {
      font-size: 16px;
      display: inline-block;
      vertical-align: middle;
      margin-right: 8px;
    }

    .lang-name {
      font-size: 13px;
      font-weight: 500;
      display: inline-block;
      vertical-align: middle;
    }

    .dropdown-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      opacity: 0.7;
      vertical-align: middle;
      margin-left: 5px;
    }

    ::ng-deep .language-menu {
      .mat-menu-content {
        padding: 4px;
      }
      
      .mat-menu-item {
        min-height: 36px;
        display: flex;
        align-items: center;
        gap: 8px;
        border-radius: 4px;
        margin: 2px 0;
        
        &.active {
          background-color: rgba(0, 0, 0, 0.04);
          font-weight: 500;
        }
        
        .flag {
          font-size: 16px;
        }
        
        .lang-name {
          font-size: 14px;
        }
      }
    }
  `]
})
export class AuthLanguageSwitcherComponent implements OnInit {
  currentLang = 'fr';
  languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
  ];

  constructor(private translate: TranslateService) { }

  ngOnInit(): void {
    this.currentLang = localStorage.getItem('preferredLanguage') || 'fr';
  }

  switchLanguage(langCode: string): void {
    this.currentLang = langCode;
    this.translate.use(langCode);
    localStorage.setItem('preferredLanguage', langCode);
    document.documentElement.lang = langCode;
  }

  getCurrentLanguage(): { code: string; name: string; flag: string } {
    return this.languages.find(lang => lang.code === this.currentLang) || this.languages[0];
  }
}
