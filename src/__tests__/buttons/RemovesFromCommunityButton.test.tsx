import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { useDelete } from '@refinedev/core';
import { RemovesFromCommunityButton } from '../../components/buttons/removeFromCommunity';

jest.mock('@refinedev/core', () => ({
    useDelete: jest.fn(),
}));

describe('RemovesFromCommunityButton', () => {
    const mockOnSuccess = jest.fn();
    const mockMutate = jest.fn();

    beforeEach(() => {
        (useDelete as jest.Mock).mockReturnValue({ mutate: mockMutate });
        mockOnSuccess.mockClear();
    });

    test('should render the remove button correctly', () => {
        render(
            <RemovesFromCommunityButton
                communityId="123"
                associationId="456"
                url="https://example.com"
                onSuccessFn={mockOnSuccess}
                associationType="host"
                modalBtnIcon={<span>Remove Icon</span>}
            />
        );

        const removeButton = screen.getByRole('button');
        expect(removeButton).toBeInTheDocument();
        expect(removeButton).toHaveTextContent('Remove');
    });

    test('should show the confirmation popup when clicked', () => {
        render(
            <RemovesFromCommunityButton
                communityId="123"
                associationId="456"
                url="https://example.com"
                onSuccessFn={mockOnSuccess}
                associationType="host"
                modalBtnIcon={<span>Remove Icon</span>}
            />
        );
    
        const removeButton = screen.getByRole('button');
        fireEvent.click(removeButton);
    
        const confirmationText = screen.getByText((content, element) =>
            content.includes('Are you sure?')
        );
    
        expect(confirmationText).toBeInTheDocument();
    });
    

    test('should trigger mutate on confirm click', async () => {
        render(
            <RemovesFromCommunityButton
                communityId="123"
                associationId="456"
                url="https://example.com"
                onSuccessFn={mockOnSuccess}
                associationType="host"
                modalBtnIcon={<span>Remove Icon</span>}
            />
        );

        const removeButton = screen.getByRole('button');
        fireEvent.click(removeButton);

        const confirmButton = screen.getByText('Yes');
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(mockMutate).toHaveBeenCalledWith(
                expect.objectContaining({
                    resource: 'https://example.com/123/host',
                    id: '456',
                }),
                expect.objectContaining({
                    onSuccess: expect.any(Function),
                })
            );
        });
    });

    test('should handle instructor removal scenario', async () => {
        render(
            <RemovesFromCommunityButton
                communityId="123"
                associationId="456"
                url="https://example.com"
                onSuccessFn={mockOnSuccess}
                associationType="host"
                modalBtnIcon={<span>Remove Icon</span>}
                isInstructor={true}
            />
        );

        const removeButton = screen.getByRole('button');
        fireEvent.click(removeButton);

        const confirmRemoveInstructorButton = screen.getByText('Yes');
        fireEvent.click(confirmRemoveInstructorButton);

        await waitFor(() => {
            expect(mockMutate).toHaveBeenCalledWith(
                expect.objectContaining({
                    resource: 'https://example.com/123/host',
                    id: '456',
                }),
                expect.objectContaining({
                    onSuccess: expect.any(Function),
                })
            );
        });
    });

    test('should not trigger second popup if isInstructor is false', () => {
        render(
            <RemovesFromCommunityButton
                communityId="123"
                associationId="456"
                url="https://example.com"
                onSuccessFn={mockOnSuccess}
                associationType="host"
                modalBtnIcon={<span>Remove Icon</span>}
                isInstructor={false}
            />
        );
    
        const removeButton = screen.getByRole('button');
        fireEvent.click(removeButton);
    
        const confirmationText = screen.getByText((content, element) => 
            content.includes('Are you sure?')
        );
    
        expect(confirmationText).toBeInTheDocument();
    });
});
