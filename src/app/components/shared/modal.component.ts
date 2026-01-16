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
      background: rgba(2, 6, 23, 0.55);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
      padding: 1.5rem;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-container {
      background: var(--bg-card);
      border-radius: var(--radius-xl);
      border: 1px solid rgba(148, 163, 184, 0.15);
      box-shadow: 0 30px 60px -18px rgba(15, 23, 42, 0.45);
      width: 90%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.3s ease;
      overflow: hidden;
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      background: linear-gradient(180deg, rgba(148, 163, 184, 0.08), rgba(148, 163, 184, 0));
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: 0.2px;
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
      scrollbar-width: thin;
    }

    .modal-body h3,
    .modal-body h4,
    .modal-body h5 {
      margin: 0 0 0.75rem;
      font-weight: 600;
    }

    .modal-body .form-group {
      margin-bottom: 1rem;
    }

    .modal-body label {
      display: block;
      font-weight: 600;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
      color: var(--text-main);
    }

    .modal-body input,
    .modal-body select,
    .modal-body textarea {
      width: 100%;
      padding: 0.7rem 0.85rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background: var(--bg-body);
      color: var(--text-main);
      transition: border 0.2s, box-shadow 0.2s;
    }

    .modal-body input:focus,
    .modal-body select:focus,
    .modal-body textarea:focus {
      outline: none;
      border-color: rgba(59, 130, 246, 0.5);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    .modal-body table {
      width: 100%;
      border-collapse: collapse;
      background: var(--bg-body);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .modal-body table th,
    .modal-body table td {
      padding: 0.75rem 0.9rem;
      border-bottom: 1px solid var(--border-color);
      text-align: left;
      font-size: 0.875rem;
    }

    .modal-body table th {
      background: var(--bg-tertiary);
      font-weight: 600;
      color: var(--text-muted);
    }

    .modal-body .hint {
      color: var(--text-muted);
      font-size: 0.8125rem;
      margin-top: 0.25rem;
    }

    .modal-body .empty-state {
      padding: 1rem;
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-md);
      text-align: center;
      color: var(--text-muted);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-color);
      background: var(--bg-card);
    }

    @media (max-width: 640px) {
      .modal-container {
        width: 100%;
        max-height: 92vh;
      }

      .modal-header,
      .modal-body,
      .modal-footer {
        padding-left: 1rem;
        padding-right: 1rem;
      }

      .modal-footer {
        flex-direction: column-reverse;
        gap: 0.5rem;
      }

      .modal-footer .btn {
        width: 100%;
      }
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
