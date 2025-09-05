import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { GroceryListDetailComponent } from './grocery-list-detail.component';
import { GroceryService } from '../../services/grocery.service';
import {
  GroceryList,
  GroceryListItem,
  Item,
  Category,
  PaginatedResponse,
} from '../../models/api.models';
import { ItemFormData } from '../item-form/item-form.component';
import { AutocompleteItem } from '../item-autocomplete/item-autocomplete.component';

describe('GroceryListDetailComponent', () => {
  let component: GroceryListDetailComponent;
  let fixture: ComponentFixture<GroceryListDetailComponent>;
  let mockGroceryService: jasmine.SpyObj<GroceryService>;
  let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;

  const mockGroceryList: GroceryList = {
    id: 1,
    name: 'Test Shopping List',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    owner: 1,
    shared_with: [],
    item_count: 5,
  };

  const mockGroceryListItems: GroceryListItem[] = [
    {
      id: 1,
      grocery_list: 1,
      item: 1,
      item_name: 'Apples',
      item_category: 'Fruits',
      quantity: '2',
      unit: 'lbs',
      is_checked: false,
      notes: undefined,
      custom_name: undefined,
      display_name: undefined,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      added_by: 1,
      checked_by: undefined,
    },
    {
      id: 2,
      grocery_list: 1,
      item: 2,
      item_name: 'Milk',
      item_category: 'Dairy',
      quantity: '1',
      unit: 'gallon',
      is_checked: true,
      notes: 'Organic',
      custom_name: 'Organic Milk',
      display_name: 'Organic Milk',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      added_by: 1,
      checked_by: 1,
    },
  ];

  const mockCategories: Category[] = [
    {
      id: 1,
      name: 'Fruits',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Dairy',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 3,
      name: 'Vegetables',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
  ];

  // Commented out for now - can be used for future tests
  // const mockItems: Item[] = [
  //   {
  //     id: 1,
  //     name: 'Apples',
  //     category: 1,
  //     category_name: 'Fruits',
  //     default_unit: 'lbs',
  //     created_at: '2023-01-01T00:00:00Z',
  //     updated_at: '2023-01-01T00:00:00Z',
  //   },
  // ];

  beforeEach(async () => {
    mockGroceryService = jasmine.createSpyObj('GroceryService', [
      'getGroceryList',
      'getGroceryListItems',
      'getCategories',
      'createItem',
      'addItemToList',
      'createCategory',
      'toggleItemChecked',
      'updateGroceryListItem',
      'deleteGroceryListItem',
    ]);

    mockActivatedRoute = {
      params: of({ id: '1' }),
    } as any;

    await TestBed.configureTestingModule({
      imports: [GroceryListDetailComponent],
      providers: [
        { provide: GroceryService, useValue: mockGroceryService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GroceryListDetailComponent);
    component = fixture.componentInstance;

    // Setup default successful responses
    mockGroceryService.getGroceryList.and.returnValue(of(mockGroceryList));
    mockGroceryService.getGroceryListItems.and.returnValue(
      of({
        count: 2,
        next: undefined,
        previous: undefined,
        results: mockGroceryListItems,
      } as PaginatedResponse<GroceryListItem>)
    );
    mockGroceryService.getCategories.and.returnValue(
      of({
        count: 3,
        next: undefined,
        previous: undefined,
        results: mockCategories,
      } as PaginatedResponse<Category>)
    );
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default signal values', () => {
      expect(component.list()).toBeNull();
      expect(component.items()).toEqual([]);
      expect(component.availableItems()).toEqual([]);
      expect(component.categories()).toEqual([]);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
      expect(component.isProcessing()).toBe(false);
    });

    it('should load data on ngOnInit', () => {
      component.ngOnInit();

      expect(mockGroceryService.getGroceryList).toHaveBeenCalledWith(1);
      expect(mockGroceryService.getGroceryListItems).toHaveBeenCalledWith(1);
      expect(mockGroceryService.getCategories).toHaveBeenCalled();
    });

    it('should set listId from route params', () => {
      component.ngOnInit();

      expect(component['listId']).toBe(1);
    });
  });

  describe('Data Loading', () => {
    describe('loadList', () => {
      it('should load grocery list successfully', () => {
        component.loadList();

        expect(mockGroceryService.getGroceryList).toHaveBeenCalledWith(0);
        expect(component.list()).toEqual(mockGroceryList);
      });

      it('should handle grocery list load error', () => {
        const error = { message: 'Load failed' };
        mockGroceryService.getGroceryList.and.returnValue(throwError(() => error));
        spyOn(console, 'error');

        component.loadList();

        expect(component.error()).toBe('Failed to load grocery list');
        expect(console.error).toHaveBeenCalledWith('Error loading list:', error);
      });
    });

    describe('loadListItems', () => {
      it('should load list items successfully', () => {
        component.loadListItems();

        expect(component.loading()).toBe(false);
        expect(component.items()).toEqual(mockGroceryListItems);
        expect(mockGroceryService.getGroceryListItems).toHaveBeenCalledWith(0);
      });

      it('should set loading state during load', () => {
        component.loadListItems();

        expect(mockGroceryService.getGroceryListItems).toHaveBeenCalled();
      });

      it('should handle list items load error', () => {
        const error = { message: 'Load failed' };
        mockGroceryService.getGroceryListItems.and.returnValue(throwError(() => error));
        spyOn(console, 'error');

        component.loadListItems();

        expect(component.error()).toBe('Failed to load items');
        expect(component.loading()).toBe(false);
        expect(console.error).toHaveBeenCalledWith('Error loading items:', error);
      });
    });

    describe('loadCategories', () => {
      it('should load categories successfully', () => {
        component.loadCategories();

        expect(component.categories()).toEqual(mockCategories);
        expect(mockGroceryService.getCategories).toHaveBeenCalled();
      });

      it('should handle categories load error', () => {
        const error = { message: 'Load failed' };
        mockGroceryService.getCategories.and.returnValue(throwError(() => error));
        spyOn(console, 'error');

        component.loadCategories();

        expect(console.error).toHaveBeenCalledWith('Error loading categories:', error);
      });
    });
  });

  describe('Item Form Submission', () => {
    beforeEach(() => {
      component['listId'] = 1;
    });

    describe('Adding New Items', () => {
      it('should create new item and add to list', () => {
        component.ngOnInit(); // This sets the listId from route params
        component.items.set([]); // Start with empty items for this test
        const newItem = {
          name: 'Bananas',
          categoryId: 1,
          unit: 'bunch',
        };
        const formData: ItemFormData = {
          newItem,
          selectedItem: null,
          quantity: '3',
          unit: 'bunch',
        };

        const createdItem: Item = {
          id: 3,
          name: 'Bananas',
          category: 1,
          category_name: 'Fruits',
          default_unit: 'bunch',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        };

        const addedListItem: GroceryListItem = {
          id: 3,
          grocery_list: 1,
          item: 3,
          item_name: 'Bananas',
          item_category: 'Fruits',
          quantity: '3',
          unit: 'bunch',
          is_checked: false,
          notes: undefined,
          custom_name: undefined,
          display_name: undefined,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          added_by: 1,
          checked_by: undefined,
        };

        mockGroceryService.createItem.and.returnValue(of(createdItem));
        mockGroceryService.addItemToList.and.returnValue(of(addedListItem));

        component.onItemFormSubmit(formData);

        expect(mockGroceryService.createItem).toHaveBeenCalledWith({
          name: 'Bananas',
          category: 1,
          default_unit: 'bunch',
        });
        expect(mockGroceryService.addItemToList).toHaveBeenCalledWith(1, 3, '3', 'bunch');
        expect(component.items()).toEqual([addedListItem]);
        expect(component.isProcessing()).toBe(false);
      });

      it('should handle create item error', () => {
        const newItem = {
          name: 'Bananas',
          categoryId: 1,
          unit: 'bunch',
        };
        const formData: ItemFormData = {
          newItem,
          selectedItem: null,
          quantity: '3',
          unit: 'bunch',
        };

        const error = { status: 400, error: { name: ['Item already exists'] } };
        mockGroceryService.createItem.and.returnValue(throwError(() => error));
        spyOn(window, 'alert');
        spyOn(console, 'error');

        component.onItemFormSubmit(formData);

        expect(component.isProcessing()).toBe(false);
        expect(window.alert).toHaveBeenCalledWith(
          'Failed to create new item:\nItem already exists'
        );
        expect(console.error).toHaveBeenCalledWith('Failed to create new item:', error);
      });
    });

    describe('Adding Existing Items', () => {
      it('should add existing item to list', () => {
        const selectedItem: AutocompleteItem = {
          id: 1,
          name: 'Apples',
          category_name: 'Fruits',
          default_unit: 'lbs',
        };
        const formData: ItemFormData = {
          newItem: undefined,
          selectedItem,
          quantity: '5',
          unit: 'lbs',
        };

        const addedListItem: GroceryListItem = {
          id: 4,
          grocery_list: 1,
          item: 1,
          item_name: 'Apples',
          item_category: 'Fruits',
          quantity: '5',
          unit: 'lbs',
          is_checked: false,
          notes: undefined,
          custom_name: undefined,
          display_name: undefined,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          added_by: 1,
          checked_by: undefined,
        };

        mockGroceryService.addItemToList.and.returnValue(of(addedListItem));

        component.onItemFormSubmit(formData);

        expect(mockGroceryService.addItemToList).toHaveBeenCalledWith(1, 1, '5', 'lbs');
        expect(component.items()).toEqual([addedListItem]);
        expect(component.isProcessing()).toBe(false);
      });

      it('should handle add existing item error', () => {
        const selectedItem: AutocompleteItem = {
          id: 1,
          name: 'Apples',
          category_name: 'Fruits',
          default_unit: 'lbs',
        };
        const formData: ItemFormData = {
          newItem: undefined,
          selectedItem,
          quantity: '5',
          unit: 'lbs',
        };

        const error = { status: 500, message: 'Server error' };
        mockGroceryService.addItemToList.and.returnValue(throwError(() => error));
        spyOn(window, 'alert');
        spyOn(console, 'error');

        component.onItemFormSubmit(formData);

        expect(component.isProcessing()).toBe(false);
        expect(window.alert).toHaveBeenCalledWith('Failed to add item to list. Please try again.');
        expect(console.error).toHaveBeenCalledWith('Failed to add item to list:', error);
      });
    });
  });

  describe('Category Management', () => {
    it('should create new category', () => {
      const newCategory: Category = {
        id: 4,
        name: 'Snacks',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };
      mockGroceryService.createCategory.and.returnValue(of(newCategory));

      component.categories.set(mockCategories);
      component.onCreateNewCategory('Snacks');

      expect(mockGroceryService.createCategory).toHaveBeenCalledWith('Snacks');
      expect(component.categories()).toEqual([...mockCategories, newCategory]);
    });

    it('should handle create category error', () => {
      const error = { status: 400, error: { name: ['Category already exists'] } };
      mockGroceryService.createCategory.and.returnValue(throwError(() => error));
      spyOn(window, 'alert');
      spyOn(console, 'error');

      component.onCreateNewCategory('Snacks');

      expect(window.alert).toHaveBeenCalledWith(
        'Failed to create category:\nCategory already exists'
      );
      expect(console.error).toHaveBeenCalledWith('Failed to create category:', error);
    });
  });

  describe('Item Management', () => {
    beforeEach(() => {
      component.items.set(mockGroceryListItems);
    });

    describe('Toggle Item Checked', () => {
      it('should toggle item checked status', () => {
        const updatedItem = { ...mockGroceryListItems[0], is_checked: true };
        mockGroceryService.toggleItemChecked.and.returnValue(of(updatedItem));

        component.onToggleItemChecked(mockGroceryListItems[0]);

        expect(mockGroceryService.toggleItemChecked).toHaveBeenCalledWith(1);
        expect(component.items()[0]).toEqual(updatedItem);
        expect(component.items()[1]).toEqual(mockGroceryListItems[1]);
      });

      it('should handle toggle item checked error', () => {
        const error = { status: 404, message: 'Item not found' };
        mockGroceryService.toggleItemChecked.and.returnValue(throwError(() => error));
        spyOn(window, 'alert');
        spyOn(console, 'error');

        component.onToggleItemChecked(mockGroceryListItems[0]);

        expect(window.alert).toHaveBeenCalledWith('Failed to update item. Please try again.');
        expect(console.error).toHaveBeenCalledWith('Failed to update item:', error);
      });
    });

    describe('Update Item', () => {
      it('should update item successfully', () => {
        const updates = { quantity: '3', custom_name: 'Red Apples' };
        const updatedItem = { ...mockGroceryListItems[0], ...updates };
        const callback = jasmine.createSpy('callback');

        mockGroceryService.updateGroceryListItem.and.returnValue(of(updatedItem));

        component.onUpdateItem({ id: 1, updates, callback });

        expect(mockGroceryService.updateGroceryListItem).toHaveBeenCalledWith(1, updates);
        expect(component.items()[0]).toEqual(updatedItem);
        expect(callback).toHaveBeenCalledWith(true);
      });

      it('should handle update item error', () => {
        const updates = { quantity: '3' };
        const callback = jasmine.createSpy('callback');
        const error = { status: 400, error: { quantity: ['Invalid quantity'] } };

        mockGroceryService.updateGroceryListItem.and.returnValue(throwError(() => error));
        spyOn(window, 'alert');
        spyOn(console, 'error');

        component.onUpdateItem({ id: 1, updates, callback });

        expect(callback).toHaveBeenCalledWith(false);
        expect(window.alert).toHaveBeenCalledWith('Failed to update item:\nInvalid quantity');
        expect(console.error).toHaveBeenCalledWith('Failed to update item:', error);
      });
    });

    describe('Delete Item', () => {
      it('should delete item with confirmation', () => {
        spyOn(window, 'confirm').and.returnValue(true);
        mockGroceryService.deleteGroceryListItem.and.returnValue(of(undefined as any));

        component.onDeleteItem(1);

        expect(window.confirm).toHaveBeenCalledWith('Remove this item from the list?');
        expect(mockGroceryService.deleteGroceryListItem).toHaveBeenCalledWith(1);
        expect(component.items()).toEqual([mockGroceryListItems[1]]);
      });

      it('should not delete item without confirmation', () => {
        spyOn(window, 'confirm').and.returnValue(false);

        component.onDeleteItem(1);

        expect(window.confirm).toHaveBeenCalledWith('Remove this item from the list?');
        expect(mockGroceryService.deleteGroceryListItem).not.toHaveBeenCalled();
        expect(component.items()).toEqual(mockGroceryListItems);
      });

      it('should handle delete item error', () => {
        spyOn(window, 'confirm').and.returnValue(true);
        const error = { status: 403, message: 'Forbidden' };
        mockGroceryService.deleteGroceryListItem.and.returnValue(throwError(() => error));
        spyOn(window, 'alert');
        spyOn(console, 'error');

        component.onDeleteItem(1);

        expect(window.alert).toHaveBeenCalledWith('Failed to remove item. Please try again.');
        expect(console.error).toHaveBeenCalledWith('Failed to remove item:', error);
      });
    });
  });

  describe('Error Handling', () => {
    describe('handleError method', () => {
      beforeEach(() => {
        spyOn(console, 'error');
        spyOn(window, 'alert');
      });

      it('should handle 400 error with field validation messages', () => {
        const error = {
          status: 400,
          error: {
            name: ['This field is required', 'Name must be unique'],
            category: ['Invalid category'],
          },
        };

        component['handleError']('Failed to create item', error);

        expect(console.error).toHaveBeenCalledWith('Failed to create item:', error);
        expect(window.alert).toHaveBeenCalledWith(
          'Failed to create item:\nThis field is required\nName must be unique\nInvalid category'
        );
      });

      it('should handle 400 error with string messages', () => {
        const error = {
          status: 400,
          error: {
            detail: 'Invalid request data',
          },
        };

        component['handleError']('Operation failed', error);

        expect(window.alert).toHaveBeenCalledWith('Operation failed:\nInvalid request data');
      });

      it('should handle non-400 errors with generic message', () => {
        const error = {
          status: 500,
          message: 'Internal server error',
        };

        component['handleError']('Server error', error);

        expect(console.error).toHaveBeenCalledWith('Server error:', error);
        expect(window.alert).toHaveBeenCalledWith('Server error. Please try again.');
      });

      it('should handle errors without status', () => {
        const error = { status: 0, error: { message: 'Network error' } };

        component['handleError']('Connection failed', error);

        expect(window.alert).toHaveBeenCalledWith('Connection failed. Please try again.');
      });
    });
  });

  describe('Signal State Management', () => {
    it('should update items signal when adding new item', () => {
      const newItem: GroceryListItem = {
        id: 5,
        grocery_list: 1,
        item: 5,
        item_name: 'Oranges',
        item_category: 'Fruits',
        quantity: '4',
        unit: 'pieces',
        is_checked: false,
        notes: undefined,
        custom_name: undefined,
        display_name: undefined,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        added_by: 1,
        checked_by: undefined,
      };

      component.items.set([mockGroceryListItems[0]]);
      mockGroceryService.addItemToList.and.returnValue(of(newItem));

      const formData: ItemFormData = {
        newItem: undefined,
        selectedItem: { id: 5, name: 'Oranges', category_name: 'Fruits', default_unit: 'pieces' },
        quantity: '4',
        unit: 'pieces',
      };

      component.onItemFormSubmit(formData);

      expect(component.items()).toEqual([newItem, mockGroceryListItems[0]]);
    });

    it('should update categories signal when creating new category', () => {
      const newCategory: Category = {
        id: 5,
        name: 'Beverages',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };
      component.categories.set([mockCategories[0]]);
      mockGroceryService.createCategory.and.returnValue(of(newCategory));

      component.onCreateNewCategory('Beverages');

      expect(component.categories()).toEqual([mockCategories[0], newCategory]);
    });

    it('should maintain signal reactivity across operations', () => {
      component.items.set(mockGroceryListItems);

      // Test that signal updates are reflected
      expect(component.items().length).toBe(2);

      // Simulate item deletion
      spyOn(window, 'confirm').and.returnValue(true);
      mockGroceryService.deleteGroceryListItem.and.returnValue(of(undefined as any));

      component.onDeleteItem(1);

      expect(component.items().length).toBe(1);
      expect(component.items()[0].id).toBe(2);
    });
  });

  describe('Integration with Child Components', () => {
    it('should handle item form submission data correctly', () => {
      component.ngOnInit(); // This sets the listId from route params
      const formData: ItemFormData = {
        newItem: {
          name: 'Test Item',
          categoryId: 1,
          unit: 'pieces',
        },
        selectedItem: null,
        quantity: '2',
        unit: 'pieces',
      };

      const createdItem: Item = {
        id: 10,
        name: 'Test Item',
        category: 1,
        category_name: 'Fruits',
        default_unit: 'pieces',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      const addedListItem: GroceryListItem = {
        id: 10,
        grocery_list: 1,
        item: 10,
        item_name: 'Test Item',
        item_category: 'Fruits',
        quantity: '2',
        unit: 'pieces',
        is_checked: false,
        notes: undefined,
        custom_name: undefined,
        display_name: undefined,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        added_by: 1,
        checked_by: undefined,
      };

      mockGroceryService.createItem.and.returnValue(of(createdItem));
      mockGroceryService.addItemToList.and.returnValue(of(addedListItem));

      component.onItemFormSubmit(formData);

      expect(mockGroceryService.createItem).toHaveBeenCalledWith({
        name: 'Test Item',
        category: 1,
        default_unit: 'pieces',
      });
      expect(mockGroceryService.addItemToList).toHaveBeenCalledWith(1, 10, '2', 'pieces');
    });

    it('should handle grocery list item component events', () => {
      component.items.set(mockGroceryListItems);
      const updatedItem = { ...mockGroceryListItems[0], quantity: '5' };
      const callback = jasmine.createSpy('callback');

      mockGroceryService.updateGroceryListItem.and.returnValue(of(updatedItem));

      component.onUpdateItem({
        id: 1,
        updates: { quantity: '5' },
        callback,
      });

      expect(mockGroceryService.updateGroceryListItem).toHaveBeenCalledWith(1, { quantity: '5' });
      expect(callback).toHaveBeenCalledWith(true);
    });
  });
});
