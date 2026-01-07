import { Modal, Radio, RadioChangeEvent, Space, Typography } from '@pankod/refine-antd'
import dayjs from 'dayjs';
import React, { Dispatch, SetStateAction } from 'react'
import { ScheduledClassAlterOccurrenceTypes } from '../../components/buttons/deleteScheduledClass';
import { EventDropArg } from '@fullcalendar/core';
import { useOne } from '@refinedev/core';

export const EditClassModal: React.FC<{
    setEditEventModal: Dispatch<SetStateAction<boolean>>,
    editEventModal: boolean,
    draggedEvent: { drag: EventDropArg | undefined, classId: string },
    radioValue: ScheduledClassAlterOccurrenceTypes,
    setRadioValue: Dispatch<SetStateAction<ScheduledClassAlterOccurrenceTypes>>,
    setNewOccurenceTime: (eventInfo?: { drag: EventDropArg | undefined, classId: string }, scheduledClass?: any) => void
}> = ({
    setEditEventModal,
    editEventModal,
    radioValue,
    setRadioValue,
    draggedEvent,
    setNewOccurenceTime
}) => {

        const { data } = useOne({
            resource: "scheduled-class",
            id: draggedEvent?.classId,
        });
        console.log('formPropsHere: ', data?.data?.startDate)

        const handleOk = async () => {
            setEditEventModal(false);
            setNewOccurenceTime(undefined, data?.data);
        };

        const handleCancel = () => {
            draggedEvent?.drag?.revert();
            setEditEventModal(false);
            setRadioValue(ScheduledClassAlterOccurrenceTypes.Single);
        };

        const handleChange = (e: RadioChangeEvent) => {
            setRadioValue(e.target.value)
        }

        return (
            <Modal
                title="Edit event"
                open={editEventModal}
                onOk={handleOk}
                // confirmLoading={isLoading}
                onCancel={handleCancel}
            >
                <Space direction="vertical">
                    <Typography.Text><b>Edit recurring event</b></Typography.Text>
                    <Radio.Group onChange={handleChange} value={radioValue}>
                        <Space direction="vertical">
                            <Radio value={ScheduledClassAlterOccurrenceTypes.Single}>This event</Radio>
                            <Radio value={ScheduledClassAlterOccurrenceTypes.All}>All events</Radio>
                            {radioValue === ScheduledClassAlterOccurrenceTypes.All &&
                                <Typography.Text italic>
                                    <span style={{color: 'red'}}>Warning: </span>This will set the whole occurrence start time to {dayjs(draggedEvent.drag?.event.start).format('MMM-D h:ma')} 
                                </Typography.Text>}
                        </Space>
                    </Radio.Group>
                </Space>
            </Modal>
        )
    }
