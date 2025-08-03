import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { StarRatingComponent } from './star-rating.component';
import { MaterialModule } from '../../material.module';

describe('StarRatingComponent', () => {
  let component: StarRatingComponent;
  let fixture: ComponentFixture<StarRatingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StarRatingComponent, MaterialModule, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(StarRatingComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.value).toBe(0);
    expect(component.interactive).toBe(false);
    expect(component.disabled).toBe(false);
    expect(component.showValue).toBe(false);
    expect(component.showCount).toBe(false);
    expect(component.allowClear).toBe(true);
    expect(component.size).toBe(20);
    expect(component.cssClass).toBe('');
  });

  describe('Display Mode (non-interactive)', () => {
    beforeEach(() => {
      component.interactive = false;
    });

    it('should display correct stars for integer rating', () => {
      component.value = 3;
      fixture.detectChanges();
      
      const stars = component.starArray();
      expect(stars).toEqual(['star', 'star', 'star', 'star_border', 'star_border']);
    });

    it('should display half star for decimal rating', () => {
      component.value = 3.7;
      fixture.detectChanges();
      
      const stars = component.starArray();
      expect(stars).toEqual(['star', 'star', 'star', 'star_half', 'star_border']);
    });

    it('should display empty stars for zero rating', () => {
      component.value = 0;
      fixture.detectChanges();
      
      const stars = component.starArray();
      expect(stars).toEqual(['star_border', 'star_border', 'star_border', 'star_border', 'star_border']);
    });

    it('should display full stars for maximum rating', () => {
      component.value = 5;
      fixture.detectChanges();
      
      const stars = component.starArray();
      expect(stars).toEqual(['star', 'star', 'star', 'star', 'star']);
    });
  });

  describe('Interactive Mode', () => {
    beforeEach(() => {
      component.interactive = true;
      fixture.detectChanges();
    });

    it('should emit rating change when star is clicked', () => {
      spyOn(component.ratingChange, 'emit');
      
      component.onStarClick(3);
      
      expect(component.ratingChange.emit).toHaveBeenCalledWith(3);
      expect(component.selectedRating()).toBe(3);
    });

    it('should not emit rating change when disabled', () => {
      component.disabled = true;
      spyOn(component.ratingChange, 'emit');
      
      component.onStarClick(3);
      
      expect(component.ratingChange.emit).not.toHaveBeenCalled();
    });

    it('should emit hover event when star is hovered', () => {
      spyOn(component.ratingHover, 'emit');
      
      component.onStarHover(4);
      
      expect(component.ratingHover.emit).toHaveBeenCalledWith(4);
      expect(component.hoveredRating()).toBe(4);
    });

    it('should clear hover when star is left', () => {
      component.hoveredRating.set(4);
      
      component.onStarLeave();
      
      expect(component.hoveredRating()).toBe(0);
    });

    it('should clear rating when clear is called', () => {
      component.selectedRating.set(3);
      spyOn(component.ratingChange, 'emit');
      spyOn(component.ratingClear, 'emit');
      
      component.onClear();
      
      expect(component.selectedRating()).toBe(0);
      expect(component.hoveredRating()).toBe(0);
      expect(component.ratingChange.emit).toHaveBeenCalledWith(0);
      expect(component.ratingClear.emit).toHaveBeenCalled();
    });

    it('should not clear rating when disabled', () => {
      component.disabled = true;
      component.selectedRating.set(3);
      spyOn(component.ratingChange, 'emit');
      spyOn(component.ratingClear, 'emit');
      
      component.onClear();
      
      expect(component.ratingChange.emit).not.toHaveBeenCalled();
      expect(component.ratingClear.emit).not.toHaveBeenCalled();
    });
  });

  describe('Star Colors', () => {
    it('should return correct colors for different star types', () => {
      expect(component.getStarColor('star')).toBe('#ffd700');
      expect(component.getStarColor('star_half')).toBe('#ffd700');
      expect(component.getStarColor('star_border')).toBe('#e0e0e0');
    });

    it('should return correct interactive star colors', () => {
      component.selectedRating.set(3);
      
      expect(component.getInteractiveStarColor(1)).toBe('#ffd700');
      expect(component.getInteractiveStarColor(3)).toBe('#ffd700');
      expect(component.getInteractiveStarColor(4)).toBe('#e0e0e0');
    });

    it('should use hover rating for interactive star colors', () => {
      component.selectedRating.set(2);
      component.hoveredRating.set(4);
      
      expect(component.getInteractiveStarColor(4)).toBe('#ffd700');
    });
  });

  describe('Interactive Star Icons', () => {
    it('should return correct interactive star icons', () => {
      component.selectedRating.set(3);
      
      expect(component.getInteractiveStarIcon(1)).toBe('star');
      expect(component.getInteractiveStarIcon(3)).toBe('star');
      expect(component.getInteractiveStarIcon(4)).toBe('star_border');
    });

    it('should use hover rating for interactive star icons', () => {
      component.selectedRating.set(2);
      component.hoveredRating.set(4);
      
      expect(component.getInteractiveStarIcon(4)).toBe('star');
    });
  });

  describe('Lifecycle', () => {
    it('should initialize selectedRating on ngOnInit', () => {
      component.value = 4;
      component.ngOnInit();
      
      expect(component.selectedRating()).toBe(4);
    });

    it('should update selectedRating on ngOnChanges', () => {
      component.value = 2;
      component.ngOnChanges();
      
      expect(component.selectedRating()).toBe(2);
    });
  });

  describe('Interactive Stars Array', () => {
    it('should return array of 5 elements', () => {
      const stars = component.interactiveStars();
      expect(stars).toEqual([0, 0, 0, 0, 0]);
      expect(stars.length).toBe(5);
    });
  });
}); 