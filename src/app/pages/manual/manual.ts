import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { PageHeaderComponent } from '../../components/shared';

@Component({
  selector: 'app-manual',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  template: `
    <app-page-header
      title="User Manual"
      subtitle="Complete guide for Merve Aesthetics workflow">
    </app-page-header>

    <div class="manual-container">
      <div class="state-card" *ngIf="loading">
        <i class="fa-solid fa-spinner fa-spin"></i>
        Loading manual...
      </div>

      <div class="state-card error" *ngIf="error">
        <i class="fa-solid fa-triangle-exclamation"></i>
        {{ error }}
      </div>

      <div class="manual-content" *ngIf="!loading && !error" [innerHTML]="manualHtml"></div>
    </div>
  `,
  styles: [`
    .manual-container {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
    }

    .state-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-radius: var(--radius-lg);
      background: var(--bg-body);
      border: 1px dashed var(--border-color);
      color: var(--text-muted);
      font-weight: 500;
    }

    .state-card.error {
      color: var(--danger);
      border-color: rgba(239, 68, 68, 0.4);
      background: rgba(239, 68, 68, 0.05);
    }

    .manual-content {
      line-height: 1.7;
      color: var(--text-primary);
    }

    .manual-content h1,
    .manual-content h2,
    .manual-content h3,
    .manual-content h4,
    .manual-content h5 {
      color: var(--text-primary);
      font-weight: 700;
      margin: 1.5rem 0 0.75rem;
    }

    .manual-content h1 { font-size: 2rem; }
    .manual-content h2 { font-size: 1.5rem; }
    .manual-content h3 { font-size: 1.25rem; }
    .manual-content h4 { font-size: 1.1rem; }

    .manual-content p {
      margin: 0.75rem 0;
    }

    .manual-content ul,
    .manual-content ol {
      padding-left: 1.5rem;
      margin: 0.75rem 0;
    }

    .manual-content li {
      margin: 0.4rem 0;
    }

    .manual-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
      font-size: 0.95rem;
    }

    .manual-content table th,
    .manual-content table td {
      border: 1px solid var(--border-color);
      padding: 0.6rem 0.75rem;
      text-align: left;
    }

    .manual-content table th {
      background: var(--bg-body);
      font-weight: 600;
    }

    .manual-content code {
      background: rgba(15, 23, 42, 0.06);
      padding: 0.15rem 0.35rem;
      border-radius: var(--radius-sm);
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 0.9em;
    }

    .manual-content pre {
      background: #0f172a;
      color: #e2e8f0;
      padding: 1rem;
      border-radius: var(--radius-lg);
      overflow: auto;
    }

    .manual-content pre code {
      background: transparent;
      padding: 0;
      color: inherit;
    }

    .manual-content blockquote {
      border-left: 4px solid var(--primary);
      padding-left: 1rem;
      color: var(--text-muted);
      margin: 1rem 0;
    }

    .manual-content hr {
      border: none;
      border-top: 1px solid var(--border-color);
      margin: 1.5rem 0;
    }
  `]
})
export class ManualPage implements OnInit {
  manualHtml: SafeHtml | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadManual();
  }

  private async loadManual() {
    this.loading = true;
    this.error = null;

    this.http.get('user-manual.md', { responseType: 'text' }).subscribe({
      next: async (markdown) => {
        const html = await marked.parse(markdown);
        this.manualHtml = this.sanitizer.bypassSecurityTrustHtml(html);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Unable to load the manual right now.';
        this.loading = false;
      }
    });
  }
}
