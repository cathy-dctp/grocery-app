import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category } from '../../models/api.models';
import { ItemAutocompleteComponent, AutocompleteItem } from '../item-autocomplete/item-autocomplete.component';
import { CategorySelectComponent } from '../category-select/category-select.component';

export interface ItemFormData {
  selectedItem: AutocompleteItem | null;
  quantity: string;
  unit: string;
  newItem?: {
    name: string;
    categoryId: number;
    unit: string;
  };
}

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ItemAutocompleteComponent, CategorySelectComponent],
  templateUrl: './item-form.component.html'
})
export class ItemFormComponent {
  @Input({ required: true }) categories: Category[] = [];
  
  @Output() addItem = new EventEmitter<ItemFormData>();
  @Output() createNewCategory = new EventEmitter<string>();
  @Output() clearForm = new EventEmitter<void>();

  selectedItem = signal<AutocompleteItem | null>(null);
  itemQuantity = signal('1');
  itemUnit = signal('');
  
  // New item creation
  isCreatingNewItem = signal(false);
  newItemName = signal('');
  selectedCategoryId = signal(0);
  newItemUnit = signal('pcs');

  onItemSelected(item: AutocompleteItem) {
    this.selectedItem.set(item);
    this.itemUnit.set(item.default_unit || '');
    this.isCreatingNewItem.set(false);
  }

  onCreateNewItem(itemName: string) {
    this.isCreatingNewItem.set(true);
    this.newItemName.set(itemName);
    this.selectedItem.set(null);
    // Auto-select first category if available
    if (this.categories.length > 0) {
      this.selectedCategoryId.set(this.categories[0].id);
    }
  }

  onCategoryChanged(categoryId: number) {
    this.selectedCategoryId.set(categoryId);
  }

  onCreateNewCategory(categoryName: string) {
    this.createNewCategory.emit(categoryName);
  }

  onSubmit() {
    if (this.isCreatingNewItem()) {
      // Validate new item creation
      if (!this.newItemName().trim() || this.selectedCategoryId() === 0) {
        return;
      }
      
      this.addItem.emit({
        selectedItem: null,
        quantity: '1',
        unit: this.newItemUnit(),
        newItem: {
          name: this.newItemName().trim(),
          categoryId: this.selectedCategoryId(),
          unit: this.newItemUnit()
        }
      });
    } else if (this.selectedItem()) {
      // Add existing item
      this.addItem.emit({
        selectedItem: this.selectedItem()!,
        quantity: this.itemQuantity(),
        unit: this.itemUnit()
      });
    }
  }

  onClear() {
    this.selectedItem.set(null);
    this.itemQuantity.set('1');
    this.itemUnit.set('');
    this.isCreatingNewItem.set(false);
    this.newItemName.set('');
    this.selectedCategoryId.set(this.categories.length > 0 ? this.categories[0].id : 0);
    this.newItemUnit.set('pcs');
    this.clearForm.emit();
  }

  cancelNewItemCreation() {
    this.isCreatingNewItem.set(false);
    this.newItemName.set('');
    this.selectedCategoryId.set(this.categories.length > 0 ? this.categories[0].id : 0);
    this.newItemUnit.set('pcs');
  }

  getSelectedItemUnit(): string {
    return this.selectedItem()?.default_unit || '';
  }

  canSubmit(): boolean {
    if (this.isCreatingNewItem()) {
      return this.newItemName().trim().length > 0 && this.selectedCategoryId() > 0;
    }
    return this.selectedItem() !== null;
  }
}