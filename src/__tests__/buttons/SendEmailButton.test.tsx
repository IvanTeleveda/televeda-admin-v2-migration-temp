import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useCreate } from '@refinedev/core';
import { useModal } from '@refinedev/antd';
import { useSelect } from '@refinedev/antd';
import { SendEmailButton } from '../../components/buttons/sendEmail';

jest.mock('@refinedev/core');
jest.mock('@refinedev/antd');

const mockMutate = jest.fn();
const mockShow = jest.fn();
const mockClose = jest.fn();
const mockRefetch = jest.fn();

(useCreate as jest.Mock).mockReturnValue({ mutate: mockMutate });
(useModal as jest.Mock).mockReturnValue({ show: mockShow, close: mockClose, modalProps: { open: true } });

// Mock the useSelect hook
(useSelect as jest.Mock).mockReturnValue({
    selectProps: {},
    query: {
        refetch: mockRefetch
    }
});

const defaultProps = {
    url: 'send-email',
    templateId: '123',
    communitiesIdsFilterList: ['1', '2', '3'],
    btnText: 'Send Email',
    btnShape: 'default' as "default" | "circle" | "round",
    btnType: 'primary' as "primary" | "link" | "default" | "text" | "dashed",
    btnWidth: 150,
    includeInstructors: true
};

describe('SendEmailButton', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the SendEmailButton and opens the modal', async () => {
        render(<SendEmailButton {...defaultProps} />);

        const button = screen.getByText('Send Email');
        fireEvent.click(button);

        await waitFor(() => {
            expect(mockShow).toHaveBeenCalled();
            expect(screen.getByText('Who should receive this email?')).toBeInTheDocument();
        });
    });
    
    it('renders only members selection if includeInstructors is false', async () => {
        render(<SendEmailButton {...defaultProps} includeInstructors={false} />);

        const button = screen.getByText('Send Email');
        fireEvent.click(button);

        await waitFor(() => {
            expect(mockShow).toHaveBeenCalled();
            expect(screen.queryByText('Community Instructors')).not.toBeInTheDocument();
        });
    });
});
