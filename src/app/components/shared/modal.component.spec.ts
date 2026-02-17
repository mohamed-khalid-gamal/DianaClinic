import '../../../test-setup';
import { describe, it, expect, vi } from 'vitest';
import { ModalComponent } from './modal.component';

describe('ModalComponent', () => {
  it('should create', () => {
    const component = new ModalComponent();
    expect(component).toBeTruthy();
  });

  it('should emit closed event on close()', () => {
    const component = new ModalComponent();
    component.closed = { emit: vi.fn() } as any;

    component.close();
    expect(component.closed.emit).toHaveBeenCalled();
  });

  it('should emit confirmed event on onConfirm()', () => {
    const component = new ModalComponent();
    component.confirmed = { emit: vi.fn() } as any;

    component.onConfirm();
    expect(component.confirmed.emit).toHaveBeenCalled();
  });
});
