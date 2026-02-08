// Shared appointment status color map
export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  'scheduled': '#3B82F6',
  'checked-in': '#F59E0B',
  'in-progress': '#8B5CF6',
  'completed': '#10B981',
  'billed': '#9CA3AF',
  'cancelled': '#EF4444',
  'no-show': '#F97316'
};

export function getAppointmentStatusColor(status: string): string {
  return APPOINTMENT_STATUS_COLORS[status] || '#6B7280';
}

// Device status colors
export const DEVICE_STATUS_COLORS: Record<string, string> = {
  'active': 'var(--success)',
  'maintenance': 'var(--warning)',
  'inactive': 'var(--danger)'
};

export function getDeviceStatusColor(status: string): string {
  return DEVICE_STATUS_COLORS[status] || 'var(--secondary-color)';
}
