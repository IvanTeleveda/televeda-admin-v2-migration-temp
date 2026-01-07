import React, {useContext, useMemo, useState} from "react";
import {Table, Typography, Space, Tooltip, Select, Form, Card, Row, Col, Statistic} from "antd";
import {useCustom} from "@refinedev/core";
import {InfoCircleOutlined} from '@ant-design/icons';
import moment from "moment";
import {ColorModeContext} from "../../../../contexts/color-mode";
import {AnalyticsGroupType} from "../../../../pages/analytics";
import {Switch} from "@pankod/refine-antd";
import {AnalyticsTableProps, RegistrationAnalyticsQuery} from "../../analytics-types";

const {Text} = Typography;

interface SummaryMetrics {
    totalRegistrations: number;
    directRegistrations: number;
    bulkRegistrations: number;
    otherRegistrations: number;
}

export const NewRegistrationsTable: React.FC<AnalyticsTableProps & {
    globalGroupBy?: AnalyticsGroupType;
    hideZero?: boolean;
}> = ({
    communityIds,
    dateRange,
    apiUrl,
    globalGroupBy = AnalyticsGroupType.WEEK,
    hideZero = true
}) => {
    const {mode} = useContext(ColorModeContext);
    const groupByFilter = globalGroupBy;
    const hideZeroValues = hideZero;

    const timezone = useMemo(() => moment.tz.guess(), []);

    const query = useMemo(() => ({
        start: dateRange[0].startOf('day').toISOString(),
        end: dateRange[1].endOf('day').toISOString(),
        timezone,
        groupBy: groupByFilter,
        communityIds,
        hideZero: hideZeroValues
    }), [communityIds, dateRange, groupByFilter, timezone, hideZeroValues]);

    const url = `${apiUrl}/analytics/registeredMembers`;
    const {data, isLoading} = useCustom<{
        data: RegistrationAnalyticsQuery[];
        total: number;
    }>({
        url,
        method: "get",
        config: {query}
    });

    const getDateFormat = (value: string, groupBy: AnalyticsGroupType) => {
        switch (groupBy) {
            case AnalyticsGroupType.DAY:
                return moment(value).format('MMM Do');
            case AnalyticsGroupType.WEEK:
                return `${moment(value).format('MMM Do')} - ${moment(value).add(6, 'days').format('Do')} (${moment(value).format('wo')} week)`;
            case AnalyticsGroupType.MONTH:
                return moment(value).format('YYYY, MMMM');
            case AnalyticsGroupType.QUARTER:
                return `${moment(value).format('YYYY, Qo')} quarter`;
            default:
                return moment(value).format('MMM Do');
        }
    };

    const summaryMetrics = useMemo<SummaryMetrics>(() => {
        const metrics: SummaryMetrics = {
            totalRegistrations: 0,
            directRegistrations: 0,
            bulkRegistrations: 0,
            otherRegistrations: 0
        };

        if (!data?.data?.data) return metrics;

        data.data.data.forEach(item => {
            const count = item.user_count;
            metrics.totalRegistrations += count;

            if (item.registration_type === 'direct') {
                metrics.directRegistrations += count;
            } else if (item.registration_type === 'admin/bulk') {
                metrics.bulkRegistrations += count;
            } else {
                metrics.otherRegistrations += count;
            }
        });

        return metrics;
    }, [data]);

    const tableData = useMemo(() => {
        if (!data?.data?.data) return [];

        const groupedData: Record<string, RegistrationAnalyticsQuery[]> = {};
        data.data.data.forEach(item => {
            const key = item.start_date;
            if (!groupedData[key]) {
                groupedData[key] = [];
            }
            groupedData[key].push(item);
        });

        const rows = Object.entries(groupedData).map(([date, items]) => {
            const row: any = {key: date};
            let total = 0;

            items.forEach(item => {
                const type = item.registration_type || 'other';
                row[type] = (row[type] || 0) + item.user_count;
                total += item.user_count;
            });

            return {
                ...row,
                date: getDateFormat(date, groupByFilter),
                total,
                rawDate: date
            };
        });

        // Filter out zero values if enabled
        return hideZeroValues
            ? rows.filter(row => row.total > 0)
            : rows;
    }, [data, groupByFilter, hideZeroValues]);

    const columnTotals = useMemo(() => {
        const totals: Record<string, number> = {
            direct: 0,
            'admin/bulk': 0,
            other: 0,
            total: 0
        };

        tableData.forEach(row => {
            totals.direct += row.direct || 0;
            totals['admin/bulk'] += row['admin/bulk'] || 0;
            totals.other += row.other || 0;
            totals.total += row.total;
        });

        return totals;
    }, [tableData]);

    const columns = useMemo(() => [
        {
            title: "Date",
            dataIndex: "date",
            key: "date",
            sorter: (a: any, b: any) =>
                new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime(),
        },
        {
            title: "Direct",
            dataIndex: "direct",
            key: "direct",
            render: (value: number) => value || 0,
            align: 'center' as const,
        },
        {
            title: "Bulk",
            dataIndex: "admin/bulk",
            key: "admin/bulk",
            render: (value: number) => value || 0,
            align: 'center' as const,
        },
        // {
        //     title: "Other",
        //     dataIndex: "other",
        //     key: "other",
        //     render: (value: number) => value || 0,
        //     align: 'center' as const,
        // },
        {
            title: "Total",
            dataIndex: "total",
            key: "total",
            align: 'center' as const,
        }
    ], []);

    return (
        <div style={{padding: '0 24px'}}>
            {/* Summary now handled by UnifiedAnalyticsView */}

            <div style={{ marginBottom: 16 }}>
                <Space direction="vertical" size={0}>
                    <Text strong style={{fontSize: 18}}>
                        Registration Analytics
                        <Tooltip
                            title="Shows new member registrations for the selected period"
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
                    <Text type="secondary">
                        {tableData.length} periods shown
                    </Text>
                </Space>
            </div>

            <Table
                columns={columns}
                dataSource={tableData}
                loading={isLoading}
                pagination={false}
                scroll={{x: true}}
                summary={() => (
                    <Table.Summary fixed>
                        <Table.Summary.Row>
                            <Table.Summary.Cell index={0} align="right">
                                <Text strong>Total</Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1} align="center">
                                <Text strong>{columnTotals.direct}</Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={2} align="center">
                                <Text strong>{columnTotals['admin/bulk']}</Text>
                            </Table.Summary.Cell>
                            {/*<Table.Summary.Cell index={3} align="center">*/}
                            {/*    <Text strong>{columnTotals.other}</Text>*/}
                            {/*</Table.Summary.Cell>*/}
                            <Table.Summary.Cell index={4} align="center">
                                <Text strong>{columnTotals.total}</Text>
                            </Table.Summary.Cell>
                        </Table.Summary.Row>
                    </Table.Summary>
                )}
            />
        </div>
    );
};