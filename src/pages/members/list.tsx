import {
    Table,
    TextField,
    Space,
    DateField,
    DatePicker,
    Form,
    Col,
    Input,
    Select,
    Button,
    Modal,
    Radio
} from "@pankod/refine-antd";
import {
    useLink,
    IResourceComponentsProps,
    CrudFilters,
    HttpError,
    useUpdateMany,
    useNavigation,
} from "@refinedev/core";
import { useRef, useState } from "react";
import { UploadOutlined, SearchOutlined } from "@ant-design/icons";
import Constants from "../../typings/constants";
import FilterFormWrapper from "../../components/filter";
import { ICommunity, IMemberFilterVariables, IUser, IUserCommunityAssociation } from "../../interfaces";
import { FilterButton } from "../../components/buttons/filter";
import { TelevedaList } from "../../components/page-containers/list";
import paginationFormatter from "../../components/pagination";
import { CreateButton, ShowButton, useSelect, useTable } from "@refinedev/antd";

export const MembersList: React.FC<IResourceComponentsProps> = () => {
    const [form] = Form.useForm();
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [changeCommunityModalVisible, setChangeCommunityModalVisible] = useState<boolean>(false);
    const { show } = useNavigation();

    const filterButtonRef = useRef<{ hide: () => void }>();
    const filterWrapperRef = useRef<{ handleValidation: () => void }>();

    const { selectProps: communitySelectProps } = useSelect<ICommunity>({
        resource: "community",
        optionLabel: "name",
        optionValue: "id",
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
    });

    const { tableProps, searchFormProps, filters, tableQuery: { refetch: refetchTable } } = useTable<IUserCommunityAssociation, HttpError, IMemberFilterVariables>({
        initialSorter: [
            {
                field: "createdAt",
                order: "desc",
            },
        ],
        onSearch: (params) => {
            const filters: CrudFilters = [];
            const { email, communityIds, firstName, lastName, isActive, createdAt } = params;

            // console.log('onSearch');

            setSelectedRowKeys([]);

            // console.log("Filter params: ", params);

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
                field: "is_active",
                operator: "eq",
                value: isActive,
            });

            filters.push({
                field: "community.id",
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

            // console.log('Filters:', filters);

            return filters;
        },
        syncWithLocation: true,
    });

    const Link = useLink();

    const { mutate: mutateCommunityAssociation, isLoading: isMutatingCommunityAssociation } = useUpdateMany<IUserCommunityAssociation>();
    const { mutate: mutateUser, isLoading: isMutatingUser } = useUpdateMany<IUser>();

    console.log("tableProps:", tableProps);

    const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
        console.log('selectedRowKeys changed: ', newSelectedRowKeys);
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    };

    const hasSelected = selectedRowKeys.length > 0;

    const handleChangeUserStatus = (isActive: boolean) => {

        mutateUser({
            resource: "community-associations/userStatus",
            ids: selectedRowKeys.map(String),
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
            }
        )
    }

    const handleChangeCommunity = () => {

        const fields = form.getFieldsValue();

        mutateCommunityAssociation({
            resource: "community-associations",
            ids: selectedRowKeys.map(String),
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
                onCancel={() => { setChangeCommunityModalVisible(false) }}
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
                        extra:
                            <>
                                <FilterButton
                                    ref={filterButtonRef}
                                    filters={filters}
                                >
                                    <FilterFormWrapper
                                        ref={filterWrapperRef}
                                        filterButtonRef={filterButtonRef}
                                        formProps={searchFormProps}
                                        filters={filters || []}
                                        fieldValuesNameRef={['firstName', 'lastName', 'email', 'communityIds', 'createdAt', 'isActive']}
                                        filterValuesNameRef={['first_name', 'last_name', 'email', 'community.id', 'createdAt', 'is_active']}
                                        formElement={
                                            <>
                                                <Col xl={24} md={8} sm={12} xs={24}>
                                                    <Form.Item label="First name" name="firstName">
                                                        <Input
                                                            onChange={() => filterWrapperRef.current?.handleValidation()}
                                                            placeholder="Filter by first name"
                                                            prefix={<SearchOutlined />}
                                                            allowClear
                                                        />
                                                    </Form.Item>
                                                </Col>

                                                <Col xl={24} md={8} sm={12} xs={24}>
                                                    <Form.Item label="Last name" name="lastName">
                                                        <Input
                                                            onChange={() => filterWrapperRef.current?.handleValidation()}
                                                            placeholder="Filter by last name"
                                                            prefix={<SearchOutlined />}
                                                            allowClear
                                                        />
                                                    </Form.Item>
                                                </Col>

                                                <Col xl={24} md={8} sm={12} xs={24}>
                                                    <Form.Item label="Email" name="email">
                                                        <Input
                                                            onChange={() => filterWrapperRef.current?.handleValidation()}
                                                            placeholder="Filter by email"
                                                            prefix={<SearchOutlined />}
                                                            allowClear
                                                        />
                                                    </Form.Item>
                                                </Col>

                                                <Col xl={24} md={8} sm={12} xs={24}>
                                                    <Form.Item
                                                        label="Community"
                                                        name="communityIds"
                                                    >
                                                        <Select
                                                            onChange={() => filterWrapperRef.current?.handleValidation()}
                                                            {...communitySelectProps}
                                                            placeholder="Filter by community"
                                                            allowClear mode="multiple" />
                                                    </Form.Item>
                                                </Col>

                                                <Col xl={24} md={8} sm={12} xs={24}>
                                                    <Form.Item
                                                        label="Created range"
                                                        name="createdAt"
                                                    >
                                                        <RangePicker
                                                            onChange={() => filterWrapperRef.current?.handleValidation()}
                                                            style={{ width: "100%" }} />
                                                    </Form.Item>
                                                </Col>

                                                <Col xl={24} md={8} sm={12} xs={24}>
                                                    <Form.Item
                                                        label="Member Status"
                                                        name="isActive"
                                                    >
                                                        <Radio.Group
                                                            onChange={() => filterWrapperRef.current?.handleValidation()}
                                                            defaultValue="true"
                                                            name="radiogroup">
                                                            <Space direction="vertical">
                                                                <Radio value="true">Active</Radio>
                                                                <Radio value="false">Suspended</Radio>
                                                            </Space>
                                                        </Radio.Group>
                                                    </Form.Item>
                                                </Col>
                                            </>}
                                        syncWithLocation={true}
                                    />
                                </FilterButton>
                                <CreateButton type="primary" resource="_User"/>
                                <Button type="primary"><UploadOutlined /> <Link style={{ color: "black" }} to="/users/_User/bulk">Bulk Import</Link></Button>
                            </>,
                        subTitle: hasSelected && (
                            <Space style={{ gap: 10, marginLeft: "1em" }}>
                                <Button
                                    onClick={() => { setChangeCommunityModalVisible(true) }}
                                >
                                    Change community
                                </Button>

                                {tableProps.dataSource && (tableProps.dataSource[0].user.accountData === null || tableProps.dataSource[0].user.accountData.isActive === true) ?

                                    <Button
                                        type="primary"
                                        danger
                                        onClick={() => { handleChangeUserStatus(false) }}
                                    >
                                        Suspend
                                    </Button> : <Button
                                        type="primary"
                                        onClick={() => { handleChangeUserStatus(true) }}
                                    >
                                        Grant Access
                                    </Button>
                                }

                            </Space>
                        ),
                    }
                }}
            >

                <Table {...tableProps} rowKey="id" rowSelection={rowSelection}>

                    <Table.Column
                        dataIndex="user"
                        key="user.firstName"
                        title="First name"
                        render={(value) => <TextField style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }} onClick={() => show('_User', value.id)} value={value.firstName} />}
                        
                        sorter
                    />

                    <Table.Column
                        dataIndex="user"
                        key="user.lastName"
                        title="Last name"
                        render={(value) => <TextField value={value.lastName} />}
                        sorter
                    />

                    <Table.Column
                        dataIndex="user"
                        key="user.email"
                        title="Email"
                        render={(value) => <TextField value={value.email} />}
                        sorter
                    />

                    <Table.Column
                        dataIndex="community"
                        key="community.name"
                        title="Community"
                        render={(value) =>
                            <TextField value={value.name} />
                        }

                        sorter
                    />

                    <Table.Column
                        dataIndex="createdAt"
                        key="createdAt"
                        title="Created"
                        render={(value) => <DateField value={value} format="LLL" />}
                        sorter
                    />

                    <Table.Column<IUserCommunityAssociation>
                        title="Actions"
                        render={(_, record) => (
                            <ShowButton shape="round" size="small" recordItemId={record.userId}>History</ShowButton>
                        )}
                    />
                </Table>
            </TelevedaList>
        </>
    );
};