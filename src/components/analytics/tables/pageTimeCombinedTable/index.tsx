import React, { useContext, useMemo, useState } from "react";
import { Table, Typography, Space, Tooltip, Form, Input, Button } from "antd";
import { useCustom } from "@refinedev/core";
import { InfoCircleOutlined, SearchOutlined } from '@ant-design/icons';
import moment from "moment";
import { ColorModeContext } from "../../../../contexts/color-mode";
import { AnalyticsTableProps, TimeSpentData, PageTimeData } from "../../analytics-types";

const { Text } = Typography;

export const CombinedTimeAnalyticsTable: React.FC<AnalyticsTableProps> = ({
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

    // Fetch page time data
    const pageTimeUrl = `${apiUrl}/analytics/memberPageTimeMetrics`;
    const { data: pageTimeData, isLoading: pageLoading } = useCustom<{
        data: PageTimeData[];
    }>({
        url: pageTimeUrl,
        method: "get",
        config: { query }
    });

    // Fetch on-demand streaming data
    const onDemandUrl = `${apiUrl}/analytics/memberOnDemandClassScheduleTimeMetrics`;
    const { data: onDemandData, isLoading: onDemandLoading } = useCustom<{
        data: TimeSpentData[];
    }>({
        url: onDemandUrl,
        method: "get",
        config: { query }
    });

    const isLoading = pageLoading || onDemandLoading;

    const formatTime = (seconds: number): string => {
        if (!seconds) return "0s";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        return `${minutes > 0 ? `${minutes}m ` : ''}${remainingSeconds}s`;
    };

    // Combine both datasets
    const combinedData = useMemo(() => {
        const allData: (PageTimeData | TimeSpentData)[] = [];

        if (pageTimeData?.data?.data) {
            allData.push(...pageTimeData.data.data);
        }

        if (onDemandData?.data?.data) {
            allData.push(...onDemandData.data.data);
        }

        return allData;
    }, [pageTimeData, onDemandData]);

    const tableData = useMemo(() => {
        if (!combinedData.length) return { tableRows: [], allPages: [] };

        const groupedByDate: Record<string, {
            date: string;
            pageData: Record<string, number>;
            total: number;
        }> = {};

        combinedData.forEach((item) => {
            if (!item.event_date) return;

            const date = item.event_date;
            if (!groupedByDate[date]) {
                groupedByDate[date] = {
                    date,
                    pageData: {},
                    total: 0
                };
            }

            // Add page time data
            groupedByDate[date].pageData[item.page] =
                (groupedByDate[date].pageData[item.page] || 0) + item.total_time_spent;
            groupedByDate[date].total += item.total_time_spent;
        });

        const allPages = Array.from(
            new Set(combinedData.map(item => item.page))
        );

        const tableRows = Object.values(groupedByDate).map(item => ({
            key: item.date,
            date: moment(item.date).format("MMM DD, YYYY"),
            rawDate: item.date,
            pageData: item.pageData,
            total: item.total
        }));

        return { tableRows, allPages };
    }, [combinedData]);

    const columnTotals = useMemo(() => {
        const totals: Record<string, number> = { total: 0 };

        tableData.tableRows.forEach((row) => {
            Object.entries(row.pageData).forEach(([page, time]) => {
                if (!totals[page]) totals[page] = 0;
                totals[page] += time;
            });
            totals.total += row.total;
        });

        return totals;
    }, [tableData]);

    const getPageTime = (row: any, page: string): number => {
        return row.pageData[page] || 0;
    };

    const applyFilter = (): void => {
        const email = form.getFieldValue("email")?.trim() || "";
        setUserEmail(email);
    };

    const resetFilter = (): void => {
        form.resetFields(["email"]);
        setUserEmail("");
    };

    const columns = useMemo(() => {
        const baseColumns: any[] = [
            {
                title: "Date",
                dataIndex: "date",
                key: "date",
                sorter: (a: any, b: any) =>
                    new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime(),
            }
        ];

        tableData.allPages.forEach((page: string) => {
            baseColumns.push({
                title: page,
                dataIndex: page,
                key: page,
                render: (_: any, record: any) => formatTime(getPageTime(record, page)),
                align: 'center' as const,
            });
        });

        baseColumns.push({
            title: "Total Time",
            dataIndex: "total",
            key: "total",
            render: (value: number) => formatTime(value),
            align: 'center' as const,
        });

        return baseColumns;
    }, [tableData.allPages]);

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
                        Combined Time Analytics
                        <Tooltip
                            title="Shows time spent by users on different pages including class schedules and on-demand streaming"
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
                dataSource={tableData.tableRows}
                loading={isLoading}
                pagination={false}
                scroll={{ x: true }}
                summary={() => (
                    <Table.Summary fixed>
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0} align="right">
                                <Text strong>Total</Text>
                            </Table.Summary.Cell>

                            {tableData.allPages.map((page: string, index: number) => (
                                <Table.Summary.Cell key={page} index={index + 1} align="center">
                                    <Text strong>{formatTime(columnTotals[page] || 0)}</Text>
                                </Table.Summary.Cell>
                            ))}

                            <Table.Summary.Cell index={tableData.allPages.length + 1} align="center">
                                <Text strong>{formatTime(columnTotals.total)}</Text>
                            </Table.Summary.Cell>
                        </Table.Summary.Row>
                    </Table.Summary>
                )}
            />
        </div>
    );
};