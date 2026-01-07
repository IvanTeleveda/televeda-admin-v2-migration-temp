import { useTranslate, IResourceComponentsProps, HttpError, file2Base64, useCreate, useCustomMutation, usePermissions, useApiUrl } from '@refinedev/core';
import {
    Form,
    Select,
    Upload,
    Button,
    ButtonProps,
    Card,
    Table,
    TextField,
    DateField,
    Space,
    Popconfirm,
    List,
    Tooltip,
    Typography
} from "@pankod/refine-antd";
import { UploadOutlined } from '@ant-design/icons';
import { useState } from "react";
import { ICommunity, UserPermissions } from "../../interfaces";
import Constants from "../../typings/constants";
import { TelevedaCreate } from "../../components/page-containers/create";
import { useForm, useSelect, useTable } from "@refinedev/antd";

export interface IBulkCreateUser {
    usersList: any;
    communityId: string;
}

type CategoryMutationResult = {
    id: number;
    title: string;
};

interface IUserImportJobData {
    email: string;
}

interface IUserImportJob {
    id: string;
    data: IUserImportJobData;
    finishedOn: number;
    returnvalue: any;
}

export const UserBulkCreate: React.FC<IResourceComponentsProps> = () => {

    const t = useTranslate();

    const apiUrl = useApiUrl();

    const { data: permissionsData } = usePermissions<UserPermissions>();

    const [refetchBtnDisabled, setRefetchBtnDisabled] = useState<boolean>(false)

    const { formProps } = useForm<IBulkCreateUser, HttpError, IBulkCreateUser>();

    const { selectProps: communitySelectProps } = useSelect<ICommunity>({
        resource: "community",
        optionLabel: "name",
        optionValue: "id",
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
    });

    const { tableProps: jobsTableProps, tableQuery: { refetch: refetchJobs } } = useTable<IUserImportJob>({
        resource: `_User/import_jobs`,
    });

    const { mutate: mutateCleanJobs } = useCustomMutation<any>();

    const { mutate } = useCreate<CategoryMutationResult>();

    const normFile = (e: any) => {
        console.log('Upload event:', e);
        if (Array.isArray(e)) {
            return e;
        }
        return e?.fileList;
    };

    const customSaveBtnProps: ButtonProps = {
        onClick: async () => {

            await formProps.form?.validateFields();

            console.log('Import users:', formProps.form?.getFieldsValue());

            if (!formProps.form) return

            const base64Files = [];
            const { usersList, communityId } = formProps.form.getFieldsValue();

            for (const file of usersList) {
                if (file.originFileObj) {
                    const base64String = await file2Base64(file);

                    base64Files.push({
                        ...file,
                        base64String,
                    });
                } else {
                    base64Files.push(file);
                }
            }

            mutate({
                resource: "_User/bulk",
                values: {
                    importFiles: base64Files,
                    communityId
                },
                successNotification: (() => ({
                    description: "Send",
                    message: `Task successfully send for processing`,
                    type: "success"
                })),
                errorNotification: (() => ({
                    description: "Failed to send",
                    message: `Task failed to send for processing`,
                    type: "error"
                }))
            }, {
                onSuccess: () => {
                    refetchJobs();
                    formProps.form?.resetFields();
                },
                onError: () => {
                    refetchJobs();
                },
            });
        }
    }

    const handleCleanJobsClick = () => {
        mutateCleanJobs({
            url: `${apiUrl}/_User/clean_import_jobs`,
            method: "post",
            values: {},
        }, {
            onSuccess: () => {
                refetchJobs();
            },
            onError: () => {
                refetchJobs();
            }
        });
    }

    const refetchJobsFn = () => {
        refetchJobs();

        setRefetchBtnDisabled(true);
        setTimeout(() => {
            setRefetchBtnDisabled(false)
        }, 10000)
    }

    return (
        <>
            <TelevedaCreate title="Bulk User Import" saveButtonProps={customSaveBtnProps}>
                <Form {...formProps} layout="vertical">

                    <Form.Item
                        label="Upload users csv file"
                        getValueFromEvent={normFile}
                        name="usersList"
                        valuePropName="fileList"
                        rules={[
                            { required: true, message: 'Please select .csv file to import!' },
                            {
                                validator: async (_, value) => {
                                    if (!value || !value[0]) return;
                                    if (value[0].originFileObj.type === 'text/csv') {
                                        return Promise.resolve();
                                    }
                                    else {
                                        return Promise.reject(new Error('File must be .csv format'));
                                    }
                                },
                            },
                        ]}>
                        <Upload maxCount={1} listType="picture" accept=".csv" beforeUpload={() => false}>
                            <Button icon={<UploadOutlined />}>Click to upload</Button>
                        </Upload>

                    </Form.Item>

                    <Form.Item
                        label="Assign to community"
                        name="communityId"
                        rules={[{ required: true, message: 'Please select community!' }]}
                    >
                        <Select {...communitySelectProps} placeholder="Select community" />
                    </Form.Item>
                </Form>
            </TelevedaCreate>
            <Card
                style={{ marginTop: 20 }}
                title="Import Jobs"
                extra={
                    <Space>
                        <Tooltip open={refetchBtnDisabled} trigger={'hover'} title={"Wait at least 10 seconds to be able to refresh again"}>
                            <Button type="primary"
                                onClick={() => refetchJobsFn()}
                                disabled={refetchBtnDisabled}
                            >
                                Refresh Table
                            </Button>
                        </Tooltip>
                        {permissionsData && permissionsData === 'TelevedaAdmin' &&
                            <Popconfirm
                                title={"Are you sure?"}
                                okText="Yes"
                                cancelText="No"
                                onConfirm={handleCleanJobsClick}
                            >
                                <Button type="primary">Clean Completed Jobs</Button>
                            </Popconfirm>
                        }
                    </Space>
                }
            >
                <Table {...jobsTableProps}
                    rowKey="id"
                    expandable={{
                        expandedRowRender: expandedRowRender,
                        rowExpandable: record => record.returnvalue?.errors?.length > 0,
                    }}>
                    <Table.Column
                        dataIndex="id"
                        width={60}
                        key="id"
                        title={"Id"}
                        render={(value) => <TextField value={value} />} />
                    <Table.Column
                        dataIndex="returnvalue"
                        key="returnvalue"
                        title={"Status"}
                        render={(value, record: any) => {
                            let displayValue = ''
                            if (record.failedReason) {
                                displayValue = `Task Failed: ${record.failedReason}`
                                return <TextField value={displayValue} />
                            }
                            if (value) {
                                displayValue = value?.message
                            }
                            else {
                                displayValue = "Processing task... Refresh to re-check status"
                            }
                            return <TextField value={displayValue} />
                        }}
                    />
                    <Table.Column
                        dataIndex="finishedOn"
                        key="finishedOn"
                        title={"Finished On"}
                        render={(value) => value ? <DateField value={value} format="LLL" /> : null} />
                </Table>
            </Card>
        </>
    );
};

const expandedRowRender = (record: IUserImportJob) => {
    const tableColumns = [{
        title: 'Email',
        dataIndex: 'email',
        key: 'email'
    },
    {
        title: 'Error Message',
        dataIndex: 'message',
        key: 'message'
    }];

    return (
        <List title={<Typography style={{ fontSize: 16 }} >Errors Information</Typography>}>
            <Table dataSource={record.returnvalue.errors} columns={tableColumns} />
        </List>)
}