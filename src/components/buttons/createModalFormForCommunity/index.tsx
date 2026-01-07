import { Button, Checkbox, Form, Input, Modal, Select } from "@pankod/refine-antd";
import React, { JSX, useState } from "react";
import { ICommunity } from "../../../interfaces";
import Constants from "../../../typings/constants";
import { useSelect } from "@refinedev/antd";
import { useCreate } from "@refinedev/core";

export const CreateModalFormForCommunityButton: React.FC<{
    communityId: string,
    url: string,
    modalTitle: string,
    modalField: string,
    onSuccessFn: () => void,
    associationType: string
    modalBtnIcon: JSX.Element
    modalBtnTxt: string
}> = (props) => {

    const { communityId, url, modalTitle, modalField, onSuccessFn, associationType, modalBtnTxt, modalBtnIcon } = props;

    const [inviteManagerVisible, setInviteManagerVisible] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const { selectProps } = useSelect<ICommunity>({
        resource: "Community",
        optionLabel: 'name',
        optionValue: 'id',
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
    });

    const [form] = Form.useForm();

    const onSuccess = () => {
        setInviteManagerVisible(false);
        onSuccessFn();
    }

    const { data, isLoading, mutate } = useCreate<any>();

    const showModal = () => {
        form.resetFields();
        setInviteManagerVisible(true);
    };



    const handleOk = async () => {
        setConfirmLoading(true);

        const fields = form.getFieldsValue();
        await form.validateFields()

        const values: any = {}
        let resource: string
        let localCommunityId: string
        communityId === "" ? localCommunityId = fields.communityId : localCommunityId = communityId

        if (associationType) {
            resource = `${url}/${localCommunityId}/${associationType}`
        }
        else {
            resource = `${url}/${localCommunityId}`
        }

        values[modalField] = fields.value
        values['communityId'] = localCommunityId

        if(fields.checkbox) {
            mutate({
                successNotification: false,
                errorNotification: false,
                resource: `${url}/${localCommunityId}/host`,
                values: { ...values, isFromManagerInvitation: true }
            })
        }

        mutate({
            resource: resource,
            values: { ...values }
        },
            {
                onSuccess: onSuccess
            });
        

        console.log('Invite form values:', form.getFieldsValue());
    };

    const handleCancel = () => {
        console.log('Clicked cancel button');
        setInviteManagerVisible(false);
    };

    //useEffect

    return (
        <>
            <Modal
                title={modalTitle}
                open={inviteManagerVisible}
                onOk={handleOk}
                confirmLoading={isLoading}
                onCancel={handleCancel}
            >
                <Form
                    form={form}
                    layout={'vertical'}
                    name="basic"
                    // labelCol={{ span: 8 }}
                    // wrapperCol={{ span: 16 }}
                    initialValues={{ remember: true }}
                    // onFinish={onFinish}
                    // onFinishFailed={onFinishFailed}
                    autoComplete="off"
                >
                    <Form.Item
                        label={modalField === "email" ? "Registered Email" : "Invite code"}
                        name="value"
                        rules={[
                            {
                                type: `${modalField === "email" ? "email" : "string"}`,
                                message: "The input is not valid email!"
                            },
                            {
                                required: true,
                                message: `${modalField === "email" ? "Registered Email" : "Invite code"} is required!`
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    {communityId === "" ?
                        <Form.Item
                            label="Communitiy"
                            name="communityId"
                            rules={[{ required: true, message: "Community is required!" }]}
                        >
                            <Select {...selectProps}></Select>
                        </Form.Item>
                        : null}

                    {associationType === "manager" ?
                        <Form.Item
                            name="checkbox"
                            valuePropName="checked"
                            initialValue={true}
                        >
                             <Checkbox style={{ fontWeight: "bold", fontSize: "14px" }}>Also assign as instructor</Checkbox>
                        </Form.Item> : null}
                </Form>

            </Modal>

            <Button type="primary" shape={communityId === "" ? "default" : "round"} icon={modalBtnIcon} onClick={showModal}>
                {modalBtnTxt}
            </Button>
        </>

    )
}