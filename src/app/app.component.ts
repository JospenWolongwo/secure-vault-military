import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute, RouterModule, RouterOutlet } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './core/services/language.service';

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
    private languageService: LanguageService
  ) {
    // The LanguageService is now self-initializing
    // We can subscribe to language changes if we need to react to them
    this.languageService.currentLanguage$.subscribe(lang => {
      // The language service already handles updating the document language
      // and the translate service, so we don't need to do anything here
      // unless we have specific logic that needs to run on language change
    });
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
