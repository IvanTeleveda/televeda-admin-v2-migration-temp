import React, { useState, useMemo } from 'react';
import { Card, Empty } from '@pankod/refine-antd';
import { CrownOutlined, UserOutlined, EyeOutlined, InteractionOutlined } from '@ant-design/icons';
import { useCustom } from '@refinedev/core';
import * as moment from 'moment-timezone';
import {SponsorMemberEvents} from "../../../components/analytics/charts/sponsorEventsCharts/sponsorMemberEvents";
import {SponsorEventsCharts} from "../../../components/analytics/charts/sponsorEventsCharts";
import {UnifiedAnalyticsView} from "../../../components/analytics/unified/UnifiedAnalyticsView";

interface SponsorAnalyticsTabProps {
    communityIds: any;
    dateRange: any;
    apiUrl: string;
    sponsorData?: any;
}

const SponsorAnalyticsTab: React.FC<SponsorAnalyticsTabProps> = ({
    communityIds,
    dateRange,
    apiUrl,
    sponsorData
}) => {
    // Unified filter state
    const [selectedSponsorId, setSelectedSponsorId] = useState<string | undefined>(undefined);
    const [hideZeroValues, setHideZeroValues] = useState(false);

    const tz = useMemo(() => moment.tz.guess(), []);

    // API query for summary data - only when sponsor is selected
    const summaryQuery = useMemo(() => {
        if (!dateRange || !communityIds || !selectedSponsorId) return null;
        return {
            start: dateRange[0].startOf('day').toISOString(),
            end: dateRange[1].endOf('day').toISOString(),
            timezone: tz,
            communityIds,
            sponsorId: selectedSponsorId
        };
    }, [dateRange, communityIds, selectedSponsorId, tz]);

    // Fetch summary data - only when sponsor is selected
    const { data: summaryData, isLoading: summaryLoading } = useCustom<{
        sponsorEvents: any[];
        sponsorEventsPeriod: number;
        sponsorEventsToDate: number;
        pageVisits: any[];
        pageVisitsPeriod: number;
        pageVisitsToDate: number;
        totalMemberActions: number;
        uniqueMembers: number;
    }>({
        url: `${apiUrl}/analytics/sponsorEvents`,
        method: "get",
        config: { query: summaryQuery },
        queryOptions: {
            enabled: !!summaryQuery && !!selectedSponsorId, // Only fetch when sponsor is selected
        }
    });

    // Tab filters configuration
    const tabFilters = [
        {
            key: 'sponsor',
            label: selectedSponsorId ? 'Sponsor' : 'Select Sponsor (Required)',
            type: 'select' as const,
            options: sponsorData?.data?.map((sponsor: any) => ({
                value: sponsor.id,
                label: sponsor.name
            })) || [],
            defaultValue: selectedSponsorId,
            onChange: (value: string) => setSelectedSponsorId(value)
        },
        {
            key: 'hideZero',
            label: 'Hide Zero Values',
            type: 'toggle' as const,
            defaultValue: hideZeroValues,
            onChange: (value: boolean) => setHideZeroValues(value)
        }
    ];

    // Summary statistics
    const summaryStats = useMemo(() => {
        if (!summaryData?.data) return [];

        return [
            {
                title: "Total Sponsor Events",
                value: summaryData.data.sponsorEventsPeriod || 0,
                prefix: <InteractionOutlined />,
                valueStyle: { color: '#1890ff' },
                tooltip: "Total sponsor-related events (clicks, interactions) during the selected period"
            },
            {
                title: "Page Views",
                value: summaryData.data.pageVisitsPeriod || 0,
                prefix: <EyeOutlined />,
                valueStyle: { color: '#52c41a' },
                tooltip: "Total page views with sponsor content during the selected period"
            },
            {
                title: "Unique Members",
                value: summaryData.data.uniqueMembers || 0,
                prefix: <UserOutlined />,
                valueStyle: { color: '#722ed1' },
                tooltip: "Number of unique members who interacted with sponsors"
            },
            {
                title: "Total Actions",
                value: summaryData.data.totalMemberActions || 0,
                prefix: <CrownOutlined />,
                valueStyle: { color: '#f5222d' },
                tooltip: "Total member actions related to sponsors (all event types combined)"
            }
        ];
    }, [summaryData]);

    if (!communityIds) {
        return (
            <Card style={{ textAlign: 'center', padding: 40 }}>
                <Empty
                    description="Select a community to view sponsor analytics"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            </Card>
        );
    }

    if (!sponsorData?.data) {
        return (
            <Card style={{ textAlign: 'center', padding: 40 }}>
                <Empty
                    description="No sponsor data available"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            </Card>
        );
    }

    return (
        <UnifiedAnalyticsView
            title="Sponsor Analytics"
            tooltip="Track sponsor event interactions, page views, and member actions across communities"
            icon={<CrownOutlined />}
            summaryStats={summaryStats}
            isLoading={summaryLoading}
            tabFilters={tabFilters}
            tableComponent={
                <SponsorMemberEvents
                    sponsorData={sponsorData}
                    dateRange={dateRange}
                    communityIds={communityIds}
                    sponsorId={selectedSponsorId}
                    hideFilters={true} // Hide individual filters since we have unified ones
                />
            }
            chartComponent={
                <SponsorEventsCharts
                    sponsorData={sponsorData} 
                    apiUrl={apiUrl}
                    dateRange={dateRange}
                    communityIds={communityIds}
                    sponsorId={selectedSponsorId}
                    hideZeroValues={hideZeroValues}
                    hideFilters={true} // Hide individual filters since we have unified ones
                />
            }
        />
    );
};

export default SponsorAnalyticsTab;