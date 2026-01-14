import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="onOverlayClick($event)">
      <div class="modal-container" [style.maxWidth]="maxWidth">
        <div class="modal-header">
          <h2>{{ title }}</h2>
          <button class="close-btn" (click)="close()">×</button>
        </div>
        <div class="modal-body">
          <ng-content></ng-content>
        </div>
        <div class="modal-footer" *ngIf="showFooter">
          <button class="btn btn-outline" (click)="close()">{{ cancelText }}</button>
          <button class="btn btn-primary" (click)="onConfirm()" [disabled]="confirmDisabled">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .modal-container {
      background: var(--bg-card);
      border-radius: var(--radius-xl);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      width: 90%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.3s ease;
    }
    
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }
    
    .modal-header h2 {
      margin: 0;
      font-size: 1.25rem;
    }
    
    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-muted);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-md);
      transition: all 0.2s;
    }
    
    .close-btn:hover {
      background: var(--bg-body);
      color: var(--text-main);
    }
    
    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
    }
    
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-color);
    }
  `]
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() maxWidth = '600px';
  @Input() showFooter = true;
  @Input() confirmText = 'Save';
  @Input() cancelText = 'Cancel';
  @Input() confirmDisabled = false;
  
  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();

  close() {
    this.closed.emit();
  }

  onConfirm() {
    this.confirmed.emit();
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }
}
