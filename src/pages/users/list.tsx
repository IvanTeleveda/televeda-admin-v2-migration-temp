import {
    IResourceComponentsProps,
    CrudFilters,
    HttpError,
    usePermissions,
    useNavigation,
    useUpdateMany,
    useDeleteMany,
    useLink,
} from '@refinedev/core';
import {
    Table,
    TextField,
    getDefaultSortOrder,
    Space,
    DateField,
    Form,
    Col,
    Input,
    Icons,
    Button,
    DatePicker,
    Checkbox,
    Tag,
    Select,
    Popover,
    Modal,
    Result,
    Radio
} from "@pankod/refine-antd";
import { useContext, useRef, useState } from "react";
import { UploadOutlined } from "@ant-design/icons";
import paginationFormatter from "../../components/pagination";
import { ICommunity, IUser, IUserCommunityAssociation, IUserFilterVariables, UserPermissions } from "../../interfaces";
import { TelevedaList } from "../../components/page-containers/list";
import Constants from "../../typings/constants";
import FilterFormWrapper from "../../components/filter";
import { FilterButton } from "../../components/buttons/filter";
import { CreateButton, DeleteButton, ShowButton, useSelect, useTable } from "@refinedev/antd";
import { ColorModeContext } from '../../contexts/color-mode';

