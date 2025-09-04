import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category } from '../../models/api.models';

@Component({
  selector: 'app-category-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-select.component.html'
})
export class CategorySelectComponent {
  @Input({ required: true }) categories: Category[] = [];
  @Input() selectedCategoryId: number = 0;
  @Input() required = false;
  @Input() placeholder = 'Select a category';
  
  @Output() categoryChanged = new EventEmitter<number>();
  @Output() createNewCategory = new EventEmitter<string>();

  showCustomCategoryInput = signal(false);
  customCategoryName = signal('');

  onCategoryChange(value: string) {
    const categoryId = Number(value);
    this.selectedCategoryId = categoryId;
    this.showCustomCategoryInput.set(categoryId === -1);
    
    if (categoryId !== -1) {
      this.customCategoryName.set('');
      this.categoryChanged.emit(categoryId);
    }
  }

  onCreateCategory() {
    const name = this.customCategoryName().trim();
    if (name) {
      this.createNewCategory.emit(name);
    }
  }

  resetCustomInput() {
    this.customCategoryName.set('');
    this.showCustomCategoryInput.set(false);
  }
}