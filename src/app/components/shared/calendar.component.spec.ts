import '../../../test-setup';
import { describe, it, expect, vi } from 'vitest';
import { CalendarComponent } from './calendar.component';
import { SimpleChanges } from '@angular/core';

describe('CalendarComponent', () => {
  it('should create', () => {
    const component = new CalendarComponent();
    expect(component).toBeTruthy();
  });

  it('should init calendar options', () => {
    const component = new CalendarComponent();
    component.ngOnInit();
    expect(component.calendarOptions).toBeDefined();
    expect(component.calendarOptions.initialView).toBe('timeGridWeek');
  });

  it('should update options on changes', () => {
    const component = new CalendarComponent();
    component.ngOnInit();
    
    // Mock ngOnChanges
    const changes: SimpleChanges = {
      events: {
        currentValue: [],
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true
      }
    };
    
    component.ngOnChanges(changes);
    expect(component.calendarOptions).toBeDefined();
  });

  it('should change view', () => {
    const component = new CalendarComponent();
    component.viewChange = { emit: vi.fn() } as any;
    
    // Mock FullCalendar API
    component.calendarComponent = {
      getApi: () => ({ changeView: vi.fn() })
    } as any;

    component.changeView('dayGridMonth');
    expect(component.currentView).toBe('dayGridMonth');
    expect(component.viewChange.emit).toHaveBeenCalledWith('dayGridMonth');
  });
});
