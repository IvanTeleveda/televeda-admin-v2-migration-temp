import { DatePicker, Form, Space, Table, TextField } from "@pankod/refine-antd";
import React, { useMemo, useState } from "react";
import { TelevedaList } from "../../components/page-containers/list";
import { useTable } from "@refinedev/antd";
import { HttpError, IResourceComponentsProps, useParsed } from "@refinedev/core";
import dayjs, { Dayjs } from "dayjs";
import moment from "moment";

export interface IMemberHistoryFilterVariables {
    className: string;
    timestamp?: any[];
}

export const ResourceUsersShow: React.FC<IResourceComponentsProps> = () => {
    const { id: idFromRoute } = useParsed();
    const tz = useMemo(() => {
        return moment.tz.guess()
    }, []);

    const { RangePicker } = DatePicker;
    const [form] = Form.useForm();

    const [queryFilters, setQueryFilters] = useState<{
        dateRange: [Dayjs, Dayjs],
        timezone: string,
    }>({
        dateRange: [
            dayjs().subtract(7, "days"),
            dayjs()
        ],
        timezone: tz
    });
    const { dateRange, timezone } = queryFilters;
    const { tableProps, sorters, searchFormProps, filters, tableQuery: { refetch: refetchTable } } = useTable<any, HttpError, any>({
        resource: `community-collection-items/resource/${idFromRoute}`,
        permanentFilter: [
            { field: 'start', operator: 'gte', value: dateRange[0].toISOString()},
            { field: 'end', operator: 'lte', value: dateRange[1].toISOString() },
            { field: 'timezone', operator: 'eq', value: timezone }
        ],
    });

    return (
        <TelevedaList
            title={`Resource Users History - [ ${idFromRoute} ]`}
            listProps={{
                headerProps: {
                    breadcrumb: <></>,
                    extra:
                        <>
                            <Space direction="vertical" style={{ marginLeft: 'auto', marginTop: 20 }}>  
                                <Form form={form}>
                                    <Form.Item name="dateRange">
                                        <RangePicker
                                            style={{
                                                height: 35,
                                                background: 'rgba(255, 255, 255, 0.3)'
                                            }}
                                            size="small"
                                            placeholder={[
                                                dayjs(dateRange[0]).format('YYYY-MM-DD'), 
                                                dayjs(dateRange[1]).format('YYYY-MM-DD')
                                            ]}
                                            onChange={(values: any) => {
                                                if (values && values[0] && values[1]) {
                                                    setQueryFilters(prevValue => ({
                                                        ...prevValue, 
                                                        dateRange: [values[0].startOf('day'), values[1].endOf('day')]
                                                    }));
                                                }
                                            }}
                                            ranges={{
                                                "This Week": [dayjs().startOf("week"), dayjs().endOf("week")],
                                                "Last Month": [dayjs().startOf("month").subtract(1, "month"), dayjs().endOf("month").subtract(1, "month")],
                                                "This Month": [dayjs().startOf("month"), dayjs().endOf("month")],
                                                "This Year": [dayjs().startOf("year"), dayjs().endOf("year")],
                                            }}
                                            format="YYYY/MM/DD"
                                            allowClear={false}
                                        />
                                    </Form.Item>
                                </Form>
                            </Space>
                        </>
                }
            }}
        >

            <Table {...tableProps}

                rowKey="id">

                <Table.Column
                    dataIndex="first_name"
                    key="first_name"
                    title="First name"
                    render={(value) => <TextField value={value} />}
                    sorter
                />

                <Table.Column
                    dataIndex="last_name"
                    key="last_name"
                    title="Last name"
                    render={(value) => <TextField value={value} />}
                    sorter
                />

            </Table>

        </TelevedaList>
    );
};