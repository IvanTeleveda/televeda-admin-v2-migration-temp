import React, { useContext, useMemo } from "react";
import { Table, Typography, Space, Tooltip } from "antd";
import { useCustom } from "@refinedev/core";
import { InfoCircleOutlined } from '@ant-design/icons';
import * as moment from "moment-timezone";
import { ColorModeContext } from "../../../../contexts/color-mode";
import { AnalyticsGroupType } from "../../../../pages/analytics";
import {AnalyticsTableProps, TimeSpentData} from "../../analytics-types";
import { formatTime } from "../../util";

const { Text } = Typography;

export const OnDemandAnalyticsTable: React.FC<AnalyticsTableProps & {
    globalGroupBy?: AnalyticsGroupType;
    userEmail?: string;
}> = ({
    communityIds,
    dateRange,
    apiUrl,
    globalGroupBy = AnalyticsGroupType.DAY,
    userEmail = ""
}) => {
    const { mode } = useContext(ColorModeContext);

    const timezone = useMemo(() => moment.tz.guess(), []);

    const query = useMemo(() => ({
        start: dateRange[0].startOf('day').toISOString(),
        end: dateRange[1].endOf('day').toISOString(),
        timezone,
        communityIds,
        groupBy: globalGroupBy,
        ...(userEmail ? { userEmail } : {}),
    }), [communityIds, dateRange, timezone, globalGroupBy, userEmail]);

    const url = `${apiUrl}/analytics/memberOnDemandClassScheduleTimeMetrics`;
    const { data, isLoading } = useCustom<{
        data: TimeSpentData[];
    }>({
        url,
        method: "get",
        config: { query }
    });

    const tableData = useMemo(() => {
        if (!data?.data?.data) return [];

        const groupedByDate: Record<string, {
            date: string;
            classSchedule: number;
            onDemand: number;
            externalEvent: number;
            total: number;
        }> = {};

        data.data.data.forEach(item => {
            if (!item.event_date) return;

            const date = item.event_date;
            if (!groupedByDate[date]) {
                groupedByDate[date] = {
                    date,
                    classSchedule: 0,
                    onDemand: 0,
                    externalEvent: 0,
                    total: 0
                };
            }

            // Fix the page name matching based on actual API data
            if (item.page === "class-schedule") {
                groupedByDate[date].classSchedule += item.total_time_spent;
            } else if (item.page === "on-demand") {
                groupedByDate[date].onDemand += item.total_time_spent;
            } else if (item.page === "external-event") {
                groupedByDate[date].externalEvent += item.total_time_spent;
            }

            groupedByDate[date].total += item.total_time_spent;
        });

        return Object.values(groupedByDate)
            .map(item => ({
                key: item.date,
                date: moment(item.date).format("MMM DD, YYYY"),
                rawDate: item.date,
                classSchedule: item.classSchedule,
                onDemand: item.onDemand,
                externalEvent: item.externalEvent,
                total: item.total
            }))
            .sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime());
    }, [data]);

    const totals = useMemo(() => {
        return tableData.reduce((acc, item) => {
            acc.classSchedule += item.classSchedule;
            acc.onDemand += item.onDemand;
            acc.externalEvent += item.externalEvent;
            acc.total += item.total;
            return acc;
        }, {
            classSchedule: 0,
            onDemand: 0,
            externalEvent: 0,
            total: 0
        });
    }, [tableData]);



    const columns = [
        {
            title: "Date",
            dataIndex: "date",
            key: "date",
            sorter: (a: any, b: any) =>
                new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime(),
            width: 150,
        },
        {
            title: "Scheduled classes Streaming",
            dataIndex: "classSchedule",
            key: "classSchedule",
            render: (value: number) => formatTime(value),
            align: 'center' as const,
            width: 130,
        },
        {
            title: "On Demand Streaming",
            dataIndex: "onDemand",
            key: "onDemand",
            render: (value: number) => formatTime(value),
            align: 'center' as const,
            width: 180,
        },
        {
            title: "External Event",
            dataIndex: "externalEvent",
            key: "externalEvent",
            render: (value: number) => formatTime(value),
            align: 'center' as const,
            width: 130,
        },
        {
            title: "Total Time",
            dataIndex: "total",
            key: "total",
            render: (value: number) => formatTime(value),
            align: 'center' as const,
            width: 120,
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
                        Streaming time for classes + on-demand / videos
                        <Tooltip
                            title="Shows the calculated time for all classes based on class participation. This includes users joining classes from the main lobby (Platform + external) + also includes on-demand classes viewed."
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

                {/* Individual filters removed - now controlled by tab-level filters */}
            </div>

            <Table
                columns={columns}
                dataSource={tableData}
                loading={isLoading}
                pagination={false}
                scroll={{ x: true }}
                size="small"
                summary={() => (
                    <Table.Summary fixed>
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0} align="right">
                                <Text strong>Total</Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1} align="center">
                                <Text strong>{formatTime(totals.classSchedule)}</Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={2} align="center">
                                <Text strong>{formatTime(totals.onDemand)}</Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={3} align="center">
                                <Text strong>{formatTime(totals.externalEvent)}</Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={4} align="center">
                                <Text strong>{formatTime(totals.total)}</Text>
                            </Table.Summary.Cell>
                        </Table.Summary.Row>
                    </Table.Summary>
                )}
            />
        </div>
    );
};