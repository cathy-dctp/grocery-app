import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { provideRouter } from '@angular/router';
import { GroceryListCardComponent } from './grocery-list-card.component';
import { GroceryList, User } from '../../models/api.models';

describe('GroceryListCardComponent', () => {
  let component: GroceryListCardComponent;
  let fixture: ComponentFixture<GroceryListCardComponent>;

  const mockGroceryList: GroceryList = {
    id: 1,
    name: 'Test List',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    owner: 1,
    owner_username: 'testuser',
    shared_with: [],
    item_count: 5,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, GroceryListCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(GroceryListCardComponent);
    component = fixture.componentInstance;
    component.list = mockGroceryList;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display list name', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h3')?.textContent?.trim()).toBe('Test List');
  });

  it('should emit shareClicked event when share button is clicked', () => {
    component.isOwned = true;
    fixture.detectChanges();

    spyOn(component.shareClicked, 'emit');
    const mockEvent = new Event('click');

    component.onShareClick(mockEvent);

    expect(component.shareClicked.emit).toHaveBeenCalledWith({
      list: mockGroceryList,
      event: mockEvent,
    });
  });

  it('should emit deleteClicked event when delete button is clicked', () => {
    component.isOwned = true;
    fixture.detectChanges();

    spyOn(component.deleteClicked, 'emit');
    const mockEvent = new Event('click');

    component.onDeleteClick(mockEvent);

    expect(component.deleteClicked.emit).toHaveBeenCalledWith({
      listId: mockGroceryList.id,
      event: mockEvent,
    });
  });

  it('should format date correctly', () => {
    const date = '2023-01-01T00:00:00Z';
    const result = component.formatDate(date);
    expect(result).toBeTruthy();
  });

  it('should display shared user names', () => {
    const users: User[] = [
      { id: 1, username: 'user1', first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
      {
        id: 2,
        username: 'user2',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
      },
    ];

    const result = component.getSharedWithNames(users);
    expect(result).toBe('John, Jane');
  });

  it('should show owner info for shared lists', () => {
    component.isOwned = false;
    component.list = { ...mockGroceryList, owner_username: 'owner123' };
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Owner: owner123');
  });

  it('should show shared badge for non-owned lists', () => {
    component.isOwned = false;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Shared');
  });
});
