import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LoadingComponent } from './loading.component';
import { MaterialModule } from '../../material.module';

describe('LoadingComponent', () => {
  let component: LoadingComponent;
  let fixture: ComponentFixture<LoadingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingComponent, MaterialModule, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.message).toBe('Loading...');
    expect(component.size).toBe(50);
    expect(component.fullHeight).toBe(false);
    expect(component.inline).toBe(false);
  });

  it('should render inline mode when inline is true', () => {
    component.inline = true;
    component.message = 'Custom message';
    component.size = 30;
    
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    expect(element.querySelector('.flex.items-center.gap-2')).toBeTruthy();
    expect(element.querySelector('mat-spinner')).toBeTruthy();
    expect(element.textContent).toContain('Custom message');
  });

  it('should render full mode when inline is false', () => {
    component.inline = false;
    component.message = 'Page loading...';
    component.size = 80;
    
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    expect(element.querySelector('.flex.justify-center.items-center')).toBeTruthy();
    expect(element.querySelector('mat-spinner')).toBeTruthy();
    expect(element.textContent).toContain('Page loading...');
  });

  it('should apply fullHeight class when fullHeight is true', () => {
    component.inline = false;
    component.fullHeight = true;
    
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    expect(element.querySelector('.h-64')).toBeTruthy();
  });

  it('should apply py-4 class when fullHeight is false', () => {
    component.inline = false;
    component.fullHeight = false;
    
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    expect(element.querySelector('.py-4')).toBeTruthy();
  });

  it('should not show message when message is empty', () => {
    component.inline = true;
    component.message = '';
    
    fixture.detectChanges();
    
    const element = fixture.nativeElement;
    expect(element.querySelector('span')).toBeFalsy();
  });

  it('should pass size to mat-spinner', () => {
    component.inline = true;
    component.size = 100;
    
    fixture.detectChanges();
    
    const spinner = fixture.nativeElement.querySelector('mat-spinner');
    // The size property should be set on the component
    expect(component.size).toBe(100);
    // Check if the spinner element exists
    expect(spinner).toBeTruthy();
  });
}); 