import { Col, DateField, DatePicker, Form, Icons, Input, Table, TextField, notification } from "@pankod/refine-antd";
import { RequestQueryBuilder } from "@nestjsx/crud-request";
import React, { useRef } from "react";
import FilterFormWrapper from "../../components/filter";
import { IMemberHistory } from "../../interfaces";
import { generateFilter, generateSort } from "../../providers/dataProvider-nest";
import { TelevedaList } from "../../components/page-containers/list";
import { FilterButton } from "../../components/buttons/filter";
import { ExportButton, useTable } from "@refinedev/antd";
import { CrudFilters, HttpError, IResourceComponentsProps, useApiUrl, useParsed } from "@refinedev/core";

export interface IMemberHistoryFilterVariables {
    className: string;
    timestamp?: any[];
}

export const MemberShow: React.FC<IResourceComponentsProps> = () => {

    const { id: idFromRoute } = useParsed();

    const apiUrl = useApiUrl();

    const filterButtonRef = useRef<{ hide: () => void }>();
    const filterWrapperRef = useRef<{ handleValidation: () => void }>();

    const { tableProps, sorters, searchFormProps, filters, tableQuery: { refetch: refetchTable } } = useTable<IMemberHistory, HttpError, IMemberHistoryFilterVariables>({
        resource: `community-associations/members/${idFromRoute}`,
        initialPageSize: 20,
        onSearch: (params) => {
            const filters: CrudFilters = [];

            const { className, timestamp } = params;


            filters.push({
                field: "className",
                operator: "contains",
                value: className,
            });


            if (timestamp) {
                filters.push({
                    field: "timestamp",
                    operator: "between",
                    value: [timestamp[0].startOf("day").toISOString(), timestamp[1].endOf("day").toISOString()],
                });
            }
            else {
                filters.push({
                    field: "timestamp",
                    operator: "between",
                    value: undefined,
                });
            }

            return filters
        }
    });

    const exportAttendeeHistory = async () => {
        const generatedFilter = generateFilter(filters);
        const query = RequestQueryBuilder.create()
            .setFilter(generatedFilter.crudFilters);

        const sortBy = generateSort(sorters);
        if (sortBy) {
            query.sortBy(sortBy);
        }        
        
        window.open(`${apiUrl}/community-associations/member/download_history/${idFromRoute}?${query.query()}`);

        notification.open({
            description: "If you don't see it please check your browser downloads.",
            type: "success",
            message: "Download has started."
        });
    }

    const { RangePicker } = DatePicker;

    const ClassReportActions: React.FC = () => (
        <ExportButton onClick={exportAttendeeHistory} loading={false} />    
    );

    return (
        <TelevedaList
            title={`Attendee History - [ ${idFromRoute} ]`}
            listProps={{
                headerProps: {
                    breadcrumb: <></>,
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
                                    fieldValuesNameRef={['className', 'timestamp']}
                                    filterValuesNameRef={['className', 'timestamp']}
                                    formElement={
                                        <>
                                            <Col xl={24} md={8} sm={12} xs={24}>
                                                <Form.Item label="Event name" name="className">
                                                    <Input
                                                        placeholder="Filter by event name"
                                                        prefix={<Icons.SearchOutlined />}
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col xl={24} md={8} sm={12} xs={24}>
                                                <Form.Item
                                                    label="Timestamp"
                                                    name="timestamp"
                                                >
                                                    <RangePicker style={{ width: "100%" }} />
                                                </Form.Item>
                                            </Col>
                                        </>}
                                />
                            </FilterButton>
                            <ClassReportActions />
                        </>
                }
            }}
        >

            <Table {...tableProps}

                rowKey="id">

                <Table.Column
                    dataIndex="className"
                    key="className"
                    title="Event name"
                    render={(value) => <TextField value={value} />}
                    sorter
                />

                <Table.Column
                    dataIndex="eventType"
                    key="eventType"
                    title="Action"
                    render={(value) => <TextField value={value === 0 ? "Joined" : "Left"} />}
                    sorter
                />

                <Table.Column
                    dataIndex="timestamp"
                    key="timestamp"
                    title="Timestamp"
                    render={(value) => <DateField value={value} format="LLL" />}
                    sorter
                />

                <Table.Column
                    dataIndex="classCommunityName"
                    key="classCommunityName"
                    title="Event Community"
                    render={(value) => <TextField value={value} />}
                    sorter
                />

                <Table.Column
                    dataIndex="classScheduledFor"
                    key="classScheduledFor"
                    title="Event start"
                    render={(value) => <DateField value={value} format="LLL" />}
                    sorter
                />

            </Table>

        </TelevedaList>
    );
};