import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useCustom } from '@refinedev/core';
import { AttendanceChart } from '../../components/analytics/charts/attendanceChart';
import dayjs from 'dayjs';

jest.mock('dayjs', () => {
    const originalDayjs = jest.requireActual('dayjs');
    return {
        __esModule: true,
        default: originalDayjs,
        extend: jest.fn().mockReturnValue(originalDayjs),
        tz: originalDayjs.tz,
    };
});

jest.mock('@refinedev/core', () => ({
    useCustom: jest.fn(),
}));

jest.mock('@ant-design/plots', () => ({
    Line: jest.fn(() => <div>Line Chart</div>),
    Pie: jest.fn(() => <div>Pie Chart</div>),
}));

describe('AttendanceChart', () => {
    const communityFilters = { communityIds: 'community123' };
    const apiUrl = 'https://mock-api.com';

    const mockData = {
        data: {
            data: [
                { date: '2023-01-01', count: 10, type: 'attendance' },
                { date: '2023-01-02', count: 20, type: 'attendance' },
            ],
            total: [
                { type: 'attended', count: 50 },
                { type: 'not_attended', count: 30 },
            ],
        },
        total: 100,
        trend: 1,
    };

    const dateRange: [dayjs.Dayjs, dayjs.Dayjs] = [
        dayjs('2023-01-01'),
        dayjs('2023-01-07'),
    ];

    beforeEach(() => {
        (useCustom as jest.Mock).mockReturnValue({
            data: mockData,
            isLoading: false,
        });
    });

    it('renders the AttendanceChart component', () => {
        render(<AttendanceChart communityIds={communityFilters.communityIds} dateRange={dateRange} apiUrl={apiUrl} />);
        expect(screen.getByText('Pie Chart')).toBeInTheDocument();
        expect(screen.getByText('Line Chart')).toBeInTheDocument();
    });

    it('handles API response and renders pie chart correctly', async () => {
        render(<AttendanceChart communityIds={communityFilters.communityIds} dateRange={dateRange} apiUrl={apiUrl} />);
        await waitFor(() => {
            expect(screen.getByText('Pie Chart')).toBeInTheDocument();
        });
    });
});