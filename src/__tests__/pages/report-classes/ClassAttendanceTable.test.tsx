import { render, screen } from '@testing-library/react';
import { useTable } from '@refinedev/antd';
import { IClassReportData, IClassAttendee } from '../../../interfaces';
import { ClassAttendanceTable } from '../../../pages/report-classes/ClassAttendanceTable';
import { EventTypes } from '../../../utils/enums';

jest.mock('@refinedev/antd', () => ({
  useTable: jest.fn(),
}));

describe('ClassAttendanceTable', () => {
  const mockRecord: IClassReportData = {
    id: '123',
    scheduledFor: new Date('2025-04-10'),
    scheduledClassId: '456',
    classType: EventTypes.LOCAL,
    classScheduledFor: new Date('2025-04-10'),
    className: '',
    communityName: '',
    isScheduledClass: false,
    startedAt: new Date('2025-04-10'),
    endedAt: new Date('2025-04-10'),
    hasVideoRecordings: false,
    participantsCount: 0,
    participantId: '',
    info: '',
    classReportOverridden: false,
    canSeeOverrideButton: false,
    overriddenBy: '',
    hybridAttendanceCount: 0,
  };

  const mockAttendees: IClassAttendee[] = [
    {
      classType: EventTypes.ON_DEMAND,
      participantName: 'John Doe',
      participantEmail: 'john.doe@example.com',
      participantId: '1',
      communityName: 'Community A',
    },
    {
      classType: EventTypes.ON_DEMAND,
      participantName: 'Jane Smith',
      participantEmail: 'jane.smith@example.com',
      participantId: '2',
      communityName: 'Community B',
    },
  ];

  beforeEach(() => {
    (useTable as jest.Mock).mockReturnValue({
      tableProps: {
        dataSource: mockAttendees,
        loading: false,
        pagination: false,
      },
    });
  });

  it('does not render any attendees if dataSource is empty', async () => {
    (useTable as jest.Mock).mockReturnValue({
      tableProps: {
        dataSource: [],
        loading: false,
        pagination: false,
      },
    });

    render(<ClassAttendanceTable record={mockRecord} />);

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });
});
