import React, { useMemo, useState } from "react";
import { Card, Empty } from "@pankod/refine-antd";
import { FolderOpenOutlined } from '@ant-design/icons';
import { useCustom } from '@refinedev/core';
import moment from 'moment';
import ResourceList from "../resource-list";
import { CollectionItemEvent, CommunityEventsCharts } from "../../../components/analytics/charts/communityEventsChart";
import { UnifiedAnalyticsView } from "../../../components/analytics/unified/UnifiedAnalyticsView";
import { AnalyticsGroupType } from "../../analytics";

const ResourceAnalyticsTab: React.FC<{
    communityIds: any;
    dateRange: any;
    apiUrl: string;
    sponsorData?: any;
}> = ({ communityIds, dateRange, apiUrl, sponsorData }) => {
    const [eventsHideZero, setEventsHideZero] = useState(false);
    const [groupBy, setGroupBy] = useState<AnalyticsGroupType>(AnalyticsGroupType.DAY);

    // Always show both resource interactions and page views since we removed the filter
    const eventsShowResourceInteractions = true;
    const eventsShowPageViews = true;

    const timezone = useMemo(() => moment.tz.guess(), []);

    // Create query parameters
    const createQuery = (groupByParam: AnalyticsGroupType, additionalParams: any = {}) => ({
        start: dateRange?.[0]?.startOf('day').toISOString(),
        end: dateRange?.[1]?.endOf('day').toISOString(),
        timezone,
        communityIds,
        groupBy: groupByParam,
        ...additionalParams
    });

    const { data: eventsData, isLoading: eventsLoading } = useCustom<{
        collectionItemsEvents: CollectionItemEvent[];
        sponsorEventsPeriod: number;
        sponsorEventsToDate: number;
        pageVisits: CollectionItemEvent[];
        pageVisitsPeriod: number;
        pageVisitsToDate: number;
    }>({
        url: `${apiUrl}/analytics/collectionItemsEvents`,
        method: "get",
        config: { query: createQuery(groupBy, { hideZero: eventsHideZero }) },
        queryOptions: { enabled: !!dateRange?.[0] && !!communityIds }
    });

    // Calculate events summary metrics
    const eventsSummary = useMemo(() => {
        if (!eventsData?.data) return null;

        const resourcePeriod = eventsData.data.sponsorEventsPeriod || 0;
        const resourceTotal = eventsData.data.sponsorEventsToDate || 0;
        const pagePeriod = eventsData.data.pageVisitsPeriod || 0;
        const pageTotal = eventsData.data.pageVisitsToDate || 0;

        // Calculate active dates from the events data
        const activeDates = new Set();
        if (eventsData.data.collectionItemsEvents) {
            eventsData.data.collectionItemsEvents.forEach((item: any) => {
                if (item.event_count > 0) activeDates.add(item.event_date);
            });
        }
        if (eventsData.data.pageVisits) {
            eventsData.data.pageVisits.forEach((item: any) => {
                if (item.event_count > 0) activeDates.add(item.event_date);
            });
        }

        return {
            resourcePeriod,
            resourceTotal,
            pagePeriod,
            pageTotal,
            totalEvents: resourcePeriod + pagePeriod,
            totalEventsAllTime: resourceTotal + pageTotal,
            activeDates: activeDates.size
        };
    }, [eventsData]);

    if (!communityIds) {
        return (
            <Card style={{ textAlign: 'center', padding: 40 }}>
                <Empty
                    description="Select a community to view resource analytics"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            </Card>
        );
    }

    return (
        <UnifiedAnalyticsView
            title="Resource Analytics"
            tooltip="Shows resource interactions and usage metrics for the selected communities and time period"
            icon={<FolderOpenOutlined />}
            isLoading={eventsLoading}
            hideViewSwitcher={false}
            tabFilters={[
                {
                    key: 'groupBy',
                    label: 'Group By',
                    type: 'select',
                    options: [
                        { value: AnalyticsGroupType.DAY, label: 'Day' },
                        { value: AnalyticsGroupType.WEEK, label: 'Week' },
                        { value: AnalyticsGroupType.MONTH, label: 'Month' },
                        { value: AnalyticsGroupType.QUARTER, label: 'Quarter' }
                    ],
                    defaultValue: groupBy,
                    onChange: (value: AnalyticsGroupType) => {
                        setGroupBy(value);
                    }
                },
                {
                    key: 'hideZero',
                    label: 'Hide Zero Values',
                    type: 'toggle',
                    defaultValue: eventsHideZero,
                    onChange: setEventsHideZero
                }
            ]}
            summaryStats={[
                {
                    title: 'Resource Interactions',
                    value: eventsSummary?.resourcePeriod || 0,
                    suffix: `/ ${eventsSummary?.resourceTotal || 0} total`,
                    tooltip: `Resource interactions during the selected date range compared to all-time total since community creation`
                },
                {
                    title: 'Page Views',
                    value: eventsSummary?.pagePeriod || 0,
                    suffix: `/ ${eventsSummary?.pageTotal || 0} total`,
                    tooltip: `Page views during the selected date range compared to all-time total since community creation`
                },
                {
                    title: 'Total Events',
                    value: eventsSummary?.totalEvents || 0,
                    suffix: `/ ${eventsSummary?.totalEventsAllTime || 0} total`,
                    tooltip: 'Combined resource interactions and page views for the selected period compared to all-time totals. This represents overall community engagement activity.'
                },
                {
                    title: 'Active Dates',
                    value: eventsSummary?.activeDates || 0,
                    suffix: `of ${Math.ceil(dateRange?.[1]?.diff(dateRange?.[0], 'days') + 1 || 0)} days`,
                    tooltip: 'Number of unique dates with recorded events in the selected period. Shows community activity distribution - higher numbers indicate more consistent daily engagement.'
                }
            ]}
            tableComponent={
                <ResourceList
                    communityIds={communityIds}
                    dateRange={dateRange}
                    showResourceInteractions={eventsShowResourceInteractions}
                    showPageViews={eventsShowPageViews}
                    hideZero={eventsHideZero}
                />
            }
            chartComponent={
                <CommunityEventsCharts
                    sponsorData={sponsorData}
                    communityIds={communityIds}
                    dateRange={dateRange}
                    apiUrl={apiUrl}
                    showResourceInteractions={eventsShowResourceInteractions}
                    showPageViews={eventsShowPageViews}
                    groupBy={groupBy}
                    enableFetching={false}
                    isLoading={eventsLoading}
                    passedData={eventsData}
                />
            }
        />
    );
};

export default ResourceAnalyticsTab;