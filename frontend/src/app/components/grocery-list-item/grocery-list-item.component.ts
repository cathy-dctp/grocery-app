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
  @Output() updateItem = new EventEmitter<{ id: number; updates: Partial<GroceryListItem> }>();
  @Output() deleteItem = new EventEmitter<number>();

  isEditing = signal(false);
  editingQuantity = signal('');
  editingUnit = signal('');
  isSaving = signal(false);

  ngOnInit() {
    this.editingQuantity.set(this.item.quantity);
    this.editingUnit.set(this.item.unit);
  }

  onToggleChecked() {
    this.toggleChecked.emit(this.item);
  }

  startEditing() {
    this.isEditing.set(true);
    this.editingQuantity.set(this.item.quantity);
    this.editingUnit.set(this.item.unit);
  }

  cancelEditing() {
    this.isEditing.set(false);
    this.editingQuantity.set(this.item.quantity);
    this.editingUnit.set(this.item.unit);
  }

  saveChanges() {
    const quantity = this.editingQuantity().trim();
    const unit = this.editingUnit().trim();

    if (!quantity) {
      alert('Quantity is required');
      return;
    }

    if (quantity === this.item.quantity && unit === this.item.unit) {
      this.isEditing.set(false);
      return;
    }

    this.isSaving.set(true);
    this.updateItem.emit({
      id: this.item.id,
      updates: { quantity, unit }
    });
  }

  onUpdateComplete(success: boolean) {
    this.isSaving.set(false);
    if (success) {
      this.isEditing.set(false);
    }
  }

  onDeleteClick() {
    this.deleteItem.emit(this.item.id);
  }
}