import { Button, Modal, Select, Space, Typography, } from "@pankod/refine-antd";
import React, { useEffect, useMemo, useState } from "react";
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { ICalendarEvent, ICommunity } from "../../../interfaces";
import { GetListResponse } from "@refinedev/core";

export const AlterPublicClassVisibilityButtons: React.FC<{
    onSuccessFn: (communityIds: Array<string>, isToHide: boolean) => void,
    setHidePopover: React.Dispatch<React.SetStateAction<boolean>>,
    communitySelectPropsData: GetListResponse<ICommunity> | undefined,
    selectedEvent: ICalendarEvent,
}> = (props) => {

    const { onSuccessFn, setHidePopover, communitySelectPropsData, selectedEvent } = props;

    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [selectValue, setSelectValue] = useState<Array<string> | []>([]);
    const [selectOptions, setSelectOptions] = useState<Array<{ label: string, value: string }> | undefined>(undefined);
    const [btnsRenderType, setBtnsRenderType] = useState<"only-hide" | "only-show" | "both">();
    const [isToHide, setIsToHide] = useState<boolean>(true);

    useMemo(() => {
        if (!modalOpen) {
            setHidePopover(false);
        }
        else {
            setHidePopover(true);
        }
    }, [modalOpen])

    useEffect(() => {
        if (!communitySelectPropsData || !selectedEvent.exceptionCommuinties) return;

        const managedCommunities = communitySelectPropsData.data;
        const exceptions = selectedEvent.exceptionCommuinties;
        const targetCommunityId = selectedEvent.communityId;

        const otherCommunities = managedCommunities.filter(
            c => c.id !== targetCommunityId
        );

        if (exceptions.length === 0) setBtnsRenderType("only-hide");
        else if  (otherCommunities.length === exceptions.length) setBtnsRenderType("only-show");
        else setBtnsRenderType("both");

    }, [selectedEvent])

    const renderBtns = () => {
        switch (btnsRenderType) {
            case "only-hide": return (
                <Button icon={<EyeInvisibleOutlined />} onClick={() => showModal(true)} danger>
                    Hide
                </Button>
            )
            case "only-show": return (
                <Button style={{ borderColor: 'green', color: 'green' }} icon={<EyeOutlined />} onClick={() => showModal(false)}>
                    Show
                </Button>
            )
            case "both": return (
                <>
                    <Button style={{
                        borderRightColor: 'black',
                        width: 90,
                        borderBottomRightRadius: 0,
                        borderTopRightRadius: 0
                    }} icon={<EyeInvisibleOutlined />} onClick={() => showModal(true)} danger>
                        Hide
                    </Button><Button style={{
                        borderLeft: 'none',
                        width: 90,
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                        borderColor: 'green',
                        color: 'green'
                    }} icon={<EyeOutlined />} onClick={() => showModal(false)}>
                        Show
                    </Button>
                </>
            )
            default: return <></>;
        }
    }

    const determineSelectOptions = (isToHide: boolean) => {
        if (!communitySelectPropsData || !selectedEvent.exceptionCommuinties) return;

        const managedCommunities = communitySelectPropsData.data;
        const exceptions = selectedEvent.exceptionCommuinties;

        setIsToHide(isToHide);

        if (isToHide) {
            const options = managedCommunities
                .filter(community => exceptions.every(exception => exception.communityId !== community.id) && selectedEvent.communityId !== community.id)
                .map((community) => {
                    return { label: community.name, value: community.id }
                });
            setSelectOptions(options);
            return;
        }

        const options = exceptions.map((exception) => {
            return { label: exception.community.name, value: exception.communityId }
        })
        setSelectOptions(options);
    }

    const showModal = (isToHide: boolean) => {
        determineSelectOptions(isToHide);
        setModalOpen(true);
    };

    const handleOk = async () => {
        setModalOpen(false);
        if (selectOptions && selectOptions.length === 1) { onSuccessFn([selectOptions[0].value], isToHide) }
        else if (selectValue) { onSuccessFn(selectValue, isToHide) }
    };

    const handleCancel = () => {
        console.log('Clicked cancel button');
        setModalOpen(false);
    };

    return (
        <>
            <Modal
                title={`${isToHide ? "Hide" : "Show"} event`}
                open={modalOpen}
                onOk={handleOk}
                // confirmLoading={isLoading}
                onCancel={handleCancel}
            >
                {selectOptions &&

                    <>
                        {selectOptions.length > 1 ?
                            <Space direction="vertical">
                                <Typography.Text>
                                    Are you sure you want to {isToHide ? "hide" : "show"} {selectedEvent.isRecurring ? "recurring" : ""} event - {selectedEvent.title} for your members.
                                </Typography.Text>

                                <Typography.Text>Choose communities: </Typography.Text>
                                <Select
                                    style={{ width: '100%' }}
                                    value={selectValue}
                                    mode="multiple"
                                    showSearch
                                    optionFilterProp="label"
                                    onChange={(value) => setSelectValue(value)}
                                    options={selectOptions}
                                />
                            </Space>
                            :
                            <Typography.Text>
                                Are you sure you want {isToHide ? "hide" : "show"} {selectedEvent.isRecurring ? "recurring" : ""} event - {selectedEvent.title} for the members of {selectOptions[0].label}.
                            </Typography.Text>
                        }
                    </>
                }
            </Modal>

            {renderBtns()}
        </>
    )
}