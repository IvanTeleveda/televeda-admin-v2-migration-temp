import React, { useMemo } from "react";
import { Table, Typography, Space, Tooltip } from "antd";
import { useCustom } from "@refinedev/core";
import { InfoCircleOutlined } from '@ant-design/icons';
import moment from "moment";
import { AnalyticsGroupType } from "../../../../pages/analytics";
import { AnalyticsTableProps, RetentionDataItem } from "../../analytics-types";
import { getDateFormat } from "../../util";

const { Text } = Typography;

export const RetentionAnalyticsTable: React.FC<AnalyticsTableProps & {
    globalGroupBy?: AnalyticsGroupType;
    enableFetching?: boolean;
    isLoading?: boolean;
    passedData?: { data: { data: RetentionDataItem[] } } | undefined;
}> = ({
    communityIds,
    dateRange,
    apiUrl,
    globalGroupBy = AnalyticsGroupType.MONTH,
    enableFetching = true,
    isLoading: passedIsLoading,
    passedData
}) => {
        const groupByFilter = globalGroupBy;

        const timezone = useMemo(() => moment.tz.guess(), []);

        const query = useMemo(() => ({
            start: dateRange[0].toISOString(),
            end: dateRange[1].toISOString(),
            timezone,
            groupBy: groupByFilter,
            communityIds
        }), [communityIds, dateRange, groupByFilter, timezone]);

        const url = `${apiUrl}/analytics/retention`;
        const { data: queryData, isLoading: queryIsLoading, refetch } = useCustom<{
            data: RetentionDataItem[];
        }>({
            url,
            method: "get",
            config: { query },
            queryOptions: { enabled: enableFetching /* refine black magic allows getting the data from the parent query */ }
        });

        // Use passed loading state when fetching is disabled, otherwise use query loading state
        const isLoading = enableFetching ? queryIsLoading : (passedIsLoading ?? false);
        const data = passedData || queryData;


        const retentionData = useMemo(() => {
            if (!data?.data?.data) return [];

            const groupedData: Record<string, RetentionDataItem[]> = {};
            data.data.data.forEach(item => {
                if (!item.interval_date) return;

                const key = item.interval_date;
                if (!groupedData[key]) {
                    groupedData[key] = [];
                }
                groupedData[key].push(item);
            });

            const sortedDates = Object.keys(groupedData).sort();

            let prevIntervalParticipants: RetentionDataItem[] = [];
            const retentionData: any[] = [];

            sortedDates.forEach((date, index) => {
                const currentParticipants = groupedData[date];

                // Calculate retained participants
                const retainedParticipants = currentParticipants.filter(current =>
                    prevIntervalParticipants.some(prev => prev.participantId === current.participantId)
                );

                retentionData.push({
                    key: date,
                    active: index > 0,
                    interval: getDateFormat(date, groupByFilter),
                    rawDate: date,
                    currentParticipants: currentParticipants.length,
                    prevParticipants: index === 0 ? 0 : prevIntervalParticipants.length,
                    retained: retainedParticipants.length,
                    retentionRate: index === 0 ? 0 :
                        Math.round((retainedParticipants.length / prevIntervalParticipants.length) * 100),
                    isLowRetention: index > 0 &&
                        (retainedParticipants.length / prevIntervalParticipants.length) < 0.5
                });


                prevIntervalParticipants = currentParticipants;
            });

            return retentionData;
        }, [data, groupByFilter]);

        const summaryMetrics = useMemo(() => {
            if (retentionData.length < 2) return null;

            let totalPrevParticipants = 0;
            let totalRetained = 0;

            // Calculate metrics
            retentionData.forEach((item, index) => {

                if (index > 0) {
                    totalPrevParticipants += item.prevParticipants;
                    totalRetained += item.retained;
                }
            });

            return {
                averageRetention: Math.round(totalRetained / totalPrevParticipants * 100),
            };
        }, [retentionData]);

        const columns = [
            {
                title: (
                    <Tooltip title="The time period being analyzed. Periods with low retention (below 50%) are highlighted in red to draw attention to potential engagement issues.">
                        <Space>
                            Time Period
                            <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 12 }} />
                        </Space>
                    </Tooltip>
                ),
                dataIndex: "interval",
                key: "interval",
                sorter: (a: any, b: any) =>
                    new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime(),
                render: (text: string, record: any) => (
                    <Text style={record.isLowRetention ? { color: '#ff4d4f', fontWeight: 500 } : {}}>
                        {text}
                    </Text>
                )
            },
            {
                title: (
                    <Tooltip title="Number of unique participants who attended events in the previous time period. This serves as the baseline to calculate retention rates.">
                        <Space>
                            Previous Participants
                            <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 12 }} />
                        </Space>
                    </Tooltip>
                ),
                dataIndex: "prevParticipants",
                key: "prevParticipants",
                align: 'center' as const,
            },
            {
                title: (
                    <Tooltip title="Number of unique participants who attended events in the current time period. Compare this with previous participants to see growth or decline.">
                        <Space>
                            Current Participants
                            <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 12 }} />
                        </Space>
                    </Tooltip>
                ),
                dataIndex: "currentParticipants",
                key: "currentParticipants",
                align: 'center' as const,
            },
            {
                title: (
                    <Tooltip title="Number of participants who attended events in both the previous AND current periods. These are your most engaged community members who consistently return.">
                        <Space>
                            Retained Participants
                            <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 12 }} />
                        </Space>
                    </Tooltip>
                ),
                dataIndex: "retained",
                key: "retained",
                align: 'center' as const,
            },
            {
                title: (
                    <Tooltip title="Percentage of previous participants who returned in the current period. Green (80%+) indicates excellent retention, red (<50%) indicates concerning retention that may need attention.">
                        <Space>
                            Retention Rate
                            <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 12 }} />
                        </Space>
                    </Tooltip>
                ),
                dataIndex: "retentionRate",
                key: "retentionRate",
                render: (value: number) => (
                    <Text
                        style={value < 50 ? { color: '#ff4d4f', fontWeight: 500 } :
                            value >= 80 ? { color: '#52c41a', fontWeight: 500 } : {}}
                    >
                        {value}%
                    </Text>
                ),
                align: 'center' as const,
                sorter: (a: any, b: any) => a.retentionRate - b.retentionRate,
            },
            {
                title: (
                    <Tooltip title="Net change in participants from previous to current period. Positive numbers (green) show growth, negative numbers (red) show decline.">
                        <Space>
                            Growth
                            <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 12 }} />
                        </Space>
                    </Tooltip>
                ),
                key: "growth",
                align: 'center' as const,
                render: (_: any, record: any) => {
                    if (record.prevParticipants === 0) return '-';
                    const growth = record.currentParticipants - record.prevParticipants;
                    return (
                        <Text type={growth > 0 ? 'success' : 'danger'}>
                            {growth > 0 ? '+' : ''}{growth}
                        </Text>
                    );
                }
            }
        ];

        return (
            <div style={{ padding: '0 24px' }}>
                {/* Summary now handled by UnifiedAnalyticsView */}

                <div style={{ marginBottom: 16 }}>
                    <Space direction="vertical" size={0}>
                        <Text strong style={{ fontSize: 18 }}>
                            Retention Analytics
                            <Tooltip
                                title="This table analyzes how many participants continue attending events over consecutive time periods. Retention rate shows the percentage of previous participants who return, helping you understand community engagement patterns and identify periods that need attention."
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
                            Showing {retentionData.length - 1} periods
                        </Text>
                    </Space>
                    {/* Individual filters removed - now controlled by tab-level filters */}
                </div>

                <Table
                    columns={columns}
                    dataSource={retentionData.filter(data => data.active === true)}
                    loading={isLoading}
                    pagination={false}
                    scroll={{ x: true }}
                    rowClassName={(record) => record.isLowRetention ? 'low-retention-row' : ''}
                    summary={() => (
                        <Table.Summary fixed>
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0} colSpan={3} align="right">
                                    <Text strong>Average Retention:</Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={1} colSpan={3} align="center">
                                    <Text strong>
                                        {summaryMetrics?.averageRetention || 0}%
                                    </Text>
                                </Table.Summary.Cell>
                            </Table.Summary.Row>
                        </Table.Summary>
                    )}
                    locale={{
                        emptyText: "No retention data found for selected filters"
                    }}
                />

                <div style={{ marginTop: 24, textAlign: 'center' }}>
                    <Text type="secondary">
                        <Tooltip title="The formula used to calculate retention rates. Retained participants are those who attended in both the previous and current periods, divided by the total who attended in the previous period.">
                            <Space>
                                Retention Rate = (Retained Participants / Previous Participants) × 100
                                <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 12 }} />
                            </Space>
                        </Tooltip>
                    </Text>
                </div>
            </div>
        );
    };