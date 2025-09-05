import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { of, BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, filter, catchError } from 'rxjs/operators';
import { GroceryService } from '../../services/grocery.service';

export interface AutocompleteItem {
  id: number;
  name: string;
  category_name: string;
  default_unit: string;
  isCreateNew?: boolean;
}

@Component({
  selector: 'app-item-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './item-autocomplete.component.html',
})
export class ItemAutocompleteComponent {
  @Input() placeholder: string = 'Start typing to search items...';
  @Input() minLength: number = 2;
  @Output() itemSelected = new EventEmitter<AutocompleteItem>();
  @Output() createNewItem = new EventEmitter<string>();

  searchControl = new FormControl('');
  suggestions = signal<AutocompleteItem[]>([]);
  isLoading = signal(false);
  showDropdown = signal(false);
  selectedIndex = signal(-1);
  private searchSubject = new BehaviorSubject<string>('');

  constructor(private groceryService: GroceryService) {
    this.initializeSearch();
  }

  private initializeSearch() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((query) => query.length >= this.minLength || query.length === 0),
        switchMap((query) => {
          if (query.length === 0) {
            return of({ results: [] });
          }

          this.isLoading.set(true);
          return this.groceryService.searchItems(query).pipe(
            catchError((error) => {
              console.error('Search error:', error);
              return of({ results: [] });
            })
          );
        })
      )
      .subscribe((response) => {
        const items: AutocompleteItem[] = response.results.map((item) => ({
          id: item.id,
          name: item.name,
          category_name: item.category_name,
          default_unit: item.default_unit,
        }));

        const query = this.searchControl.value || '';

        // Add "Create new item" option if no exact match found and query is not empty
        if (query.length >= this.minLength) {
          const hasExactMatch = items.some(
            (item) => item.name.toLowerCase() === query.toLowerCase()
          );

          if (!hasExactMatch) {
            items.push({
              id: -1,
              name: `Create "${query}"`,
              category_name: 'New Item',
              default_unit: '',
              isCreateNew: true,
            });
          }
        }

        this.suggestions.set(items);
        this.isLoading.set(false);
        this.showDropdown.set(items.length > 0);
        this.selectedIndex.set(-1);
      });

    // Subscribe to form control changes
    this.searchControl.valueChanges.subscribe((value) => {
      this.searchSubject.next(value || '');
    });
  }

  onInputFocus() {
    const query = this.searchControl.value || '';
    if (query.length >= this.minLength) {
      this.showDropdown.set(this.suggestions().length > 0);
    }
  }

  onInputBlur() {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => {
      this.showDropdown.set(false);
      this.selectedIndex.set(-1);
    }, 200);
  }

  onKeyDown(event: KeyboardEvent) {
    const suggestions = this.suggestions();
    const selectedIndex = this.selectedIndex();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = selectedIndex < suggestions.length - 1 ? selectedIndex + 1 : 0;
        this.selectedIndex.set(nextIndex);
        break;

      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : suggestions.length - 1;
        this.selectedIndex.set(prevIndex);
        break;

      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          this.selectItem(suggestions[selectedIndex]);
        } else if (this.searchControl.value) {
          // Create new item inline
          this.createNewItem.emit(this.searchControl.value);
          this.showDropdown.set(false);
        }
        break;

      case 'Escape':
        this.showDropdown.set(false);
        this.selectedIndex.set(-1);
        break;
    }
  }

  selectItem(item: AutocompleteItem) {
    if (item.isCreateNew) {
      // Emit the item name for inline creation
      const itemName = this.searchControl.value || '';
      this.createNewItem.emit(itemName);
      this.showDropdown.set(false);
    } else {
      this.itemSelected.emit(item);
      this.clearInput();
    }
  }

  clearInput() {
    this.searchControl.setValue('');
    this.showDropdown.set(false);
    this.selectedIndex.set(-1);
  }
}
