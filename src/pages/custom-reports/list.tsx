import { Col, Form, Icons, Input, Select, Space, Table, Tag, TextField, Typography } from "@pankod/refine-antd";
import { useRef } from "react";
import { ICommunity, ICustomReportTemplate, IRefineUser, UserPermissions } from "../../interfaces";
import { CreateButton, DateField, DeleteButton, ShowButton, useSelect, useTable } from "@refinedev/antd";
import { CrudFilters, HttpError, IResourceComponentsProps, useGetIdentity, usePermissions } from "@refinedev/core";
import Constants from "../../typings/constants";
import { TelevedaList } from "../../components/page-containers/list";
import { FilterButton } from "../../components/buttons/filter";
import FilterFormWrapper from "../../components/filter";

interface ICustomReportFilterVariables {
    name: string;
    communityIds: string;
    startDate: string;
    endDate: string;
    occurrence: string;
}

export const CustomReports: React.FC<IResourceComponentsProps> = () => {
    const { data: permissionsData } = usePermissions<UserPermissions>();

    const filterButtonRef = useRef<{ hide: () => void }>();
    const filterWrapperRef = useRef<{ handleValidation: () => void }>();

    const { tableProps, sorters, searchFormProps, filters, tableQuery: { refetch: refetch } } = useTable<ICustomReportTemplate, HttpError, ICustomReportFilterVariables>({
        onSearch: (params) => {
            const filters: CrudFilters = [];
            const { name, communityIds, occurrence } = params;

            console.log('onSearch');

            console.log("Filter params: ", params);

            filters.push({
                field: "name",
                operator: "contains",
                value: name,
            });

            filters.push({
                field: "communityIds",
                operator: "in",
                value: communityIds,
            });

            filters.push({
                field: "occurrence",
                operator: "eq",
                value: occurrence,
            });

            return filters;
        },
        syncWithLocation: true,
    })

    const { selectProps: communitySelectProps } = useSelect<ICommunity>({
        resource: "Community",
        optionLabel: 'name',
        optionValue: 'id',
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
        sort: [
            { field: "name", order: 'asc' }
        ]
    });

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
                                    fieldValuesNameRef={['name', 'communityIds', 'occurrence']}
                                    filterValuesNameRef={['name', 'communityIds', 'occurrence']}
                                    formElement={
                                        <>
                                            <Col xl={24} md={8} sm={12} xs={24}>
                                                <Form.Item label="Report Name" name="name">
                                                    <Input
                                                        onChange={() => filterWrapperRef.current?.handleValidation()}
                                                        placeholder="Filter by report name"
                                                        prefix={<Icons.SearchOutlined />}
                                                        allowClear
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col xl={24} md={8} sm={12} xs={24}>
                                                <Form.Item
                                                    label="Communities"
                                                    name="communityIds"
                                                >
                                                    <Select
                                                        onChange={() => filterWrapperRef.current?.handleValidation()}
                                                        {...communitySelectProps}
                                                        placeholder="Filter by community"
                                                        allowClear
                                                        mode="multiple"
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col xl={24} md={8} sm={12} xs={24}>
                                                <Form.Item
                                                    label="Occurrence"
                                                    name="occurrence"
                                                >
                                                    <Select
                                                        onChange={() => filterWrapperRef.current?.handleValidation()}
                                                        options={[
                                                            { label: 'Weekly', value: 'week' },
                                                            { label: 'Monthly', value: 'month' },
                                                            { label: 'Quarterly', value: 'quarter' },
                                                        ]}
                                                        placeholder="Filter by Occurrence"
                                                        allowClear
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </>}
                                    syncWithLocation={true}
                                />
                            </FilterButton>
                            {permissionsData === "TelevedaAdmin" && <CreateButton type="primary" />}
                        </>
                }
            }}
        >
            <Table {...tableProps} rowKey="id">

                <Table.Column
                    dataIndex="name"
                    key="name"
                    title="Report Name"
                    render={(value) => <TextField value={value} />}
                    sorter
                />

                <Table.Column<ICustomReportTemplate>
                    title={"Communities"}
                    dataIndex={"associations"}
                    key={"associations"}
                    width={310}
                    render={(_, record) => {

                        if (record.associations && record.associations.length > 0) {
                            const value = record.associations;

                            return (
                                <Space wrap>
                                    {value.map((val) => {
                                        const community = val.community;
                                        return (
                                            <Tag color="geekblue" key={val.id} style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {community?.name}
                                            </Tag>
                                        );
                                    })}
                                </Space>
                            )
                        }

                        else {
                            return (
                                <Typography.Text><b>NONE</b></Typography.Text>
                            )
                        }
                    }}
                />

                <Table.Column
                    dataIndex="occurrence"
                    key="occurrence"
                    title="Occurrence Period"
                    render={(value) => <TextField value={value} />}
                    sorter
                />

                <Table.Column
                    dataIndex="startDate"
                    key="startDate"
                    title="Start Date"
                    render={(value) => <DateField value={value} format="LLL" />}
                    sorter
                />

                <Table.Column
                    dataIndex="endDate"
                    key="endDate"
                    title="End Date"
                    render={(value) => <DateField value={value} format="LLL" />}
                    sorter
                />

                <Table.Column<ICustomReportTemplate>
                    width={150}
                    title={"Actions"}
                    dataIndex="id"
                    render={(_, record) => (
                        <Space>
                            <ShowButton meta={{ name: encodeURIComponent(record.name) }} recordItemId={record.id} >View Occurrences</ShowButton>
                            {permissionsData === "TelevedaAdmin" && <DeleteButton resource="custom_reports/template" hideText recordItemId={record.id} onSuccess={() => refetch()} /> }
                        </Space>
                    )}
                />
            </Table>
        </TelevedaList>
    )
}
