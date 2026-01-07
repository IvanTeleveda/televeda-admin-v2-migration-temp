import { useMemo } from "react";
import { Empty } from "antd";
import { LineConfig } from "@ant-design/plots/lib/components/line";
import { Dayjs } from "dayjs";
import * as moment from 'moment-timezone';
import { Line, Pie, PieConfig } from "@ant-design/plots";
import { useCustom } from "@refinedev/core";
import { AnalyticsGroupType } from "../../../../pages/analytics";
import { getDateFormat } from "../../util";

export const AttendanceChart: React.FC<{
    communityIds: string | string[] | undefined | null | number | { value: string; label: string };
    dateRange: [Dayjs, Dayjs];
    apiUrl: string;
    globalGroupBy?: AnalyticsGroupType;
    viewMode?: 'all' | 'selected' | 'other';
    hideZero?: boolean;
    enableFetching?: boolean;
    isLoading?: boolean;
    passedData?: any;
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
        const viewModeValue = viewMode;
        const hideZeroValue = hideZero;
        const groupByFilter = globalGroupBy;

        const timezone = useMemo(() => {
            return moment.tz.guess()
        }, []);
        const query = {
            start: dateRange[0].startOf('day').toISOString(),
            end: dateRange[1].endOf('day').toISOString(),
            timezone,
            communityIds,
            groupBy: globalGroupBy
        };
        const url = `${apiUrl}/analytics/memberAttendance`;
        const { data: queryData, isLoading: queryIsLoading } = useCustom<{
            data: any;
            total: any;
            trend: number;
        }>({
            url,
            method: "get",
            config: {
                query
            },
            queryOptions: { enabled: enableFetching /* refine black magic allows getting the data from the parent query */ }
        });

        // Use passed loading state when fetching is disabled, otherwise use query loading state
        const isLoading = enableFetching ? queryIsLoading : (passedIsLoading ?? false);
        const data = passedData || queryData;

        const config = useMemo(() => {
            const filterData = (items: any[]) => {
                if (!items) return [];

                return items.filter((item) => {
                    if (hideZeroValue && item.count === 0) {
                        return false;
                    }

                    if (viewModeValue === 'selected') {
                        return item.type === 'Selected Communities';
                    }
                    if (viewModeValue === 'other') {
                        return item.type === 'All other communities';
                    }

                    return true;
                });
            };

            const filteredGraphData = filterData(data?.data.data || []);
            const filteredPieData = filterData(data?.data.total || []);

            const lineConfig: LineConfig = {
                data: filteredGraphData,
                loading: isLoading,
                padding: "auto",
                xField: "date",
                yField: "count",
                autoFit: true,
                seriesField: 'type',
                point: {
                    size: 4,
                    shape: 'circle',
                },
                xAxis: {
                    label: {
                        formatter: (value: any) => getDateFormat(value, groupByFilter, false)
                    },
                    line: null,
                },
                tooltip: {
                    title: (title: any) => {
                        return getDateFormat(title, groupByFilter, true);
                    },
                },
                color: ['#532D7F', '#FEBF00'],
                smooth: true,
                scrollbar: {
                    categorySize: 10,
                    style: {
                        thumbColor: '#d9d9d9',
                        thumbHighlightColor: '#b3b3b3'
                    }
                }
            };

            const pieConfig: PieConfig = {
                appendPadding: 10,
                data: filteredPieData,
                angleField: 'count',
                colorField: 'type',
                radius: 0.8,
                height: 250,
                width: 475,
                legend: false,
                autoFit: true,
                label: {
                    type: 'spider',
                    content: ({ percent, count, }: any) => `${(percent * 100).toFixed(0)}% \n${count} attendances`,
                    style: {
                        fontSize: 15
                    },
                },
                interactions: [
                    {
                        type: 'element-active',
                    },
                ],
                color: ['#532D7F', '#FEBF00'],
            };

            return { lineConfig, pieConfig };
        }, [data, viewModeValue, hideZeroValue, groupByFilter, isLoading]);

        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 16,
                borderRadius: 8,
                boxShadow: '0 1px 2px -2px rgba(0, 0, 0, 0.16), 0 3px 6px 0 rgba(0, 0, 0, 0.12), 0 5px 12px 4px rgba(0, 0, 0, 0.09)'
            }}>
                {!isLoading && (!data?.data.data || data.data.data.length === 0) ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                        <Empty
                            description="No data found. Please adjust your search and try again."
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                            <Pie {...config.pieConfig} />
                        </div>
                        <div style={{ flexGrow: 1 }}>
                            <Line
                                padding={0}
                                appendPadding={10}
                                {...config.lineConfig}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };