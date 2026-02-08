import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule, FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, DateSelectArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { CalendarEvent, CalendarView } from '../../services/calendar.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  template: `
    <div class="calendar-wrapper">
      <div class="calendar-header" *ngIf="showHeader">
        <div class="calendar-title">
          <h3 *ngIf="title">{{ title }}</h3>
          <span class="subtitle" *ngIf="subtitle">{{ subtitle }}</span>
        </div>
        <div class="view-selector" *ngIf="showViewSelector">
          <button
            [class.active]="currentView === 'dayGridMonth'"
            (click)="changeView('dayGridMonth')">
            Month
          </button>
          <button
            [class.active]="currentView === 'timeGridWeek'"
            (click)="changeView('timeGridWeek')">
            Week
          </button>
          <button
            [class.active]="currentView === 'timeGridDay'"
            (click)="changeView('timeGridDay')">
            Day
          </button>
          <button
            [class.active]="currentView === 'listWeek'"
            (click)="changeView('listWeek')">
            List
          </button>
        </div>
      </div>

      <div class="calendar-legend" *ngIf="showLegend">
        <div class="legend-item" *ngFor="let item of legendItems">
          <span class="legend-color" [style.backgroundColor]="item.color"></span>
          <span class="legend-label">{{ item.label }}</span>
        </div>
      </div>

      <full-calendar
        #calendar
        [options]="calendarOptions">
      </full-calendar>
    </div>
  `,
  styles: [`
    .calendar-wrapper {
      background: var(--bg-card);
      border-radius: var(--radius-xl);
      border: 1px solid var(--border-color);
      overflow: hidden;
    }

    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      flex-wrap: wrap;
      gap: 1rem;
    }

    .calendar-title {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .calendar-title h3 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .calendar-title .subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .view-selector {
      display: flex;
      background: var(--bg-body);
      border-radius: var(--radius-md);
      padding: 0.25rem;
      gap: 0.25rem;
    }

    .view-selector button {
      padding: 0.5rem 1rem;
      border: none;
      background: transparent;
      border-radius: var(--radius-md);
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-muted);
      transition: all 0.2s;
    }

    .view-selector button:hover {
      color: var(--text-main);
    }

    .view-selector button.active {
      background: var(--bg-card);
      color: var(--primary-color);
      box-shadow: var(--shadow-sm);
    }

    .calendar-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      padding: 0.75rem 1.5rem;
      background: var(--bg-body);
      border-bottom: 1px solid var(--border-color);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 3px;
    }

    .legend-label {
      color: var(--text-muted);
    }

    :host ::ng-deep {
      .fc {
        font-family: 'Inter', sans-serif;
      }

      .fc-theme-standard td,
      .fc-theme-standard th {
        border-color: var(--border-color);
        background: var(--bg-card); /* STRICT: Force Cream background */
      }

      .fc-theme-standard .fc-scrollgrid {
        border-color: var(--border-color);
        background: var(--bg-card);
      }

      .fc-col-header-cell {
        background: var(--bg-body);
        padding: 0.75rem 0;
      }

      .fc-col-header-cell-cushion {
        font-weight: 600;
        font-size: 0.8125rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .fc-timegrid-slot-label-cushion {
        font-size: 0.75rem;
        color: var(--text-muted);
      }

      .fc-daygrid-day-number {
        font-size: 0.875rem;
        font-weight: 500;
        padding: 0.5rem;
        color: var(--text-main);
      }

      .fc-day-today {
        background: rgba(65, 22, 28, 0.05) !important; /* Maroon tint */
      }

      .fc-day-today .fc-daygrid-day-number {
        background: var(--primary-color);
        color: var(--primary-light);
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .fc-event {
        border-radius: 6px;
        padding: 2px 6px;
        font-size: 0.75rem;
        font-weight: 500;
        cursor: pointer;
        transition: transform 0.15s, box-shadow 0.15s;
      }

      .fc-event:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(65, 22, 28, 0.15);
      }

      .fc-timegrid-event {
        border-radius: 6px;
      }

      .fc-timegrid-event .fc-event-main {
        padding: 4px 8px;
      }

      .fc-event-title {
        font-weight: 600;
      }

      .fc-event-time {
        font-weight: 500;
        opacity: 0.9;
      }

      .fc-toolbar {
        padding: 1rem 1.5rem;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .fc-toolbar-title {
        font-size: 1.125rem !important;
        font-weight: 600;
        color: var(--text-heading);
      }

      .fc-button {
        background: var(--bg-body) !important;
        border: 1px solid var(--border-color) !important;
        color: var(--text-main) !important;
        font-weight: 500 !important;
        padding: 0.5rem 1rem !important;
        border-radius: var(--radius-md) !important;
        text-transform: capitalize !important;
        transition: all 0.2s !important;
      }

      .fc-button:hover {
        background: var(--bg-card) !important;
        border-color: var(--primary-color) !important;
      }

      .fc-button-active {
        background: var(--primary-color) !important;
        border-color: var(--primary-color) !important;
        color: var(--primary-light) !important;
      }

      .fc-button-primary:not(:disabled).fc-button-active {
        background: var(--primary-color) !important;
        border-color: var(--primary-color) !important;
      }

      .fc-today-button {
        background: var(--primary-light) !important;
        color: var(--primary-dark) !important;
        border-color: transparent !important;
      }

      .fc-today-button:hover {
        background: var(--primary-color) !important;
        color: var(--primary-light) !important;
      }

      .fc-today-button:disabled {
        opacity: 0.5;
      }

      .fc-now-indicator-line {
        border-color: var(--danger);
      }

      .fc-now-indicator-arrow {
        border-color: var(--danger);
        border-top-color: transparent;
        border-bottom-color: transparent;
      }

      .fc-list {
        border-radius: 0 0 var(--radius-xl) var(--radius-xl);
        overflow: hidden;
      }

      .fc-list-day-cushion {
        background: var(--bg-body) !important;
        padding: 0.75rem 1rem !important;
      }

      .fc-list-event:hover td {
        background: rgba(65, 22, 28, 0.05); /* Maroon tint */
      }
    
      .fc-list-event-time {
        font-weight: 500;
        color: var(--text-muted);
      }

      .fc-list-event-title {
        font-weight: 500;
      }

      .fc-popover {
        background: var(--bg-card);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        border: 1px solid var(--border-color);
      }

      .fc-popover-header {
        background: var(--bg-body);
        padding: 0.75rem 1rem;
        font-weight: 600;
      }
    }

    @media (max-width: 768px) {
      .calendar-header {
        flex-direction: column;
        align-items: stretch;
      }

      .view-selector {
        justify-content: center;
      }

      .calendar-legend {
        justify-content: center;
      }

      :host ::ng-deep {
        .fc-toolbar {
          flex-direction: column;
        }

        .fc-toolbar-chunk {
          display: flex;
          justify-content: center;
        }
      }
    }
  `]
})
export class CalendarComponent implements OnChanges {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  @Input() events: CalendarEvent[] = [];
  @Input() initialView: CalendarView = 'timeGridWeek';
  @Input() title = '';
  @Input() subtitle = '';
  @Input() showHeader = true;
  @Input() showViewSelector = true;
  @Input() showLegend = true;
  @Input() height: string | number = 'auto';
  @Input() editable = false;
  @Input() selectable = true;

  @Output() eventClick = new EventEmitter<CalendarEvent>();
  @Output() dateSelect = new EventEmitter<{ start: Date; end: Date }>();
  @Output() viewChange = new EventEmitter<CalendarView>();

  currentView: CalendarView = 'timeGridWeek';
  calendarOptions: CalendarOptions = {};

  legendItems = [
    { label: 'Scheduled', color: '#3B82F6' },
    { label: 'Checked-In', color: '#F59E0B' },
    { label: 'In Progress', color: '#8B5CF6' },
    { label: 'Completed', color: '#10B981' },
    { label: 'Billed', color: '#9CA3AF' },
    { label: 'Cancelled', color: '#EF4444' },
    { label: 'No-Show', color: '#F97316' }
  ];

  ngOnInit() {
    this.currentView = this.initialView;
    this.initCalendarOptions();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['events'] || changes['initialView']) {
      this.initCalendarOptions();
    }
  }

  private initCalendarOptions() {
    this.calendarOptions = {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
      initialView: this.currentView,
      headerToolbar: false, // We use our custom header
      events: this.events,
      slotMinTime: '07:00:00',
      slotMaxTime: '22:00:00',
      slotDuration: '00:30:00',
      allDaySlot: false,
      weekends: true,
      editable: this.editable,
      selectable: this.selectable,
      selectMirror: true,
      dayMaxEvents: true,
      nowIndicator: true,
      height: this.height,
      eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      },
      slotLabelFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      },
      eventClick: this.handleEventClick.bind(this),
      select: this.handleDateSelect.bind(this)
    };
  }

  changeView(view: CalendarView) {
    this.currentView = view;
    const calendarApi = this.calendarComponent?.getApi();
    if (calendarApi) {
      calendarApi.changeView(view);
    }
    this.viewChange.emit(view);
  }

  private handleEventClick(info: EventClickArg) {
    const event = this.events.find(e => e.id === info.event.id);
    if (event) {
      this.eventClick.emit(event);
    }
  }

  private handleDateSelect(info: DateSelectArg) {
    this.dateSelect.emit({ start: info.start, end: info.end });
  }

  // Public methods for external control
  goToDate(date: Date) {
    const calendarApi = this.calendarComponent?.getApi();
    if (calendarApi) {
      calendarApi.gotoDate(date);
    }
  }

  today() {
    const calendarApi = this.calendarComponent?.getApi();
    if (calendarApi) {
      calendarApi.today();
    }
  }

  prev() {
    const calendarApi = this.calendarComponent?.getApi();
    if (calendarApi) {
      calendarApi.prev();
    }
  }

  next() {
    const calendarApi = this.calendarComponent?.getApi();
    if (calendarApi) {
      calendarApi.next();
    }
  }
}
