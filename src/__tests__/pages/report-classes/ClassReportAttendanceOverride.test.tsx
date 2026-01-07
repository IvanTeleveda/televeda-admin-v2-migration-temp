import { render, screen } from '@testing-library/react';
import { useCreate, useShow } from '@refinedev/core';
import { BrowserRouter as Router } from 'react-router-dom';
import { ClassReportAttendanceOverride } from '../../../pages/report-classes/edit';

jest.mock('@refinedev/core', () => ({
    useCreate: jest.fn(),
    useShow: jest.fn(),
}));

describe('ClassReportAttendanceOverride', () => {
    const mockMutate = jest.fn();

    beforeEach(() => {
        (useCreate as jest.Mock).mockReturnValue({ mutate: mockMutate });
        (useShow as jest.Mock).mockReturnValue({
            query: {
                data: {
                    data: {
                        participantsCount: 10,
                        info: 'Test Info',
                        canSeeOverrideButton: true,
                        scheduledFor: '2025-04-10',
                        scheduledClassId: '456',
                        classType: 'LOCAL',
                    },
                },
                isLoading: false,
            },
        });        
    });

    it('renders form with correct data', () => {
        render(
            <Router>
                <ClassReportAttendanceOverride />
            </Router>
        );

        expect(screen.getByLabelText('Total Participant Count')).toHaveValue("10");
        expect(screen.getByLabelText('Note')).toHaveValue('Test Info');
    });
});
