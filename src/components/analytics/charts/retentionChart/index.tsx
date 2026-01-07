import { useEffect, useMemo, useState } from "react";
import { Typography } from "antd";
import { Dayjs } from "dayjs";
import moment from "moment-timezone";
import { Mix, MixConfig } from "@ant-design/plots";
import { each, groupBy } from '@antv/util';
import './retentionChart.css';
import { AnalyticsGroupType } from "../../../../pages/analytics";
import { useCustom } from "@refinedev/core";
import { getDateFormat } from "../../util";

interface RetentionAnalyticsQuery {
    interval_date: string,
    participantId: string,
    attendance_count: number | string,
    email?: string,
    first_name?: string
}

const numberOfPlots = 3;

export const RetentionChart: React.FC<{
    communityIds: string | string[];
    apiUrl: string;
    dateRange: [Dayjs, Dayjs];
    globalGroupBy?: AnalyticsGroupType;
    enableFetching?: boolean;
    isLoading?: boolean;
    passedData?: any
}> = ({
    communityIds,
    apiUrl,
    dateRange,
    globalGroupBy = AnalyticsGroupType.MONTH,
    enableFetching = true,
    isLoading: passedIsLoading,
    passedData
}) => {
        const groupByFilter = globalGroupBy;

        const [queryData, setQueryData] = useState<any>([]);
        const [plotData, setPlotData] = useState([]);

        const [renderArrows, setRenderArrows] = useState<boolean>(false);

        const [offsetIndex, setOffsetIndex] = useState<number>(0);

        const { Text } = Typography;

        const timezone = useMemo(() => {
            return moment.tz.guess();
        }, []);

        const query = {
            start: dateRange[0].toISOString(),
            end: dateRange[1].toISOString(),
            timezone,
            groupBy: groupByFilter,
            communityIds
        };

        const url = `${apiUrl}/analytics/retention`;
        const { data: queryRawData, isLoading: queryIsLoading, refetch } = useCustom<{
            data: any;
            total: number;
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
        const data = passedData || queryRawData;

        useEffect(() => {
            if (!isLoading && data) {
                const responseData = data?.data;

                const actualData = responseData?.data || responseData;

                if (Array.isArray(actualData) && actualData.length > 0) {
                    const transformedData = transformData(actualData);
                    setQueryData(transformedData);
                } else {
                    console.log('No valid data found:', actualData);
                    setQueryData([]);
                }
            }
        }, [data, isLoading, groupByFilter]);

        useEffect(() => {
            if (queryData.length === 0) {
                setPlotData([]);
                setRenderArrows(false);
                return;
            }

            // Skip the first element and get the next numberOfPlots elements
            const startIndex = Math.max(0, offsetIndex);
            const endIndex = Math.min(queryData.length, startIndex + numberOfPlots);
            const truncatedData = queryData.slice(startIndex, endIndex);

            console.log('Plot data slice:', { startIndex, endIndex, truncatedData }); // Debug log

            if (queryData.length > numberOfPlots) {
                setRenderArrows(true);
            } else {
                setRenderArrows(false);
            }

            setPlotData(truncatedData);
        }, [queryData, offsetIndex]);

        function transformData(inputData: RetentionAnalyticsQuery[]) {
            if (!inputData || !Array.isArray(inputData)) {
                console.log('Invalid input data for transform:', inputData);
                return [];
            }

            console.log('Transforming data:', inputData);

            // Group by interval_date and sort by date
            const groupedData = groupBy(inputData, 'interval_date');
            const sortedDates = Object.keys(groupedData).sort();

            let prevIntervalEntries: RetentionAnalyticsQuery[] = [];
            const formattedData: any = [];

            sortedDates.forEach((dateKey, index) => {
                const values = groupedData[dateKey];
                const thisIntervalEntries = values;
                const thisIntervalTotal = values.length;

                const prevIntervalTotal = prevIntervalEntries.length;

                // Find retained entries (participants who appear in both current and previous intervals)
                const retainedEntries = thisIntervalEntries.filter(currEntry =>
                    prevIntervalEntries.some(prevEntry => prevEntry.participantId === currEntry.participantId)
                );
                const retainedEntriesTotal = retainedEntries.length;

                if (index > 0) {
                    const dataPoint = [
                        {
                            month: dateKey,
                            type: `This ${groupByFilter} total`,
                            value: thisIntervalTotal,
                            entries: thisIntervalEntries
                        },
                        {
                            month: dateKey,
                            type: `Prev. ${groupByFilter} total`,
                            value: prevIntervalTotal,
                            entries: prevIntervalEntries
                        },
                        {
                            month: dateKey,
                            type: "Retained",
                            value: retainedEntriesTotal,
                            entries: retainedEntries
                        }
                    ];

                    formattedData.push(dataPoint);
                }

                prevIntervalEntries = [...thisIntervalEntries];
            });

            return formattedData;
        }

        const config = useMemo(() => {
            if (!plotData || plotData.length === 0) {
                console.log('No plot data available');
                return { plots: [] };
            }

            const plots: any[] = [];
            const total = plotData.length;

            each(plotData, (data, idx) => {
                const startX = idx / total;
                plots.push({
                    type: 'column',
                    region: {
                        start: {
                            x: startX,
                            y: 0,
                        },
                        end: {
                            x: (idx + 1) / total,
                            y: 1,
                        },
                    },
                    options: {
                        data,
                        xField: 'type',
                        yField: 'value',
                        seriesField: 'month',
                        isGroup: true,
                        meta: {
                            value: {
                                sync: true,
                            },
                        },
                        xAxis: {
                            label: {
                                autoRotate: true,
                            },
                        },
                        yAxis:
                            idx === 0
                                ? {
                                    tickCount: 10,
                                }
                                : {
                                    label: {
                                        formatter: (v: any) => '',
                                    },
                                    tickCount: 10,
                                },
                        label: {},
                        minColumnWidth: 24,
                        maxColumnWidth: 75,
                        appendPadding: [20, 0],
                        color: ['#5c3886'],
                        annotations: [
                            {
                                type: 'text',
                                content: data && data[0] ? getDateFormat(data[0].month, groupByFilter) : '',
                                position: ['50%', '0%'],
                                offsetY: -15,
                                style: {
                                    textAlign: 'center',
                                },
                            },
                        ],
                    }
                });
            });

            const config: MixConfig = {
                plots,
                syncViewPadding: true,
                legend: false,
                tooltip: {
                    enterable: true,
                    showDelay: 50,
                    customContent: (title: string, items: any[]) => {
                        if (!items || items.length === 0) return '';

                        const firstItem = items[0];
                        if (!firstItem?.data?.entries) return '';

                        const list = firstItem.data.entries.map((item: any) => {
                            return `
                                <li class="g2-tooltip-list-item" style="list-style-type: none; padding: 0px; margin: 12px 0px;">
                                    <span class="g2-tooltip-marker" style="background: #64428c; width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 8px;">
                                    </span>
                                    <span class="g2-tooltip-name"><b>${item.email ? `${item.email}, ${item.first_name}` : '[Deleted User]'}: ${item.attendance_count}</b></span>
                                </li>
                            `;
                        });

                        return `
                            <div style="max-height: 400px; overflow: auto; padding: 10px">
                                <b style="font-size: 14px">Total accounts: ${firstItem.data.entries.length}</b>
                                <ul class="g2-tooltip-list" style="margin: 0px; list-style-type: none">
                                    ${list.join("\n")}
                                </ul>
                            </div>
                        `;
                    },
                },
            };

            return config;
        }, [plotData, groupByFilter]);

        if (isLoading) {
            return <div>Loading retention data...</div>;
        }

        if (!isLoading && plotData.length === 0) {
            return (
                <div style={{
                    height: 550,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                }}>
                    <Text>No retention data available for the selected period</Text>
                    <Text type="secondary">Try adjusting the date range or group by filter</Text>
                </div>
            );
        }

        return (
            <div style={{
                height: 550,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
            }}>
                {/* Individual filters removed - now controlled by tab-level filters */}
                {renderArrows &&
                    <div className="arrow-btn-wrapper">
                        <button
                            disabled={offsetIndex <= 0}
                            onClick={() => setOffsetIndex(prevVal => Math.max(0, prevVal - numberOfPlots))}
                            className="arrow-btn"
                        >
                            <div style={{ padding: 0, width: 17 }}>
                                <svg stroke={offsetIndex <= 0 ? '#D9D9D9' : '#64428c'} fill={offsetIndex <= 0 ? '#D9D9D9' : '#64428c'} strokeWidth="0" viewBox="0 0 448 512" dominantBaseline="middle" textAnchor="middle" height="17" width="17" xmlns="http://www.w3.org/2000/svg"><path d="M257.5 445.1l-22.2 22.2c-9.4 9.4-24.6 9.4-33.9 0L7 273c-9.4-9.4-9.4-24.6 0-33.9L201.4 44.7c9.4-9.4 24.6-9.4 33.9 0l22.2 22.2c9.5 9.5 9.3 25-.4 34.3L136.6 216H424c13.3 0 24 10.7 24 24v32c0 13.3-10.7 24-24 24H136.6l120.5 114.8c9.8 9.3 10 24.8.4 34.3z"></path></svg>
                            </div>
                        </button>
                        <button
                            className="arrow-btn"
                            disabled={offsetIndex >= queryData.length - numberOfPlots}
                            onClick={() => setOffsetIndex(prevVal => Math.min(queryData.length - numberOfPlots, prevVal + numberOfPlots))}
                        >
                            <div style={{ padding: 0, width: 17 }}>
                                <svg stroke={offsetIndex >= queryData.length - numberOfPlots ? '#D9D9D9' : '#64428c'} fill={offsetIndex >= queryData.length - numberOfPlots ? '#D9D9D9' : '#64428c'} strokeWidth="0" viewBox="0 0 448 512" dominantBaseline="middle" textAnchor="middle" height="17" width="17" xmlns="http://www.w3.org/2000/svg"><path d="M190.5 66.9l22.2-22.2c9.4-9.4 24.6-9.4 33.9 0L441 239c9.4 9.4 9.4 24.6 0 33.9L246.6 467.3c-9.4 9.4-24.6 9.4-33.9 0l-22.2-22.2c-9.5-9.5-9.3-25 .4-34.3L311.4 296H24c-13.3 0-24-10.7-24-24v-32c0-13.3 10.7-24 24-24h287.4L190.9 101.2c-9.8-9.3-10-24.8-.4-34.3z"></path></svg>
                            </div>
                        </button>
                    </div>
                }
                <Mix {...config} />
            </div>
        );
    };