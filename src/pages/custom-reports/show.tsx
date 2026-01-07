import { Button, Col, DatePicker, Form, Space, Table } from "@pankod/refine-antd";
import { useRef } from "react";
import { ICustomReportTemplate, UserPermissions } from "../../interfaces";
import { DateField, EditButton, useTable } from "@refinedev/antd";
import { CrudFilters, HttpError, IResourceComponentsProps, useLink, useParsed, usePermissions } from "@refinedev/core";
import { TelevedaList } from "../../components/page-containers/list";
import { FilterButton } from "../../components/buttons/filter";
import FilterFormWrapper from "../../components/filter";
import { EyeOutlined } from "@ant-design/icons";

interface ICustomReportFilterVariables {
    startDate: string;
}

export const CustomReportOccurrences: React.FC<IResourceComponentsProps> = () => {
    const { data: permissionsData } = usePermissions<UserPermissions>();

    const filterButtonRef = useRef<{ hide: () => void }>();
    const filterWrapperRef = useRef<{ handleValidation: () => void }>();

    const { id: idFromRoute, params } = useParsed();

    const Link = useLink();

    const { tableProps, sorters, searchFormProps, filters, tableQuery: { refetch: refetch } } = useTable<ICustomReportTemplate, HttpError, ICustomReportFilterVariables>({
        resource: `custom_reports/occurrences/${idFromRoute}`,
        onSearch: (params) => {
            const filters: CrudFilters = [];
            const { startDate } = params;

            console.log('onSearch');

            console.log("Filter params: ", params);

            filters.push({
                field: "startDate",
                operator: "gte",
                value: startDate,
            });

            return filters;
        },
        syncWithLocation: true,
    })

    return (
        <TelevedaList
            title={`Occurrences for ${params?.name ? decodeURIComponent(params.name) : 'report'}`}
            listProps={{
                headerProps: {
                    extra:
                        <>  
                            {/* TODO <FilterButton
                                ref={filterButtonRef}
                                filters={filters}
                            >
                                <FilterFormWrapper
                                    ref={filterWrapperRef}
                                    filterButtonRef={filterButtonRef}
                                    formProps={searchFormProps}
                                    filters={filters || []}
                                    fieldValuesNameRef={['startDate']}
                                    filterValuesNameRef={['startDate']}
                                    formElement={
                                        <>
                                            <Col xl={24} md={8} sm={12} xs={24}>
                                                <Form.Item label="Start Date" name="startDate">
                                                    <DatePicker format='LLL' onChange={() => filterWrapperRef.current?.handleValidation()} />
                                                </Form.Item>
                                            </Col>
                                        </>}
                                    syncWithLocation={true}
                                />
                            </FilterButton> */}
                            {permissionsData === "TelevedaAdmin" && <EditButton meta={{ type: 'temp' }} type="primary">Edit all</EditButton>}
                        </>
                }
            }}
        >
            <Table {...tableProps} rowKey="id">

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
                            {permissionsData === "TelevedaAdmin" && <EditButton meta={{ type: 'occ' }} recordItemId={record.id} /> }
                            <Button><Link to={`/custom-reports/view/${record.id}/occ`}><EyeOutlined /> View</Link></Button>
                        </Space>
                    )}
                />
            </Table>
        </TelevedaList>
    )
}
