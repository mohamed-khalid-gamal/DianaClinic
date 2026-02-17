import '../../../test-setup';
import { describe, it, expect, vi } from 'vitest';
import { StatCardComponent } from './stat-card.component';
import { EventEmitter } from '@angular/core';

describe('StatCardComponent', () => {
  it('should create', () => {
    const component = new StatCardComponent();
    expect(component).toBeTruthy();
  });

  it('should have default inputs', () => {
    const component = new StatCardComponent();
    expect(component.icon).toContain('chart-line');
    expect(component.value).toBe(0);
  });

  it('should emit click event if clickable', () => {
    const component = new StatCardComponent();
    component.clickable = true;
    
    // Mock EventEmitter
    component.cardClick = { emit: vi.fn() } as any;

    component.onClick();
    expect(component.cardClick.emit).toHaveBeenCalled();
  });

  it('should not emit click event if not clickable', () => {
    const component = new StatCardComponent();
    component.clickable = false;
    
    component.cardClick = { emit: vi.fn() } as any;

    component.onClick();
    expect(component.cardClick.emit).not.toHaveBeenCalled();
  });
});
