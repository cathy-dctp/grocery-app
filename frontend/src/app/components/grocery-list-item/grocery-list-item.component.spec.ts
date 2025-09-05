import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { GroceryListItemComponent } from './grocery-list-item.component';
import { GroceryListItem } from '../../models/api.models';

describe('GroceryListItemComponent', () => {
  let component: GroceryListItemComponent;
  let fixture: ComponentFixture<GroceryListItemComponent>;

  const mockItem: GroceryListItem = {
    id: 1,
    grocery_list: 1,
    item: 1,
    item_name: 'Test Item',
    item_category: 'Groceries',
    quantity: '2',
    unit: 'lbs',
    is_checked: false,
    notes: 'Test notes',
    custom_name: 'My Custom Name',
    display_name: 'My Custom Name',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    added_by: 1,
    checked_by: undefined
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroceryListItemComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(GroceryListItemComponent);
    component = fixture.componentInstance;
    component.item = { ...mockItem };
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize editing signals with item values', () => {
      component.ngOnInit();

      expect(component.editingCustomName()).toBe('My Custom Name');
      expect(component.editingQuantity()).toBe('2');
      expect(component.editingUnit()).toBe('lbs');
      expect(component.editingNotes()).toBe('Test notes');
      expect(component.isEditing()).toBe(false);
      expect(component.isSaving()).toBe(false);
    });

    it('should handle null custom_name and notes', () => {
      component.item = { ...mockItem, custom_name: undefined, notes: undefined };
      component.ngOnInit();

      expect(component.editingCustomName()).toBe('');
      expect(component.editingNotes()).toBe('');
    });
  });

  describe('Display Mode', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should display item information correctly', () => {
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.textContent).toContain('My Custom Name');
      expect(compiled.textContent).toContain('2 lbs');
      expect(compiled.textContent).toContain('Groceries');
      expect(compiled.textContent).toContain('Test notes');
    });

    it('should show display_name when custom_name exists', () => {
      const nameElement = fixture.nativeElement.querySelector('[class*="font-heading"]');
      expect(nameElement?.textContent?.trim()).toBe('My Custom Name');
    });

    it('should show item_name when no custom_name exists', () => {
      component.item = { ...mockItem, custom_name: undefined, display_name: undefined };
      fixture.detectChanges();

      const nameElement = fixture.nativeElement.querySelector('[class*="font-heading"]');
      expect(nameElement?.textContent?.trim()).toBe('Test Item');
    });

    it('should show edit button when not editing and not checked', () => {
      component.item.is_checked = false;
      component.isEditing.set(false);
      fixture.detectChanges();

      const editButton = fixture.nativeElement.querySelector('button[title="Edit item"]');
      expect(editButton).toBeTruthy();
    });

    it('should hide edit button when item is checked', () => {
      component.item.is_checked = true;
      component.isEditing.set(false);
      fixture.detectChanges();

      const editButton = fixture.nativeElement.querySelector('button[title="Edit item"]');
      expect(editButton).toBeFalsy();
    });

    it('should always show delete button', () => {
      const deleteButton = fixture.nativeElement.querySelector('button[title="Remove from list"]');
      expect(deleteButton).toBeTruthy();
    });

    it('should apply checked styling when item is checked', () => {
      component.item.is_checked = true;
      fixture.detectChanges();

      const itemDiv = fixture.nativeElement.querySelector('div[class*="opacity-60"]');
      expect(itemDiv).toBeTruthy();
    });
  });

  describe('Checkbox Functionality', () => {
    it('should emit toggleChecked event when checkbox is clicked', () => {
      spyOn(component.toggleChecked, 'emit');
      component.ngOnInit();
      fixture.detectChanges();

      const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
      checkbox.click();

      expect(component.toggleChecked.emit).toHaveBeenCalledWith(component.item);
    });

    it('should reflect checked state in checkbox', () => {
      component.item.is_checked = true;
      component.ngOnInit();
      fixture.detectChanges();

      const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('Edit Mode Activation', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should enter edit mode when edit button is clicked', () => {
      const editButton = fixture.nativeElement.querySelector('button[title="Edit item"]') as HTMLButtonElement;
      editButton.click();

      expect(component.isEditing()).toBe(true);
    });

    it('should populate editing fields with current values when entering edit mode', () => {
      component.startEditing();

      expect(component.editingCustomName()).toBe('My Custom Name');
      expect(component.editingQuantity()).toBe('2');
      expect(component.editingUnit()).toBe('lbs');
      expect(component.editingNotes()).toBe('Test notes');
    });

    it('should show edit form when in editing mode', () => {
      component.isEditing.set(true);
      fixture.detectChanges();

      const customNameInput = fixture.nativeElement.querySelector('input[placeholder="Custom name (optional)"]');
      const quantityInput = fixture.nativeElement.querySelector('input[placeholder="Quantity"]');
      const unitInput = fixture.nativeElement.querySelector('input[placeholder="Unit"]');
      const notesTextarea = fixture.nativeElement.querySelector('textarea[placeholder="Additional notes (optional)"]');

      expect(customNameInput).toBeTruthy();
      expect(quantityInput).toBeTruthy();
      expect(unitInput).toBeTruthy();
      expect(notesTextarea).toBeTruthy();
    });

    it('should show save and cancel buttons in edit mode', () => {
      component.isEditing.set(true);
      fixture.detectChanges();

      const saveButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(btn => 
                          (btn as HTMLButtonElement).textContent?.includes('Save'));
      const cancelButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(btn => 
                            (btn as HTMLButtonElement).textContent?.includes('Cancel'));

      expect(saveButton).toBeTruthy();
      expect(cancelButton).toBeTruthy();
    });
  });

  describe('Edit Form Validation', () => {
    beforeEach(() => {
      component.ngOnInit();
      component.startEditing();
    });

    it('should require quantity field', () => {
      spyOn(window, 'alert');
      component.editingQuantity.set('');
      
      component.saveChanges();

      expect(window.alert).toHaveBeenCalledWith('Quantity is required');
      expect(component.isEditing()).toBe(true);
    });

    it('should trim whitespace from inputs', () => {
      component.editingCustomName.set('  Custom Name  ');
      component.editingQuantity.set('  3  ');
      component.editingUnit.set('  cups  ');
      component.editingNotes.set('  Some notes  ');

      spyOn(component.updateItem, 'emit');
      component.saveChanges();

      expect(component.updateItem.emit).toHaveBeenCalledWith({
        id: 1,
        updates: {
          custom_name: 'Custom Name',
          quantity: '3',
          unit: 'cups',
          notes: 'Some notes'
        },
        callback: jasmine.any(Function)
      });
    });

    it('should not emit update if no fields changed', () => {
      spyOn(component.updateItem, 'emit');
      
      component.saveChanges();

      expect(component.updateItem.emit).not.toHaveBeenCalled();
      expect(component.isEditing()).toBe(false);
    });
  });

  describe('Save Changes Functionality', () => {
    beforeEach(() => {
      component.ngOnInit();
      component.startEditing();
    });

    it('should emit updateItem event with correct data when saving', () => {
      spyOn(component.updateItem, 'emit');
      
      component.editingCustomName.set('Updated Name');
      component.editingQuantity.set('5');
      component.editingUnit.set('pieces');
      component.editingNotes.set('Updated notes');

      component.saveChanges();

      expect(component.updateItem.emit).toHaveBeenCalledWith({
        id: 1,
        updates: {
          custom_name: 'Updated Name',
          quantity: '5',
          unit: 'pieces',
          notes: 'Updated notes'
        },
        callback: jasmine.any(Function)
      });
    });

    it('should set isSaving to true when saving starts', () => {
      spyOn(component.updateItem, 'emit');
      component.editingQuantity.set('5');

      component.saveChanges();

      expect(component.isSaving()).toBe(true);
    });

    it('should handle successful save callback', () => {
      spyOn(component.updateItem, 'emit').and.callFake((data: any) => {
        data.callback(true);
      });
      component.editingQuantity.set('5');

      component.saveChanges();

      expect(component.isSaving()).toBe(false);
      expect(component.isEditing()).toBe(false);
    });

    it('should handle failed save callback', () => {
      spyOn(component.updateItem, 'emit').and.callFake((data: any) => {
        data.callback(false);
      });
      component.editingQuantity.set('5');

      component.saveChanges();

      expect(component.isSaving()).toBe(false);
      expect(component.isEditing()).toBe(true);
    });

    it('should send undefined for empty custom_name to clear the field', () => {
      spyOn(component.updateItem, 'emit');
      
      component.editingCustomName.set('');
      component.editingQuantity.set('5');

      component.saveChanges();

      const emitCall = (component.updateItem.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emitCall.updates.custom_name).toBeUndefined();
    });

    it('should send empty string for notes when cleared', () => {
      spyOn(component.updateItem, 'emit');
      
      component.editingNotes.set('');
      component.editingQuantity.set('5');

      component.saveChanges();

      const emitCall = (component.updateItem.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emitCall.updates.notes).toBe('');
    });
  });

  describe('Cancel Editing', () => {
    beforeEach(() => {
      component.ngOnInit();
      component.startEditing();
    });

    it('should exit edit mode when cancel is clicked', () => {
      component.isEditing.set(true);
      fixture.detectChanges();

      const cancelButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(btn => 
        (btn as HTMLButtonElement).textContent?.includes('Cancel')) as HTMLButtonElement;
      cancelButton.click();

      expect(component.isEditing()).toBe(false);
    });

    it('should reset editing fields to original values when cancelled', () => {
      component.editingCustomName.set('Changed Name');
      component.editingQuantity.set('999');
      component.editingUnit.set('changed');
      component.editingNotes.set('Changed notes');

      component.cancelEditing();

      expect(component.editingCustomName()).toBe('My Custom Name');
      expect(component.editingQuantity()).toBe('2');
      expect(component.editingUnit()).toBe('lbs');
      expect(component.editingNotes()).toBe('Test notes');
      expect(component.isEditing()).toBe(false);
    });
  });

  describe('Delete Functionality', () => {
    it('should emit deleteItem event with item id when delete button is clicked', () => {
      spyOn(component.deleteItem, 'emit');
      component.ngOnInit();
      fixture.detectChanges();

      const deleteButton = fixture.nativeElement.querySelector('button[title="Remove from list"]') as HTMLButtonElement;
      deleteButton.click();

      expect(component.deleteItem.emit).toHaveBeenCalledWith(1);
    });
  });

  describe('UI State Management', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should disable form inputs when saving', async () => {
      component.isEditing.set(true);
      fixture.detectChanges();
      
      component.isSaving.set(true);
      fixture.detectChanges();
      await fixture.whenStable();

      const editingInputs = fixture.nativeElement.querySelectorAll('input[type="text"], textarea');
      expect(editingInputs.length).toBeGreaterThan(0);
      editingInputs.forEach((input: HTMLInputElement | HTMLTextAreaElement) => {
        expect(input.disabled).toBe(true);
      });
    });

    it('should disable save and cancel buttons when saving', () => {
      component.isEditing.set(true);
      component.isSaving.set(true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      const saveButton = Array.from(buttons).find(btn => (btn as HTMLButtonElement).textContent?.includes('Saving')) as HTMLButtonElement;
      const cancelButton = Array.from(buttons).find(btn => (btn as HTMLButtonElement).textContent?.includes('Cancel')) as HTMLButtonElement;

      expect(saveButton?.disabled).toBe(true);
      expect(cancelButton?.disabled).toBe(true);
    });

    it('should show loading spinner when saving', () => {
      component.isEditing.set(true);
      component.isSaving.set(true);
      fixture.detectChanges();

      const spinner = fixture.nativeElement.querySelector('.animate-spin');
      const savingText = Array.from(fixture.nativeElement.querySelectorAll('button')).find(btn => 
        (btn as HTMLButtonElement).textContent?.includes('Saving'));

      expect(spinner).toBeTruthy();
      expect(savingText).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle item with minimal data', () => {
      const minimalItem: GroceryListItem = {
        id: 2,
        grocery_list: 1,
        item: 2,
        item_name: 'Minimal Item',
        item_category: 'Test',
        quantity: '1',
        unit: 'unit',
        is_checked: false,
        notes: undefined,
        custom_name: undefined,
        display_name: undefined,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        added_by: 1,
        checked_by: undefined
      };

      component.item = minimalItem;
      component.ngOnInit();

      expect(component.editingCustomName()).toBe('');
      expect(component.editingNotes()).toBe('');
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle empty string fields gracefully', () => {
      component.item = { 
        ...mockItem, 
        custom_name: '', 
        notes: '',
        display_name: ''
      };
      component.ngOnInit();
      fixture.detectChanges();

      expect(() => component.startEditing()).not.toThrow();
      expect(() => component.cancelEditing()).not.toThrow();
    });
  });

  describe('Angular Signals Integration', () => {
    it('should update UI when signals change', () => {
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.isEditing()).toBe(false);
      
      component.isEditing.set(true);
      fixture.detectChanges();

      const editForm = fixture.nativeElement.querySelector('input[placeholder="Custom name (optional)"]');
      expect(editForm).toBeTruthy();
    });

    it('should maintain signal state consistency', () => {
      component.ngOnInit();
      
      component.startEditing();
      expect(component.isEditing()).toBe(true);
      
      component.cancelEditing();
      expect(component.isEditing()).toBe(false);
      expect(component.isSaving()).toBe(false);
    });
  });
});