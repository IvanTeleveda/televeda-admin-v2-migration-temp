import React, {useContext, useMemo, useState} from "react";
import {Table, Typography, Space, Tooltip, Card, Row, Col, Statistic, Checkbox, Form} from "antd";
import {useCustom} from "@refinedev/core";
import {InfoCircleOutlined} from '@ant-design/icons';
import moment from "moment";
import {ColorModeContext} from "../../../../contexts/color-mode";
import {Switch} from "@pankod/refine-antd";
import {AnalyticsTableProps, EventsAnalyticsData, EventsTableDataItem } from "../../analytics-types";

const {Text} = Typography;

export const EventsAnalyticsTable: React.FC<AnalyticsTableProps & {
    hideZero?: boolean;
    showResourceInteractions?: boolean;
    showPageViews?: boolean;
}> = ({
    communityIds,
    dateRange,
    apiUrl,
    hideZero = true,
    showResourceInteractions = true,
    showPageViews = true
}) => {
    const {mode} = useContext(ColorModeContext);
    const hideZeroValues = hideZero;

    const timezone = useMemo(() => moment.tz.guess(), []);

    const query = useMemo(() => ({
        start: dateRange[0].startOf('day').toISOString(),
        end: dateRange[1].endOf('day').toISOString(),
        timezone,
        communityIds
    }), [communityIds, dateRange, timezone]);

    const url = `${apiUrl}/analytics/collectionItemsEvents`;
    const {data, isLoading} = useCustom<EventsAnalyticsData>({
        url,
        method: "get",
        config: {query}
    });

    const formatDate = (date: string) => moment(date).format("MMM DD, YYYY");

    const totals = useMemo(() => {
        return {
            resourcePeriod: data?.data?.sponsorEventsPeriod || 0,
            resourceTotal: data?.data?.sponsorEventsToDate || 0,
            pagePeriod: data?.data?.pageVisitsPeriod || 0,
            pageTotal: data?.data?.pageVisitsToDate || 0
        };
    }, [data]);

    const resourceData = useMemo(() => {
        if (!data?.data?.collectionItemsEvents) return [];

        return data.data.collectionItemsEvents.map((item, index) => ({
            key: `${item.event_date}-resource-${index}`,
            date: formatDate(item.event_date),
            eventType: "Resource Interaction",
            count: item.event_count,
            description: "Viewed or downloaded community resource",
            rawDate: item.event_date
        }));
    }, [data]);

    const pageViewData = useMemo(() => {
        if (!data?.data?.pageVisits) return [];

        return data.data.pageVisits.map((item, index) => ({
            key: `${item.event_date}-page-${index}`,
            date: formatDate(item.event_date),
            eventType: "Page View",
            count: item.event_count,
            description: "Viewed community page",
            rawDate: item.event_date
        }));
    }, [data]);

    const tableData = useMemo(() => {
        let combined: EventsTableDataItem[] = [];

        if (showResourceInteractions) combined = [...combined, ...resourceData];
        if (showPageViews) combined = [...combined, ...pageViewData];

        if (hideZeroValues) {
            combined = combined.filter((item: EventsTableDataItem) => item.count > 0);
        }

        return combined;
    }, [resourceData, pageViewData, showResourceInteractions, showPageViews, hideZeroValues]);

    const columns = [
        {
            title: "Date",
            dataIndex: "date",
            key: "date",
            sorter: (a: EventsTableDataItem, b: EventsTableDataItem) =>
                new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime(),
        },
        {
            title: "Event Type",
            dataIndex: "eventType",
            key: "eventType",
            render: (text: string, record: EventsTableDataItem) => (
                <Tooltip title={record.description}>
                    <Text>{text}</Text>
                </Tooltip>
            )
        },
        {
            title: "Count",
            dataIndex: "count",
            key: "count",
            align: 'center' as const,
        }
    ];

    return (
        <div style={{padding: '0 24px'}}>
            {/* Summary now handled by UnifiedAnalyticsView */}

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16
            }}>
                <Space direction="vertical" size={0}>
                    <Text strong style={{fontSize: 18}}>
                        Community Events Analytics
                        <Tooltip
                            title="Tracks community resource interactions and page views"
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
                        Showing {tableData.length} events
                    </Text>
                </Space>

                {/* Individual filters removed - now controlled by tab-level filters */}
            </div>

            <Table
                columns={columns}
                dataSource={tableData}
                loading={isLoading}
                pagination={false}
                scroll={{x: true}}
                rowKey="key"
                locale={{
                    emptyText: hideZeroValues
                        ? "No events with counts greater than zero"
                        : "No events found for selected filters"
                }}
            />

            <div style={{marginTop: 24}}>
                <Card title="Event Descriptions" size="small">
                    <Space direction="vertical">
                        <div>
                            <Text strong>Resource Interaction:</Text>
                            <Text> Occurs when a member views or downloads a community resource</Text>
                        </div>
                        <div>
                            <Text strong>Page View:</Text>
                            <Text> Occurs when a member views the community page</Text>
                        </div>
                    </Space>
                </Card>
            </div>
        </div>
    );
};