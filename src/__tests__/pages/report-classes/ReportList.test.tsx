import { render, screen, fireEvent } from '@testing-library/react';
import { usePermissions } from '@refinedev/core';
import { ReportList } from '../../../pages/report-classes/list';

jest.mock('@refinedev/core', () => ({
    usePermissions: jest.fn(),
}));

const mockSetSearchParams = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useSearchParams: () => [new URLSearchParams(), mockSetSearchParams],
}));

jest.mock('../../../pages/report-classes/ClassesReport', () => ({
    ClassReportList: ({ setParamKeys }: any) => (
        <div data-testid="class-report">Class Report List</div>
    ),
}));

jest.mock('../../../pages/report-classes/MembersReport', () => ({
    MemberReportList: ({ setParamKeys }: any) => (
        <div data-testid="member-report">Member Report List</div>
    ),
}));

describe('ReportList', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    it('renders default tab (My Events)', () => {
        (usePermissions as jest.Mock).mockReturnValue({ data: 'Admin' });

        render(<ReportList />);

        expect(screen.getByText('My Events')).toBeInTheDocument();
        expect(screen.getByTestId('class-report')).toBeInTheDocument();
        expect(screen.queryByTestId('member-report')).not.toBeInTheDocument();
    });

    it('disables "My Members" tab for CommunityHost', () => {
        (usePermissions as jest.Mock).mockReturnValue({ data: 'CommunityHost' });

        render(<ReportList />);
        const tab = screen.getByRole('tab', { name: /my members/i });

        expect(tab).toHaveAttribute('aria-disabled', 'true');
    });

    it('switches tab and updates localStorage and searchParams', () => {
        (usePermissions as jest.Mock).mockReturnValue({ data: 'Admin' });

        render(<ReportList />);

        const tab = screen.getByRole('tab', { name: /my members/i });
        fireEvent.click(tab);

        expect(mockSetSearchParams).toHaveBeenCalledWith('?pageSize=10&current=1');

        expect(localStorage.getItem('attendance-tab')).toBe('2');
    });

    it('uses tab from localStorage if set', () => {
        localStorage.setItem('attendance-tab', '2');
        (usePermissions as jest.Mock).mockReturnValue({ data: 'Admin' });

        render(<ReportList />);

        expect(screen.getByTestId('member-report')).toBeInTheDocument();
    });
});
