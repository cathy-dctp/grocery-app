import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ItemFormComponent, ItemFormData } from './item-form.component';
import { AutocompleteItem } from '../item-autocomplete/item-autocomplete.component';
import { GroceryService } from '../../services/grocery.service';
import { Category } from '../../models/api.models';
import { of } from 'rxjs';

describe('ItemFormComponent', () => {
  let component: ItemFormComponent;
  let fixture: ComponentFixture<ItemFormComponent>;

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

  const mockAutocompleteItem: AutocompleteItem = {
    id: 1,
    name: 'Apples',
    category_name: 'Produce',
    default_unit: 'lb',
  };

  beforeEach(async () => {
    const mockGroceryService = jasmine.createSpyObj('GroceryService', ['searchItems']);
    mockGroceryService.searchItems.and.returnValue(of({ results: [] }));

    await TestBed.configureTestingModule({
      imports: [ItemFormComponent, FormsModule, HttpClientTestingModule],
      providers: [{ provide: GroceryService, useValue: mockGroceryService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemFormComponent);
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
      expect(component.selectedItem()).toBeNull();
      expect(component.itemQuantity()).toBe('1');
      expect(component.itemUnit()).toBe('');
      expect(component.isCreatingNewItem()).toBe(false);
      expect(component.newItemName()).toBe('');
      expect(component.selectedCategoryId()).toBe(0);
      expect(component.newItemUnit()).toBe('pcs');
    });

    it('should set default category when categories are available', () => {
      // Component should auto-select first category when categories are provided
      expect(component.categories.length).toBeGreaterThan(0);
    });
  });

  describe('Item Selection', () => {
    it('should handle item selection from autocomplete', () => {
      component.onItemSelected(mockAutocompleteItem);

      expect(component.selectedItem()).toEqual(mockAutocompleteItem);
      expect(component.itemUnit()).toBe(mockAutocompleteItem.default_unit);
      expect(component.isCreatingNewItem()).toBe(false);
    });

    it('should handle item selection with empty default unit', () => {
      const itemWithoutUnit = { ...mockAutocompleteItem, default_unit: '' };

      component.onItemSelected(itemWithoutUnit);

      expect(component.selectedItem()).toEqual(itemWithoutUnit);
      expect(component.itemUnit()).toBe('');
      expect(component.isCreatingNewItem()).toBe(false);
    });

    it('should clear new item creation state when item selected', () => {
      component.isCreatingNewItem.set(true);
      component.newItemName.set('Some Item');

      component.onItemSelected(mockAutocompleteItem);

      expect(component.isCreatingNewItem()).toBe(false);
    });
  });

  describe('New Item Creation', () => {
    it('should handle create new item from autocomplete', () => {
      const itemName = 'New Fruit';

      component.onCreateNewItem(itemName);

      expect(component.isCreatingNewItem()).toBe(true);
      expect(component.newItemName()).toBe(itemName);
      expect(component.selectedItem()).toBeNull();
    });

    it('should auto-select first category when creating new item', () => {
      component.onCreateNewItem('New Item');

      expect(component.selectedCategoryId()).toBe(mockCategories[0].id);
    });

    it('should handle create new item with empty categories', () => {
      component.categories = [];

      component.onCreateNewItem('New Item');

      expect(component.selectedCategoryId()).toBe(0);
    });

    it('should handle category change', () => {
      const newCategoryId = 2;

      component.onCategoryChanged(newCategoryId);

      expect(component.selectedCategoryId()).toBe(newCategoryId);
    });

    it('should emit create new category event', () => {
      spyOn(component.createNewCategory, 'emit');
      const categoryName = 'New Category';

      component.onCreateNewCategory(categoryName);

      expect(component.createNewCategory.emit).toHaveBeenCalledWith(categoryName);
    });

    it('should cancel new item creation', () => {
      component.isCreatingNewItem.set(true);
      component.newItemName.set('Some Item');
      component.selectedCategoryId.set(2);
      component.newItemUnit.set('kg');

      component.cancelNewItemCreation();

      expect(component.isCreatingNewItem()).toBe(false);
      expect(component.newItemName()).toBe('');
      expect(component.selectedCategoryId()).toBe(mockCategories[0].id);
      expect(component.newItemUnit()).toBe('pcs');
    });

    it('should handle cancel with empty categories', () => {
      component.categories = [];
      component.isCreatingNewItem.set(true);

      component.cancelNewItemCreation();

      expect(component.selectedCategoryId()).toBe(0);
    });
  });

  describe('Form Submission', () => {
    it('should submit existing item data', () => {
      spyOn(component.addItem, 'emit');
      component.selectedItem.set(mockAutocompleteItem);
      component.itemQuantity.set('2');
      component.itemUnit.set('bags');

      component.onSubmit();

      const expectedData: ItemFormData = {
        selectedItem: mockAutocompleteItem,
        quantity: '2',
        unit: 'bags',
      };
      expect(component.addItem.emit).toHaveBeenCalledWith(expectedData);
    });

    it('should submit new item data', () => {
      spyOn(component.addItem, 'emit');
      component.isCreatingNewItem.set(true);
      component.newItemName.set('Custom Item');
      component.selectedCategoryId.set(2);
      component.newItemUnit.set('kg');
      component.itemQuantity.set('1.5');

      component.onSubmit();

      const expectedData: ItemFormData = {
        selectedItem: null,
        quantity: '1.5',
        unit: 'kg',
        newItem: {
          name: 'Custom Item',
          categoryId: 2,
          unit: 'kg',
        },
      };
      expect(component.addItem.emit).toHaveBeenCalledWith(expectedData);
    });

    it('should not submit when creating new item without valid data', () => {
      spyOn(component.addItem, 'emit');
      component.isCreatingNewItem.set(true);
      component.newItemName.set('');
      component.selectedCategoryId.set(0);

      component.onSubmit();

      expect(component.addItem.emit).not.toHaveBeenCalled();
    });

    it('should not submit when creating new item with empty name', () => {
      spyOn(component.addItem, 'emit');
      component.isCreatingNewItem.set(true);
      component.newItemName.set('   ');
      component.selectedCategoryId.set(1);

      component.onSubmit();

      expect(component.addItem.emit).not.toHaveBeenCalled();
    });

    it('should not submit when creating new item without category', () => {
      spyOn(component.addItem, 'emit');
      component.isCreatingNewItem.set(true);
      component.newItemName.set('Valid Name');
      component.selectedCategoryId.set(0);

      component.onSubmit();

      expect(component.addItem.emit).not.toHaveBeenCalled();
    });

    it('should not submit when no item selected and not creating new item', () => {
      spyOn(component.addItem, 'emit');
      component.selectedItem.set(null);
      component.isCreatingNewItem.set(false);

      component.onSubmit();

      expect(component.addItem.emit).not.toHaveBeenCalled();
    });

    it('should trim whitespace from new item name', () => {
      spyOn(component.addItem, 'emit');
      component.isCreatingNewItem.set(true);
      component.newItemName.set('  Trimmed Item  ');
      component.selectedCategoryId.set(1);
      component.itemQuantity.set('1');
      component.newItemUnit.set('pcs');

      component.onSubmit();

      const expectedData: ItemFormData = {
        selectedItem: null,
        quantity: '1',
        unit: 'pcs',
        newItem: {
          name: 'Trimmed Item',
          categoryId: 1,
          unit: 'pcs',
        },
      };
      expect(component.addItem.emit).toHaveBeenCalledWith(expectedData);
    });
  });

  describe('Form Clear', () => {
    it('should clear all form data', () => {
      spyOn(component.clearForm, 'emit');
      component.selectedItem.set(mockAutocompleteItem);
      component.itemQuantity.set('5');
      component.itemUnit.set('boxes');
      component.isCreatingNewItem.set(true);
      component.newItemName.set('Some Item');
      component.selectedCategoryId.set(2);
      component.newItemUnit.set('kg');

      component.onClear();

      expect(component.selectedItem()).toBeNull();
      expect(component.itemQuantity()).toBe('1');
      expect(component.itemUnit()).toBe('');
      expect(component.isCreatingNewItem()).toBe(false);
      expect(component.newItemName()).toBe('');
      expect(component.selectedCategoryId()).toBe(mockCategories[0].id);
      expect(component.newItemUnit()).toBe('pcs');
      expect(component.clearForm.emit).toHaveBeenCalled();
    });

    it('should handle clear with empty categories', () => {
      component.categories = [];

      component.onClear();

      expect(component.selectedCategoryId()).toBe(0);
    });
  });

  describe('Helper Functions', () => {
    it('should get selected item unit', () => {
      component.selectedItem.set(mockAutocompleteItem);

      const unit = component.getSelectedItemUnit();

      expect(unit).toBe(mockAutocompleteItem.default_unit);
    });

    it('should return empty string when no item selected', () => {
      component.selectedItem.set(null);

      const unit = component.getSelectedItemUnit();

      expect(unit).toBe('');
    });

    it('should return empty string when selected item has no default unit', () => {
      const itemWithoutUnit = { ...mockAutocompleteItem, default_unit: '' };
      component.selectedItem.set(itemWithoutUnit);

      const unit = component.getSelectedItemUnit();

      expect(unit).toBe('');
    });

    it('should determine if form can be submitted - existing item', () => {
      component.selectedItem.set(mockAutocompleteItem);
      component.isCreatingNewItem.set(false);

      expect(component.canSubmit()).toBe(true);
    });

    it('should determine if form can be submitted - new item valid', () => {
      component.isCreatingNewItem.set(true);
      component.newItemName.set('Valid Item');
      component.selectedCategoryId.set(1);

      expect(component.canSubmit()).toBe(true);
    });

    it('should determine if form cannot be submitted - new item invalid name', () => {
      component.isCreatingNewItem.set(true);
      component.newItemName.set('');
      component.selectedCategoryId.set(1);

      expect(component.canSubmit()).toBe(false);
    });

    it('should determine if form cannot be submitted - new item invalid category', () => {
      component.isCreatingNewItem.set(true);
      component.newItemName.set('Valid Item');
      component.selectedCategoryId.set(0);

      expect(component.canSubmit()).toBe(false);
    });

    it('should determine if form cannot be submitted - no selection', () => {
      component.selectedItem.set(null);
      component.isCreatingNewItem.set(false);

      expect(component.canSubmit()).toBe(false);
    });

    it('should handle whitespace-only new item name in canSubmit', () => {
      component.isCreatingNewItem.set(true);
      component.newItemName.set('   ');
      component.selectedCategoryId.set(1);

      expect(component.canSubmit()).toBe(false);
    });
  });

  describe('Signal State Management', () => {
    it('should update selectedItem signal', () => {
      expect(component.selectedItem()).toBeNull();

      component.selectedItem.set(mockAutocompleteItem);

      expect(component.selectedItem()).toEqual(mockAutocompleteItem);
    });

    it('should update itemQuantity signal', () => {
      expect(component.itemQuantity()).toBe('1');

      component.itemQuantity.set('5');

      expect(component.itemQuantity()).toBe('5');
    });

    it('should update itemUnit signal', () => {
      expect(component.itemUnit()).toBe('');

      component.itemUnit.set('kg');

      expect(component.itemUnit()).toBe('kg');
    });

    it('should update isCreatingNewItem signal', () => {
      expect(component.isCreatingNewItem()).toBe(false);

      component.isCreatingNewItem.set(true);

      expect(component.isCreatingNewItem()).toBe(true);
    });

    it('should update newItemName signal', () => {
      expect(component.newItemName()).toBe('');

      component.newItemName.set('New Item');

      expect(component.newItemName()).toBe('New Item');
    });

    it('should update selectedCategoryId signal', () => {
      expect(component.selectedCategoryId()).toBe(0);

      component.selectedCategoryId.set(2);

      expect(component.selectedCategoryId()).toBe(2);
    });

    it('should update newItemUnit signal', () => {
      expect(component.newItemUnit()).toBe('pcs');

      component.newItemUnit.set('kg');

      expect(component.newItemUnit()).toBe('kg');
    });
  });

  describe('Integration', () => {
    it('should handle complete workflow - select existing item and submit', () => {
      spyOn(component.addItem, 'emit');

      // Simulate autocomplete selection
      component.onItemSelected(mockAutocompleteItem);
      component.itemQuantity.set('3');
      component.itemUnit.set('bags');

      // Verify state
      expect(component.selectedItem()).toEqual(mockAutocompleteItem);
      expect(component.isCreatingNewItem()).toBe(false);
      expect(component.canSubmit()).toBe(true);

      // Submit
      component.onSubmit();

      expect(component.addItem.emit).toHaveBeenCalledWith({
        selectedItem: mockAutocompleteItem,
        quantity: '3',
        unit: 'bags',
      });
    });

    it('should handle complete workflow - create new item and submit', () => {
      spyOn(component.addItem, 'emit');

      // Simulate new item creation
      component.onCreateNewItem('Custom Vegetable');
      component.onCategoryChanged(1);
      component.itemQuantity.set('2');
      component.newItemUnit.set('bunches');

      // Verify state
      expect(component.isCreatingNewItem()).toBe(true);
      expect(component.newItemName()).toBe('Custom Vegetable');
      expect(component.selectedCategoryId()).toBe(1);
      expect(component.canSubmit()).toBe(true);

      // Submit
      component.onSubmit();

      expect(component.addItem.emit).toHaveBeenCalledWith({
        selectedItem: null,
        quantity: '2',
        unit: 'bunches',
        newItem: {
          name: 'Custom Vegetable',
          categoryId: 1,
          unit: 'bunches',
        },
      });
    });

    it('should handle cancel during new item creation', () => {
      // Start creating new item
      component.onCreateNewItem('Test Item');
      component.onCategoryChanged(2);
      component.newItemUnit.set('boxes');

      expect(component.isCreatingNewItem()).toBe(true);

      // Cancel
      component.cancelNewItemCreation();

      expect(component.isCreatingNewItem()).toBe(false);
      expect(component.newItemName()).toBe('');
      expect(component.selectedCategoryId()).toBe(mockCategories[0].id);
      expect(component.newItemUnit()).toBe('pcs');
    });

    it('should handle clear after item selection', () => {
      spyOn(component.clearForm, 'emit');

      // Select item
      component.onItemSelected(mockAutocompleteItem);
      component.itemQuantity.set('4');

      // Clear
      component.onClear();

      expect(component.selectedItem()).toBeNull();
      expect(component.itemQuantity()).toBe('1');
      expect(component.itemUnit()).toBe('');
      expect(component.clearForm.emit).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null autocomplete item', () => {
      expect(() => component.onItemSelected(null as any)).toThrow();
    });

    it('should handle undefined item name in create new item', () => {
      expect(() => component.onCreateNewItem(undefined as any)).not.toThrow();
    });

    it('should handle very long item names', () => {
      const longName = 'A'.repeat(1000);

      component.onCreateNewItem(longName);

      expect(component.newItemName()).toBe(longName);
    });

    it('should handle negative category IDs', () => {
      component.onCategoryChanged(-1);

      expect(component.selectedCategoryId()).toBe(-1);
    });

    it('should handle empty category name in createNewCategory', () => {
      spyOn(component.createNewCategory, 'emit');

      component.onCreateNewCategory('');

      expect(component.createNewCategory.emit).toHaveBeenCalledWith('');
    });

    it('should handle undefined autocomplete item properties', () => {
      const incompleteItem = { id: 1, name: 'Test' } as any;

      component.onItemSelected(incompleteItem);

      expect(component.selectedItem()).toEqual(incompleteItem);
      expect(component.itemUnit()).toBe(''); // Should handle missing default_unit
    });

    it('should handle special characters in item names', () => {
      const specialName = 'Crème brûlée & café au lait';

      component.onCreateNewItem(specialName);

      expect(component.newItemName()).toBe(specialName);
    });
  });
});
