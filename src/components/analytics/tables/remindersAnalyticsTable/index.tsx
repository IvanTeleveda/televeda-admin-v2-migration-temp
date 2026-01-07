import React, { useContext, useMemo, useState, useEffect, useCallback } from "react";
import { Table, Typography, Space, Tooltip, Select, Form, Switch, Card, Row, Col, Statistic, Collapse } from "antd";
import { useCustom } from "@refinedev/core";
import moment from "moment";
import { ColorModeContext } from "../../../../contexts/color-mode";
import { AnalyticsGroupType } from "../../../../pages/analytics";
import {
    ReminderAnalyticsQuery,
    ReminderTableRow,
    ReminderTableData,
    ColumnTotals,
    AnalyticsTableProps
} from "../../analytics-types";
import {InfoCircleOutlined} from "@ant-design/icons";

const { Text, Title } = Typography;
const { Panel } = Collapse;

type EventBreakdownRow = {
    key: string;
    eventTitle: string;
    total: number;
    percentage: number;
    types?: Array<{ type: string; value: number }>;
};

export const RemindersAnalyticsTable: React.FC<AnalyticsTableProps & {
    globalGroupBy?: AnalyticsGroupType;
    memberAggregate?: boolean;
    hideZero?: boolean;
}> = ({
    communityIds,
    dateRange,
    apiUrl,
    globalGroupBy = AnalyticsGroupType.WEEK,
    memberAggregate = false,
    hideZero = true
}) => {
    const { mode } = useContext(ColorModeContext);
    const groupByFilter = globalGroupBy;
    const hideZeroValues = hideZero;
    const [activePanel, setActivePanel] = useState<string | string[]>(["1"]);

    const timezone = useMemo(() => moment.tz.guess(), []);

    const query = useMemo(() => ({
        start: dateRange[0].startOf('day').toISOString(),
        end: dateRange[1].endOf('day').toISOString(),
        timezone,
        groupBy: groupByFilter,
        memberAggregate,
        communityIds
    }), [communityIds, dateRange, groupByFilter, timezone, memberAggregate]);

    const url = `${apiUrl}/analytics/reminders`;
    const { data, isLoading } = useCustom<{
        data: {
            pie: any[];
            columns: ReminderAnalyticsQuery[];
        };
        total: number;
    }>({
        url,
        method: "get",
        config: { query }
    });

    // Individual filters removed - now controlled by tab-level filters

    // Date formatting utility
    const getDateFormat = useCallback((value: string, groupBy: AnalyticsGroupType): string => {
        const date = moment(value);
        switch(groupBy) {
            case AnalyticsGroupType.DAY:
                return date.format('MMM Do');
            case AnalyticsGroupType.WEEK:
                return `${date.format('MMM Do')} - ${date.add(6, 'days').format('Do')} (${date.format('wo')} week)`;
            case AnalyticsGroupType.MONTH:
                return date.format('YYYY, MMMM');
            case AnalyticsGroupType.QUARTER:
                return `${date.format('YYYY, Qo')} quarter`;
            default:
                return date.format('MMM Do');
        }
    }, []);

    const tableData = useMemo((): ReminderTableData => {
        const responseData = data?.data?.data?.columns;
        if (!responseData) return { tableRows: [], groupKeys: [] };

        const groupedData: Record<string, ReminderAnalyticsQuery[]> = {};
        responseData.forEach((item: ReminderAnalyticsQuery) => {
            if (!item.start_date) return;

            const key = item.start_date;
            if (!groupedData[key]) {
                groupedData[key] = [];
            }
            groupedData[key].push(item);
        });
        // yeah, this is AI :)
        const groupKeys = Array.from(
            new Set(
                responseData
                    .map((item: ReminderAnalyticsQuery) => item.group_key)
                    .filter(Boolean)
            )
        ) as string[];


        const tableRows: ReminderTableRow[] = Object.entries(groupedData).map(([date, items]) => {
            const reminderData: Record<string, number> = {};
            let total = 0;

            items.forEach((item: ReminderAnalyticsQuery) => {
                const type = item.group_key || 'other';
                reminderData[type] = (reminderData[type] || 0) + (item.value || 0);
                total += item.value || 0;
            });

            return {
                key: date,
                date: getDateFormat(date, groupByFilter),
                rawDate: date,
                total,
                groupKeys,
                reminderData
            };
        });

        return { tableRows, groupKeys };
    }, [data, groupByFilter, getDateFormat]);

    const eventBreakdownData = useMemo((): EventBreakdownRow[] => {
        const pieData = data?.data?.data?.pie;
        if (!pieData) return [];

        const totalValue = pieData.reduce((sum: number, item: any) => sum + (item.value || 0), 0);

        return pieData.map((item: any, index: number) => ({
            key: `event-${index}`,
            eventTitle: item.title || 'Unknown Event',
            total: item.value || 0,
            percentage: totalValue > 0 ? ((item.value || 0) / totalValue) * 100 : 0,
            types: item.types || []
        })).sort((a: EventBreakdownRow, b: EventBreakdownRow) => b.total - a.total);
    }, [data]);

    const columnTotals = useMemo((): ColumnTotals => {
        const totals: ColumnTotals = { total: 0 };

        tableData.tableRows.forEach((row: ReminderTableRow) => {
            Object.entries(row.reminderData).forEach(([key, value]) => {
                if (!totals[key]) totals[key] = 0;
                totals[key] += value;
            });
            totals.total += row.total;
        });

        return totals;
    }, [tableData]);

    const getReminderValue = (row: ReminderTableRow, groupKey: string): number => {
        return row.reminderData[groupKey] || 0;
    };

    // Filter timeline rows based on hideZeroValues setting
    const filteredTimelineRows = useMemo(() => {
        if (hideZeroValues) {
            return tableData.tableRows.filter(row => row.total > 0);
        }
        return tableData.tableRows;
    }, [tableData.tableRows, hideZeroValues]);

    const timelineColumns = useMemo(() => {
        const baseColumns: any[] = [
            {
                title: "Date",
                dataIndex: "date",
                key: "date",
                sorter: (a: ReminderTableRow, b: ReminderTableRow) =>
                    new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime(),
                width: 200,
            }
        ];

        tableData.groupKeys.forEach((key: string) => {
            baseColumns.push({
                title: key,
                dataIndex: key,
                key: key,
                render: (_: any, record: ReminderTableRow) => getReminderValue(record, key),
                align: 'center' as const,
                width: 100,
            });
        });

        baseColumns.push({
            title: "Total",
            dataIndex: "total",
            key: "total",
            align: 'center' as const,
            width: 100,
        });

        return baseColumns;
    }, [tableData.groupKeys, hideZeroValues]);

    const eventBreakdownColumns = [
        {
            title: "Event Title",
            dataIndex: "eventTitle",
            key: "eventTitle",
            render: (text: string) => (
                <Tooltip title={text}>
                    <Text style={{ maxWidth: 300 }} ellipsis>
                        {text.length > 50 ? `${text.substring(0, 47)}...` : text}
                    </Text>
                </Tooltip>
            ),
            width: 350,
        },
        {
            title: "Total Reminders",
            dataIndex: "total",
            key: "total",
            align: 'center' as const,
            width: 150,
            sorter: (a: EventBreakdownRow, b: EventBreakdownRow) => a.total - b.total,
        },
        {
            title: "Percentage",
            dataIndex: "percentage",
            key: "percentage",
            align: 'center' as const,
            width: 120,
            render: (percentage: number) => `${percentage.toFixed(1)}%`,
            sorter: (a: EventBreakdownRow, b: EventBreakdownRow) => a.percentage - b.percentage,
        },
    ];

    const groupByOptions = [
        { value: AnalyticsGroupType.DAY, label: 'Day' },
        { value: AnalyticsGroupType.WEEK, label: 'Week' },
        { value: AnalyticsGroupType.MONTH, label: 'Month' },
        { value: AnalyticsGroupType.QUARTER, label: 'Quarter' }
    ];

    return (
        <div style={{ padding: '0 24px' }}>
            {/* Summary now handled by UnifiedAnalyticsView */}

            {/* Collapsible Event Breakdown */}
            <Collapse
                activeKey={activePanel}
                onChange={setActivePanel}
                style={{ marginBottom: 24 }}
            >
                <Panel
                    header="Event Breakdown"
                    key="1"
                    extra={
                        <Text type="secondary">
                            {eventBreakdownData.length} events shown
                        </Text>
                    }
                >
                    <Table
                        columns={eventBreakdownColumns}
                        dataSource={eventBreakdownData}
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
                                        <Text strong>{eventBreakdownData.reduce((sum, item) => sum + item.total, 0)}</Text>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={2} align="center">
                                        <Text strong>100.0%</Text>
                                    </Table.Summary.Cell>
                                </Table.Summary.Row>
                            </Table.Summary>
                        )}
                    />
                </Panel>
            </Collapse>

            {/* Timeline View */}
            <Card>
                <div style={{ marginBottom: 16 }}>
                    <Space direction="vertical" size={0}>
                        <Text strong style={{ fontSize: 16 }}>
                            Timeline View
                        </Text>
                        <Text type="secondary">
                            {filteredTimelineRows.length} periods shown
                        </Text>
                    </Space>
                    {/* Individual filters removed - now controlled by tab-level filters */}
                </div>

                <Table
                    columns={timelineColumns}
                    dataSource={filteredTimelineRows}
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

                                {tableData.groupKeys.map((key: string, index: number) => (
                                    <Table.Summary.Cell key={key} index={index + 1} align="center">
                                        <Text strong>{columnTotals[key] || 0}</Text>
                                    </Table.Summary.Cell>
                                ))}

                                <Table.Summary.Cell index={tableData.groupKeys.length + 1} align="center">
                                    <Text strong>{columnTotals.total}</Text>
                                </Table.Summary.Cell>
                            </Table.Summary.Row>
                        </Table.Summary>
                    )}
                />
            </Card>
        </div>
    );
};