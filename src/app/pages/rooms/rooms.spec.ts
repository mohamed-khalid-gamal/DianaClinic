import '../../../test-setup';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Rooms } from './rooms';
import { Room } from '../../models';

describe('Rooms Component', () => {
  let component: Rooms;
  let dataServiceMock: any;
  let alertServiceMock: any;
  let cdrMock: any;

  const mockRooms: Room[] = [
    { id: 'r1', name: 'Room 1', type: 'treatment', isActive: true, capacity: 1, floor: '1' } as any
  ];

  const mockRoomTypes = [
    { id: 'rt1', name: 'Treatment' }
  ];

  beforeEach(() => {
    dataServiceMock = {
      getRooms: vi.fn().mockReturnValue(of(mockRooms)),
      getRoomTypes: vi.fn().mockReturnValue(of(mockRoomTypes)),
      addRoom: vi.fn().mockReturnValue(of(mockRooms[0])),
      updateRoom: vi.fn().mockReturnValue(of(mockRooms[0])),
      deleteRoom: vi.fn().mockReturnValue(of(void 0))
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

    component = new Rooms(dataServiceMock, alertServiceMock, {} as any, cdrMock);
  });

  it('loads rooms on init', () => {
    component.ngOnInit();
    expect(dataServiceMock.getRooms).toHaveBeenCalled();
    expect(component.rooms.length).toBe(1);
  });

  it('validates form before saving', () => {
    component.roomForm = {};
    component.saveRoom();
    expect(alertServiceMock.validationError).toHaveBeenCalled();
    expect(dataServiceMock.addRoom).not.toHaveBeenCalled();
  });

  it('adds new room', () => {
    component.roomForm = { name: 'New Room', type: 'consultation' };
    component.isEditMode = false;

    component.saveRoom();

    expect(dataServiceMock.addRoom).toHaveBeenCalled();
    expect(alertServiceMock.created).toHaveBeenCalled();
  });

  it('updates existing room', () => {
    component.roomForm = { ...mockRooms[0] };
    component.isEditMode = true;

    component.saveRoom();

    expect(dataServiceMock.updateRoom).toHaveBeenCalled();
    expect(alertServiceMock.updated).toHaveBeenCalled();
  });

  /*
  it.skip('deletes room after confirmation', async () => {
    await component.deleteRoom(mockRooms[0]);
    expect(dataServiceMock.deleteRoom).toHaveBeenCalled();
    expect(alertServiceMock.deleted).toHaveBeenCalled();
  });
  */
});