export const UserList: React.FC<IResourceComponentsProps> = () => {
    const { data: permissionsData } = usePermissions<UserPermissions>();

    const { mode } = useContext(ColorModeContext);

    const [changeCommunityModalVisible, setChangeCommunityModalVisible] = useState<boolean>(false);

    const filterButtonRef = useRef<{ hide: () => void }>();
    const filterWrapperRef = useRef<{ handleValidation: () => void }>();

    const { mutate: mutateCommunityAssociation, isLoading: isMutatingCommunityAssociation } = useUpdateMany<IUserCommunityAssociation>();
    const { mutate: mutateUser, isLoading: isMutatingUser } = useUpdateMany<IUser>();

    const { selectProps: communitySelectProps } = useSelect<ICommunity>({
        resource: "community",
        optionLabel: "name",
        optionValue: "id",
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
    });

    const { show } = useNavigation();
    const [form] = Form.useForm();

    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const { tableProps, sorters, filters, searchFormProps, tableQuery: { refetch: refetchTable } } = useTable<IUser, HttpError, IUserFilterVariables>({
        syncWithLocation: true,
        initialSorter: [
            {
                field: "createdAt",
                order: "desc",
            },
        ],
        onSearch: (params) => {
            const filters: CrudFilters = [];
            const { email, firstName, lastName, associationType, communityIds, createdAt, updatedAt, isActive, noAssociation } = params;

            setSelectedRowKeys([]);

            filters.push({
                field: "email",
                operator: "contains",
                value: email,
            });

            filters.push({
                field: "first_name",
                operator: "contains",
                value: firstName,
            });

            filters.push({
                field: "last_name",
                operator: "contains",
                value: lastName,
            });

            filters.push({
                field: "associationType",
                operator: "in",
                value: associationType,
            });

            filters.push({
                field: "communityId",
                operator: "in",
                value: communityIds,
            });

            if (createdAt) {
                filters.push({
                    field: "createdAt",
                    operator: "between",
                    value: [createdAt[0].startOf("day").toISOString(), createdAt[1].endOf("day").toISOString()],
                });
            }
            else {
                filters.push({
                    field: "createdAt",
                    operator: "between",
                    value: undefined,
                });
            }

            if (updatedAt) {
                filters.push({
                    field: "updatedAt",
                    operator: "between",
                    value: [updatedAt[0].startOf("day").toISOString(), updatedAt[1].endOf("day").toISOString()],
                });
            }
            else {
                filters.push({
                    field: "updatedAt",
                    operator: "between",
                    value: undefined,
                });
            }

            filters.push({
                field: "is_active",
                operator: "eq",
                value: isActive,
            });

            filters.push({
                field: "no_association",
                operator: "nin",
                value: noAssociation ? true : undefined
            })

            console.log('Filters:', filters);

            return filters;
        },
    });

    const Link = useLink();
    const { mutate: mutateDeleteMany } = useDeleteMany();

    const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
        console.log('selectedRowKeys changed: ', newSelectedRowKeys);
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    };

    const hasSelected = selectedRowKeys.length > 0;

    const handleDeleteUsers = () => {

        mutateDeleteMany({
            resource: "_User",
            ids: selectedRowKeys.map((key: any) => JSON.parse(key)),
            mutationMode: "undoable",
            successNotification: (() => ({
                description: "Successful",
                message: `Successfully Deleted User${selectedRowKeys?.length > 1 ? 's' : ''} `,
                type: "success"
            })),
            errorNotification: (error) => ({
                description: (error as any).message,
                message: `Error Deleting User${selectedRowKeys?.length > 1 ? 's' : ''} `,
                type: "error"
            }),
        },
            {
                onError: (error, variables, context) => {
                    // An error happened!
                },
                onSuccess: (data, variables, context) => {
                    setSelectedRowKeys([]);
                    refetchTable();
                },
            });
    };

    if (permissionsData && permissionsData != 'TelevedaAdmin') {
        return <Result
            status="403"
            title="403"
            subTitle="Sorry, you are not authorized to access this page."
            extra={<Button type="primary"><Link to='/'>Back Home</Link></Button>}
        />
    }

    const handleChangeUserStatus = (isActive: boolean) => {

        mutateUser({
            resource: "community-associations/userStatus",
            ids: selectedRowKeys.map((key: any) => JSON.parse(key).communityId),
            values: {
                accountData: {
                    isActive
                }
            },
            mutationMode: "undoable",
        },
            {
                onSuccess: () => {
                    setSelectedRowKeys([]);
                    refetchTable();
                },
                onError: () => {
                    refetchTable();
                }
            }
        )
    }

    const handleChangeCommunity = () => {
        const fields = form.getFieldsValue();
        mutateCommunityAssociation({
            resource: "community-associations",
            ids: selectedRowKeys.map((key: any) => JSON.parse(key).communityId),
            values: {
                communityId: fields.communityId
            },
            mutationMode: "undoable",
        },
            {
                onSuccess: () => {
                    setChangeCommunityModalVisible(false);
                    setSelectedRowKeys([]);
                    refetchTable();
                },
            }
        );
    };

    const { RangePicker } = DatePicker;

    if (tableProps.pagination) {
        tableProps.pagination.showTotal = paginationFormatter;
    }

    return (

        <>
            <Modal
                title={"Change community"}
                open={changeCommunityModalVisible}
                onOk={handleChangeCommunity}
                confirmLoading={isMutatingCommunityAssociation}
                onCancel={() => { setChangeCommunityModalVisible(false); }}
            >
                <Form
                    form={form}
                    layout={'vertical'}
                    name="basic"
                    initialValues={{ remember: true }}
                    autoComplete="off"
                >
                    <Form.Item
                        label="Community"
                        name="communityId"
                        rules={[{ required: true, message: 'Please select community!' }]}
                    >
                        <Select {...communitySelectProps} placeholder="Select community" allowClear />
                    </Form.Item>

                </Form>

            </Modal>
            <TelevedaList
                listProps={{
                    headerProps: {
                        extra: <>
                            <FilterButton
                                ref={filterButtonRef}
                                width={700}
                                filters={filters}
                            >
                                <FilterFormWrapper
                                    ref={filterWrapperRef}
                                    filterButtonRef={filterButtonRef}
                                    formProps={searchFormProps}
                                    filters={filters || []}
                                    fieldValuesNameRef={['firstName', 'lastName', 'communityIds', 'associationType', 'email', 'createdAt', 'isActive', 'noAssociation']}
                                    filterValuesNameRef={['first_name', 'last_name', 'communityId', 'associationType', 'email', 'createdAt', 'is_active', 'no_association']}
                                    formElement={
                                        <>
                                            <Col xl={12} md={8} sm={12} xs={24}>
                                                <Form.Item label="First name" name="firstName">
                                                    <Input
                                                        onChange={() => filterWrapperRef.current?.handleValidation()}
                                                        placeholder="Filter by first name"
                                                        prefix={<Icons.SearchOutlined />}
                                                        allowClear
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col xl={12} md={8} sm={12} xs={24}>
                                                <Form.Item label="Last name" name="lastName">
                                                    <Input
                                                        onChange={() => filterWrapperRef.current?.handleValidation()}
                                                        placeholder="Filter by last name"
                                                        prefix={<Icons.SearchOutlined />}
                                                        allowClear
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col xl={12} md={8} sm={12} xs={24}>
                                                <Form.Item label="Email" name="email">
                                                    <Input
                                                        onChange={() => filterWrapperRef.current?.handleValidation()}
                                                        placeholder="Filter by email"
                                                        prefix={<Icons.SearchOutlined />}
                                                        allowClear
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col xl={12} md={8} sm={12} xs={24}>
                                                <Form.Item label="Roles" name="associationType">
                                                    <Select
                                                        placeholder="Filter by roles"
                                                        allowClear
                                                        onChange={() => filterWrapperRef.current?.handleValidation()}
                                                        options={[
                                                            { label: "Member", value: "Member" },
                                                            { label: "Instuctor", value: "Host" },
                                                            { label: "Manager", value: "Manager" },
                                                            { label: "Admin", value: "Admin" }
                                                        ]}
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col xl={12} md={8} sm={12} xs={24}>
                                                <Form.Item
                                                    label="Community"
                                                    name="communityIds"
                                                >
                                                    <Select onChange={() => filterWrapperRef.current?.handleValidation()}{...communitySelectProps} placeholder="Filter by community" allowClear mode="multiple" />
                                                </Form.Item>
                                            </Col>


                                            <Col xl={12} md={8} sm={12} xs={24}>
                                                <Form.Item
                                                    label="Created between"
                                                    name="createdAt"
                                                >
                                                    <RangePicker onChange={() => filterWrapperRef.current?.handleValidation()} style={{ width: "100%" }} />
                                                </Form.Item>
                                            </Col>

                                            <Col xl={12} md={8} sm={12} xs={24}>
                                                <Form.Item
                                                    label="Member Status"
                                                    name="isActive"
                                                >
                                                    <Radio.Group onChange={() => filterWrapperRef.current?.handleValidation()} defaultValue="true" name="radiogroup">
                                                        <Space direction="vertical">
                                                            <Radio value="true">Active</Radio>
                                                            <Radio value="false">Suspended</Radio>
                                                        </Space>
                                                    </Radio.Group>
                                                </Form.Item>
                                            </Col>

                                            <Col xl={24} md={8} sm={12} xs={24}>
                                                <Form.Item
                                                    name="noAssociation"
                                                    valuePropName="checked"
                                                >
                                                    <Checkbox onChange={() => filterWrapperRef.current?.handleValidation()} style={{ fontWeight: "bold", fontSize: "14px" }}>Show users without community</Checkbox>
                                                </Form.Item>
                                            </Col>
                                        </>}
                                    syncWithLocation={true}
                                />
                            </FilterButton>
                            <CreateButton type="primary" />
                            <Button type="primary"><UploadOutlined /> <Link style={{ color: "black" }} to="/users/_User/bulk">Bulk Import</Link></Button>
                        </>,
                        subTitle: hasSelected && (
                            <Space style={{ gap: 10, marginLeft: "1em" }}>
                                <Button
                                    onClick={() => { setChangeCommunityModalVisible(true); }}
                                >
                                    Change community
                                </Button>

                                {tableProps.dataSource && (tableProps.dataSource[0].accountData === null || tableProps.dataSource[0].accountData.isActive === true) ?

                                    <Button
                                        type="primary"
                                        danger
                                        onClick={() => { handleChangeUserStatus(false); }}
                                    >
                                        Suspend
                                    </Button> : <Button
                                        type="primary"
                                        onClick={() => { handleChangeUserStatus(true); }}
                                    >
                                        Grant Access
                                    </Button>}

                                <Button
                                    type="primary"
                                    danger
                                    onClick={() => { handleDeleteUsers(); }}
                                >
                                    Bulk Delete
                                </Button>
                            </Space>
                        ),
                    }
                }}
            >

                <Table {...tableProps} rowKey={(record) => { return JSON.stringify({ id: record.id, communityId: record.memberOfCommunities?.at(0)?.UserCommunityAssociation?.id, authId: record.auth0Id }) || '' }} rowSelection={rowSelection}>
                    <Table.Column
                        dataIndex="firstName"
                        key="firstName"
                        title="Name"
                        width="150px"
                        render={(_, record: IUser) => <TextField style={{ cursor: 'pointer', color: mode === 'light' ? 'blue' : '#5273e0', textDecoration: 'underline' }} onClick={() => show('_User', record.id)} value={`${record.firstName} ${record.lastName}`} />}
                        defaultSortOrder={getDefaultSortOrder("firstName", sorters)}
                        sorter />

                    <Table.Column
                        dataIndex="email"
                        key="email"
                        title="Email"
                        render={(value) => <TextField value={value} />}
                        defaultSortOrder={getDefaultSortOrder("email", sorters)}
                        sorter />

                    <Table.Column
                        dataIndex="accountData"
                        key="accountData.mobilePhoneNumber"
                        width="150px"
                        title="Phone Number"
                        render={(value) => <TextField value={value?.mobilePhoneNumber} />} />

                    <Table.Column
                        dataIndex=""
                        key="id"
                        width="200px"
                        title="Roles"
                        render={(_, record: any) => {
                            let roles = [];
                            let communityNames = { members: [], managers: [], instructors: [] };
                            if (record?.memberOfCommunities?.length > 0) {
                                roles.push("Member");
                                communityNames.members = record?.memberOfCommunities?.at(0).name;
                            }
                            if (record?.managedCommunities?.length > 0) {
                                roles.push("Manager");
                                communityNames.managers = record?.managedCommunities?.map((item: ICommunity) => { return <>{item.name}<br /></>; });
                            }
                            if (record?.hostForCommunities?.length > 0) {
                                roles.push("Instructor");
                                communityNames.instructors = record?.hostForCommunities?.map((item: ICommunity) => { return <>{item.name}<br /></>; });
                            }
                            if (record?.accountData?.isTelevedaAdmin)
                                roles.push("Super-Admin");
                            return (
                                <Space key={record.id} wrap>
                                    {roles.map((item) => {
                                        return (
                                            item !== "Super-Admin" ?
                                                <Popover key={item + record.id} content={item === "Member" ? communityNames.members : item === "Manager" ? communityNames.managers : communityNames.instructors} title={item + ' of'}>
                                                    <Tag color={item != "Member" ? "#532d7f" : "geekblue"}>{item}</Tag>
                                                </Popover>
                                                :
                                                <Tag color={"#febf00"} key={item + record.id}>{item}</Tag>
                                        );
                                    })}
                                </Space>
                            );
                        }} />

                    <Table.Column
                        dataIndex="memberOfCommunities"
                        key="memberOfCommunities.name"
                        title="Member of"
                        render={(value) => <TextField value={value?.at(0)?.name} />}
                        sorter
                    />

                    <Table.Column
                        dataIndex="createdAt"
                        key="createdAt"
                        title="Created"
                        render={(value) => <DateField value={value} format="LLL" />}
                        sorter />

                    <Table.Column<IUser>
                        title={"Actions"}
                        dataIndex="actions"
                        render={(_, record) => (
                            <Space direction="vertical">
                                <ShowButton size="small" shape="round" style={{ width: 95 }} resource="community-associations/members" recordItemId={record.id}>History</ShowButton>
                                <DeleteButton
                                    size="small"
                                    shape="round"
                                    style={{ width: 95 }} recordItemId={record.id}
                                    successNotification={(() => ({
                                        description: "Successful",
                                        message: `Successfully Deleted User`,
                                        type: "success"
                                    }))}
                                    errorNotification={(error) => ({
                                        description: (error as any).message,
                                        message: `Error Deleting User.`,
                                        type: "error"
                                    })}
                                />
                            </Space>
                        )} />

                </Table>
            </TelevedaList></>
    );
};