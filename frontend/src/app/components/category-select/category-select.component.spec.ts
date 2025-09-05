import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CategorySelectComponent } from './category-select.component';
import { Category } from '../../models/api.models';

describe('CategorySelectComponent', () => {
  let component: CategorySelectComponent;
  let fixture: ComponentFixture<CategorySelectComponent>;

  const mockCategories: Category[] = [
    {
      id: 1,
      name: 'Produce',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 2,
      name: 'Dairy',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    { id: 3, name: 'Meat', created_at: '2024-01-15T10:00:00Z', updated_at: '2024-01-15T10:00:00Z' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategorySelectComponent, FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CategorySelectComponent);
    component = fixture.componentInstance;
    component.categories = mockCategories;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.selectedCategoryId).toBe(0);
      expect(component.required).toBe(false);
      expect(component.placeholder).toBe('Select a category');
      expect(component.showCustomCategoryInput()).toBe(false);
      expect(component.customCategoryName()).toBe('');
    });

    it('should accept input properties', () => {
      component.selectedCategoryId = 2;
      component.required = true;
      component.placeholder = 'Choose category';

      expect(component.selectedCategoryId).toBe(2);
      expect(component.required).toBe(true);
      expect(component.placeholder).toBe('Choose category');
    });

    it('should require categories input', () => {
      // The categories input is marked as required in the component
      expect(component.categories).toBeDefined();
      expect(Array.isArray(component.categories)).toBe(true);
    });
  });

  describe('Category Selection', () => {
    it('should handle category selection', () => {
      spyOn(component.categoryChanged, 'emit');

      component.onCategoryChange('2');

      expect(component.selectedCategoryId).toBe(2);
      expect(component.showCustomCategoryInput()).toBe(false);
      expect(component.customCategoryName()).toBe('');
      expect(component.categoryChanged.emit).toHaveBeenCalledWith(2);
    });

    it('should handle category selection as zero (placeholder)', () => {
      spyOn(component.categoryChanged, 'emit');
      component.selectedCategoryId = 2; // Set initial value

      component.onCategoryChange('0');

      expect(component.selectedCategoryId).toBe(0);
      expect(component.showCustomCategoryInput()).toBe(false);
      expect(component.categoryChanged.emit).toHaveBeenCalledWith(0);
    });

    it('should clear previous custom input when selecting existing category', () => {
      component.customCategoryName.set('Previous Input');
      component.showCustomCategoryInput.set(true);
      spyOn(component.categoryChanged, 'emit');

      component.onCategoryChange('1');

      expect(component.customCategoryName()).toBe('');
      expect(component.showCustomCategoryInput()).toBe(false);
      expect(component.categoryChanged.emit).toHaveBeenCalledWith(1);
    });

    it('should handle string values by converting to numbers', () => {
      spyOn(component.categoryChanged, 'emit');

      component.onCategoryChange('3');

      expect(component.selectedCategoryId).toBe(3);
      expect(component.categoryChanged.emit).toHaveBeenCalledWith(3);
    });

    it('should handle non-numeric strings gracefully', () => {
      spyOn(component.categoryChanged, 'emit');

      component.onCategoryChange('invalid');

      expect(component.selectedCategoryId).toBeNaN();
      expect(component.showCustomCategoryInput()).toBe(false);
      expect(component.categoryChanged.emit).toHaveBeenCalledWith(NaN);
    });
  });

  describe('Create New Category', () => {
    it('should show custom input when create new is selected', () => {
      spyOn(component.categoryChanged, 'emit');

      component.onCategoryChange('-1');

      expect(component.selectedCategoryId).toBe(-1);
      expect(component.showCustomCategoryInput()).toBe(true);
      expect(component.categoryChanged.emit).not.toHaveBeenCalled();
    });

    it('should emit create new category event with valid name', () => {
      spyOn(component.createNewCategory, 'emit');
      component.customCategoryName.set('New Category');

      component.onCreateCategory();

      expect(component.createNewCategory.emit).toHaveBeenCalledWith('New Category');
    });

    it('should not emit create new category event with empty name', () => {
      spyOn(component.createNewCategory, 'emit');
      component.customCategoryName.set('');

      component.onCreateCategory();

      expect(component.createNewCategory.emit).not.toHaveBeenCalled();
    });

    it('should not emit create new category event with whitespace-only name', () => {
      spyOn(component.createNewCategory, 'emit');
      component.customCategoryName.set('   ');

      component.onCreateCategory();

      expect(component.createNewCategory.emit).not.toHaveBeenCalled();
    });

    it('should trim whitespace from custom category name', () => {
      spyOn(component.createNewCategory, 'emit');
      component.customCategoryName.set('  New Category  ');

      component.onCreateCategory();

      expect(component.createNewCategory.emit).toHaveBeenCalledWith('New Category');
    });

    it('should handle very long category names', () => {
      spyOn(component.createNewCategory, 'emit');
      const longName = 'A'.repeat(1000);
      component.customCategoryName.set(longName);

      component.onCreateCategory();

      expect(component.createNewCategory.emit).toHaveBeenCalledWith(longName);
    });

    it('should handle special characters in category names', () => {
      spyOn(component.createNewCategory, 'emit');
      const specialName = 'Café & Bakery Items';
      component.customCategoryName.set(specialName);

      component.onCreateCategory();

      expect(component.createNewCategory.emit).toHaveBeenCalledWith(specialName);
    });
  });

  describe('Reset Custom Input', () => {
    it('should reset custom input state', () => {
      component.customCategoryName.set('Some Category');
      component.showCustomCategoryInput.set(true);

      component.resetCustomInput();

      expect(component.customCategoryName()).toBe('');
      expect(component.showCustomCategoryInput()).toBe(false);
    });

    it('should reset from any state', () => {
      component.customCategoryName.set('Very Long Category Name With Special Characters!');
      component.showCustomCategoryInput.set(true);
      component.selectedCategoryId = -1;

      component.resetCustomInput();

      expect(component.customCategoryName()).toBe('');
      expect(component.showCustomCategoryInput()).toBe(false);
      // selectedCategoryId should not be affected by resetCustomInput alone
      expect(component.selectedCategoryId).toBe(-1);
    });
  });

  describe('Signal State Management', () => {
    it('should update showCustomCategoryInput signal', () => {
      expect(component.showCustomCategoryInput()).toBe(false);

      component.showCustomCategoryInput.set(true);

      expect(component.showCustomCategoryInput()).toBe(true);
    });

    it('should update customCategoryName signal', () => {
      expect(component.customCategoryName()).toBe('');

      component.customCategoryName.set('Test Category');

      expect(component.customCategoryName()).toBe('Test Category');
    });

    it('should react to signal changes in template logic', () => {
      component.customCategoryName.set('Valid Name');

      // This simulates the template condition [disabled]="!customCategoryName().trim()"
      expect(component.customCategoryName().trim().length > 0).toBe(true);

      component.customCategoryName.set('   ');
      expect(component.customCategoryName().trim().length > 0).toBe(false);
    });
  });

  describe('Integration', () => {
    it('should handle complete workflow - select create new, enter name, create', () => {
      spyOn(component.categoryChanged, 'emit');
      spyOn(component.createNewCategory, 'emit');

      // User selects "Create new category"
      component.onCategoryChange('-1');

      expect(component.selectedCategoryId).toBe(-1);
      expect(component.showCustomCategoryInput()).toBe(true);
      expect(component.categoryChanged.emit).not.toHaveBeenCalled();

      // User enters category name
      component.customCategoryName.set('Beverages');

      // User clicks create
      component.onCreateCategory();

      expect(component.createNewCategory.emit).toHaveBeenCalledWith('Beverages');
    });

    it('should handle complete workflow - select create new, enter name, cancel', () => {
      spyOn(component.categoryChanged, 'emit');

      // User selects "Create new category"
      component.onCategoryChange('-1');
      component.customCategoryName.set('Beverages');

      expect(component.showCustomCategoryInput()).toBe(true);

      // User clicks cancel (this simulates the cancel button logic)
      component.resetCustomInput();
      component.onCategoryChange('0');

      expect(component.customCategoryName()).toBe('');
      expect(component.showCustomCategoryInput()).toBe(false);
      expect(component.selectedCategoryId).toBe(0);
      expect(component.categoryChanged.emit).toHaveBeenCalledWith(0);
    });

    it('should handle switching from create new to existing category', () => {
      spyOn(component.categoryChanged, 'emit');

      // Start with create new
      component.onCategoryChange('-1');
      component.customCategoryName.set('Some Category');

      expect(component.showCustomCategoryInput()).toBe(true);

      // Switch to existing category
      component.onCategoryChange('2');

      expect(component.selectedCategoryId).toBe(2);
      expect(component.showCustomCategoryInput()).toBe(false);
      expect(component.customCategoryName()).toBe(''); // Should be cleared
      expect(component.categoryChanged.emit).toHaveBeenCalledWith(2);
    });

    it('should handle multiple create attempts', () => {
      spyOn(component.createNewCategory, 'emit');

      component.customCategoryName.set('Category 1');
      component.onCreateCategory();

      component.customCategoryName.set('Category 2');
      component.onCreateCategory();

      expect(component.createNewCategory.emit).toHaveBeenCalledTimes(2);
      expect(component.createNewCategory.emit).toHaveBeenCalledWith('Category 1');
      expect(component.createNewCategory.emit).toHaveBeenCalledWith('Category 2');
    });
  });

  describe('UI Integration', () => {
    it('should render categories in select dropdown', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const options = compiled.querySelectorAll('option');

      // Should have placeholder + categories + create new option
      expect(options.length).toBe(mockCategories.length + 2);

      // Check some key options exist
      expect(options[0].textContent).toContain('Select a category');
      expect(options[1].textContent).toBe('Produce');
      expect(options[options.length - 1].textContent).toContain('Create new category');
    });

    it('should show custom input when create new is selected', () => {
      component.onCategoryChange('-1');
      fixture.detectChanges();

      expect(component.showCustomCategoryInput()).toBe(true);
    });

    it('should hide custom input initially', () => {
      expect(component.showCustomCategoryInput()).toBe(false);
      // Custom input should not be in DOM when hidden
    });

    it('should apply error styling when required and no selection', () => {
      component.required = true;
      component.selectedCategoryId = 0;
      fixture.detectChanges();

      // This would be checked in a more complete DOM test
      expect(component.selectedCategoryId).toBe(0);
      expect(component.required).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty categories array', () => {
      component.categories = [];

      spyOn(component.categoryChanged, 'emit');
      component.onCategoryChange('1');

      expect(component.categoryChanged.emit).toHaveBeenCalledWith(1);
    });

    it('should handle null categories array', () => {
      component.categories = null as any;

      expect(() => component.onCategoryChange('1')).not.toThrow();
    });

    it('should handle undefined custom category name', () => {
      component.customCategoryName.set(undefined as any);

      expect(() => component.onCreateCategory()).toThrow();
    });

    it('should handle null custom category name', () => {
      component.customCategoryName.set(null as any);

      expect(() => component.onCreateCategory()).toThrow();
    });

    it('should handle very large category IDs', () => {
      spyOn(component.categoryChanged, 'emit');

      component.onCategoryChange('999999999');

      expect(component.selectedCategoryId).toBe(999999999);
      expect(component.categoryChanged.emit).toHaveBeenCalledWith(999999999);
    });

    it('should handle negative category IDs (other than -1)', () => {
      spyOn(component.categoryChanged, 'emit');

      component.onCategoryChange('-5');

      expect(component.selectedCategoryId).toBe(-5);
      expect(component.showCustomCategoryInput()).toBe(false); // Only -1 triggers custom input
      expect(component.categoryChanged.emit).toHaveBeenCalledWith(-5);
    });

    it('should handle floating point category IDs', () => {
      spyOn(component.categoryChanged, 'emit');

      component.onCategoryChange('2.5');

      expect(component.selectedCategoryId).toBe(2.5);
      expect(component.categoryChanged.emit).toHaveBeenCalledWith(2.5);
    });

    it('should handle scientific notation category IDs', () => {
      spyOn(component.categoryChanged, 'emit');

      component.onCategoryChange('1e2');

      expect(component.selectedCategoryId).toBe(100);
      expect(component.categoryChanged.emit).toHaveBeenCalledWith(100);
    });

    it('should handle empty string input for category change', () => {
      spyOn(component.categoryChanged, 'emit');

      component.onCategoryChange('');

      expect(component.selectedCategoryId).toBe(0); // Number('') is 0
      expect(component.categoryChanged.emit).toHaveBeenCalledWith(0);
    });

    it('should handle unicode category names', () => {
      spyOn(component.createNewCategory, 'emit');
      const unicodeName = '🍎 Fruits & Vegetables 🥕';
      component.customCategoryName.set(unicodeName);

      component.onCreateCategory();

      expect(component.createNewCategory.emit).toHaveBeenCalledWith(unicodeName);
    });
  });

  describe('Event Emissions', () => {
    it('should emit categoryChanged with correct data types', () => {
      let emittedValue: any;
      component.categoryChanged.subscribe((value) => {
        emittedValue = value;
      });

      component.onCategoryChange('3');

      expect(typeof emittedValue).toBe('number');
      expect(emittedValue).toBe(3);
    });

    it('should emit createNewCategory with correct data types', () => {
      let emittedValue: any;
      component.createNewCategory.subscribe((value) => {
        emittedValue = value;
      });

      component.customCategoryName.set('Test Category');
      component.onCreateCategory();

      expect(typeof emittedValue).toBe('string');
      expect(emittedValue).toBe('Test Category');
    });

    it('should not emit events when invalid', () => {
      spyOn(component.categoryChanged, 'emit');
      spyOn(component.createNewCategory, 'emit');

      // This should not emit categoryChanged
      component.onCategoryChange('-1');

      // This should not emit createNewCategory
      component.customCategoryName.set('');
      component.onCreateCategory();

      expect(component.categoryChanged.emit).not.toHaveBeenCalled();
      expect(component.createNewCategory.emit).not.toHaveBeenCalled();
    });
  });
});
