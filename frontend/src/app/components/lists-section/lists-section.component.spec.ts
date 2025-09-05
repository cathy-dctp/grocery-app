import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { provideRouter } from '@angular/router';
import { ListsSectionComponent } from './lists-section.component';
import { GroceryListCardComponent } from '../grocery-list-card/grocery-list-card.component';
import { GroceryList } from '../../models/api.models';

describe('ListsSectionComponent', () => {
  let component: ListsSectionComponent;
  let fixture: ComponentFixture<ListsSectionComponent>;

  const mockGroceryLists: GroceryList[] = [
    {
      id: 1,
      name: 'Test List 1',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      owner: 1,
      owner_username: 'testuser',
      shared_with: [],
      item_count: 5,
    },
    {
      id: 2,
      name: 'Test List 2',
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
      owner: 1,
      owner_username: 'testuser',
      shared_with: [],
      item_count: 3,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, ListsSectionComponent, GroceryListCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ListsSectionComponent);
    component = fixture.componentInstance;
    component.title = 'Test Section';
    component.lists = mockGroceryLists;
    component.badgeColor = 'bg-primary-100 text-primary-800';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display section title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent?.trim()).toBe('Test Section');
  });

  it('should display correct number of lists in badge', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('span')?.textContent?.trim()).toBe('2');
  });

  it('should render grocery list cards', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('app-grocery-list-card');
    expect(cards.length).toBe(2);
  });

  it('should emit shareClicked event', () => {
    spyOn(component.shareClicked, 'emit');
    const mockData = { list: mockGroceryLists[0], event: new Event('click') };

    component.onShareClick(mockData);

    expect(component.shareClicked.emit).toHaveBeenCalledWith(mockData);
  });

  it('should emit deleteClicked event', () => {
    spyOn(component.deleteClicked, 'emit');
    const mockData = { listId: 1, event: new Event('click') };

    component.onDeleteClick(mockData);

    expect(component.deleteClicked.emit).toHaveBeenCalledWith(mockData);
  });

  it('should not render section when lists array is empty', () => {
    component.lists = [];
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.children.length).toBe(0);
  });

  it('should apply correct badge color classes', () => {
    component.badgeColor = 'bg-secondary-100 text-secondary-800';
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const badge = compiled.querySelector('span');
    expect(badge?.className).toContain('bg-secondary-100 text-secondary-800');
  });
});
