import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroceryListItem } from '../../models/api.models';

@Component({
  selector: 'app-grocery-list-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grocery-list-item.component.html'
})
export class GroceryListItemComponent {
  @Input({ required: true }) item!: GroceryListItem;
  @Output() toggleChecked = new EventEmitter<GroceryListItem>();
  @Output() updateItem = new EventEmitter<{ id: number; updates: Partial<GroceryListItem>; callback: (success: boolean) => void }>();
  @Output() deleteItem = new EventEmitter<number>();

  isEditing = signal(false);
  editingCustomName = signal('');
  editingQuantity = signal('');
  editingUnit = signal('');
  editingNotes = signal('');
  isSaving = signal(false);

  ngOnInit() {
    this.editingCustomName.set(this.item.custom_name || '');
    this.editingQuantity.set(this.item.quantity);
    this.editingUnit.set(this.item.unit);
    this.editingNotes.set(this.item.notes || '');
  }

  onToggleChecked() {
    this.toggleChecked.emit(this.item);
  }

  startEditing() {
    this.isEditing.set(true);
    this.editingCustomName.set(this.item.custom_name || '');
    this.editingQuantity.set(this.item.quantity);
    this.editingUnit.set(this.item.unit);
    this.editingNotes.set(this.item.notes || '');
  }

  cancelEditing() {
    this.isEditing.set(false);
    this.editingCustomName.set(this.item.custom_name || '');
    this.editingQuantity.set(this.item.quantity);
    this.editingUnit.set(this.item.unit);
    this.editingNotes.set(this.item.notes || '');
  }

  saveChanges() {
    const customName = this.editingCustomName().trim();
    const quantity = this.editingQuantity().trim();
    const unit = this.editingUnit().trim();
    const notes = this.editingNotes().trim();

    if (!quantity) {
      alert('Quantity is required');
      return;
    }

    // Check if any field has changed
    if (customName === (this.item.custom_name || '') &&
        quantity === this.item.quantity &&
        unit === this.item.unit &&
        notes === (this.item.notes || '')) {
      this.isEditing.set(false);
      return;
    }

    this.isSaving.set(true);
    this.updateItem.emit({
      id: this.item.id,
      updates: { 
        custom_name: customName || undefined, // Send undefined if empty to clear the field
        quantity, 
        unit,
        notes: notes || ''
      },
      callback: (success: boolean) => {
        this.isSaving.set(false);
        if (success) {
          this.isEditing.set(false);
        }
      }
    });
  }

  onDeleteClick() {
    this.deleteItem.emit(this.item.id);
  }
}