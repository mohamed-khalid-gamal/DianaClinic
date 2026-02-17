import { getAppointmentStatusColor, APPOINTMENT_STATUS_COLORS } from './status-colors';
import { describe, it, expect } from 'vitest';

describe('Status Colors Utils', () => {
  it('should return correct color for known appointment status', () => {
    expect(getAppointmentStatusColor('scheduled')).toBe('#3B82F6');
    expect(getAppointmentStatusColor('cancelled')).toBe('#EF4444');
  });

  it('should return default color for unknown status', () => {
    expect(getAppointmentStatusColor('unknown')).toBe('#6B7280');
  });
});
