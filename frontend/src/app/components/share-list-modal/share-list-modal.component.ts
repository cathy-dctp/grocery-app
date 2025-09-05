import { Component, EventEmitter, Input, Output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroceryService } from '../../services/grocery.service';
import { GroceryList, User } from '../../models/api.models';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-share-list-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './share-list-modal.component.html',
  styleUrls: ['./share-list-modal.component.css'],
})
export class ShareListModalComponent implements OnInit {
  @Input() groceryList: GroceryList | null = null;
  @Input() isVisible = false;
  @Output() close = new EventEmitter<void>();
  @Output() shared = new EventEmitter<string>();
  @Output() userRemoved = new EventEmitter<string>();

  // State signals
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  searchResults = signal<User[]>([]);
  isSearching = signal(false);

  // Form data
  searchQuery = '';
  private searchSubject = new Subject<string>();

  constructor(private groceryService: GroceryService) {}

  ngOnInit() {
    // Setup search debouncing
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          if (query.length < 2) {
            return of({ results: [] });
          }
          this.isSearching.set(true);
          return this.groceryService.searchUsers(query);
        })
      )
      .subscribe({
        next: (response) => {
          this.searchResults.set(response.results || []);
          this.isSearching.set(false);
        },
        error: (error) => {
          console.error('Search error:', error);
          this.searchResults.set([]);
          this.isSearching.set(false);
        },
      });
  }

  onSearchInput(query: string) {
    this.searchQuery = query;
    this.searchSubject.next(query);
    this.clearMessages();
  }

  shareWithUser(username: string) {
    if (!this.groceryList) return;

    this.isLoading.set(true);
    this.clearMessages();

    this.groceryService.shareList(this.groceryList.id, username).subscribe({
      next: () => {
        this.successMessage.set(`Successfully shared list with ${username}!`);
        this.shared.emit(username);
        this.searchQuery = '';
        this.searchResults.set([]);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        const message = this.extractErrorMessage(error);
        this.errorMessage.set(message);
      },
    });
  }

  removeUser(username: string) {
    if (!this.groceryList) return;

    this.isLoading.set(true);
    this.clearMessages();

    this.groceryService.removeUserFromList(this.groceryList.id, username).subscribe({
      next: () => {
        this.successMessage.set(`Successfully removed ${username} from list!`);
        this.userRemoved.emit(username);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        const message = this.extractErrorMessage(error);
        this.errorMessage.set(message);
      },
    });
  }

  onClose() {
    this.clearMessages();
    this.searchQuery = '';
    this.searchResults.set([]);
    this.close.emit();
  }

  private clearMessages() {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  private extractErrorMessage(error: unknown): string {
    // Type guard for error with nested error structure
    if (this.isErrorWithNestedError(error)) {
      if (Array.isArray(error.error.error)) {
        return error.error.error.join(' ');
      }
      return error.error.error;
    }

    // Type guard for error with message
    if (this.isErrorWithMessage(error)) {
      return error.message;
    }

    return 'An error occurred. Please try again.';
  }

  private isErrorWithNestedError(error: unknown): error is { error: { error: string | string[] } } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'error' in error &&
      typeof (error as { error: unknown }).error === 'object' &&
      (error as { error: unknown }).error !== null &&
      'error' in ((error as { error: unknown }).error as object)
    );
  }

  private isErrorWithMessage(error: unknown): error is { message: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message: unknown }).message === 'string'
    );
  }
}
