import '../../test-setup';
import { vi, describe, it, expect, beforeEach, beforeAll } from 'vitest';
import Swal from 'sweetalert2';

// Hoist mocks so vi.mock factory does not call vi before initialization
const { mockFire, mockMixin, mockStopTimer, mockResumeTimer } = vi.hoisted(() => ({
  mockFire: vi.fn().mockResolvedValue({ isConfirmed: false }),
  mockMixin: vi.fn(() => ({ fire: vi.fn().mockResolvedValue({ isConfirmed: false }) })),
  mockStopTimer: vi.fn(),
  mockResumeTimer: vi.fn()
}));

vi.mock('sweetalert2', () => ({
  default: {
    fire: mockFire,
    mixin: mockMixin,
    stopTimer: mockStopTimer,
    resumeTimer: mockResumeTimer
  }
}));

// Load service after mock is applied so it gets the mocked sweetalert2
let SweetAlertService: typeof import('./sweet-alert.service').SweetAlertService;

describe('SweetAlertService', () => {
  let service: InstanceType<typeof SweetAlertService>;

  beforeAll(async () => {
    const m = await import('./sweet-alert.service');
    SweetAlertService = m.SweetAlertService;
  });

  beforeEach(() => {
    service = new SweetAlertService();
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('success should call Swal.fire with success icon', async () => {
    await service.success('Title', 'Message');
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Title',
      text: 'Message',
      icon: 'success'
    }));
  });

  it('error should call Swal.fire with error icon', async () => {
    await service.error('Error', 'Message');
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Error',
      icon: 'error'
    }));
  });

  it('confirm should return boolean from Swal result', async () => {
    (Swal.fire as ReturnType<typeof vi.fn>).mockResolvedValue({ isConfirmed: true });
    const result = await service.confirm('Are you sure?');
    expect(result).toBe(true);
  });

  it('toast should call Swal.mixin and fire', async () => {
    await service.toast('Hello');
    expect(Swal.mixin).toHaveBeenCalled();
  });

  describe('Business Methods', () => {
    it('created should show success toast', async () => {
      const toastSpy = vi.spyOn(service, 'toast');
      await service.created('Item');
      expect(toastSpy).toHaveBeenCalledWith(expect.stringContaining('Item has been created'), 'success');
    });

    it('validationError should show warning', async () => {
      const warningSpy = vi.spyOn(service, 'warning');
      await service.validationError('Invalid');
      expect(warningSpy).toHaveBeenCalledWith('Validation Error', 'Invalid');
    });
  });
});
