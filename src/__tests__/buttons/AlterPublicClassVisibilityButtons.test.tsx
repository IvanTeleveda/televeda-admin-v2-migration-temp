import { render, screen, fireEvent } from '@testing-library/react';
import { GetListResponse } from '@refinedev/core';
import { AlterPublicClassVisibilityButtons } from '../../components/buttons/hideScheduledClass';
import { ICalendarEvent, ICommunity } from '../../interfaces';

describe('AlterPublicClassVisibilityButtons', () => {
    const mockOnSuccessFn = jest.fn();
    const mockSetHidePopover = jest.fn();

    const communitySelectPropsData: GetListResponse<ICommunity> = {
        data: [
            {
                id: '1', name: 'Community 1',
                logo: '',
                displayName: '',
                communityManagers: [],
                sponsorId: ''
            },
            {
                id: '2', name: 'Community 2',
                logo: '',
                displayName: '',
                communityManagers: [],
                sponsorId: ''
            },
            {
                id: '3', name: 'Community 3',
                logo: '',
                displayName: '',
                communityManagers: [],
                sponsorId: ''
            }
        ],
        total: 3
    };


    const selectedEvent: ICalendarEvent = {
        id: 'event1',
        title: 'Sample Event',
        communityId: '1',
        isRecurring: false,
        exceptionCommuinties: [],
        start: '',
        end: '',
        backgroundColor: ''
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders only the Hide button when no exceptions are present', () => {
        render(<AlterPublicClassVisibilityButtons 
            onSuccessFn={mockOnSuccessFn}
            setHidePopover={mockSetHidePopover}
            communitySelectPropsData={communitySelectPropsData}
            selectedEvent={selectedEvent}
        />);

        expect(screen.getByRole('button', { name: /hide/i })).toBeInTheDocument();
    });

    it('renders the Show button when all communities are in exceptions', () => {
        selectedEvent.exceptionCommuinties = [
            { communityId: '1', community: { name: 'Community 1' } },
            { communityId: '2', community: { name: 'Community 2' } },
            { communityId: '3', community: { name: 'Community 3' } }
        ];

        render(<AlterPublicClassVisibilityButtons 
            onSuccessFn={mockOnSuccessFn}
            setHidePopover={mockSetHidePopover}
            communitySelectPropsData={communitySelectPropsData}
            selectedEvent={selectedEvent}
        />);

        expect(screen.getByRole('button', { name: /show/i })).toBeInTheDocument();
    });

    it('renders both Hide and Show buttons when some communities are exceptions', () => {
        selectedEvent.exceptionCommuinties = [
            { communityId: '1', community: { name: 'Community 1' } }
        ];

        render(<AlterPublicClassVisibilityButtons 
            onSuccessFn={mockOnSuccessFn}
            setHidePopover={mockSetHidePopover}
            communitySelectPropsData={communitySelectPropsData}
            selectedEvent={selectedEvent}
        />);

        expect(screen.getByRole('button', { name: /hide/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /show/i })).toBeInTheDocument();
    });

    it('opens the modal when Hide button is clicked', () => {
        render(<AlterPublicClassVisibilityButtons 
            onSuccessFn={mockOnSuccessFn}
            setHidePopover={mockSetHidePopover}
            communitySelectPropsData={communitySelectPropsData}
            selectedEvent={selectedEvent}
        />);

        fireEvent.click(screen.getByRole('button', { name: /hide/i }));

        expect(screen.getByText('Hide event')).toBeInTheDocument();
    });

    it('calls onSuccessFn with selected communities when Ok is clicked', () => {
        render(<AlterPublicClassVisibilityButtons 
            onSuccessFn={mockOnSuccessFn}
            setHidePopover={mockSetHidePopover}
            communitySelectPropsData={communitySelectPropsData}
            selectedEvent={selectedEvent}
        />);

        fireEvent.click(screen.getByRole('button', { name: /hide/i }));

        fireEvent.click(screen.getByText('OK'));

        expect(mockOnSuccessFn).toHaveBeenCalled();
    });

    it('calls setHidePopover when modal is opened or closed', () => {
        render(<AlterPublicClassVisibilityButtons 
            onSuccessFn={mockOnSuccessFn}
            setHidePopover={mockSetHidePopover}
            communitySelectPropsData={communitySelectPropsData}
            selectedEvent={selectedEvent}
        />);

        fireEvent.click(screen.getByRole('button', { name: /hide/i }));
        expect(mockSetHidePopover).toHaveBeenCalledWith(true);

        fireEvent.click(screen.getByText('Cancel'));
        expect(mockSetHidePopover).toHaveBeenCalledWith(false);
    });
});
