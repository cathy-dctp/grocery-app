import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { ItemAutocompleteComponent, AutocompleteItem } from './item-autocomplete.component';
import { GroceryService } from '../../services/grocery.service';
import { Item, PaginatedResponse } from '../../models/api.models';

describe('ItemAutocompleteComponent', () => {
  let component: ItemAutocompleteComponent;
  let fixture: ComponentFixture<ItemAutocompleteComponent>;
  let mockGroceryService: jasmine.SpyObj<GroceryService>;

  const mockItems: Item[] = [
    {
      id: 1,
      name: 'Apples',
      category: 1,
      category_name: 'Produce',
      default_unit: 'lb',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 2,
      name: 'Apple Juice',
      category: 2,
      category_name: 'Beverages',
      default_unit: 'bottle',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 3,
      name: 'Banana',
      category: 1,
      category_name: 'Produce',
      default_unit: 'bunch',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
  ];

  const mockSearchResponse: PaginatedResponse<Item> = {
    count: 2,
    next: undefined,
    previous: undefined,
    results: mockItems.slice(0, 2), // First 2 items
  };

  beforeEach(async () => {
    mockGroceryService = jasmine.createSpyObj('GroceryService', ['searchItems']);
    mockGroceryService.searchItems.and.callFake((query: string) => {
      if (query === 'app') {
        return of(mockSearchResponse);
      } else if (query === 'orange') {
        return of({ count: 0, next: undefined, previous: undefined, results: [] });
      } else if (query === 'Apples') {
        return of({
          count: 1,
          next: undefined,
          previous: undefined,
          results: [mockItems[0]], // Exact match
        });
      } else {
        return of(mockSearchResponse); // Default response
      }
    });

    await TestBed.configureTestingModule({
      imports: [ItemAutocompleteComponent, ReactiveFormsModule, HttpClientTestingModule],
      providers: [{ provide: GroceryService, useValue: mockGroceryService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemAutocompleteComponent);
    component = fixture.componentInstance;
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
      expect(component.placeholder).toBe('Start typing to search items...');
      expect(component.minLength).toBe(2);
      expect(component.suggestions()).toEqual([]);
      expect(component.isLoading()).toBe(false);
      expect(component.showDropdown()).toBe(false);
      expect(component.selectedIndex()).toBe(-1);
      expect(component.searchControl.value).toBe('');
    });

    it('should accept input properties', () => {
      component.placeholder = 'Search for items';
      component.minLength = 3;

      expect(component.placeholder).toBe('Search for items');
      expect(component.minLength).toBe(3);
    });

    it('should initialize search observable', () => {
      expect(component.searchControl).toBeDefined();
      expect(component['searchSubject']).toBeDefined();
    });
  });

  describe('Search Functionality', () => {
    it('should initialize search control', () => {
      expect(component.searchControl).toBeDefined();
      expect(component.searchControl.value).toBe('');
    });

    it('should have searchSubject for handling search queries', () => {
      expect(component['searchSubject']).toBeDefined();
    });

    it('should set suggestions manually for testing', () => {
      const testSuggestions: AutocompleteItem[] = [
        { id: 1, name: 'Test Item', category_name: 'Test Category', default_unit: 'pcs' },
      ];

      component.suggestions.set(testSuggestions);
      component.showDropdown.set(true);

      expect(component.suggestions()).toEqual(testSuggestions);
      expect(component.showDropdown()).toBe(true);
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      // Set up test suggestions manually instead of relying on async search
      const testSuggestions: AutocompleteItem[] = [
        { id: 1, name: 'Apples', category_name: 'Produce', default_unit: 'lb' },
        { id: 2, name: 'Apple Juice', category_name: 'Beverages', default_unit: 'bottle' },
      ];
      component.suggestions.set(testSuggestions);
      component.showDropdown.set(true);
    });

    it('should handle arrow down navigation', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      spyOn(event, 'preventDefault');

      component.onKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.selectedIndex()).toBe(0);
    });

    it('should handle arrow up navigation', () => {
      component.selectedIndex.set(1);
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      spyOn(event, 'preventDefault');

      component.onKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.selectedIndex()).toBe(0);
    });

    it('should wrap around when navigating past end with arrow down', () => {
      const suggestions = component.suggestions();
      component.selectedIndex.set(suggestions.length - 1);
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });

      component.onKeyDown(event);

      expect(component.selectedIndex()).toBe(0);
    });

    it('should wrap around when navigating past start with arrow up', () => {
      component.selectedIndex.set(0);
      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });

      component.onKeyDown(event);

      expect(component.selectedIndex()).toBe(component.suggestions().length - 1);
    });

    it('should select highlighted item on Enter', () => {
      spyOn(component, 'selectItem');
      component.selectedIndex.set(0);
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      spyOn(event, 'preventDefault');

      component.onKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.selectItem).toHaveBeenCalledWith(component.suggestions()[0]);
    });

    it('should create new item on Enter when no item selected but has search value', () => {
      spyOn(component.createNewItem, 'emit');
      component.selectedIndex.set(-1);
      component.searchControl.setValue('new item');
      const event = new KeyboardEvent('keydown', { key: 'Enter' });

      component.onKeyDown(event);

      expect(component.createNewItem.emit).toHaveBeenCalledWith('new item');
      expect(component.showDropdown()).toBe(false);
    });

    it('should hide dropdown on Escape', () => {
      component.showDropdown.set(true);
      const event = new KeyboardEvent('keydown', { key: 'Escape' });

      component.onKeyDown(event);

      expect(component.showDropdown()).toBe(false);
      expect(component.selectedIndex()).toBe(-1);
    });

    it('should ignore unknown keys', () => {
      const initialIndex = component.selectedIndex();
      const event = new KeyboardEvent('keydown', { key: 'Tab' });

      component.onKeyDown(event);

      expect(component.selectedIndex()).toBe(initialIndex);
    });
  });

  describe('Focus and Blur Handling', () => {
    it('should hide dropdown on blur with delay', fakeAsync(() => {
      component.showDropdown.set(true);
      component.selectedIndex.set(0);

      component.onInputBlur();
      tick(200);

      expect(component.showDropdown()).toBe(false);
      expect(component.selectedIndex()).toBe(-1);
    }));
  });

  describe('Item Selection', () => {
    beforeEach(() => {
      // Set up test suggestions manually
      const testSuggestions: AutocompleteItem[] = [
        { id: 1, name: 'Apples', category_name: 'Produce', default_unit: 'lb' },
        { id: 2, name: 'Apple Juice', category_name: 'Beverages', default_unit: 'bottle' },
      ];
      component.suggestions.set(testSuggestions);
      component.showDropdown.set(true);
    });

    it('should emit itemSelected for regular items', () => {
      spyOn(component.itemSelected, 'emit');
      const item = component.suggestions()[0];

      component.selectItem(item);

      expect(component.itemSelected.emit).toHaveBeenCalledWith(item);
    });

    it('should emit createNewItem for create new items', () => {
      spyOn(component.createNewItem, 'emit');
      const createNewItem = {
        id: -1,
        name: 'Create "new item"',
        category_name: 'New Item',
        default_unit: '',
        isCreateNew: true,
      };

      component.selectItem(createNewItem);

      expect(component.createNewItem.emit).toHaveBeenCalledWith(
        component.searchControl.value || ''
      );
      expect(component.showDropdown()).toBe(false);
    });

    it('should clear input after selecting regular item', () => {
      const item = component.suggestions()[0];

      component.selectItem(item);

      expect(component.searchControl.value).toBe('');
      expect(component.showDropdown()).toBe(false);
      expect(component.selectedIndex()).toBe(-1);
    });
  });

  describe('Clear Input', () => {
    it('should clear search input and reset state', () => {
      component.searchControl.setValue('apple');
      component.showDropdown.set(true);
      component.selectedIndex.set(1);

      component.clearInput();

      expect(component.searchControl.value).toBe('');
      expect(component.showDropdown()).toBe(false);
      expect(component.selectedIndex()).toBe(-1);
    });
  });

  describe('Signal State Management', () => {
    it('should update suggestions signal', () => {
      const newSuggestions: AutocompleteItem[] = [
        { id: 1, name: 'Test', category_name: 'Category', default_unit: 'pcs' },
      ];

      component.suggestions.set(newSuggestions);

      expect(component.suggestions()).toEqual(newSuggestions);
    });

    it('should update isLoading signal', () => {
      expect(component.isLoading()).toBe(false);

      component.isLoading.set(true);

      expect(component.isLoading()).toBe(true);
    });

    it('should update showDropdown signal', () => {
      expect(component.showDropdown()).toBe(false);

      component.showDropdown.set(true);

      expect(component.showDropdown()).toBe(true);
    });

    it('should update selectedIndex signal', () => {
      expect(component.selectedIndex()).toBe(-1);

      component.selectedIndex.set(2);

      expect(component.selectedIndex()).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle selecting item with missing properties', () => {
      const incompleteItem = { id: 1, name: 'Test' } as any;
      spyOn(component.itemSelected, 'emit');

      component.selectItem(incompleteItem);

      expect(component.itemSelected.emit).toHaveBeenCalledWith(incompleteItem);
    });

    it('should handle keyboard navigation with empty suggestions', () => {
      component.suggestions.set([]);

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });

      expect(() => component.onKeyDown(event)).not.toThrow();
      expect(component.selectedIndex()).toBe(0); // Wraps to 0 even with empty array
    });
  });

  describe('Event Emissions', () => {
    it('should emit itemSelected with correct data type', () => {
      let emittedItem: any;
      component.itemSelected.subscribe((item) => {
        emittedItem = item;
      });

      const testItem: AutocompleteItem = {
        id: 1,
        name: 'Test Item',
        category_name: 'Test Category',
        default_unit: 'pcs',
      };

      component.selectItem(testItem);

      expect(emittedItem).toEqual(testItem);
      expect(typeof emittedItem.id).toBe('number');
      expect(typeof emittedItem.name).toBe('string');
    });

    it('should emit createNewItem with correct data type', () => {
      let emittedValue: any;
      component.createNewItem.subscribe((value) => {
        emittedValue = value;
      });

      component.searchControl.setValue('new item');
      const createNewItem = {
        id: -1,
        name: 'Create "new item"',
        category_name: 'New Item',
        default_unit: '',
        isCreateNew: true,
      };

      component.selectItem(createNewItem);

      expect(typeof emittedValue).toBe('string');
      expect(emittedValue).toBe('new item');
    });
  });
});
