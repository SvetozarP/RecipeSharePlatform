import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, RouterLink } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
import { MaterialModule } from './shared/material.module';
import { AuthService, User } from './core/services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, MaterialModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']})
export class AppComponent implements OnInit {
  title = 'Recipe Sharing Platform';
  isMobile = false;
  
  @ViewChild('sidenav') sidenav!: MatSidenav;
  
  currentUser$: Observable<User | null>;
  isAuthenticated$: Observable<boolean>;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }

  ngOnInit() {
    this.checkMobileView();
    window.addEventListener('resize', () => this.checkMobileView());
  }

  navigateHome() {
    this.router.navigate(['/recipes']);
  }

  logout() {
    this.authService.logout();
  }

  toggleSidenav() {
    if (this.sidenav) {
      this.sidenav.toggle();
    }
  }

  closeSidenav() {
    if (this.sidenav) {
      this.sidenav.close();
    }
  }

  logoutAndClose() {
    this.logout();
    this.closeSidenav();
  }

  private checkMobileView() {
    this.isMobile = window.innerWidth < 768;
  }
} 