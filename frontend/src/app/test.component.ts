import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestService } from './test.service';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Backend Connection Test</h2>
    <div *ngIf="loading">Loading categories...</div>
    <div *ngIf="error">Error: {{ error }}</div>
    <div *ngIf="categories">
      <h3>Categories from Django:</h3>
      <ul>
        <li *ngFor="let category of categories.results">
          {{ category.name }}
        </li>
      </ul>
    </div>
  `
})
export class TestComponent implements OnInit {
  categories: any = null;
  loading = false;
  error: string | null = null;

  constructor(private testService: TestService) {}

  ngOnInit() {
    this.loading = true;
    this.testService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }
}