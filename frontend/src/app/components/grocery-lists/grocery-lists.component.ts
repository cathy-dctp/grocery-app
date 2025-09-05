import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GroceryService } from '../../services/grocery.service';
import { AuthService } from '../../services/auth.service';
import { GroceryList, AuthUser, User } from '../../models/api.models';

@Component({
  selector: 'app-grocery-lists',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './grocery-lists.component.html',
})
export class GroceryListsComponent implements OnInit {
  lists = signal<GroceryList[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  currentUser: AuthUser | null = null;

  showNewListForm = false;
  newListName = '';

  constructor(
    private groceryService: GroceryService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadLists();
  }

  loadLists() {
    this.loading.set(true);
    this.error.set(null);

    this.groceryService.getGroceryLists().subscribe({
      next: (response) => {
        this.lists.set(response.results);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load grocery lists');
        this.loading.set(false);
        console.error('Error loading lists:', err);
      },
    });
  }

  getSharedWithNames(users: User[]): string {
    return users.map((user) => user.first_name || user.username).join(', ');
  }

  createList() {
    if (!this.newListName.trim()) return;

    this.groceryService.createGroceryList(this.newListName.trim()).subscribe({
      next: (newList) => {
        this.lists.update((lists) => [newList, ...lists]);
        this.cancelNewList();
      },
      error: (err) => {
        alert('Failed to create list');
        console.error('Error creating list:', err);
      },
    });
  }

  cancelNewList() {
    this.showNewListForm = false;
    this.newListName = '';
  }

  deleteList(listId: number, event: Event) {
    event.stopPropagation();
    event.preventDefault();

    if (!confirm('Are you sure you want to delete this list?')) return;

    this.groceryService.deleteGroceryList(listId).subscribe({
      next: () => {
        this.lists.update((lists) => lists.filter((list) => list.id !== listId));
      },
      error: (err) => {
        alert('Failed to delete list');
        console.error('Error deleting list:', err);
      },
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Logout error:', err);
        // Redirect anyway since local data is cleared
        this.router.navigate(['/login']);
      },
    });
  }
}
