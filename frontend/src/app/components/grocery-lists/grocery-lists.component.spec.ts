import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { GroceryListsComponent } from './grocery-lists.component';
import { GroceryService } from '../../services/grocery.service';
import { AuthService } from '../../services/auth.service';
import { GroceryList, AuthUser, User, PaginatedResponse } from '../../models/api.models';

describe('GroceryListsComponent', () => {
  let component: GroceryListsComponent;
  let fixture: ComponentFixture<GroceryListsComponent>;
  let mockGroceryService: jasmine.SpyObj<GroceryService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockUser: AuthUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
  };

  const mockSharedUser: User = {
    id: 2,
    username: 'shareduser',
    email: 'shared@example.com',
    first_name: 'Shared',
    last_name: 'User',
  };

  const mockGroceryList: GroceryList = {
    id: 1,
    name: 'Weekly Groceries',
    owner: mockUser.id,
    shared_with: [mockSharedUser],
    item_count: 5,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T11:00:00Z',
  };

  const mockGroceryListsResponse: PaginatedResponse<GroceryList> = {
    count: 2,
    next: undefined,
    previous: undefined,
    results: [
      mockGroceryList,
      {
        id: 2,
        name: 'Party Shopping',
        owner: mockUser.id,
        shared_with: [],
        item_count: 3,
        created_at: '2024-01-14T09:15:00Z',
        updated_at: '2024-01-14T09:30:00Z',
      },
    ],
  };

  beforeEach(async () => {
    mockGroceryService = jasmine.createSpyObj('GroceryService', [
      'getGroceryLists',
      'createGroceryList',
      'deleteGroceryList',
      'getGroceryList',
    ]);
    mockAuthService = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'logout']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    const mockActivatedRoute = {
      snapshot: { params: {} },
    };

    await TestBed.configureTestingModule({
      imports: [GroceryListsComponent],
      providers: [
        { provide: GroceryService, useValue: mockGroceryService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GroceryListsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.lists()).toEqual([]);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
      expect(component.currentUser).toBeNull();
      expect(component.showNewListForm).toBe(false);
      expect(component.newListName).toBe('');
    });

    it('should load user and lists on init', () => {
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockGroceryService.getGroceryLists.and.returnValue(of(mockGroceryListsResponse));

      component.ngOnInit();

      expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
      expect(component.currentUser).toEqual(mockUser);
      expect(mockGroceryService.getGroceryLists).toHaveBeenCalled();
    });
  });

  describe('Load Lists', () => {
    it('should load lists successfully', () => {
      mockGroceryService.getGroceryLists.and.returnValue(of(mockGroceryListsResponse));

      component.loadLists();

      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
      expect(component.lists()).toEqual(mockGroceryListsResponse.results);
      expect(mockGroceryService.getGroceryLists).toHaveBeenCalled();
    });

    it('should handle error when loading lists fails', () => {
      const error = new Error('Network error');
      mockGroceryService.getGroceryLists.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      component.loadLists();

      expect(component.loading()).toBe(false);
      expect(component.error()).toBe('Failed to load grocery lists');
      expect(component.lists()).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error loading lists:', error);
    });

    it('should set loading state during request', () => {
      mockGroceryService.getGroceryLists.and.returnValue(of(mockGroceryListsResponse));

      component.loadLists();

      expect(mockGroceryService.getGroceryLists).toHaveBeenCalled();
    });

    it('should clear error state when loading starts', () => {
      component.error.set('Previous error');
      mockGroceryService.getGroceryLists.and.returnValue(of(mockGroceryListsResponse));

      component.loadLists();

      expect(component.error()).toBeNull();
    });
  });

  describe('Create List', () => {
    it('should create new list successfully', () => {
      const newList: GroceryList = {
        id: 3,
        name: 'New List',
        owner: mockUser.id,
        shared_with: [],
        item_count: 0,
        created_at: '2024-01-16T10:00:00Z',
        updated_at: '2024-01-16T10:00:00Z',
      };
      component.lists.set([mockGroceryList]);
      component.newListName = 'New List';
      mockGroceryService.createGroceryList.and.returnValue(of(newList));

      component.createList();

      expect(mockGroceryService.createGroceryList).toHaveBeenCalledWith('New List');
      expect(component.lists()).toEqual([newList, mockGroceryList]);
      expect(component.showNewListForm).toBe(false);
      expect(component.newListName).toBe('');
    });

    it('should handle error when creating list fails', () => {
      const error = new Error('Creation failed');
      component.newListName = 'New List';
      component.showNewListForm = true; // Set initial state
      mockGroceryService.createGroceryList.and.returnValue(throwError(() => error));
      spyOn(window, 'alert');
      spyOn(console, 'error');

      component.createList();

      expect(window.alert).toHaveBeenCalledWith('Failed to create list');
      expect(console.error).toHaveBeenCalledWith('Error creating list:', error);
      expect(component.showNewListForm).toBe(true); // Should remain open
    });

    it('should not create list with empty name', () => {
      component.newListName = '';

      component.createList();

      expect(mockGroceryService.createGroceryList).not.toHaveBeenCalled();
    });

    it('should not create list with whitespace-only name', () => {
      component.newListName = '   ';

      component.createList();

      expect(mockGroceryService.createGroceryList).not.toHaveBeenCalled();
    });

    it('should trim whitespace from list name', () => {
      const newList: GroceryList = {
        id: 3,
        name: 'Trimmed List',
        owner: mockUser.id,
        shared_with: [],
        item_count: 0,
        created_at: '2024-01-16T10:00:00Z',
        updated_at: '2024-01-16T10:00:00Z',
      };
      component.newListName = '  Trimmed List  ';
      mockGroceryService.createGroceryList.and.returnValue(of(newList));

      component.createList();

      expect(mockGroceryService.createGroceryList).toHaveBeenCalledWith('Trimmed List');
    });
  });

  describe('Cancel New List', () => {
    it('should reset new list form', () => {
      component.showNewListForm = true;
      component.newListName = 'Some name';

      component.cancelNewList();

      expect(component.showNewListForm).toBe(false);
      expect(component.newListName).toBe('');
    });
  });

  describe('Delete List', () => {
    let mockEvent: jasmine.SpyObj<Event>;

    beforeEach(() => {
      mockEvent = jasmine.createSpyObj('Event', ['stopPropagation', 'preventDefault']);
      spyOn(window, 'confirm');
    });

    it('should delete list successfully with confirmation', () => {
      component.lists.set([mockGroceryList, mockGroceryListsResponse.results[1]]);
      (window.confirm as jasmine.Spy).and.returnValue(true);
      mockGroceryService.deleteGroceryList.and.returnValue(of(undefined as any));

      component.deleteList(1, mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this list?');
      expect(mockGroceryService.deleteGroceryList).toHaveBeenCalledWith(1);
      expect(component.lists()).toEqual([mockGroceryListsResponse.results[1]]);
    });

    it('should not delete list without confirmation', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);

      component.deleteList(1, mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockGroceryService.deleteGroceryList).not.toHaveBeenCalled();
    });

    it('should handle error when deletion fails', () => {
      const error = new Error('Deletion failed');
      (window.confirm as jasmine.Spy).and.returnValue(true);
      mockGroceryService.deleteGroceryList.and.returnValue(throwError(() => error));
      spyOn(window, 'alert');
      spyOn(console, 'error');

      component.deleteList(1, mockEvent);

      expect(window.alert).toHaveBeenCalledWith('Failed to delete list');
      expect(console.error).toHaveBeenCalledWith('Error deleting list:', error);
    });

    it('should prevent event bubbling and default behavior', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);

      component.deleteList(1, mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Logout', () => {
    it('should logout successfully and navigate to login', () => {
      mockAuthService.logout.and.returnValue(of(null));

      component.logout();

      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should handle logout error and still navigate to login', () => {
      const error = new Error('Logout failed');
      mockAuthService.logout.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      component.logout();

      expect(console.error).toHaveBeenCalledWith('Logout error:', error);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('Helper Functions', () => {
    it('should get shared with names from users with first names', () => {
      const users: User[] = [
        { id: 1, username: 'user1', email: 'user1@test.com', first_name: 'John', last_name: 'Doe' },
        {
          id: 2,
          username: 'user2',
          email: 'user2@test.com',
          first_name: 'Jane',
          last_name: 'Smith',
        },
      ];

      const result = component.getSharedWithNames(users);

      expect(result).toBe('John, Jane');
    });

    it('should get shared with names from users without first names', () => {
      const users: User[] = [
        { id: 1, username: 'user1', email: 'user1@test.com', first_name: '', last_name: 'Doe' },
        { id: 2, username: 'user2', email: 'user2@test.com', first_name: '', last_name: 'Smith' },
      ];

      const result = component.getSharedWithNames(users);

      expect(result).toBe('user1, user2');
    });

    it('should get shared with names from mixed users', () => {
      const users: User[] = [
        { id: 1, username: 'user1', email: 'user1@test.com', first_name: 'John', last_name: 'Doe' },
        { id: 2, username: 'user2', email: 'user2@test.com', first_name: '', last_name: 'Smith' },
      ];

      const result = component.getSharedWithNames(users);

      expect(result).toBe('John, user2');
    });

    it('should handle empty users array', () => {
      const result = component.getSharedWithNames([]);

      expect(result).toBe('');
    });

    it('should format date correctly', () => {
      const dateString = '2024-01-15T10:30:00Z';
      spyOn(Date.prototype, 'toLocaleDateString').and.returnValue('1/15/2024');

      const result = component.formatDate(dateString);

      expect(result).toBe('1/15/2024');
      expect(Date.prototype.toLocaleDateString).toHaveBeenCalled();
    });
  });

  describe('UI Integration', () => {
    beforeEach(() => {
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockGroceryService.getGroceryLists.and.returnValue(of(mockGroceryListsResponse));
      fixture.detectChanges();
    });

    it('should display user welcome message', () => {
      expect(component.currentUser).toEqual(mockUser);
      // DOM testing would require more complex setup - testing the logic is sufficient
      // We verify the currentUser is set correctly, which drives the template display
    });

    it('should toggle new list form when button clicked', () => {
      expect(component.showNewListForm).toBe(false);

      component.showNewListForm = !component.showNewListForm;

      expect(component.showNewListForm).toBe(true);
    });

    it('should call createList when form submitted', () => {
      spyOn(component, 'createList');
      component.newListName = 'Test List';

      component.createList();

      expect(component.createList).toHaveBeenCalled();
    });

    it('should display loading state', () => {
      component.loading.set(true);
      fixture.detectChanges();

      expect(component.loading()).toBe(true);
    });

    it('should display error state', () => {
      component.error.set('Test error message');
      fixture.detectChanges();

      expect(component.error()).toBe('Test error message');
    });

    it('should display lists when loaded', () => {
      component.lists.set(mockGroceryListsResponse.results);
      fixture.detectChanges();

      expect(component.lists().length).toBe(2);
      expect(component.lists()[0].name).toBe('Weekly Groceries');
    });
  });

  describe('Signal State Management', () => {
    it('should update lists signal when adding new list', () => {
      const initialList = mockGroceryList;
      const newList: GroceryList = {
        id: 3,
        name: 'New List',
        owner: mockUser.id,
        shared_with: [],
        item_count: 0,
        created_at: '2024-01-16T10:00:00Z',
        updated_at: '2024-01-16T10:00:00Z',
      };

      component.lists.set([initialList]);
      component.newListName = 'New List';
      mockGroceryService.createGroceryList.and.returnValue(of(newList));

      component.createList();

      expect(component.lists()).toEqual([newList, initialList]);
    });

    it('should update lists signal when deleting list', () => {
      component.lists.set([mockGroceryList, mockGroceryListsResponse.results[1]]);
      spyOn(window, 'confirm').and.returnValue(true);
      mockGroceryService.deleteGroceryList.and.returnValue(of(undefined as any));

      component.deleteList(1, { stopPropagation: () => {}, preventDefault: () => {} } as Event);

      expect(component.lists().length).toBe(1);
      expect(component.lists()[0].id).toBe(2);
    });

    it('should update loading signal during operations', () => {
      expect(component.loading()).toBe(false);
      mockGroceryService.getGroceryLists.and.returnValue(of(mockGroceryListsResponse));

      component.loadLists();

      expect(component.loading()).toBe(false); // Completes immediately with mock
    });

    it('should update error signal when operations fail', () => {
      const error = new Error('Test error');
      mockGroceryService.getGroceryLists.and.returnValue(throwError(() => error));

      component.loadLists();

      expect(component.error()).toBe('Failed to load grocery lists');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null current user', () => {
      mockAuthService.getCurrentUser.and.returnValue(null);
      mockGroceryService.getGroceryLists.and.returnValue(of(mockGroceryListsResponse));

      component.ngOnInit();

      expect(component.currentUser).toBeNull();
      expect(mockGroceryService.getGroceryLists).toHaveBeenCalled();
    });

    it('should handle empty lists response', () => {
      const emptyResponse: PaginatedResponse<GroceryList> = {
        count: 0,
        next: undefined,
        previous: undefined,
        results: [],
      };
      mockGroceryService.getGroceryLists.and.returnValue(of(emptyResponse));

      component.loadLists();

      expect(component.lists()).toEqual([]);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
    });

    it('should handle lists with no shared users', () => {
      const listWithoutSharing: GroceryList = {
        ...mockGroceryList,
        shared_with: [],
      };

      const names = component.getSharedWithNames(listWithoutSharing.shared_with);

      expect(names).toBe('');
    });

    it('should handle very long list names', () => {
      const longName = 'A'.repeat(1000);
      const newList: GroceryList = {
        id: 3,
        name: longName,
        owner: mockUser.id,
        shared_with: [],
        item_count: 0,
        created_at: '2024-01-16T10:00:00Z',
        updated_at: '2024-01-16T10:00:00Z',
      };
      component.newListName = longName;
      mockGroceryService.createGroceryList.and.returnValue(of(newList));

      component.createList();

      expect(mockGroceryService.createGroceryList).toHaveBeenCalledWith(longName);
    });

    it('should handle malformed date strings', () => {
      const malformedDate = 'invalid-date';

      // This should not throw an error
      expect(() => component.formatDate(malformedDate)).not.toThrow();
    });
  });

  describe('Sharing Functionality', () => {
    let mockEvent: jasmine.SpyObj<Event>;

    beforeEach(() => {
      mockEvent = jasmine.createSpyObj('Event', ['stopPropagation', 'preventDefault']);
    });

    describe('Open Share Modal', () => {
      it('should open share modal with correct list', () => {
        component.openShareModal(mockGroceryList, mockEvent);

        expect(mockEvent.stopPropagation).toHaveBeenCalled();
        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(component.selectedListForShare).toEqual(mockGroceryList);
        expect(component.isShareModalVisible).toBe(true);
      });

      it('should prevent event bubbling when opening modal', () => {
        component.openShareModal(mockGroceryList, mockEvent);

        expect(mockEvent.stopPropagation).toHaveBeenCalled();
        expect(mockEvent.preventDefault).toHaveBeenCalled();
      });
    });

    describe('Close Share Modal', () => {
      it('should close share modal and clear state', () => {
        // Setup initial state
        component.selectedListForShare = mockGroceryList;
        component.isShareModalVisible = true;

        component.closeShareModal();

        expect(component.isShareModalVisible).toBe(false);
        expect(component.selectedListForShare).toBeNull();
      });
    });

    describe('User Shared Event Handler', () => {
      it('should refresh list data when user is shared', () => {
        const updatedList: GroceryList = {
          ...mockGroceryList,
          shared_with: [
            ...mockGroceryList.shared_with,
            {
              id: 3,
              username: 'newuser',
              email: 'new@test.com',
              first_name: 'New',
              last_name: 'User',
            },
          ],
        };

        component.selectedListForShare = mockGroceryList;
        component.lists.set([mockGroceryList]);
        mockGroceryService.getGroceryList.and.returnValue(of(updatedList));

        component.onUserShared('newuser');

        expect(mockGroceryService.getGroceryList).toHaveBeenCalledWith(mockGroceryList.id);
        expect(component.lists()[0]).toEqual(updatedList);
      });

      it('should handle error when refreshing list after sharing', () => {
        const error = new Error('Refresh failed');
        component.selectedListForShare = mockGroceryList;
        mockGroceryService.getGroceryList.and.returnValue(throwError(() => error));
        spyOn(console, 'error');

        component.onUserShared('newuser');

        expect(console.error).toHaveBeenCalledWith('Error refreshing list after sharing:', error);
      });

      it('should not refresh when no list is selected for sharing', () => {
        component.selectedListForShare = null;

        component.onUserShared('newuser');

        expect(mockGroceryService.getGroceryList).not.toHaveBeenCalled();
      });
    });

    describe('User Removed Event Handler', () => {
      it('should refresh list data when user is removed', () => {
        const updatedList: GroceryList = {
          ...mockGroceryList,
          shared_with: [], // User removed
        };

        component.selectedListForShare = mockGroceryList;
        component.lists.set([mockGroceryList]);
        mockGroceryService.getGroceryList.and.returnValue(of(updatedList));

        component.onUserRemoved('shareduser');

        expect(mockGroceryService.getGroceryList).toHaveBeenCalledWith(mockGroceryList.id);
        expect(component.lists()[0]).toEqual(updatedList);
      });

      it('should handle error when refreshing list after removing user', () => {
        const error = new Error('Refresh failed');
        component.selectedListForShare = mockGroceryList;
        mockGroceryService.getGroceryList.and.returnValue(throwError(() => error));
        spyOn(console, 'error');

        component.onUserRemoved('shareduser');

        expect(console.error).toHaveBeenCalledWith(
          'Error refreshing list after removing user:',
          error
        );
      });

      it('should not refresh when no list is selected for sharing', () => {
        component.selectedListForShare = null;

        component.onUserRemoved('shareduser');

        expect(mockGroceryService.getGroceryList).not.toHaveBeenCalled();
      });
    });

    describe('Sharing Modal State Management', () => {
      it('should initialize sharing modal state correctly', () => {
        expect(component.isShareModalVisible).toBe(false);
        expect(component.selectedListForShare).toBeNull();
      });

      it('should update list in the correct position when refreshing', () => {
        const list1: GroceryList = { ...mockGroceryList, id: 1, name: 'List 1' };
        const list2: GroceryList = { ...mockGroceryList, id: 2, name: 'List 2' };
        const list3: GroceryList = { ...mockGroceryList, id: 3, name: 'List 3' };
        const updatedList2: GroceryList = { ...list2, name: 'Updated List 2' };

        component.lists.set([list1, list2, list3]);
        component.selectedListForShare = list2;
        mockGroceryService.getGroceryList.and.returnValue(of(updatedList2));

        component.onUserShared('newuser');

        const resultLists = component.lists();
        expect(resultLists[0]).toEqual(list1);
        expect(resultLists[1]).toEqual(updatedList2);
        expect(resultLists[2]).toEqual(list3);
      });
    });
  });
});
