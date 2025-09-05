import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GroceryService } from '../../services/grocery.service';
import { AuthService } from '../../services/auth.service';
import { GroceryList, AuthUser, User } from '../../models/api.models';
import { ShareListModalComponent } from '../share-list-modal/share-list-modal.component';
import { ListsSectionComponent } from '../lists-section/lists-section.component';

@Component({
  selector: 'app-grocery-lists',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ShareListModalComponent, ListsSectionComponent],
  templateUrl: './grocery-lists.component.html',
})
export class GroceryListsComponent implements OnInit {
  lists = signal<GroceryList[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  currentUser: AuthUser | null = null;

  showNewListForm = false;
  newListName = '';

  // Sharing modal state
  isShareModalVisible = false;
  selectedListForShare: GroceryList | null = null;

  // Computed signals for owned and shared lists
  ownedLists = computed(() => {
    return this.lists().filter(list => list.owner === this.currentUser?.id);
  });

  sharedLists = computed(() => {
    return this.lists().filter(list => list.owner !== this.currentUser?.id);
  });

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

  deleteList(data: { listId: number; event: Event }) {
    if (!confirm('Are you sure you want to delete this list?')) return;

    this.groceryService.deleteGroceryList(data.listId).subscribe({
      next: () => {
        this.lists.update((lists) => lists.filter((list) => list.id !== data.listId));
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

  // Sharing modal methods
  openShareModal(data: { list: GroceryList; event: Event }) {
    this.selectedListForShare = data.list;
    this.isShareModalVisible = true;
  }

  closeShareModal() {
    this.isShareModalVisible = false;
    this.selectedListForShare = null;
  }

  onUserShared(_username: string) {
    // Refresh the specific list to get updated shared_with data
    if (this.selectedListForShare) {
      this.groceryService.getGroceryList(this.selectedListForShare.id).subscribe({
        next: (updatedList) => {
          // Update the lists signal
          this.lists.update((lists) =>
            lists.map((list) => (list.id === updatedList.id ? updatedList : list))
          );
          // Update the selected list reference so modal shows updated data
          this.selectedListForShare = updatedList;
        },
        error: (err) => {
          console.error('Error refreshing list after sharing:', err);
        },
      });
    }
  }

  onUserRemoved(_username: string) {
    // Refresh the specific list to get updated shared_with data
    if (this.selectedListForShare) {
      this.groceryService.getGroceryList(this.selectedListForShare.id).subscribe({
        next: (updatedList) => {
          // Update the lists signal
          this.lists.update((lists) =>
            lists.map((list) => (list.id === updatedList.id ? updatedList : list))
          );
          // Update the selected list reference so modal shows updated data
          this.selectedListForShare = updatedList;
        },
        error: (err) => {
          console.error('Error refreshing list after removing user:', err);
        },
      });
    }
  }
}
