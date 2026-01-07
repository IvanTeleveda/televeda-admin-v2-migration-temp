import React, { useContext, useMemo, useState } from "react";
import { Table, Typography, Space, Tooltip, Form, Input, Button } from "antd";
import { useCustom } from "@refinedev/core";
import { InfoCircleOutlined, SearchOutlined } from '@ant-design/icons';
import moment from "moment";
import { ColorModeContext } from "../../../../contexts/color-mode";
import dayjs, { Dayjs } from "dayjs";
import {formatTime} from "../../util";

const { Text } = Typography;

interface VTCData {
    event_date: string;
    page: string;
    total_time_spent: number;
}

interface VTCTableProps {
    communityIds: string | string[] | undefined | null | number | { value: string; label: string };
    dateRange: [Dayjs, Dayjs];
    apiUrl: string;
}

export const VTCTimeAnalyticsTable: React.FC<VTCTableProps> = ({
                                                                   communityIds,
                                                                   dateRange,
                                                                   apiUrl
                                                               }) => {
    const [form] = Form.useForm();
    const { mode } = useContext(ColorModeContext);
    const [userEmail, setUserEmail] = useState<string>("");

    const timezone = useMemo(() => moment.tz.guess(), []);

    const query = useMemo(() => ({
        start: dateRange[0].startOf('day').toISOString(),
        end: dateRange[1].endOf('day').toISOString(),
        timezone,
        communityIds,
        ...(userEmail ? { userEmail } : {}),
    }), [communityIds, dateRange, timezone, userEmail]);

    const url = `${apiUrl}/analytics/memberVTCTimeMetrics`;
    const { data, isLoading } = useCustom<{
        data: VTCData[];
    }>({
        url,
        method: "get",
        config: { query }
    });

    // Transform data for table display
    const tableData = useMemo(() => {
        if (!data?.data?.data) return [];

        // Group data by date
        const groupedByDate: Record<string, {
            date: string;
            vtcTime: number;
        }> = {};

        data.data.data.forEach(item => {
            if (!item.event_date) return;

            const date = item.event_date;
            if (!groupedByDate[date]) {
                groupedByDate[date] = {
                    date,
                    vtcTime: 0
                };
            }

            groupedByDate[date].vtcTime += item.total_time_spent;
        });

        return Object.values(groupedByDate).map(item => ({
            key: item.date,
            date: moment(item.date).format("MMM DD, YYYY"),
            rawDate: item.date,
            vtcTime: item.vtcTime
        }));
    }, [data]);

    // Calculate totals
    const totalVTCTime = useMemo(() => {
        return tableData.reduce((total, item) => total + item.vtcTime, 0);
    }, [tableData]);

    // Apply email filter
    const applyFilter = () => {
        const email = form.getFieldValue("email")?.trim() || "";
        setUserEmail(email);
    };

    // Reset email filter
    const resetFilter = () => {
        form.resetFields(["email"]);
        setUserEmail("");
    };

    // Columns configuration
    const columns = [
        {
            title: "Date",
            dataIndex: "date",
            key: "date",
            sorter: (a: any, b: any) =>
                new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime(),
        },
        {
            title: "VTC Time Spent",
            dataIndex: "vtcTime",
            key: "vtcTime",
            render: (value: number) => formatTime(value),
            align: 'center' as const,
        }
    ];

    return (
        <div style={{ padding: '0 24px' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                flexWrap: 'wrap'
            }}>
                <Space direction="vertical" size={0}>
                    <Text strong style={{ fontSize: 18 }}>
                        VTC Class Time Analytics
                        <Tooltip
                            title="Shows time spent by users in VTC (Virtual Talking Circle) classes"
                            placement="bottom"
                        >
                            <InfoCircleOutlined
                                style={{
                                    marginLeft: 10,
                                    fontSize: 16,
                                    color: '#1890ff'
                                }}
                            />
                        </Tooltip>
                    </Text>
                    {userEmail && (
                        <Text style={{ fontSize: 14 }}>
                            Filtered by email: {userEmail}
                        </Text>
                    )}
                </Space>

                <Form
                    form={form}
                    layout="inline"
                    style={{ marginTop: 8 }}
                >
                    <Form.Item name="email" label="Filter by Email">
                        <Input
                            placeholder="Enter user email"
                            prefix={<SearchOutlined />}
                            allowClear
                            onPressEnter={applyFilter}
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type="primary"
                            onClick={applyFilter}
                            style={{ marginRight: 8 }}
                        >
                            Apply
                        </Button>
                        <Button onClick={resetFilter}>
                            Reset
                        </Button>
                    </Form.Item>
                </Form>
            </div>

            <Table
                columns={columns}
                dataSource={tableData}
                loading={isLoading}
                pagination={false}
                scroll={{ x: true }}
                summary={() => (
                    <Table.Summary fixed>
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0} align="right">
                                <Text strong>Total VTC Time</Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1} align="center">
                                <Text strong>{formatTime(totalVTCTime)}</Text>
                            </Table.Summary.Cell>
                        </Table.Summary.Row>
                    </Table.Summary>
                )}
            />
        </div>
    );
};