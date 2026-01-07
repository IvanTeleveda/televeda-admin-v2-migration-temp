import React from "react";
import { Card, Empty } from "@pankod/refine-antd";
import { FolderOpenOutlined } from '@ant-design/icons';
import ResourceList from "../resource-list";
import { CommunityEventsCharts } from "../../../components/analytics/charts/communityEventsChart";
import { UnifiedAnalyticsView } from "../../../components/analytics/unified/UnifiedAnalyticsView";

const ResourceAnalyticsTab: React.FC<{
    communityIds: any;
    dateRange: any;
    apiUrl: string;
    sponsorData?: any;
    globalGroupBy?: any;
}> = ({ communityIds, dateRange, apiUrl, sponsorData, globalGroupBy }) => {
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
            tooltip="Community resource interactions and usage metrics"
            icon={<FolderOpenOutlined />}
            tableComponent={
                <ResourceList 
                    communityIds={communityIds}
                    dateRange={dateRange}
                    apiUrl={apiUrl}
                />
            }
            chartComponent={
                <CommunityEventsCharts
                    sponsorData={sponsorData}
                    communityIds={communityIds}
                    dateRange={dateRange}
                    apiUrl={apiUrl}
                />
            }
        />
    );
};

export default ResourceAnalyticsTab;