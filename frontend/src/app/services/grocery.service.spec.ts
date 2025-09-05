import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GroceryService } from './grocery.service';
import {
  Category,
  Item,
  GroceryList,
  GroceryListItem,
  PaginatedResponse,
} from '../models/api.models';

describe('GroceryService', () => {
  let service: GroceryService;
  let httpMock: HttpTestingController;

  // Mock data for testing - represents your new backend structure
  const mockCategory: Category = {
    id: 1,
    name: 'Fruits',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  const mockItem: Item = {
    id: 1,
    name: 'Apple',
    category: 1,
    category_name: 'Fruits',
    default_unit: 'piece',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  const mockGroceryList: GroceryList = {
    id: 1,
    name: 'Weekly Shopping',
    owner: 1,
    owner_username: 'testuser',
    shared_with: [],
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    item_count: 0,
  };

  const mockGroceryListItem: GroceryListItem = {
    id: 1,
    grocery_list: 1,
    item: 1,
    item_name: 'Apple',
    item_category: 'Fruits',
    custom_name: 'Organic Apples', // NEW: Custom naming feature
    display_name: 'Organic Apples', // NEW: Display name logic
    quantity: '5',
    unit: 'pieces',
    notes: 'Get the red ones',
    is_checked: false,
    added_by: 1,
    added_by_username: 'testuser',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  const mockPaginatedResponse = <T>(results: T[]): PaginatedResponse<T> => ({
    count: results.length,
    next: undefined,
    previous: undefined,
    results,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(GroceryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should determine correct API URL for localhost', () => {
      service.getCategories().subscribe();

      const req = httpMock.expectOne((req) => req.url.includes('/api/categories/'));
      expect(req.request.url).toBeTruthy();
      req.flush(mockPaginatedResponse([mockCategory]));
    });
  });

  describe('Category Management', () => {
    it('should get categories with pagination', () => {
      const mockCategories = [mockCategory];
      const expectedResponse = mockPaginatedResponse(mockCategories);

      service.getCategories().subscribe((response) => {
        expect(response).toEqual(expectedResponse);
        expect(response.results.length).toBe(1);
        expect(response.results[0].name).toBe('Fruits');
      });

      const req = httpMock.expectOne(
        (req) => req.url.includes('/api/categories/') && req.method === 'GET'
      );
      req.flush(expectedResponse);
    });

    it('should create new category', () => {
      const categoryName = 'Vegetables';
      const expectedCategory: Category = {
        ...mockCategory,
        id: 2,
        name: categoryName,
      };

      service.createCategory(categoryName).subscribe((category) => {
        expect(category).toEqual(expectedCategory);
        expect(category.name).toBe(categoryName);
      });

      const req = httpMock.expectOne(
        (req) => req.url.includes('/api/categories/') && req.method === 'POST'
      );
      expect(req.request.body).toEqual({ name: categoryName });
      req.flush(expectedCategory);
    });
  });

  describe('Item Management', () => {
    it('should get items with pagination', () => {
      const mockItems = [mockItem];
      const expectedResponse = mockPaginatedResponse(mockItems);

      service.getItems().subscribe((response) => {
        expect(response).toEqual(expectedResponse);
        expect(response.results[0].name).toBe('Apple');
        expect(response.results[0].category_name).toBe('Fruits');
      });

      const req = httpMock.expectOne(
        (req) => req.url.includes('/api/items/') && req.method === 'GET'
      );
      req.flush(expectedResponse);
    });

    it('should search items with query parameter', () => {
      const searchQuery = 'apple';
      const mockItems = [mockItem];
      const expectedResponse = mockPaginatedResponse(mockItems);

      service.searchItems(searchQuery).subscribe((response) => {
        expect(response).toEqual(expectedResponse);
        expect(response.results.length).toBe(1);
      });

      const req = httpMock.expectOne(
        (req) =>
          req.url.includes('/api/items/') &&
          req.url.includes(`search=${encodeURIComponent(searchQuery)}`) &&
          req.method === 'GET'
      );
      req.flush(expectedResponse);
    });

    it('should create new item', () => {
      const newItemData: Partial<Item> = {
        name: 'Banana',
        category: 1,
        default_unit: 'piece',
      };
      const expectedItem: Item = {
        ...mockItem,
        id: 2,
        name: 'Banana',
      };

      service.createItem(newItemData).subscribe((item) => {
        expect(item).toEqual(expectedItem);
        expect(item.name).toBe('Banana');
      });

      const req = httpMock.expectOne(
        (req) => req.url.includes('/api/items/') && req.method === 'POST'
      );
      expect(req.request.body).toEqual(newItemData);
      req.flush(expectedItem);
    });

    it('should update item with PUT request', () => {
      const itemId = 1;
      const updateData: Partial<Item> = {
        name: 'Green Apple',
        default_unit: 'kg',
      };
      const expectedItem: Item = {
        ...mockItem,
        name: 'Green Apple',
        default_unit: 'kg',
      };

      service.updateItem(itemId, updateData).subscribe((item) => {
        expect(item).toEqual(expectedItem);
      });

      const req = httpMock.expectOne(
        (req) => req.url.includes(`/api/items/${itemId}/`) && req.method === 'PUT'
      );
      expect(req.request.body).toEqual(updateData);
      req.flush(expectedItem);
    });

    it('should delete item', () => {
      const itemId = 1;

      service.deleteItem(itemId).subscribe((response) => {
        expect(response).toBeNull();
      });

      const req = httpMock.expectOne(
        (req) => req.url.includes(`/api/items/${itemId}/`) && req.method === 'DELETE'
      );
      req.flush(null);
    });
  });

  describe('Item Validation', () => {
    it('should validate new item with valid data', () => {
      const errors = service.validateNewItem('Apple', 1, 'piece');
      expect(errors).toEqual([]);
    });

    it('should return errors for empty item name', () => {
      const errors = service.validateNewItem('', 1, 'piece');
      expect(errors).toContain('Item name is required');
    });

    it('should return errors for whitespace-only item name', () => {
      const errors = service.validateNewItem('   ', 1, 'piece');
      expect(errors).toContain('Item name is required');
    });

    it('should return errors for invalid category', () => {
      const errors = service.validateNewItem('Apple', 0, 'piece');
      expect(errors).toContain('Category is required');
    });

    it('should return errors for empty default unit', () => {
      const errors = service.validateNewItem('Apple', 1, '');
      expect(errors).toContain('Default unit is required');
    });

    it('should return multiple errors for invalid data', () => {
      const errors = service.validateNewItem('', 0, '');
      expect(errors.length).toBe(3);
      expect(errors).toContain('Item name is required');
      expect(errors).toContain('Category is required');
      expect(errors).toContain('Default unit is required');
    });
  });

  describe('Grocery List Management', () => {
    it('should get grocery lists with pagination', () => {
      const mockLists = [mockGroceryList];
      const expectedResponse = mockPaginatedResponse(mockLists);

      service.getGroceryLists().subscribe((response) => {
        expect(response).toEqual(expectedResponse);
        expect(response.results[0].name).toBe('Weekly Shopping');
        expect(response.results[0].owner_username).toBe('testuser');
      });

      const req = httpMock.expectOne(
        (req) => req.url.includes('/api/grocery-lists/') && req.method === 'GET'
      );
      req.flush(expectedResponse);
    });

    it('should get single grocery list by id', () => {
      const listId = 1;

      service.getGroceryList(listId).subscribe((list) => {
        expect(list).toEqual(mockGroceryList);
        expect(list.id).toBe(listId);
      });

      const req = httpMock.expectOne(
        (req) => req.url.includes(`/api/grocery-lists/${listId}/`) && req.method === 'GET'
      );
      req.flush(mockGroceryList);
    });

    it('should create new grocery list', () => {
      const listName = 'Party Shopping';
      const expectedList: GroceryList = {
        ...mockGroceryList,
        id: 2,
        name: listName,
      };

      service.createGroceryList(listName).subscribe((list) => {
        expect(list).toEqual(expectedList);
        expect(list.name).toBe(listName);
      });

      const req = httpMock.expectOne(
        (req) => req.url.includes('/api/grocery-lists/') && req.method === 'POST'
      );
      expect(req.request.body).toEqual({ name: listName });
      req.flush(expectedList);
    });

    it('should update grocery list', () => {
      const listId = 1;
      const updateData: Partial<GroceryList> = {
        name: 'Updated Weekly Shopping',
      };
      const expectedList: GroceryList = {
        ...mockGroceryList,
        name: 'Updated Weekly Shopping',
      };

      service.updateGroceryList(listId, updateData).subscribe((list) => {
        expect(list).toEqual(expectedList);
      });

      const req = httpMock.expectOne(
        (req) => req.url.includes(`/api/grocery-lists/${listId}/`) && req.method === 'PUT'
      );
      expect(req.request.body).toEqual(updateData);
      req.flush(expectedList);
    });

    it('should delete grocery list', () => {
      const listId = 1;

      service.deleteGroceryList(listId).subscribe((response) => {
        expect(response).toBeNull();
      });

      const req = httpMock.expectOne(
        (req) => req.url.includes(`/api/grocery-lists/${listId}/`) && req.method === 'DELETE'
      );
      req.flush(null);
    });

    it('should share grocery list with user', () => {
      const listId = 1;
      const username = 'friend@example.com';

      service.shareList(listId, username).subscribe((response) => {
        expect(response).toBeNull();
      });

      const req = httpMock.expectOne(
        (req) =>
          req.url.includes(`/api/grocery-lists/${listId}/share_with/`) && req.method === 'POST'
      );
      expect(req.request.body).toEqual({ username });
      req.flush(null);
    });
  });

  // GROUP 6: Grocery List Items tests (Your new features!)
  describe('Grocery List Items - New Features', () => {
    it('should get grocery list items with list filter', () => {
      const listId = 1;
      const mockItems = [mockGroceryListItem];
      const expectedResponse = mockPaginatedResponse(mockItems);

      service.getGroceryListItems(listId).subscribe((response) => {
        expect(response).toEqual(expectedResponse);
        expect(response.results[0].custom_name).toBe('Organic Apples'); // NEW: Custom naming
        expect(response.results[0].display_name).toBe('Organic Apples'); // NEW: Display name
      });

      const req = httpMock.expectOne(
        (req) =>
          req.url.includes('/api/grocery-list-items/') &&
          req.url.includes(`grocery_list=${listId}`) &&
          req.method === 'GET'
      );
      req.flush(expectedResponse);
    });

    it('should get all grocery list items without filter', () => {
      const mockItems = [mockGroceryListItem];
      const expectedResponse = mockPaginatedResponse(mockItems);

      service.getGroceryListItems().subscribe((response) => {
        expect(response).toEqual(expectedResponse);
      });

      const req = httpMock.expectOne(
        (req) =>
          req.url.includes('/api/grocery-list-items/') &&
          !req.url.includes('grocery_list=') &&
          req.method === 'GET'
      );
      req.flush(expectedResponse);
    });

    // NEW FEATURE: Test duplicate item addition (creates separate entries)
    it('should add item to list creating separate entry (new duplicate behavior)', () => {
      const listId = 1;
      const itemId = 1;
      const quantity = '3';
      const unit = 'lbs';

      const expectedListItem: GroceryListItem = {
        ...mockGroceryListItem,
        id: 2, // NEW entry, not updating existing
        quantity: '3',
        unit: 'lbs',
        custom_name: '', // No custom name initially
        display_name: 'Apple', // Falls back to item name
      };

      service.addItemToList(listId, itemId, quantity, unit).subscribe((listItem) => {
        expect(listItem).toEqual(expectedListItem);
        expect(listItem.quantity).toBe('3');
        expect(listItem.unit).toBe('lbs');
        // CONCEPT: Verify it creates NEW entry instead of updating existing
        expect(listItem.id).toBe(2);
      });

      const req = httpMock.expectOne(
        (req) => req.url.includes(`/api/grocery-lists/${listId}/add_item/`) && req.method === 'POST'
      );
      expect(req.request.body).toEqual({
        item_id: itemId,
        quantity,
        unit,
      });
      req.flush(expectedListItem);
    });

    it('should add item to list without unit (use default)', () => {
      const listId = 1;
      const itemId = 1;
      const quantity = '5';

      service.addItemToList(listId, itemId, quantity).subscribe((listItem) => {
        expect(listItem.quantity).toBe('5');
        // Should use item's default unit
        expect(listItem.unit).toBeTruthy();
      });

      const req = httpMock.expectOne(
        (req) => req.url.includes(`/api/grocery-lists/${listId}/add_item/`) && req.method === 'POST'
      );
      expect(req.request.body).toEqual({
        item_id: itemId,
        quantity,
        unit: undefined,
      });
      req.flush(mockGroceryListItem);
    });

    it('should update grocery list item with PATCH (partial update)', () => {
      const itemId = 1;
      const updateData: Partial<GroceryListItem> = {
        custom_name: 'Premium Organic Apples',
        quantity: '3',
        notes: 'Get the expensive ones',
      };

      const expectedItem: GroceryListItem = {
        ...mockGroceryListItem,
        custom_name: 'Premium Organic Apples',
        display_name: 'Premium Organic Apples', // Should update based on custom_name
        quantity: '3',
        notes: 'Get the expensive ones',
      };

      service.updateGroceryListItem(itemId, updateData).subscribe((item) => {
        expect(item).toEqual(expectedItem);
        expect(item.custom_name).toBe('Premium Organic Apples');
        expect(item.display_name).toBe('Premium Organic Apples');
      });

      const req = httpMock.expectOne(
        (req) => req.url.includes(`/api/grocery-list-items/${itemId}/`) && req.method === 'PATCH'
      );
      expect(req.request.body).toEqual(updateData);
      req.flush(expectedItem);
    });

    it('should update grocery list item custom name only', () => {
      const itemId = 1;
      const updateData = { custom_name: 'Special Apples' };

      service.updateGroceryListItem(itemId, updateData).subscribe((item) => {
        expect(item.custom_name).toBe('Special Apples');
      });

      const req = httpMock.expectOne(
        (req) => req.url.includes(`/api/grocery-list-items/${itemId}/`) && req.method === 'PATCH'
      );
      expect(req.request.body).toEqual(updateData);
      req.flush({
        ...mockGroceryListItem,
        custom_name: 'Special Apples',
        display_name: 'Special Apples',
      });
    });

    it('should clear custom name with PATCH', () => {
      const itemId = 1;
      const updateData = { custom_name: '' };

      const expectedItem: GroceryListItem = {
        ...mockGroceryListItem,
        custom_name: '',
        display_name: 'Apple', // Should fall back to item name
      };

      service.updateGroceryListItem(itemId, updateData).subscribe((item) => {
        expect(item.custom_name).toBe('');
        expect(item.display_name).toBe('Apple'); // Falls back to item name
      });

      const req = httpMock.expectOne(
        (req) => req.url.includes(`/api/grocery-list-items/${itemId}/`) && req.method === 'PATCH'
      );
      req.flush(expectedItem);
    });

    it('should delete grocery list item', () => {
      const itemId = 1;

      service.deleteGroceryListItem(itemId).subscribe((response) => {
        expect(response).toBeNull();
      });

      const req = httpMock.expectOne(
        (req) => req.url.includes(`/api/grocery-list-items/${itemId}/`) && req.method === 'DELETE'
      );
      req.flush(null);
    });

    it('should toggle item checked status', () => {
      const itemId = 1;
      const expectedItem: GroceryListItem = {
        ...mockGroceryListItem,
        is_checked: true,
        checked_by: 1,
        checked_by_username: 'testuser',
        checked_at: '2025-01-01T12:00:00Z',
      };

      service.toggleItemChecked(itemId).subscribe((item) => {
        expect(item).toEqual(expectedItem);
        expect(item.is_checked).toBe(true);
        expect(item.checked_by).toBe(1);
      });

      const req = httpMock.expectOne(
        (req) =>
          req.url.includes(`/api/grocery-list-items/${itemId}/toggle_checked/`) &&
          req.method === 'POST'
      );
      expect(req.request.body).toEqual({});
      req.flush(expectedItem);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors for non-existent grocery list', () => {
      const listId = 999;

      service.getGroceryList(listId).subscribe({
        next: () => fail('Should have failed with 404'),
        error: (error) => {
          expect(error.status).toBe(404);
        },
      });

      const req = httpMock.expectOne((req) => req.url.includes(`/api/grocery-lists/${listId}/`));
      req.flush({ detail: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle 400 errors for invalid item creation', () => {
      const invalidItemData = { name: '', category: undefined };

      service.createItem(invalidItemData).subscribe({
        next: () => fail('Should have failed with 400'),
        error: (error) => {
          expect(error.status).toBe(400);
          expect(error.error).toBeTruthy();
        },
      });

      const req = httpMock.expectOne(
        (req) => req.url.includes('/api/items/') && req.method === 'POST'
      );
      req.flush(
        {
          name: ['This field is required.'],
          category: ['This field may not be null.'],
        },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should handle network errors gracefully', () => {
      service.getCategories().subscribe({
        next: () => fail('Should have failed with network error'),
        error: (error) => {
          expect(error).toBeTruthy();
        },
      });

      const req = httpMock.expectOne((req) => req.url.includes('/api/categories/'));
      req.error(new ErrorEvent('Network error'));
    });
  });
});
