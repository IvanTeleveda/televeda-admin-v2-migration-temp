
import {
    Drawer,
    DrawerProps,
    Form,
    FormProps,
    Input,
    InputNumber,
    Radio,
    Select,
    ButtonProps,
    Grid,
    Divider,
    Switch,
    Col,
    Row,
    Table,
    Button,
    Modal,
    TextField,
    Popconfirm,
    Space,
} from "@pankod/refine-antd";
import React, { useEffect, useMemo, useState } from "react";
import DateTimeInput from "./date-form-component";
import { DeleteOutlined } from '@ant-design/icons';
import moment from "moment-timezone"
import dayjs from "dayjs";
import { useModal, useSelect } from "@refinedev/antd";
import Constants from "../../typings/constants";
import { IClassCategory, ICommunity, IRefineUser, IScheduledClass, IUser, UserPermissions } from "../../interfaces";
import MutateContainer from "./create-container";
import { TimeZoneHelper } from "../../adapters/TimeZoneHelper";
import { HttpError, useCreate, useGetIdentity, useList, useNotification, usePermissions } from "@refinedev/core";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { ClassicEditor } from "ckeditor5";
import editorConfig from "../../utils/editorConfig";
import { CkEditorFirebaseUploadAdapter } from "../../adapters/CkEditorFirebaseUploadAdapter";
import { EventTypes } from "../../utils/enums";

const { Option, OptGroup } = Select;
const { TextArea } = Input;

type ScheduledClassCreateProps = {
    formId: string;
    drawerProps: DrawerProps;
    formProps: FormProps;
    saveButtonProps: ButtonProps;
    action: string;
    title: string;
    onDemand?: boolean;
    formLoading: boolean;
    showTypeSelection: boolean;
    preselectedClassType?: EventTypes;
};

type IScheduledClassTemplate = {
    address: string;
    categoryId: string
    classImage: string;
    classType: string;
    communityId: string;
    createdAt: string;
    deletedAt: string
    description: string
    externalId: string
    externalUrl: string
    id: string
    instructorImage: string
    instructorInfo: string;
    privacyType: string;
    summary: string;
    title: string;
    updatedAt: string;
    visibilityType: string;
}

export type IClassPasswords = {
    id?: string;
    key: string;
    hashedPass: string;
    expirationDate: Date;
}

export type IClassPasswordsColumns = {
    key: string;
    title: string;
    width?: string;
    render?: React.FC<IClassPasswords>;
}

declare type EventType = React.KeyboardEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement | HTMLButtonElement>;

