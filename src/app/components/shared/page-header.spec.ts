/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { PageHeaderComponent } from './page-header.component';

describe('PageHeaderComponent', () => {
  it('should create', () => {
    const component = new PageHeaderComponent();
    expect(component).toBeTruthy();
  });

  it('should have inputs', () => {
    const component = new PageHeaderComponent();
    component.title = 'Test Title';
    component.subtitle = 'Test Subtitle';
    expect(component.title).toBe('Test Title');
    expect(component.subtitle).toBe('Test Subtitle');
  });
});
