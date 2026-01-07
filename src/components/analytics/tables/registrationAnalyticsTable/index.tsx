import React, { useMemo } from "react";
import { Table, Typography, Space, Tooltip } from "antd";
import { useCustom } from "@refinedev/core";
import { InfoCircleOutlined } from '@ant-design/icons';
import moment from "moment";
import { AnalyticsGroupType } from "../../../../pages/analytics";
import { AnalyticsTableProps, RegistrationAnalyticsQuery } from "../../analytics-types";
import { getDateFormat } from "../../util";

const { Text } = Typography;

export const NewRegistrationsTable: React.FC<AnalyticsTableProps & {
    globalGroupBy?: AnalyticsGroupType;
    hideZero?: boolean;
    enableFetching?: boolean;
    isLoading?: boolean;
    passedData?: { data: { data: RegistrationAnalyticsQuery[], total: number } } | undefined
}> = ({
    communityIds,
    dateRange,
    apiUrl,
    globalGroupBy = AnalyticsGroupType.WEEK,
    hideZero = false,
    enableFetching = true,
    isLoading: passedIsLoading,
    passedData
}) => {
        const groupByFilter = globalGroupBy;
        const hideZeroValues = hideZero;

        const timezone = useMemo(() => moment.tz.guess(), []);

        const query = useMemo(() => ({
            start: dateRange[0].startOf('day').toISOString(),
            end: dateRange[1].endOf('day').toISOString(),
            timezone,
            groupBy: groupByFilter,
            communityIds,
        }), [communityIds, dateRange, groupByFilter, timezone]);

        const url = `${apiUrl}/analytics/registeredMembers`;
        const { data: queryData, isLoading: queryIsLoading } = useCustom<{
            data: RegistrationAnalyticsQuery[];
            total: number;
        }>({
            url,
            method: "get",
            config: { query },
            queryOptions: { enabled: enableFetching /* refine black magic allows getting the data from the parent query */ }
        });

        // Use passed loading state when fetching is disabled, otherwise use query loading state
        const isLoading = enableFetching ? queryIsLoading : (passedIsLoading ?? false);
        const data = passedData || queryData;

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
                const row: any = { key: date };
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
            <div style={{ padding: '0 24px' }}>
                {/* Summary now handled by UnifiedAnalyticsView */}

                <div style={{ marginBottom: 16 }}>
                    <Space direction="vertical" size={0}>
                        <Text strong style={{ fontSize: 18 }}>
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
                    scroll={{ x: true }}
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