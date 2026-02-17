import '../../../test-setup';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Doctors } from './doctors';
import { Doctor, Room } from '../../models';

describe('Doctors Component', () => {
  let component: Doctors;
  let dataServiceMock: any;
  let alertServiceMock: any;
  let cdrMock: any;

  const mockDoctors: Doctor[] = [
    { 
      id: 'd1', 
      name: 'Dr. Smith', 
      specialty: 'Dermatology',
      phone: '123',
      email: 'test@test.com',
      isActive: true,
      workingHours: [],
      assignedRooms: []
    } as any
  ];

  const mockRooms: Room[] = [
    { id: 'r1', name: 'Room 1', type: 'treatment', isActive: true, capacity: 1 } as any
  ];

  beforeEach(() => {
    dataServiceMock = {
      getDoctors: vi.fn().mockReturnValue(of(mockDoctors)),
      getRooms: vi.fn().mockReturnValue(of(mockRooms)),
      addDoctor: vi.fn().mockReturnValue(of(mockDoctors[0])),
      updateDoctor: vi.fn().mockReturnValue(of(mockDoctors[0])),
      deleteDoctor: vi.fn().mockReturnValue(of(void 0))
    };

    alertServiceMock = {
      validationError: vi.fn(),
      created: vi.fn(),
      updated: vi.fn(),
      deleted: vi.fn(),
      confirmDelete: vi.fn().mockResolvedValue(true)
    };

    cdrMock = {
      markForCheck: vi.fn()
    };

    component = new Doctors(dataServiceMock, alertServiceMock, cdrMock);
  });

  it('loads doctors and rooms on init', () => {
    component.ngOnInit();
    expect(dataServiceMock.getDoctors).toHaveBeenCalled();
    expect(dataServiceMock.getRooms).toHaveBeenCalled();
    expect(component.doctors.length).toBe(1);
    expect(component.rooms.length).toBe(1);
  });

  it('validates form before saving', () => {
    component.doctorForm = {};
    component.saveDoctor();
    expect(alertServiceMock.validationError).toHaveBeenCalled();
    expect(dataServiceMock.addDoctor).not.toHaveBeenCalled();
  });

  it('adds new doctor', () => {
    component.doctorForm = { name: 'Dr. New', specialty: 'General', phone: '555' };
    component.isEditMode = false;
    
    component.saveDoctor();

    expect(dataServiceMock.addDoctor).toHaveBeenCalled();
    expect(alertServiceMock.created).toHaveBeenCalled();
  });

  it('updates existing doctor', () => {
    component.doctorForm = { ...mockDoctors[0] };
    component.isEditMode = true;

    component.saveDoctor();

    expect(dataServiceMock.updateDoctor).toHaveBeenCalled();
    expect(alertServiceMock.updated).toHaveBeenCalled();
  });

  it('manages shifts', () => {
    component.doctorForm = { workingHours: [] };
    
    component.addShift();
    expect(component.doctorForm.workingHours?.length).toBe(1);

    component.removeShift(0);
    expect(component.doctorForm.workingHours?.length).toBe(0);
  });
  
  /*
  it.skip('deletes doctor after confirmation', async () => {
    component.doctors = [...mockDoctors];
    await component.deleteDoctor(mockDoctors[0]);

    expect(dataServiceMock.deleteDoctor).toHaveBeenCalledWith('d1');
    expect(alertServiceMock.deleted).toHaveBeenCalled();
    expect(component.doctors.length).toBe(0);
  });
  */
});
