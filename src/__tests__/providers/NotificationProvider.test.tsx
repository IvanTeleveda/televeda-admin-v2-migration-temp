import { notification } from 'antd';
import { notificationProvider, UndoableNotification } from '../../providers/notificationProvider';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('antd', () => ({
    ...jest.requireActual('antd'),
    notification: {
        ...jest.requireActual('antd').notification,
        open: jest.fn(),
        destroy: jest.fn(),
    },
}));

describe('notificationProvider', () => {
    it('should open a success notification', () => {
        const openNotificationParams = {
            key: '1',
            message: 'Test Message',
            type: 'success' as 'success',
            description: 'Test Description',
            cancelMutation: jest.fn(),
            undoableTimeout: 5,
        };

        notificationProvider.open(openNotificationParams);

        expect(notification.open).toHaveBeenCalledWith(expect.objectContaining({
            key: '1',
            message: 'Test Description',
            description: 'Test Message',
            type: 'success',
        }));        
    });

    it('should open a progress notification with undoable actions', () => {
        const openNotificationParams = {
            key: '1',
            message: 'Test Progress',
            type: 'progress' as 'progress',
            cancelMutation: jest.fn(),
            undoableTimeout: 5,
        };

        notificationProvider.open(openNotificationParams);

        expect(notification.open).toHaveBeenLastCalledWith(expect.objectContaining({
            key: '1',
            description: expect.anything(),
            message: null,
            duration: 0,
            closeIcon: expect.anything(),
        }));        
    });

    it('should call cancelMutation when undo button is clicked', () => {
        const cancelMutationMock = jest.fn();
    
        render(
            <UndoableNotification
                notificationKey="1"
                message="Undoable message"
                cancelMutation={cancelMutationMock}
                undoableTimeout={5}
            />
        );
    
        const button = screen.getByRole("button");
        fireEvent.click(button);
    
        expect(cancelMutationMock).toHaveBeenCalled();
    });
});
