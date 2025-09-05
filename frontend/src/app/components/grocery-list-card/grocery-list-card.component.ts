import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GroceryList, User } from '../../models/api.models';

@Component({
  selector: 'app-grocery-list-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './grocery-list-card.component.html',
})
export class GroceryListCardComponent {
  @Input({ required: true }) list!: GroceryList;
  @Input() isOwned = true;
  @Input() currentUserId: number | null = null;

  @Output() shareClicked = new EventEmitter<{ list: GroceryList; event: Event }>();
  @Output() deleteClicked = new EventEmitter<{ listId: number; event: Event }>();

  onShareClick(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.shareClicked.emit({ list: this.list, event });
  }

  onDeleteClick(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.deleteClicked.emit({ listId: this.list.id, event });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  }

  getSharedWithNames(users: User[]): string {
    return users.map((user) => user.first_name || user.username).join(', ');
  }
}
