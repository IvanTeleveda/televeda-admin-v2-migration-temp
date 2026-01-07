import { SendOutlined } from "@ant-design/icons";
import { Button, Form, Modal, Radio, Select, Space, Typography } from "@pankod/refine-antd";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "./useDebounce";
import { useModal, useSelect } from "@refinedev/antd";
import { ICommunity, IUserCommunityAssociation } from "../../../interfaces";
import Constants from "../../../typings/constants";
import { HttpError, useCreate } from "@refinedev/core";

export const SendEmailButton: React.FC<{
        url: string
        templateId: string | undefined;
        communitiesIdsFilterList: string[] | undefined;
        btnText: string;
        btnShape: "default" | "circle" | "round";
        btnType: "default" | "link" | "text" | "primary" | "dashed" | undefined
        btnWidth: number;
        includeInstructors?: boolean;
    }> = (props) => {

    const { show, close, modalProps } = useModal();

    const [radioValues, setRadioValues] = useState<{ members: boolean, instructors: boolean }>({ members: false, instructors: false })

    const [membersToValue, setMembersToValue] = useState<'all' | 'specific'>('all');
    const [instructorsToValue, setInstructorsToValue] = useState<'all' | 'specific'>('all');

    const [membersSearchText, setMembersSearchText] = useState<string | null>(null);
    const membersSearch = useDebouncedValue(membersSearchText, 500);

    const [instructorsSearchText, setInstructorsSearchText] = useState<string | null>(null);
    const instructorsSearch = useDebouncedValue(instructorsSearchText, 500);

    const [communityIds, setCommunityIds] = useState<string[]>([]);

    const [form] = Form.useForm();

    const { mutate } = useCreate();

    const { selectProps: instructorsSelectProps, query: { refetch: refetchInstructors } } = useSelect<IUserCommunityAssociation>({
        resource: "community-associations/hosts",
        optionLabel: (item) => item.user.email,
        optionValue: (item) => item.user.id,
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
        filters: [
            {
                field: "community.id",
                operator: "in",
                value: communityIds
            },
            {
                field: "email",
                operator: 'contains',
                value: instructorsSearchText
            }
        ],
        queryOptions: {
            enabled: false
        }
    });

    const { selectProps: membersSelectProps, query: { refetch: refetchMembers } } = useSelect<IUserCommunityAssociation, HttpError>({
        resource: "community-associations/members",
        optionLabel: (item) => item.user.email,
        optionValue: (item) => item.user.id,
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
        filters: [
            {
                field: "community.id",
                operator: "in",
                value: communityIds
            },
            {
                field: "email",
                operator: 'contains',
                value: membersSearchText
            }
        ],
        queryOptions: {
            enabled: false
        }
    });

    const { selectProps: communitySelectProps } = useSelect<ICommunity>({
        resource: "Community",
        optionLabel: 'name',
        optionValue: 'id',
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
        sort: [
            { field: "name", order: 'asc' }
        ],
        filters: [
            {
                field: 'id',
                operator: 'in',
                value: props.communitiesIdsFilterList
            }
        ],
        queryOptions: {
            enabled: modalProps.open
        }
    });

    useEffect(() => {
        if(!props.includeInstructors) {
            form.setFieldValue("members", true);
            setRadioValues(prevValues => { return { ...prevValues, members: true } });
        }
    }, [props.includeInstructors])

    useEffect(() => {
        if (communityIds.length > 0 && membersToValue === 'specific') {
            refetchMembers();
        }
    }, [communityIds, membersToValue]);

    useEffect(() => {
        if (communityIds.length > 0 && instructorsToValue === 'specific') {
            refetchInstructors();
        }
    }, [communityIds, instructorsToValue]);

    useEffect(() => {
        if(membersToValue === 'specific') {
            refetchMembers();
        }
    }, [membersSearch]);
    
    useEffect(() => {
        if(instructorsToValue === 'specific') {
            refetchInstructors();
        }
    }, [instructorsSearch]);

    const handleMembersRadioOnClick = () => {
        form.setFieldValue("members", false);
        setRadioValues(prevValues => { return { ...prevValues, members: false } })
    }

    const handleInstructorsRadioOnClick = () => {
        form.setFieldValue("instructors", false);
        setRadioValues(prevValues => { return { ...prevValues, instructors: false } })
    }

    const handleCommunityChange = (value: string[]) => {
        setCommunityIds(value);
        form.setFieldValue('instructorIds', []);
        form.setFieldValue('memberIds', []);
    }

    const resetState = () => {
        setRadioValues({ members: false, instructors: false });

        if(props.includeInstructors) {
            form.setFieldValue('members', false);
            form.setFieldValue('instructors', false);
        }

        if(!props.includeInstructors) {
            setRadioValues(prevValues => { return { ...prevValues, members: true } });
        }

        setMembersToValue('all');
        setInstructorsToValue('all');

        setMembersSearchText(null);
        form.setFieldValue('memberIds', []);

        setInstructorsSearchText(null);
        form.setFieldValue('instructorIds', []);

        setCommunityIds([]);
        form.setFieldValue('communityIds', []);
    }

    const handleSending = async () => {
        await form.validateFields();

        const instructorIds = form.getFieldValue('instructorIds');
        const memberIds = form.getFieldValue('memberIds');

        mutate({
            resource: props.url,
            values: {
                templateId: props.templateId,
                communityIds: form.getFieldValue('communityIds'),
                sendToMembers: form.getFieldValue('members') || false,
                sendToInstructors: form.getFieldValue('instructors') || false,
                membersList: membersToValue === 'specific' && form.getFieldValue('members') ? memberIds : [],
                instructorsList: instructorsToValue === 'specific' && form.getFieldValue('instructors') ? instructorIds : []
            },
            successNotification: false
        }, 
        {
            onSuccess: () => {
                resetState();
                close();
            }
        });
    }

    return (
        <>
            <Button 
                onClick={() => show()} 
                size="small" 
                type={props.btnType} 
                shape={props.btnShape} 
                icon={<SendOutlined />}
                style={{width : props.btnWidth }}
            >{
                props.btnText}
            </Button>

            <Modal
                okText="Send"
                onOk={() => handleSending()}
                width={700}
                destroyOnClose
                okButtonProps={{ disabled: !radioValues.members && !radioValues.instructors, size: 'large' }}
                cancelButtonProps={{ size: 'large' }}
                title="Who should receive this email?"
                {...modalProps}
            >
                <Form layout="vertical" form={form}>
                    {props.includeInstructors &&
                        <Space style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
                            <Form.Item
                                name="members"
                            >
                                <Radio.Group size="large" buttonStyle="solid">
                                    <Radio.Button
                                        onChange={() => setRadioValues(prevValues => { return { ...prevValues, members: true } })}
                                        onClick={() => handleMembersRadioOnClick()}
                                        value={true}>
                                        My Members
                                    </Radio.Button>
                                </Radio.Group >
                            </Form.Item>

                            <Form.Item
                                name="instructors"
                            >
                                <Radio.Group size="large" buttonStyle="solid">
                                    <Radio.Button
                                        onChange={() => setRadioValues(prevValues => { return { ...prevValues, instructors: true } })}
                                        onClick={() => handleInstructorsRadioOnClick()}
                                        value={true}>
                                        Community Instructors
                                    </Radio.Button>
                                </Radio.Group >
                            </Form.Item>
                        </Space>
                    }

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.members !== currentValues.members || prevValues.instructors !== currentValues.instructors}
                        preserve={true}
                    >
                        {({ getFieldValue }) => {
                            return (getFieldValue('members') || getFieldValue('instructors')) &&
                                <Form.Item
                                    label="Select the communities that will receive the email"
                                    name="communityIds"
                                    rules={[{ required: true, message: 'Choose at least one community' }]}
                                >
                                    <Select
                                        {...communitySelectProps}
                                        size="large"
                                        onChange={(value: any) => handleCommunityChange(value)}
                                        mode="multiple"
                                    />
                                </Form.Item>
                        }}
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.communityIds !== currentValues.communityIds}
                        preserve={true}
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('communityIds') && getFieldValue('communityIds').length > 0 &&
                            <>
                                <Form.Item
                                    noStyle
                                    shouldUpdate={(prevValues, currentValues) => prevValues.members !== currentValues.members}
                                    preserve={true}
                                >
                                    {({ getFieldValue }) => getFieldValue('members') &&
                                       <div>
                                        <Typography.Text>Sending to</Typography.Text>
                                        <Select
                                            style={{ width: 120, marginInline: 5, padding: 5 }}
                                            defaultValue={instructorsToValue}
                                            onChange={(val) => setMembersToValue(val)}
                                            options={[
                                                { label: 'All', value: 'all' },
                                                { label: 'Specific', value: 'specific' }
                                            ]} />
                                        <Typography.Text>members of the selected communities.</Typography.Text>
                                        </div>
                                    }
                                </Form.Item>

                                {membersToValue === 'specific' && radioValues.members &&
                                    <Form.Item
                                        label="Select which members you wish to recieve the email"
                                        name="memberIds"
                                        style={{ marginTop: 15 }}
                                        rules={[{ required: true, message: 'Choose at least one member' }]}
                                    >
                                        <Select 
                                            {...membersSelectProps} 
                                            onSearch={(text) => setMembersSearchText(text)} 
                                            mode="multiple" 
                                        />
                                    </Form.Item>
                                }

                                <Form.Item
                                    noStyle
                                    shouldUpdate={(prevValues, currentValues) => prevValues.instructors !== currentValues.instructors}
                                    preserve={true}
                                >
                                    {({ getFieldValue }) => getFieldValue('instructors') &&
                                        <div>
                                            <Typography.Text>Sending to</Typography.Text>
                                            <Select
                                                style={{ width: 120, marginInline: 5, padding: 5 }}
                                                defaultValue={instructorsToValue}
                                                onChange={(val) => setInstructorsToValue(val)}
                                                options={[
                                                    { label: 'All', value: 'all' },
                                                    { label: 'Specific', value: 'specific' }
                                                ]} />
                                            <Typography.Text>instructors of the selected communities.</Typography.Text>
                                        </div>
                                    }
                                </Form.Item>

                                {instructorsToValue === 'specific' && radioValues.instructors &&
                                    <Form.Item
                                        label="Select which instructors you wish to recieve the email"
                                        name="instructorIds"
                                        style={{ marginTop: 15 }}
                                        rules={[{ required: true, message: 'Choose at least one instructor' }]}
                                    >
                                        <Select 
                                            {...instructorsSelectProps} 
                                            onSearch={(text) => setInstructorsSearchText(text)} 
                                            mode="multiple" 
                                        />
                                    </Form.Item>
                                }
                            </>
                        }
                    </Form.Item>

                </Form>
            </Modal>
        </>
    )
}