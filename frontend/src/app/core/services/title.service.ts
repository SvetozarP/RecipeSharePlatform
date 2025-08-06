import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TitleService {
  private defaultTitle = 'Recipe Sharing Platform';

  constructor(
    private titleService: Title,
    private router: Router
  ) {
    this.initializeTitleTracking();
  }

  /**
   * Set the page title
   */
  setTitle(title: string): void {
    const fullTitle = title ? `${title} - ${this.defaultTitle}` : this.defaultTitle;
    this.titleService.setTitle(fullTitle);
  }

  /**
   * Reset to default title
   */
  resetTitle(): void {
    this.titleService.setTitle(this.defaultTitle);
  }

  /**
   * Get the current title
   */
  getTitle(): string {
    return this.titleService.getTitle();
  }

  /**
   * Initialize automatic title tracking based on route data
   */
  private initializeTitleTracking(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        const route = this.getCurrentRoute();
        if (route?.data?.['title']) {
          this.setTitle(route.data['title']);
        } else {
          this.resetTitle();
        }
      });
  }

  /**
   * Get the current route with its data
   */
  private getCurrentRoute(): any {
    let route = this.router.routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route;
  }
} 