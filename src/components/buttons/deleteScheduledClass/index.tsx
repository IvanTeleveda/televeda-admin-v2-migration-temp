import { Button, Modal, Radio, RadioChangeEvent, Space, Typography, } from "@pankod/refine-antd";
import React, { JSX, useMemo, useState } from "react";

export enum ScheduledClassAlterOccurrenceTypes {
    All = 'all',
    Single = 'single',
    After = 'after'
}

export const DeleteScheduledClassButton: React.FC<{
    onSuccessFn: (type: ScheduledClassAlterOccurrenceTypes) => void,
    setHidePopover: React.Dispatch<React.SetStateAction<boolean>>,
    modalBtnType: "link" | "text" | "default" | "primary" | "dashed" | undefined,
    modalBtnIcon: JSX.Element,
    classRecurring: boolean,
    modalBtnTxt: string,
    modalTitle: string,
    modalMessage: string,
    defaultType?: ScheduledClassAlterOccurrenceTypes,
}> = (props) => {

    const { onSuccessFn, setHidePopover, modalBtnTxt, modalBtnIcon, modalTitle, modalMessage, modalBtnType, classRecurring, defaultType = ScheduledClassAlterOccurrenceTypes.Single } = props;

    const [modalVisible, setModalVisible] = useState(false);
    const [radioValue, setRadioValue] = useState<ScheduledClassAlterOccurrenceTypes>(defaultType);

    useMemo(() => {
        if (!modalVisible) {
            setHidePopover(false);
        }
        else {
            setHidePopover(true);
        }
    }, [modalVisible])

    const showModal = () => {
        setModalVisible(true);
    };

    console.log('classRecurring: ', classRecurring)

    const handleOk = async () => {
        setModalVisible(false);
        onSuccessFn(radioValue);
    };

    const handleCancel = () => {
        console.log('Clicked cancel button');
        setModalVisible(false);
    };

    const handleChange = (e: RadioChangeEvent) => {
        setRadioValue(e.target.value)
    }

    return (
        <>
            <Modal
                title={modalTitle}
                open={modalVisible}
                onOk={handleOk}
                // confirmLoading={isLoading}
                onCancel={handleCancel}
            >
                {classRecurring && modalBtnTxt === "Delete" ?
                    <Space direction="vertical">
                        <Typography.Text><b>{modalMessage}</b></Typography.Text>
                        <Radio.Group onChange={handleChange} value={radioValue}>
                            <Space direction="vertical">
                                <Radio value={ScheduledClassAlterOccurrenceTypes.Single}>This event</Radio>
                                <Radio value={ScheduledClassAlterOccurrenceTypes.After}>This and following events</Radio>
                                <Radio value={ScheduledClassAlterOccurrenceTypes.All}>All events</Radio>
                            </Space>
                        </Radio.Group>
                    </Space>
                    : modalMessage}
            </Modal>

            <Button type={modalBtnType} icon={modalBtnIcon} onClick={showModal} danger>
                {modalBtnTxt}
            </Button>
        </>

    )
}