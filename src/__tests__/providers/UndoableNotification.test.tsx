import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// import { UndoableNotification, notificationProvider } from './path/to/your/notificationProvider';
import { notification } from 'antd';
import { UndoableNotification } from '../../providers/notificationProvider';
// import { UndoableNotification } from '../../../providers/notificationProvider';

// Mocking the Ant Design notification and Button components
jest.mock('antd', () => ({
    ...jest.requireActual('antd'),
    notification: {
        ...jest.requireActual('antd').notification,
        open: jest.fn(),
        destroy: jest.fn(),
    },
}));

describe('UndoableNotification', () => {
    it('should render notification and handle undo click', async () => {
        const cancelMutationMock = jest.fn();
        const undoableTimeout = 5;
        const message = "Test notification";
        const notificationKey = "mockKey";

        render(
            <UndoableNotification
                notificationKey={notificationKey}
                message={message}
                cancelMutation={cancelMutationMock}
                undoableTimeout={undoableTimeout}
            />
        );

        // Check that the message is displayed
        expect(screen.getByText(message)).toBeInTheDocument();

        // Simulate clicking the undo button
        fireEvent.click(screen.getByRole('button'));

        // Check that cancelMutation was called and notification is destroyed
        await waitFor(() => {
            expect(cancelMutationMock).toHaveBeenCalledTimes(1);
            expect(notification.destroy).toHaveBeenCalledWith(notificationKey);
        });
    });

    it('should destroy notification when timeout is 0', async () => {
        const notificationKey = "mockKey";
        const cancelMutationMock = jest.fn();

        render(
            <UndoableNotification
                notificationKey={notificationKey}
                message="Test message"
                cancelMutation={cancelMutationMock}
                undoableTimeout={0}
            />
        );

        // Check that notification is destroyed immediately
        await waitFor(() => {
            expect(notification.destroy).toHaveBeenCalledWith(notificationKey);
        });
    });
});
