import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ShareListModalComponent } from './share-list-modal.component';
import { GroceryService } from '../../services/grocery.service';
import { GroceryList, User, PaginatedResponse } from '../../models/api.models';
import { of, throwError } from 'rxjs';

describe('ShareListModalComponent', () => {
  let component: ShareListModalComponent;
  let fixture: ComponentFixture<ShareListModalComponent>;
  let mockGroceryService: jasmine.SpyObj<GroceryService>;

  const mockGroceryList: GroceryList = {
    id: 1,
    name: 'Test List',
    owner: 1,
    shared_with: [
      {
        id: 2,
        username: 'shared_user',
        email: 'shared@test.com',
        first_name: 'Shared',
        last_name: 'User',
      },
    ],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    item_count: 0,
  };

  const mockSearchResults: PaginatedResponse<User> = {
    count: 2,
    results: [
      { id: 3, username: 'john_doe', email: 'john@test.com', first_name: 'John', last_name: 'Doe' },
      {
        id: 4,
        username: 'jane_smith',
        email: 'jane@test.com',
        first_name: 'Jane',
        last_name: 'Smith',
      },
    ],
  };

  beforeEach(async () => {
    const groceryServiceSpy = jasmine.createSpyObj('GroceryService', [
      'searchUsers',
      'shareList',
      'removeUserFromList',
    ]);

    await TestBed.configureTestingModule({
      imports: [ShareListModalComponent],
      providers: [{ provide: GroceryService, useValue: groceryServiceSpy }],
    }).compileComponents();

    mockGroceryService = TestBed.inject(GroceryService) as jasmine.SpyObj<GroceryService>;

    // Set default return value for searchUsers to prevent RxJS errors
    mockGroceryService.searchUsers.and.returnValue(of({ count: 0, results: [] }));

    fixture = TestBed.createComponent(ShareListModalComponent);
    component = fixture.componentInstance;

    // Set default input values
    component.groceryList = mockGroceryList;
    component.isVisible = true;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default state', () => {
      expect(component.isLoading()).toBe(false);
      expect(component.errorMessage()).toBe('');
      expect(component.successMessage()).toBe('');
      expect(component.searchResults()).toEqual([]);
      expect(component.isSearching()).toBe(false);
      expect(component.searchQuery).toBe('');
    });

    it('should display grocery list name when visible', () => {
      const compiled = fixture.nativeElement;
      const listNameElement = compiled.querySelector('h2 + p');
      expect(listNameElement?.textContent).toContain('Test List');
    });

    it('should display currently shared users', () => {
      const compiled = fixture.nativeElement;
      const sharedUserElement = compiled.querySelector('[data-cy="remove-shared-user"]');
      expect(sharedUserElement).toBeTruthy();
    });
  });

  describe('User Search', () => {
    it('should not search when query is less than 2 characters', fakeAsync(() => {
      component.onSearchInput('a');
      tick(400);

      expect(mockGroceryService.searchUsers).not.toHaveBeenCalled();
      expect(component.searchResults()).toEqual([]);
    }));

    it('should search users with debounce when query is 2+ characters', fakeAsync(() => {
      mockGroceryService.searchUsers.and.returnValue(of(mockSearchResults));

      component.onSearchInput('john');
      expect(component.isSearching()).toBe(false); // Not searching yet due to debounce

      tick(400);

      expect(mockGroceryService.searchUsers).toHaveBeenCalledWith('john');
      expect(component.searchResults()).toEqual(mockSearchResults.results);
      expect(component.isSearching()).toBe(false);
    }));

    it('should handle search errors gracefully', fakeAsync(() => {
      mockGroceryService.searchUsers.and.returnValue(
        throwError(() => ({ error: 'Search failed' }))
      );

      component.onSearchInput('test');
      tick(400);

      expect(component.searchResults()).toEqual([]);
      expect(component.isSearching()).toBe(false);
    }));

    it('should clear messages when searching', fakeAsync(() => {
      component.errorMessage.set('Previous error');
      component.successMessage.set('Previous success');

      component.onSearchInput('test');

      expect(component.errorMessage()).toBe('');
      expect(component.successMessage()).toBe('');
    }));
  });

  describe('Sharing Functionality', () => {
    it('should share list with user successfully', () => {
      mockGroceryService.shareList.and.returnValue(of(void 0));
      spyOn(component.shared, 'emit');

      component.shareWithUser('new_user');

      expect(mockGroceryService.shareList).toHaveBeenCalledWith(1, 'new_user');
      expect(component.shared.emit).toHaveBeenCalledWith('new_user');
      expect(component.successMessage()).toBe('Successfully shared list with new_user!');
      expect(component.searchQuery).toBe('');
      expect(component.searchResults()).toEqual([]);
      expect(component.isLoading()).toBe(false);
    });

    it('should handle sharing errors', () => {
      const errorResponse = { error: { error: 'User not found' } };
      mockGroceryService.shareList.and.returnValue(throwError(() => errorResponse));

      component.shareWithUser('invalid_user');

      expect(component.errorMessage()).toBe('User not found');
      expect(component.isLoading()).toBe(false);
    });

    it('should handle array of sharing errors', () => {
      const errorResponse = { error: { error: ['Error 1', 'Error 2'] } };
      mockGroceryService.shareList.and.returnValue(throwError(() => errorResponse));

      component.shareWithUser('invalid_user');

      expect(component.errorMessage()).toBe('Error 1 Error 2');
    });

    it('should not share if no grocery list is selected', () => {
      component.groceryList = null;

      component.shareWithUser('test_user');

      expect(mockGroceryService.shareList).not.toHaveBeenCalled();
    });
  });

  describe('Remove User Functionality', () => {
    it('should remove user from list successfully', () => {
      mockGroceryService.removeUserFromList.and.returnValue(of(void 0));
      spyOn(component.userRemoved, 'emit');

      component.removeUser('shared_user');

      expect(mockGroceryService.removeUserFromList).toHaveBeenCalledWith(1, 'shared_user');
      expect(component.userRemoved.emit).toHaveBeenCalledWith('shared_user');
      expect(component.successMessage()).toBe('Successfully removed shared_user from list!');
      expect(component.isLoading()).toBe(false);
    });

    it('should handle remove user errors', () => {
      const errorResponse = { error: { error: 'Permission denied' } };
      mockGroceryService.removeUserFromList.and.returnValue(throwError(() => errorResponse));

      component.removeUser('shared_user');

      expect(component.errorMessage()).toBe('Permission denied');
      expect(component.isLoading()).toBe(false);
    });

    it('should not remove user if no grocery list is selected', () => {
      component.groceryList = null;

      component.removeUser('test_user');

      expect(mockGroceryService.removeUserFromList).not.toHaveBeenCalled();
    });
  });

  describe('Modal Control', () => {
    it('should close modal and clear state', () => {
      spyOn(component.close, 'emit');
      component.searchQuery = 'test';
      component.searchResults.set(mockSearchResults.results);
      component.errorMessage.set('Test error');
      component.successMessage.set('Test success');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
      expect(component.searchQuery).toBe('');
      expect(component.searchResults()).toEqual([]);
      expect(component.errorMessage()).toBe('');
      expect(component.successMessage()).toBe('');
    });
  });

  describe('UI Elements', () => {
    it('should have required modal elements', () => {
      const compiled = fixture.nativeElement;

      expect(compiled.querySelector('[data-cy="share-search-input"]')).toBeTruthy();
      expect(compiled.querySelector('[data-cy="share-modal-close"]')).toBeTruthy();
      expect(compiled.querySelector('h2')).toBeTruthy();
    });

    it('should show search results when available', fakeAsync(() => {
      mockGroceryService.searchUsers.and.returnValue(of(mockSearchResults));

      component.onSearchInput('john');
      tick(400);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const searchResultButtons = compiled.querySelectorAll('[data-cy="share-user-option"]');
      expect(searchResultButtons.length).toBe(2);
    }));

    it('should show "no users found" message when search returns empty', fakeAsync(() => {
      mockGroceryService.searchUsers.and.returnValue(of({ count: 0, results: [] }));

      component.onSearchInput('nonexistent');
      tick(400);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const noResultsMessage = compiled.textContent;
      expect(noResultsMessage).toContain('No users found matching "nonexistent"');
    }));

    it('should disable buttons when loading', () => {
      component.isLoading.set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const searchButton = compiled.querySelector('[data-cy="share-user-option"]');
      const removeButton = compiled.querySelector('[data-cy="remove-shared-user"]');

      if (searchButton) expect(searchButton.disabled).toBe(true);
      if (removeButton) expect(removeButton.disabled).toBe(true);
    });

    it('should display error messages with correct styling', () => {
      component.errorMessage.set('Test error message');
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const errorDiv = compiled.querySelector('.bg-error-50');
      expect(errorDiv).toBeTruthy();
      expect(errorDiv.textContent).toContain('Test error message');
    });

    it('should display success messages with correct styling', () => {
      component.successMessage.set('Test success message');
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const successDiv = compiled.querySelector('.bg-success-50');
      expect(successDiv).toBeTruthy();
      expect(successDiv.textContent).toContain('Test success message');
    });
  });

  describe('Error Message Extraction', () => {
    it('should extract error message from various error formats', () => {
      // Test private method indirectly through shareWithUser
      const testCases = [
        { error: { error: { error: 'Direct error' } }, expected: 'Direct error' },
        { error: { error: { error: ['Error 1', 'Error 2'] } }, expected: 'Error 1 Error 2' },
        { error: { message: 'Network error' }, expected: 'Network error' },
        { error: {}, expected: 'An error occurred. Please try again.' },
      ];

      testCases.forEach(({ error, expected }) => {
        mockGroceryService.shareList.and.returnValue(throwError(() => error));
        component.shareWithUser('test');
        expect(component.errorMessage()).toBe(expected);
      });
    });
  });
});
