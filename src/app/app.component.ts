import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute, RouterModule, RouterOutlet } from '@angular/router';
import { filter, map, mergeMap, take } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './core/services/language.service';
import { AuthService } from './core/services/auth.service';

// Angular Material Modules
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="app-container">
      <router-outlet></router-outlet>
      <!-- Global loading spinner can be added here if needed -->
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class AppComponent implements OnInit {
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
    private languageService: LanguageService,
    private authService: AuthService,
    private translate: TranslateService
  ) {
    // Initialize with French as default language
    this.translate.setDefaultLang('fr');
    
    // Check if user has a saved language preference
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && ['fr', 'en'].includes(savedLang)) {
      this.translate.use(savedLang);
    } else {
      // Otherwise use French as default
      this.translate.use('fr');
      localStorage.setItem('preferredLanguage', 'fr');
    }
    
    // Update HTML lang attribute
    document.documentElement.lang = this.translate.currentLang || 'fr';
    
    // Subscribe to language changes
    this.languageService.currentLanguage$.subscribe(lang => {
      // Update HTML lang attribute when language changes
      document.documentElement.lang = lang;
    });

    // Initialize auth state
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    // Check if we have a token and user in storage
    const token = this.authService.token;
    const user = this.authService.currentUserValue;

    // The auth service already handles the authentication state internally
    // through the currentUser$ observable and isAuthenticated$ observable
    // No need to manually set isAuthenticated as it's read-only and managed by the service

    // If we have a token but no user, the auth service will handle it automatically
    // through its initialization logic
  }

  ngOnInit(): void {
    // Update page title based on route data
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.activatedRoute),
        map((route) => {
          while (route.firstChild) route = route.firstChild;
          return route;
        }),
        filter((route) => route.outlet === 'primary'),
        mergeMap((route) => route.data)
      )
      .subscribe((event) => {
        const title = event['title']
          ? `${event['title']} | SecureVault Military`
          : 'SecureVault Military';
        this.titleService.setTitle(title);
      });
  }
}