export const ScheduledClassCreateWithDrawer: React.FC<ScheduledClassCreateProps> = ({
    formId,
    drawerProps,
    formProps,
    onDemand = false,
    saveButtonProps,
    action,
    title,
    formLoading,
    showTypeSelection,
    preselectedClassType = undefined
}) => {

    console.log("Drawer render.");

    console.log("FormLoading:", formLoading);

    const breakpoint = Grid.useBreakpoint();

    const { data: permissionsData } = usePermissions<UserPermissions>();

    const { data: user } = useGetIdentity<IRefineUser>();

    const { open: openNotification, close: closeNotification } = useNotification();
    const [isUploading, setIsUploading] = useState(false);

    const { selectProps: communitySelectProps, query: communitiesQuery } = useSelect<ICommunity>({
        resource: "Community",
        optionLabel: 'name',
        optionValue: 'id',
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
        filters: [{
            field: "includeHosted",
            operator: "eq",
            value: "true"
        }]
    });

    const { selectProps: categorySelectProps } = useSelect<IClassCategory>({
        resource: "class-categories",
        optionLabel: 'title',
        optionValue: 'id',
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
        filters: [{
            field: "includeHosted",
            operator: "eq",
            value: "true"
        }]
    });

    const { selectProps: templateSelectProps, query: templateQueryResult } = useSelect<IScheduledClassTemplate>({
        resource: "scheduled-class/template",
        optionLabel: 'title',
        optionValue: 'id',
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
    })

    const [templateSearchValue, setTemplateSearchValue] = useState<string>('');

    const filteredTemplateOptions = templateSelectProps.options?.filter((option: any) => {
        if (!templateSearchValue) return true;
        return option.label?.toLowerCase().includes(templateSearchValue.toLowerCase());
    }) || [];

    const { mutate: createTemplate } = useCreate<IScheduledClass>();

    const [localInitialValues, setLocalInitialValues] = useState<any>({});

    const [templateErrorMsgCheck, setTemplateErrorMsgCheck] = useState<boolean>(false);

    const [templateErrorMessages, setTemplateErrorMessages] = useState<string[]>([]);

    const [classPasswordsEntires, setClassPasswordsEntries] = useState<IClassPasswords[]>([]);

    const [instructorSelectOptions, setInstructorSelectOptions] = useState<any>(null);

    const [instructorSelectDisabled, setInstructorSelectDisabled] = useState<boolean>(false);

    const [localCommunityId, setLocalCommunityId] = useState<string | null>(null);

    const { modalProps, show, close } = useModal();

    const { modalProps: descriptionModalProps, show: descriptionModalShow, close: descriptionModalClose } = useModal();

    const [managePasswordsForm] = Form.useForm();

    const durationOptions = [30, 60, 90];

    const { data: instructorsData, isLoading: instructorsIsLoading, refetch: instructrsRefetch } = useList<IUser, HttpError>({
        resource: `community-associations/community/${localCommunityId}/hosts`,
        config: {
            pagination: {
                pageSize: Constants.DROPDOWN_FETCH_SIZE
            }
        },
        queryOptions: {
            enabled: false
        }
    });

    const classPasswordsTableColumns: IClassPasswordsColumns[] = [
        {
            title: 'Password',
            key: 'hashedPass',
            width: "45%",
            render: (record) => <Input.Password value={record.hashedPass} readOnly />
        },
        {
            title: 'Expiration Date',
            key: 'expirationDate',
            width: "35%",
            render: (record) => <TextField value={record?.expirationDate ? moment(new Date(record.expirationDate)).toString() : "Never"} />
        },
        {
            title: 'Action',
            key: 'action',
            width: "20%",
            render: (record) =>
                <Popconfirm
                    title="Are you sure?"
                    onConfirm={() => removePasswordFromTable(record.key.toString())}
                    okText="Yes"
                    cancelText="No"
                >
                    <Button danger shape="round" size="small" icon={<DeleteOutlined />}>Remove</Button>
                </Popconfirm>
        },
    ];

    useEffect(() => {
        console.log("Init props", formProps);
        formProps.form?.resetFields();
        setTemplateErrorMsgCheck(false);
        setTemplateErrorMessages([]);
    }, []);

    useEffect(
        () => {
            console.log("formProps.initialValues changed:", formProps.initialValues);

            if (formProps.initialValues) {

                let localValues = JSON.parse(JSON.stringify(formProps.initialValues));

                // check if the duration is actually set
                if (!formProps.initialValues?.duration) {
                    console.log("Duration is not set");
                    //setShowCustomDuration(false);
                }

                // check if the duration is included in the standard duration options
                if (formProps.initialValues?.duration && durationOptions.includes(formProps.initialValues?.duration)) {
                    console.log("Duration is standard", durationOptions.includes(formProps.initialValues?.duration));
                    localValues['selectedDuration'] = formProps.initialValues?.duration;
                }

                // set duration to be custom if it's not in the duration options
                if (formProps.initialValues?.duration && !durationOptions.includes(formProps.initialValues?.duration)) {
                    console.log("Duration is custom");

                    localValues['customDuration'] = formProps.initialValues?.duration;
                    localValues['selectedDuration'] = -1;
                }

                if (!formProps.initialValues?.repeatEnds) {
                    localValues['repeatEnds'] = 'never';
                }
                else if (formProps.initialValues?.repeatEnds === 'date') {
                    localValues['repeatEndDate'] = dayjs(localValues['repeatEndDate']);
                }

                if (formProps.initialValues?.instructorIds) {
                    localValues['instructorIds'] = formProps.initialValues.instructorIds.map((userCommunityAssociation: any) => {
                        return userCommunityAssociation.userId;
                    });
                }

                if (formProps.initialValues?.timezone) {
                    localValues['startDate'] = moment.tz(moment.tz(formProps.initialValues?.startDate, formProps.initialValues?.timezone).format("YYYY-MM-DD HH:mm"), moment.tz.guess()).format();
                    let timezone = { requested: formProps.initialValues?.timezone, current: moment.tz.guess() };
                    localValues['timezone'] = JSON.stringify(timezone);
                }

                else {
                    localValues['timezone'] = null;
                }

                formProps.form?.setFieldsValue(localValues);
                console.log("setFieldsValue: ", localValues);

                localValues['startDate'] = dayjs(localValues['startDate']);

                let tempClassPasswordsArr = []
                if (localValues.classPasswords?.length > 0) {
                    tempClassPasswordsArr = localValues.classPasswords.map((data: any, index: any) => { return ({ ...data, key: index.toString() }) });
                }

                setTemplateErrorMsgCheck(false);
                setTemplateErrorMessages([]);
                setClassPasswordsEntries(tempClassPasswordsArr);
                setLocalCommunityId(localValues.communityId);
                setLocalInitialValues(localValues);
            }
        },
        [formLoading, formProps.initialValues],
    );

    useEffect(() => {
        console.log("Set local initialValues", localInitialValues);
        formProps.form?.resetFields();
        setTemplateErrorMsgCheck(false);
        setTemplateErrorMessages([]);
    }, [localInitialValues]);

    useEffect(() => {
        if (localCommunityId) {
            instructrsRefetch();
            const communityMatch = communitiesQuery.data?.data.filter((community => community.id === localCommunityId))[0];
            const address = communityMatch?.address;
            if (address) {
                formProps.form?.setFieldValue('address', address);
            }
            if (user?.hostOnlyCommunityIds?.includes(localCommunityId) && action !== 'create' && permissionsData !== 'TelevedaAdmin') {
                setInstructorSelectDisabled(true);
            }
            if (localCommunityId === formProps.initialValues?.communityId && user?.hostOnlyCommunityIds?.includes(localCommunityId) && action === 'edit') {
                formProps.form?.setFieldValue('instructorIds', formProps.initialValues.instructorIds.map((userCommunityAssociation: any) => {
                    return userCommunityAssociation.userId;
                }));
            }
        }
    }, [localCommunityId]);

    useEffect(() => {
        handleInstructorSelectFocus();
    }, [instructorsData])


    const checkCanCreateTemplate = async (check: boolean = false) => {

        let returnFunction = false;

        if (templateErrorMsgCheck || check) {
            await formProps.form?.validateFields(['title', 'classImage', 'instructorImage', 'categoryId', 'classType', 'externalUrl', 'address', 'privacyType', 'visibilityType'])
                .then(() => {
                    setTemplateErrorMessages([]);
                })
                .catch(() => {
                    returnFunction = true;

                    const errorArr = formProps.form?.getFieldsError(['title', 'classImage', 'instructorImage', 'categoryId', 'classType', 'externalUrl', 'address', 'privacyType', 'visibilityType']);

                    let errorList: any = []
                    errorArr?.forEach((error) => {
                        if (error.errors.length > 0) {
                            errorList.push(error.errors);
                        }
                    });

                    const errors = errorList.flat();
                    const createTemplateErrorMsg = errors.map((err: string) => {
                        return err + " to create template.";
                    })
                    setTemplateErrorMessages(createTemplateErrorMsg);
                })
        }
        return returnFunction;
    }

    const createTemplateFunction = async () => {

        setTemplateErrorMsgCheck(true);
        const fields = formProps.form?.getFieldsValue();

        const returnFunction = await checkCanCreateTemplate(true);

        if (returnFunction) {
            return;
        }

        createTemplate({
            successNotification: (() => ({
                description: "Successful",
                message: `Successfully created scheduled-class template`,
                type: "success"
            })),
            resource: "scheduled-class/template",
            values: {
                title: fields.title,
                instructorInfo: fields.instructorInfo,
                categoryId: fields.categoryId,
                classImage: fields.classImage,
                instructorImage: fields.instructorImage,
                externalUrl: fields.externalUrl,
                externalId: fields.externalId,
                address: fields.address,
                classType: fields.classType,
                privacyType: fields.privacyType,
                visibilityType: fields.visibilityType,
                summary: fields.classDescription.summary,
                description: fields.classDescription.description || localInitialValues?.classDescription?.description,
                communityId: fields.communityId,
            }
        });
        setTemplateErrorMsgCheck(false);
        setTemplateErrorMessages([]);
    }

    const selectedTemplateChanged = (value: string) => {

        const currentlySelectedTemplate = templateQueryResult.data?.data?.filter((res) => value === res.id)[0];
        if (currentlySelectedTemplate) {

            formProps.form?.setFieldsValue({
                title: currentlySelectedTemplate.title,
                instructorInfo: currentlySelectedTemplate.instructorInfo,
                categoryId: currentlySelectedTemplate.categoryId,
                classImage: currentlySelectedTemplate.classImage,
                instructorImage: currentlySelectedTemplate.instructorImage,
                externalUrl: currentlySelectedTemplate.externalUrl,
                address: currentlySelectedTemplate.address,
                externalId: currentlySelectedTemplate.externalId,
                classType: currentlySelectedTemplate.classType,
                privacyType: currentlySelectedTemplate.privacyType,
                visibilityType: currentlySelectedTemplate.visibilityType,
                classDescription: {
                    description: currentlySelectedTemplate.description || "",
                    summary: currentlySelectedTemplate.summary || ""
                }
                //communityId: currentlySelectedTemplate.communityId,
            });
        }
    }

    const handleCommunityChange = (value: any) => {
        checkCanCreateTemplate();
        setLocalCommunityId(value);
        formProps.form?.setFieldValue('instructorIds', []);
        if (user?.hostOnlyCommunityIds?.includes(value) && action !== 'create' && permissionsData !== 'TelevedaAdmin') {
            setInstructorSelectDisabled(true);
        } else {
            setInstructorSelectDisabled(false);
        }
    }

    const handleInstructorSelectFocus = () => {

        const options = instructorsData?.data
            ?.map((instructor) => {
                if (user?.id === instructor.id) {
                    formProps.form?.setFieldValue('instructorIds', [instructor.id]);
                }
                return { label: `${instructor.firstName} ${instructor.lastName} - ${instructor.email}`, value: instructor.id }
            })

        setInstructorSelectOptions(options);
    }

    const onClassPasswordsFinish = (values: IClassPasswords) => {
        managePasswordsForm.resetFields()
        const key = classPasswordsEntires.length.toString();
        setClassPasswordsEntries((prevSettings) => ([...prevSettings, { key, hashedPass: values.hashedPass, expirationDate: values.expirationDate }]))
    }

    const removePasswordFromTable = (key: string) => {

        setClassPasswordsEntries((prevSettings) => (prevSettings.filter(val => val.key !== key)))
    }

    const onFinish = (values: any) => {

        console.log("Create Drawer onFinish", values);

        if (preselectedClassType == EventTypes.WEBEX && action == "edit") {
            if (dayjs().isAfter(dayjs(values.startDate))) {
                openNotification?.({
                    type: "error",
                    message: "",
                    description: "The start time is earlier than the current time. Enter a later start time.",
                });

                return;
            }
        }

        if (formProps && formProps.onFinish) {

            Object.keys(values).forEach((k) => (values[k] = typeof values[k] == "string" ? values[k].trim() : values[k]));

            const classPasswordsArr = classPasswordsEntires.map(({ key, ...rest }) => {
                return rest;
            });

            formProps.onFinish({
                ...values,
                category: 'none', // Mariqne opr go :)
                duration: values.selectedDuration > 0 ? values.selectedDuration : values.customDuration,
                classPasswords: classPasswordsArr
            })
            setClassPasswordsEntries([])
        }

    };

    const handleClose = (e: any) => {
        //setLocalInitialValues({});
        formProps.form?.resetFields();
        setTemplateErrorMsgCheck(false);
        setInstructorSelectDisabled(false);
        setTemplateErrorMessages([]);
        if (drawerProps.onClose) {
            drawerProps.onClose(e);
        }
    }

    // The reason for this atrocity is when the default community is fetched it takes the one you are a member of.
    // If the managed communities list does not include the one you are a member of
    // the community field will just show an id (which you are not supposed to access) because the communitySelect props fetch only managed communities.
    useMemo(() => {
        if (!communitySelectProps.options) return;

        // This will always be true for admins.
        let isDefaultCommunityExistingForManager = false;

        communitySelectProps.options?.forEach((option) => {
            if (option.value === formProps.form?.getFieldValue("communityId")) isDefaultCommunityExistingForManager = true
        });

        if (!isDefaultCommunityExistingForManager) {
            formProps.form?.setFieldsValue({
                communityId: communitySelectProps.options?.at(0)?.value
            })
            // Handles the initial fetching of the instructors only for the open drawer when creating a new event,
            // the editing is handled when the initial values change.
            if (drawerProps.open && action === 'create') {
                //@ts-ignore
                setLocalCommunityId(communitySelectProps.options?.at(0)?.value);
            }
        }
        else {
            isDefaultCommunityExistingForManager = false;
            if (drawerProps.open && action === 'create') {
                setLocalCommunityId(formProps.form?.getFieldValue('communityId'));
            }
        }
    }, [formProps]);

    return (
        <Drawer
            {...drawerProps}
            width={breakpoint.sm ? "500px" : "100%"}
            styles={{
                body: {
                    padding: 0,
                    marginTop: -20,
                },
            }}
            title={title}
            placement="right"
            onClose={handleClose}
        >
            <MutateContainer saveButtonProps={saveButtonProps} isTemplateBtnDisabled={false} createTemplate={createTemplateFunction} action={action} isFormLoading={formLoading}>
                <Form
                    id={formId}
                    {...formProps}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={localInitialValues}
                >
                    {action === "create" && <Form.Item
                        label={"Template"}
                        name="template"
                    >
                        <Select
                            getPopupContainer={() => document.getElementById(formId) || document.body}
                            {...templateSelectProps}
                            options={filteredTemplateOptions}
                            showSearch
                            onSearch={setTemplateSearchValue}
                            filterOption={false}
                            onChange={(value: any) => selectedTemplateChanged(value)}
                            placeholder="Optional: Choose template"
                        />
                    </Form.Item>}

                    <Form.Item
                        label={"Event name"}
                        name="title"
                        rules={[
                            {
                                required: true,
                                message: "Event name is required"
                            },
                            {
                                max: 80,
                                message: "Event name is too long"
                            }
                        ]}
                    >
                        <Input showCount={true} maxLength={80} onChange={() => checkCanCreateTemplate()} placeholder="Enter event name" />
                    </Form.Item>

                    <Form.Item
                        label={"Community"}
                        name={"communityId"}
                        rules={[
                            {
                                required: true,
                                message: "Community is required"
                            },
                        ]}
                    >
                        <Select
                            getPopupContainer={() => document.getElementById(formId) || document.body}
                            onChange={handleCommunityChange}
                            {...communitySelectProps}
                            placeholder="Please select a community for this event"
                        />
                    </Form.Item>

                    <Form.Item
                        label={"Assign Instructors"}
                        name={"instructorIds"}
                        rules={[
                            {
                                required: true,
                                message: "Instructor is required"
                            },
                        ]}
                    >
                        <Select
                            getPopupContainer={() => document.getElementById(formId) || document.body}
                            mode="multiple"
                            loading={instructorsIsLoading}
                            disabled={instructorSelectDisabled}
                            options={instructorSelectOptions}
                            onSearch={undefined}
                            filterOption={true}
                            optionFilterProp="label"
                            placeholder="Please assign an instructor for this event"
                        />
                    </Form.Item>

                    <Form.Item
                        label={"Instructor Display Name"}
                        name={"instructorInfo"}
                    >
                        <Input
                            placeholder="Please input instructor name for this event"
                        />
                    </Form.Item>

                    {/* <Form.Item
                        label={"Category"}
                        name={"category"}
                        rules={[
                            {
                                required: true,
                                message: "Category is required"
                            },
                        ]}
                    >
                        <Select
                            onChange={() => checkCanCreateTemplate()}
                            getPopupContainer={() => document.getElementById(formId) || document.body}
                            {...categorySelectProps}
                            placeholder="Please select event category"
                        />
                    </Form.Item> */}

                    <Form.Item
                        label={"Category"}
                        name={"categoryId"}
                        rules={[
                            {
                                required: true,
                                message: "Category is required"
                            },
                        ]}
                    >
                        <Select
                            onChange={() => checkCanCreateTemplate()}
                            getPopupContainer={() => document.getElementById(formId) || document.body}
                            {...categorySelectProps}
                            placeholder="Please select event category"
                        />
                    </Form.Item>

                    {showTypeSelection && (
                        <>
                            <Form.Item
                                noStyle={onDemand ? true : false}
                                name="classType"
                                label="Video Streaming Options"
                                rules={[
                                    {
                                        required: true,
                                        message: "Video Options are required"
                                    },
                                ]}>
                                {!onDemand ?
                                    <Select
                                        getPopupContainer={() => document.getElementById(formId) || document.body}
                                        onChange={() => checkCanCreateTemplate()}
                                        placeholder="Please select the video streaming option for this event"
                                        options={[
                                            { value: EventTypes.LOCAL, label: 'Televeda Live Streaming' },
                                            { value: EventTypes.TELEVEDA_BINGO, label: 'Televeda Bingo Game' },
                                            { value: EventTypes.EXTERNAL, label: 'External Video Conferencing (Zoom, Meets, Teams)' },
                                            { value: EventTypes.IN_PERSON, label: 'In Person' },
                                            { value: EventTypes.VTC, label: "VTC" },
                                        ]}
                                    />
                                    : <></>}
                            </Form.Item>

                            <Form.Item
                                noStyle
                                shouldUpdate={(prevValues, currentValues) => prevValues.classType !== currentValues.classType}
                                preserve={true}
                            >
                                {({ getFieldValue }) => {
                                    switch (getFieldValue('classType')) {
                                        case EventTypes.EXTERNAL:
                                            return (<Form.Item
                                                label="External Class URL"
                                                name="externalUrl"
                                                rules={[
                                                    {
                                                        validator: async (_, value) => {
                                                            console.log("validator", value);

                                                            if (!value) return;

                                                            const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
                                                                '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
                                                                '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
                                                                '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
                                                                '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
                                                                '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator

                                                            if (!!pattern.test(value)) {
                                                                return Promise.resolve();
                                                            } else {
                                                                return Promise.reject(
                                                                    new Error("Please enter a valid Url!"),
                                                                );
                                                            }


                                                        },
                                                    },
                                                    {
                                                        required: true,
                                                        message: "External Class URL is required"
                                                    },
                                                ]}
                                            >
                                                <Input onChange={() => checkCanCreateTemplate()} />
                                            </Form.Item>);
                                        case EventTypes.IN_PERSON:
                                            return <Form.Item
                                                label="In-Person Class Address"
                                                name="address"
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: "Address is required"
                                                    },
                                                ]}
                                            >
                                                <Input onChange={() => checkCanCreateTemplate()} />
                                            </Form.Item>;
                                        default: return null;
                                    }
                                }}
                            </Form.Item>
                        </>
                    )}

                    <Form.Item
                        label="Event Access"
                        name="privacyType"
                        rules={[{ required: true, message: "Event Access is required" }]}
                    >
                        <Select getPopupContainer={() => document.getElementById(formId) || document.body} onChange={() => checkCanCreateTemplate()} placeholder="Please select privacy type">
                            <Option value="public">Open to Network</Option>
                            <Option value="password">Via password access</Option>
                            <Option value="community">Only for my Community</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.privacyType !== currentValues.privacyType}
                        preserve={true}
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('privacyType') == 'password' ? (
                                <Form.Item
                                    name="classPasswords"
                                >
                                    <>
                                        <Button type="primary" onClick={show}>Manage passwords</Button>
                                        <Modal title="Manage passwords" onOk={close} afterClose={() => managePasswordsForm.resetFields()} {...modalProps} width={'40%'}>
                                            <Table dataSource={classPasswordsEntires} columns={classPasswordsTableColumns} />
                                            <Form
                                                id={`${formId}Modal`}
                                                form={managePasswordsForm}
                                                name="basic"
                                                layout="vertical"
                                                onFinish={onClassPasswordsFinish}
                                                autoComplete="off"
                                            >
                                                <Form.Item
                                                    label="Password"
                                                    name="hashedPass"
                                                    rules={[{ required: true, message: 'Password cannot be empty' }]}
                                                >
                                                    <Input.Password />
                                                </Form.Item>

                                                <Form.Item
                                                    label="Expiration date"
                                                    name="expirationDate"
                                                >
                                                    <DateTimeInput formId={`${formId}Modal`} showTime={true} />
                                                </Form.Item>

                                                <Form.Item>
                                                    <Button type="primary" htmlType="submit">
                                                        Add
                                                    </Button>
                                                </Form.Item>
                                            </Form>
                                        </Modal>
                                    </>
                                </Form.Item>
                            ) : null
                        }
                    </Form.Item>

                    <Form.Item
                        label="Event Visibility"
                        name="visibilityType"
                        rules={[{ required: true, message: "Event Visibility is required" }]}
                    >
                        <Select getPopupContainer={() => document.getElementById(formId) || document.body} onChange={() => checkCanCreateTemplate()} placeholder="Please select visibility type">
                            <Option value="public">Entire Network</Option>
                            <Option value="community">Only Community</Option>
                            {permissionsData === "TelevedaAdmin" && <Option value="hidden">Only Admins</Option>}
                        </Select>
                    </Form.Item>


                    <Divider />

                    <Form.Item name={['classDescription', 'summary']} label="Event Summary" rules={[]}>
                        <TextArea placeholder="2-sentence description" rows={2} />
                    </Form.Item>

                    <Form.Item
                        label="Event Description"
                        preserve={true}
                    >
                        <Button type="primary" onClick={descriptionModalShow}>Open event description</Button>
                        <Modal okButtonProps={{ disabled: isUploading }} onOk={descriptionModalClose} {...descriptionModalProps} width={'75%'} style={{ top: 20 }} centered>
                            <Form.Item
                                name={['classDescription', 'description']}
                                rules={[]}

                                valuePropName='data'

                                getValueFromEvent={(event, editor) => {
                                    const data = editor.getData();
                                    return data;
                                }}
                                style={{ paddingTop: 30 }}
                            >
                                <CKEditor
                                    editor={ClassicEditor}
                                    config={editorConfig}
                                    onReady={(editor: any) => {
                                        // You can store the "editor" and use when it is needed.
                                        editor.editing.view.change((writer: any) => {
                                            writer.setStyle('min-width', 'inherit', editor.editing.view.document.getRoot());
                                            writer.setStyle(
                                                "min-height",
                                                "250px",
                                                editor.editing.view.document.getRoot()
                                            );
                                        })
                                        if (editor && editor.plugins) {
                                            editor.plugins.get("FileRepository").createUploadAdapter = (loader: any) => {
                                                return new CkEditorFirebaseUploadAdapter(loader, setIsUploading);
                                            };

                                            console.log('Editor is ready to use!', editor);
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Modal>
                    </Form.Item>

                    <Divider />

                    <Form.Item
                        label="Time Zone"
                        name="timezone"
                    >
                        <Select allowClear
                            showSearch
                            filterOption={(input, option) => { return (option?.label ?? '').toLowerCase().includes(input.toLowerCase().trim()) }}
                            options={TimeZoneHelper.getTimezonesNames().map((timeZone) => { return { label: timeZone.tzPresentationName, value: JSON.stringify({ requested: timeZone.tzName, current: moment.tz.guess() }) } })}
                            getPopupContainer={() => document.getElementById(formId) || document.body}
                            placeholder="Optional: Select time zone" />
                    </Form.Item>

                    <Form.Item
                        name="startDate"
                        label="Start date & time"
                        rules={[{ required: true, message: "Start date & time are required" }]}
                    >
                        <DateTimeInput formId={formId} showTime={true} />
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.classType !== currentValues.classType}
                        preserve={true}>
                        <Form.Item name="selectedDuration" label="Duration (minutes)" rules={[{ required: true, message: "Duration is required" }]}>
                            <Select
                                getPopupContainer={() => document.getElementById(formId) || document.body}
                                placeholder="Please select duration for this event"
                            >
                                <Option value={30}>30 min</Option>
                                <Option value={60}>60 min</Option>
                                <Option value={90}>90 min</Option>
                                <Option value={-1}>Custom</Option>
                            </Select>
                        </Form.Item>
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.selectedDuration !== currentValues.selectedDuration || prevValues.classType !== currentValues.classType}
                        preserve={true}
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('selectedDuration') == -1 ? (
                                <Form.Item
                                    label="Custom duration (minutes)"
                                    name="customDuration"
                                    preserve={true}
                                    rules={[
                                        {
                                            required: true,
                                            message: "Custom duration is required"
                                        },
                                    ]}
                                >
                                    <InputNumber min={1} placeholder="Please type duration in minutes for this event" style={{ width: "100%" }} />
                                </Form.Item>
                            ) : null
                        }
                    </Form.Item>

                    <Divider />

                    <Form.Item
                        name="linkOnDemand"
                        valuePropName="checked"
                        label="Automatically create On-Demand events"
                    >
                        <Switch checkedChildren="YES" unCheckedChildren=" NO" />
                    </Form.Item>

                    <Form.Item
                        name="isRecurring"
                        valuePropName="checked"
                        label="Is Recurring"
                    >
                        <Switch checkedChildren="YES" unCheckedChildren=" NO" />
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.isRecurring !== currentValues.isRecurring}
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('isRecurring') == true ? (
                                <>
                                    <Form.Item
                                        label="Repeat every"
                                    >
                                        <Row gutter={8}>
                                            <Col span={8}>
                                                <Form.Item
                                                    name="repeatPeriod"
                                                >
                                                    <InputNumber min={1} placeholder="Repeat period" style={{ width: "100%" }} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={14}>

                                                <Form.Item name="repeatOn" >
                                                    <Select
                                                        getPopupContainer={() => document.getElementById(formId) || document.body}
                                                        placeholder="Please select duration for this event"
                                                        options={[
                                                            { value: 'day', label: 'Day' },
                                                            { value: 'week', label: 'Week' },
                                                            { value: 'month', label: 'Month' },
                                                            { value: 'year', label: 'Year' },
                                                        ]}
                                                        style={{ width: "100%" }}
                                                    />
                                                </Form.Item>

                                            </Col>
                                        </Row>
                                    </Form.Item>

                                    <Form.Item
                                        label="Ends"
                                    >
                                        <Form.Item
                                            name="repeatEnds"
                                        >
                                            <Radio.Group>
                                                <Radio value="never">Never</Radio>
                                                <Radio value="date">On a date</Radio>
                                                <Radio value="repetitions">After repetitions</Radio>
                                            </Radio.Group>
                                        </Form.Item>

                                        <Form.Item
                                            noStyle
                                            shouldUpdate={(prevValues, currentValues) => prevValues.repeatEnds !== currentValues.repeatEnds}
                                        >
                                            {({ getFieldValue }) =>
                                                getFieldValue('repeatEnds') == 'date' ?
                                                    <Form.Item
                                                        name="repeatEndDate"
                                                        rules={[
                                                            {
                                                                required: true,
                                                                message: "Event repetition end date is required"
                                                            },
                                                        ]}
                                                    >
                                                        <DateTimeInput formId={formId} showTime={false} />
                                                    </Form.Item>
                                                    : null
                                            }
                                        </Form.Item>

                                        <Form.Item
                                            noStyle
                                            shouldUpdate={(prevValues, currentValues) => prevValues.repeatEnds !== currentValues.repeatEnds}
                                        >
                                            {({ getFieldValue }) =>
                                                getFieldValue('repeatEnds') == 'repetitions' ?
                                                    <Form.Item
                                                        name="repeatEndRepetitions"
                                                        rules={[
                                                            {
                                                                required: true,
                                                                message: "Number of repetitions are required"
                                                            },
                                                        ]}
                                                    >
                                                        <InputNumber min={1} placeholder="Repetitions" style={{ width: "100%" }} />
                                                    </Form.Item>
                                                    : null
                                            }
                                        </Form.Item>

                                    </Form.Item>

                                </>)
                                : null
                        }
                    </Form.Item>

                    <Divider />
                    <Space direction="vertical" style={{ color: '#fa541c', lineHeight: '8px' }}>
                        {templateErrorMessages}
                    </Space>
                </Form>
            </MutateContainer>
        </Drawer>
    );
}