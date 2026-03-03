import { Component, Input, Output, EventEmitter, forwardRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'app-tag-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tag-input-container" [class.disabled]="disabled" (click)="focusInput()">
      <div class="tags-list">
        <span class="tag" [ngClass]="tagClass" *ngFor="let tag of (tags || []); let i = index">
          {{ tag }}
          <button type="button" class="remove-btn" (click)="removeTag(i, $event)" [disabled]="disabled">&times;</button>
        </span>
        <input
          #tagInputArea
          type="text"
          [(ngModel)]="inputValue"
          (keydown.enter)="addTag($event)"
          (blur)="addTagOnBlur()"
          [placeholder]="(!tags || tags.length === 0) ? placeholder : ''"
          [disabled]="disabled"
          class="tag-input-field"
        />
        <button 
          *ngIf="inputValue.trim().length > 0" 
          type="button" 
          class="inline-add-btn" 
          (mousedown)="addTagFromButton($event)" 
          [disabled]="disabled">
          Add
        </button>
      </div>
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TagInputComponent),
      multi: true
    }
  ],
  styles: [`
    .tag-input-container {
      display: flex;
      flex-direction: column;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.5rem;
      background: var(--bg-surface);
      min-height: 42px;
      cursor: text;
      transition: border-color 0.2s;

      &:focus-within {
        border-color: var(--primary-color);
      }

      &.disabled {
        background: var(--bg-disabled, #f3f4f6);
        cursor: not-allowed;
      }
    }

    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }

    .tag {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.5rem 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 500;
      background: var(--bg-card);
      border: 1px solid var(--border-color);

      &.danger {
        background: rgba(239, 68, 68, 0.1);
        color: var(--danger, #ef4444);
        border-color: rgba(239, 68, 68, 0.2);
      }

      &.warning {
        background: rgba(245, 158, 11, 0.1);
        color: var(--warning, #f59e0b);
        border-color: rgba(245, 158, 11, 0.2);
      }

      &.primary {
        background: rgba(59, 130, 246, 0.1);
        color: var(--primary-color, #3b82f6);
        border-color: rgba(59, 130, 246, 0.2);
      }
    }

    .remove-btn {
      background: transparent;
      border: none;
      color: inherit;
      font-size: 1.25rem;
      line-height: 1;
      padding: 0 0.25rem;
      margin-left: 0.25rem;
      cursor: pointer;
      opacity: 0.7;

      &:hover {
        opacity: 1;
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.4;
      }
    }

    .tag-input-field {
      flex: 1;
      min-width: 120px;
      border: none;
      background: transparent;
      padding: 0.25rem;
      font-size: 0.9rem;
      color: var(--text-primary);
      outline: none;

      &::placeholder {
        color: var(--text-muted);
      }
    }

    .inline-add-btn {
      background: var(--primary-color, #3b82f6);
      color: white;
      border: none;
      border-radius: var(--radius-sm, 4px);
      padding: 0.25rem 0.6rem;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      margin-left: auto;
      transition: opacity 0.2s;

      &:hover:not(:disabled) {
        opacity: 0.9;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  `]
})
export class TagInputComponent implements ControlValueAccessor {
  @Input() tags: string[] | undefined = [];
  @Input() placeholder: string = 'Add tag...';
  @Input() tagClass: string = 'primary';
  @Output() tagsChange = new EventEmitter<string[] | undefined>();

  @ViewChild('tagInputArea') tagInputArea!: ElementRef<HTMLInputElement>;

  inputValue: string = '';
  disabled: boolean = false;

  onChange = (tags: string[]) => {};
  onTouched = () => {};

  writeValue(value: string[]): void {
    if (value) {
      this.tags = [...value];
    } else {
      this.tags = [];
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  focusInput() {
    if (!this.disabled) {
      this.tagInputArea?.nativeElement.focus();
    }
  }

  addTag(event?: Event) {
    if (event) {
      event.preventDefault();
    }

    if (this.disabled) return;

    if (!this.tags) {
      this.tags = [];
    }

    // Split by comma in case user pastes comma-separated values
    const newTags = this.inputValue
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    let added = false;
    for (const tag of newTags) {
      // Prevent duplicates (case-insensitive)
      if (!this.tags.find(t => t.toLowerCase() === tag.toLowerCase())) {
        this.tags.push(tag);
        added = true;
      }
    }

    if (added) {
      this.notifyChange();
    }

    this.inputValue = '';
  }

  addTagOnBlur() {
    if (this.inputValue && this.inputValue.trim().length > 0) {
      this.addTag();
    }
    this.onTouched();
  }

  addTagFromButton(event: Event) {
    event.preventDefault(); // Prevent input from losing focus (avoiding blur trigger logic conflicts)
    event.stopPropagation();
    this.addTag();
    this.focusInput();
  }

  removeTag(index: number, event: Event) {
    event.stopPropagation();
    if (this.disabled || !this.tags) return;

    this.tags.splice(index, 1);
    this.notifyChange();
  }

  private notifyChange() {
    this.tagsChange.emit(this.tags);
    if (this.onChange) {
      this.onChange(this.tags || []);
    }
  }
}
