import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroceryList } from '../../models/api.models';
import { GroceryListCardComponent } from '../grocery-list-card/grocery-list-card.component';

@Component({
  selector: 'app-lists-section',
  standalone: true,
  imports: [CommonModule, GroceryListCardComponent],
  templateUrl: './lists-section.component.html',
})
export class ListsSectionComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) lists!: GroceryList[];
  @Input({ required: true }) badgeColor!: string;
  @Input() isOwned = true;
  @Input() currentUserId: number | null = null;

  @Output() shareClicked = new EventEmitter<{ list: GroceryList; event: Event }>();
  @Output() deleteClicked = new EventEmitter<{ listId: number; event: Event }>();

  onShareClick(data: { list: GroceryList; event: Event }) {
    this.shareClicked.emit(data);
  }

  onDeleteClick(data: { listId: number; event: Event }) {
    this.deleteClicked.emit(data);
  }
}
