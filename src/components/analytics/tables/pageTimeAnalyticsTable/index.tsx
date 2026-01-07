import React, { useMemo } from "react";
import { Table, Typography, Space, Tooltip } from "antd";
import { useCustom } from "@refinedev/core";
import { InfoCircleOutlined } from '@ant-design/icons';
import moment from "moment";
import { AnalyticsGroupType } from "../../../../pages/analytics";
import {
    PageTimeData,
    PageTimeTableRow,
    PageTimeTableData,
    ColumnTotals, AnalyticsTableProps
} from "../../analytics-types";
import { formatTime } from "../../util";

const { Text } = Typography;

export const PageTimeAnalyticsTable: React.FC<AnalyticsTableProps & {
    globalGroupBy?: AnalyticsGroupType;
    userEmail?: string;
    enableFetching?: boolean;
    isLoading?: boolean;
    passedData?: { data: { data: PageTimeData[] } } | undefined;
}> = ({
    communityIds,
    dateRange,
    apiUrl,
    globalGroupBy = AnalyticsGroupType.DAY,
    userEmail = "",
    enableFetching = true,
    isLoading: passedIsLoading,
    passedData
}) => {
        const timezone = useMemo(() => moment.tz.guess(), []);

        const query = useMemo(() => ({
            start: dateRange[0].startOf('day').toISOString(),
            end: dateRange[1].endOf('day').toISOString(),
            timezone,
            communityIds,
            groupBy: globalGroupBy,
            ...(userEmail ? { userEmail } : {}),
        }), [communityIds, dateRange, timezone, globalGroupBy, userEmail]);

        const url = `${apiUrl}/analytics/memberPageTimeMetrics`;
        const { data: queryData, isLoading: queryIsLoading } = useCustom<{
            data: PageTimeData[];
        }>({
            url,
            method: "get",
            config: { query },
            queryOptions: { enabled: enableFetching /* refine black magic allows getting the data from the parent query */ }
        });

        // Use passed loading state when fetching is disabled, otherwise use query loading state
        const isLoading = enableFetching ? queryIsLoading : (passedIsLoading ?? false);
        const data = passedData || queryData;

        const tableData = useMemo((): PageTimeTableData => {
            if (!data?.data?.data) return { tableRows: [], allPages: [] };

            const groupedByDate: Record<string, {
                date: string;
                pageData: Record<string, number>;
                total: number;
            }> = {};

            data.data.data.forEach((item: PageTimeData) => {
                if (!item.event_date) return;

                const date = item.event_date;
                if (!groupedByDate[date]) {
                    groupedByDate[date] = {
                        date,
                        pageData: {},
                        total: 0
                    };
                }
                // will combine the on-demand and on-demand-streaming pages for now.
                let pageName = item.page;
                if (item.page === 'on-demand-streaming') {
                    pageName = 'on-demand';
                }

                groupedByDate[date].pageData[pageName] =
                    (groupedByDate[date].pageData[pageName] || 0) + item.total_time_spent;
                groupedByDate[date].total += item.total_time_spent;
            });

            //
            const allPages = Array.from(
                new Set(data.data.data.map((item: PageTimeData) =>
                    item.page === 'on-demand-streaming' ? 'on-demand' : item.page
                ))
            );

            const tableRows: PageTimeTableRow[] = Object.values(groupedByDate).map(item => ({
                key: item.date,
                date: moment(item.date).format("MMM DD, YYYY"),
                rawDate: item.date,
                pageData: item.pageData,
                total: item.total
            }));

            return { tableRows, allPages };
        }, [data]);

        const columnTotals = useMemo((): ColumnTotals => {
            const totals: ColumnTotals = { total: 0 };

            tableData.tableRows.forEach((row: PageTimeTableRow) => {
                Object.entries(row.pageData).forEach(([page, time]) => {
                    if (!totals[page]) totals[page] = 0;
                    totals[page] += time;
                });
                totals.total += row.total;
            });

            return totals;
        }, [tableData]);

        const getPageTime = (row: PageTimeTableRow, page: string): number => {
            return row.pageData[page] || 0;
        };



        const columns = useMemo(() => {
            const baseColumns: any[] = [
                {
                    title: "Date",
                    dataIndex: "date",
                    key: "date",
                    sorter: (a: PageTimeTableRow, b: PageTimeTableRow) =>
                        new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime(),
                }
            ];

            tableData.allPages.forEach((page: string) => {
                baseColumns.push({
                    title: page,
                    dataIndex: page,
                    key: page,
                    render: (_: any, record: PageTimeTableRow) => formatTime(getPageTime(record, page)),
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
                            Page Time Analytics
                            <Tooltip
                                title="Shows time spent by users on different pages of the platform, excluding time spent streaming live, external events, or on‑demand classes."
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