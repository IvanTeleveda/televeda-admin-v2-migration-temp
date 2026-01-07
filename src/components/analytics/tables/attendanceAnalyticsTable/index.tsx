import React, { useMemo } from "react";
import { Table, Typography, Space, Tooltip } from "antd";
import { useCustom } from "@refinedev/core";
import { InfoCircleOutlined } from '@ant-design/icons';
import moment from "moment";
import { AttendanceDataItem, AnalyticsTableProps } from "../../analytics-types";
import { AnalyticsGroupType } from "../../../../pages/analytics";
import { getDateFormat } from "../../util";

const { Text } = Typography;

export const AttendanceAnalyticsTable: React.FC<AnalyticsTableProps & {
    globalGroupBy?: AnalyticsGroupType;
    viewMode?: 'all' | 'selected' | 'other';
    hideZero?: boolean;
    enableFetching?: boolean;
    isLoading?: boolean;
    passedData?: {
        data: { data: AttendanceDataItem[], total: { type: string, count: number }[] }
    } | undefined
}> = ({
    communityIds,
    dateRange,
    apiUrl,
    globalGroupBy = AnalyticsGroupType.DAY,
    viewMode = 'all',
    hideZero = false,
    enableFetching = true,
    isLoading: passedIsLoading,
    passedData
}) => {
        const hideZeroValues = hideZero;

        const timezone = useMemo(() => moment.tz.guess(), []);

        const query = useMemo(() => ({
            start: dateRange[0].startOf('day').toISOString(),
            end: dateRange[1].endOf('day').toISOString(),
            timezone,
            communityIds,
            groupBy: globalGroupBy
        }), [communityIds, dateRange, timezone, globalGroupBy]);

        const url = `${apiUrl}/analytics/memberAttendance`;
        const { data: queryData, isLoading: queryIsLoading } = useCustom<{
            data: AttendanceDataItem[];
            total: { type: string; count: number }[];
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

            const groupedByDate: Record<string, {
                date: string;
                selected: number;
                other: number;
                total: number;
                rawDate: string;
            }> = {};

            data.data.data.forEach(item => {
                if (!groupedByDate[item.date]) {
                    groupedByDate[item.date] = {
                        date: item.date,
                        rawDate: item.date,
                        selected: 0,
                        other: 0,
                        total: 0
                    };
                }

                if (item.type === "Selected Communities") {
                    groupedByDate[item.date].selected += item.count;
                } else if (item.type === "All other communities") {
                    groupedByDate[item.date].other += item.count;
                }

                groupedByDate[item.date].total += item.count;
            });

            return Object.values(groupedByDate).map(item => ({
                ...item,
                key: item.date,
                formattedDate: getDateFormat(item.date, globalGroupBy)
            }));
        }, [data, globalGroupBy]);

        // const summaryMetrics = useMemo(() => {
        //     let selectedTotal = 0;
        //     let otherTotal = 0;
        //     let overallTotal = 0;
        //     let maxAttendance = 0;
        //     let maxAttendanceDate = "";
        //     let periodsWithAttendance = 0;

        //     tableData.forEach(item => {
        //         selectedTotal += item.selected;
        //         otherTotal += item.other;
        //         overallTotal += item.total;

        //         if (item.total > 0) periodsWithAttendance++;

        //         if (item.total > maxAttendance) {
        //             maxAttendance = item.total;
        //             maxAttendanceDate = item.formattedDate;
        //         }
        //     });

        //     // Calculate total periods based on groupBy type
        //     const getTotalPeriods = () => {
        //         const start = dateRange[0];
        //         const end = dateRange[1];

        //         switch(globalGroupBy) {
        //             case AnalyticsGroupType.WEEK:
        //                 return Math.ceil(end.diff(start, 'weeks', true)) + 1;
        //             case AnalyticsGroupType.MONTH:
        //                 return Math.ceil(end.diff(start, 'months', true)) + 1;
        //             case AnalyticsGroupType.QUARTER:
        //                 return Math.ceil(end.diff(start, 'quarters', true)) + 1;
        //             default:
        //                 return Math.ceil(end.diff(start, 'days') + 1);
        //         }
        //     };

        //     const totalPeriods = getTotalPeriods();
        //     const avgSelected = selectedTotal / totalPeriods;
        //     const avgOther = otherTotal / totalPeriods;
        //     const avgOverall = overallTotal / totalPeriods;

        //     return {
        //         selectedTotal,
        //         otherTotal,
        //         overallTotal,
        //         maxAttendance,
        //         maxAttendanceDate,
        //         daysWithAttendance: periodsWithAttendance, // Keep the same property name for compatibility
        //         daysInPeriod: totalPeriods, // Keep the same property name for compatibility
        //         avgSelected: Number.isNaN(avgSelected) ? 0 : avgSelected,
        //         avgOther: Number.isNaN(avgOther) ? 0 : avgOther,
        //         avgOverall: Number.isNaN(avgOverall) ? 0 : avgOverall
        //     };
        // }, [tableData, dateRange, globalGroupBy]);

        const filteredData = useMemo(() => {
            let filtered = tableData;

            if (viewMode === 'selected') {
                filtered = filtered.map(item => ({
                    ...item,
                    other: 0,
                    total: item.selected
                }));
            } else if (viewMode === 'other') {
                filtered = filtered.map(item => ({
                    ...item,
                    selected: 0,
                    total: item.other
                }));
            }

            if (hideZeroValues) {
                filtered = filtered.filter(item => item.total > 0);
            }

            return filtered;
        }, [tableData, viewMode, hideZeroValues]);

        const columnTotals = useMemo(() => {
            const totals = {
                selected: 0,
                other: 0,
                total: 0
            };

            filteredData.forEach(item => {
                totals.selected += item.selected;
                totals.other += item.other;
                totals.total += item.total;
            });

            return totals;
        }, [filteredData]);

        const getColumnTitle = () => {
            switch (globalGroupBy) {
                case AnalyticsGroupType.WEEK:
                    return "Week Period";
                case AnalyticsGroupType.MONTH:
                    return "Month";
                case AnalyticsGroupType.QUARTER:
                    return "Quarter";
                default:
                    return "Date";
            }
        };

        const columns = [
            {
                title: getColumnTitle(),
                dataIndex: "formattedDate",
                key: "date",
                sorter: (a: any, b: any) =>
                    new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime(),
            },
            {
                title: "Selected Communities",
                dataIndex: "selected",
                key: "selected",
                render: (value: number) => value || 0,
                align: 'center' as const,
            },
            {
                title: "All Other Communities",
                dataIndex: "other",
                key: "other",
                render: (value: number) => value || 0,
                align: 'center' as const,
            },
            {
                title: "Total Attendance",
                dataIndex: "total",
                key: "total",
                align: 'center' as const,
            }
        ];

        const getViewModeLabel = () => {
            switch (viewMode) {
                case 'selected': return 'Selected Communities Only';
                case 'other': return 'Other Communities Only';
                default: return 'All Communities';
            }
        };

        return (
            <div style={{ padding: '0 24px' }}>
                {/* Summary now handled by UnifiedAnalyticsView */}

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16
                }}>
                    <Space direction="vertical" size={0}>
                        <Text strong style={{ fontSize: 18 }}>
                            Live Attendance Analytics
                            <Tooltip
                                title="This table shows attendance data comparing your selected communities against all other communities in the platform. Use the filters to focus on specific data views and time periods."
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
                            Showing {filteredData.length} {globalGroupBy === AnalyticsGroupType.DAY ? 'days' :
                                globalGroupBy === AnalyticsGroupType.WEEK ? 'weeks' :
                                    globalGroupBy === AnalyticsGroupType.MONTH ? 'months' : 'quarters'} • {getViewModeLabel()}
                        </Text>
                    </Space>
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredData}
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
                                    <Text strong>{columnTotals.selected}</Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={2} align="center">
                                    <Text strong>{columnTotals.other}</Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={3} align="center">
                                    <Text strong>{columnTotals.total}</Text>
                                </Table.Summary.Cell>
                            </Table.Summary.Row>
                        </Table.Summary>
                    )}
                    locale={{
                        emptyText: hideZeroValues
                            ? `No ${globalGroupBy === AnalyticsGroupType.DAY ? 'days' :
                                globalGroupBy === AnalyticsGroupType.WEEK ? 'weeks' :
                                    globalGroupBy === AnalyticsGroupType.MONTH ? 'months' : 'quarters'} with attendance greater than zero in the selected period`
                            : "No attendance data found for the selected period and communities"
                    }}
                />
            </div>
        );
    };