import {
    Table,
    TextField,
    DateField,
    DatePicker,
    Col,
    Input,
    Icons,
    Select,
    Switch,
    Popconfirm,
    Form,
} from "@pankod/refine-antd";
import { UserDeleteOutlined, UserAddOutlined } from '@ant-design/icons';
import { useRef } from "react";
import Constants from "../../typings/constants";
import FilterFormWrapper from "../../components/filter";
import { FilterButton } from "../../components/buttons/filter";
import { TelevedaList } from "../../components/page-containers/list";
import paginationFormatter from "../../components/pagination";
import { CreateModalFormForCommunityButton } from "../../components/buttons/createModalFormForCommunity";
import { RemovesFromCommunityButton } from "../../components/buttons/removeFromCommunity";
import { ICommunity, IMemberFilterVariables, IUserCommunityAssociation } from "../../interfaces";
import { useSelect, useTable } from "@refinedev/antd";
import { CrudFilters, HttpError, IResourceComponentsProps, useCreate, useDelete } from "@refinedev/core";

export const ManagersList: React.FC<IResourceComponentsProps> = () => {
    const filterButtonRef = useRef<{ hide: () => void }>();
    const filterWrapperRef = useRef<{ handleValidation: () => void }>();
    
    const { mutate: inviteInstructor } = useCreate<IUserCommunityAssociation>()
    const { mutate: deleteInstructor } = useDelete<IUserCommunityAssociation>();

    const { selectProps: communitySelectProps } = useSelect<ICommunity>({
        resource: "community",
        optionLabel: "name",
        optionValue: "id",
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
    });
    
    const { tableProps, searchFormProps, filters, tableQuery:{refetch: refetchTable} } = useTable<IUserCommunityAssociation, HttpError, IMemberFilterVariables>({
        initialSorter: [
            {
                field: "id",
                order: "desc",
            },
        ],
        onSearch: (params) => {
            const filters: CrudFilters = [];
            const { email, communityIds, firstName, lastName, createdAt } = params;
            
            // console.log("Filter params: ", params);
            
           // if( email ) {
                filters.push({
                    field: "email",
                    operator: "contains",
                    value: email,
                });
           // }

           // if( firstName ) {
                filters.push({
                    field: "first_name",
                    operator: "contains",
                    value: firstName,
                });
           // }

            //if( lastName ) {
                filters.push({
                    field: "last_name",
                    operator: "contains",
                    value: lastName,
                });
            //}
           
            //if( communityIds && communityIds.length > 0 ) {
                filters.push({
                    field: "community.id",
                    operator: "in",
                    value: communityIds,
                });
            //}

            if( createdAt ) {
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
        syncWithLocation: false,
    });

    const { RangePicker } = DatePicker;

    const handleAssignment = (record: IUserCommunityAssociation) => {

        if(!record.isInstructor) {
            inviteInstructor({ 
                resource: `community-associations/community/${record.communityId}/host`,
                values: {
                    email: record.user?.email,
                    communityId: record.communityId
                }
            },
            {
                onSuccess: () => {
                    refetchTable()
                }
            })
        }

        else {
            deleteInstructor({
                resource: `community-associations/community/${record.communityId}/host`,
                id: record.userId
            },
            {
                onSuccess: () => {
                    refetchTable()
                }
            })
        }
    }

    console.log("tableProps:", tableProps);

    if (tableProps.pagination) {
        tableProps.pagination.showTotal = paginationFormatter;
    }

    return (

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
                                            fieldValuesNameRef={['firstName', 'lastName', 'email', 'communityIds', 'createdAt']} 
                                            filterValuesNameRef={['first_name', 'last_name', 'email', 'community.id', 'createdAt']}
                                            formElement={
                                            <>
                                                <Col span={24}>
                                                    <Form.Item label="First name" name="firstName">
                                                        <Input
                                                            onChange={() => filterWrapperRef.current?.handleValidation()}
                                                            placeholder="Filter by first name"
                                                            prefix={<Icons.SearchOutlined />}
                                                            allowClear
                                                        />
                                                    </Form.Item>
                                                </Col>

                                                <Col span={24}>
                                                    <Form.Item label="Last name" name="lastName">
                                                        <Input
                                                            onChange={() => filterWrapperRef.current?.handleValidation()}
                                                            placeholder="Filter by last name"
                                                            prefix={<Icons.SearchOutlined />}
                                                            allowClear
                                                        />
                                                    </Form.Item>
                                                </Col>

                                                <Col span={24}>
                                                    <Form.Item label="Email" name="email">
                                                        <Input
                                                            onChange={() => filterWrapperRef.current?.handleValidation()}
                                                            placeholder="Filter by email"
                                                            prefix={<Icons.SearchOutlined />}
                                                            allowClear
                                                        />
                                                    </Form.Item>
                                                </Col>

                                                <Col span={24}>
                                                    <Form.Item
                                                        label="Community"
                                                        name="communityIds"
                                                    >
                                                        <Select onChange={() => filterWrapperRef.current?.handleValidation()} {...communitySelectProps} placeholder="Filter by community" allowClear mode="multiple"/>
                                                    </Form.Item>
                                                </Col>

                                                <Col span={24}>
                                                    <Form.Item
                                                        label="Created range"
                                                        name="createdAt"
                                                    >
                                                        <RangePicker onChange={() => filterWrapperRef.current?.handleValidation()} style={{ width: "100%" }} />
                                                    </Form.Item>
                                                </Col>
                                            </>} 
                                         />
                                    </FilterButton>
                                    <CreateModalFormForCommunityButton
                                        communityId={""}
                                        url={"community-associations/community"}
                                        modalTitle={"Invite community manager"}
                                        modalField={"email"}
                                        onSuccessFn={refetchTable}
                                        associationType='manager'
                                        modalBtnTxt="Invite"
                                        modalBtnIcon={<UserAddOutlined />}
                                    />
                                </>
                        }
                    }}
                >

                    <Table {...tableProps} rowKey="id">

                        <Table.Column
                            dataIndex="user"
                            key="user.firstName"
                            title="First name"
                            render={(value) => <TextField value={value.firstName} />}
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
                            dataIndex="isInstructor"
                            key="isInstructor"
                            title="Instructor Privileges"
                            render={(_, record) =>
                                <Popconfirm
                                    style={{width: "200px"}}
                                    title={!record.isInstructor? `Assign as instructor?` : `Remove as instructor?`}
                                    okText="Yes"
                                    onConfirm={() => handleAssignment(record)}
                                    cancelText="No"
                                >
                                <Switch 
                                    checkedChildren="YES" 
                                    unCheckedChildren=" NO"
                                    checked={record.isInstructor === 1? true: false} />
                                </Popconfirm>    
                            }
                        />

                        <Table.Column<IUserCommunityAssociation>
                            title="Actions"
                            render={(_, record) => (
                                 <RemovesFromCommunityButton 
                                    communityId={record.community.id || ""} 
                                    associationId={record.user.id}
                                    url={"community-associations/community"} 
                                    onSuccessFn={()=>{refetchTable()}}
                                    associationType='manager' 
                                    modalBtnIcon={<UserDeleteOutlined />}
                                    isInstructor={record.isInstructor === 1? true: false} 
                                />
                            )}
                        />

                    </Table>
                </TelevedaList>
    );
};