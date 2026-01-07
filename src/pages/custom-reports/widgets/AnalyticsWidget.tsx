import React from 'react';
import { Card, Empty, Space, Typography, Tooltip, Tabs } from 'antd';
import { AnalyticsWidgetConfig, AnalyticsType, AnalyticsDisplayFormat, ReportFilters } from '../types';
import { LineChartOutlined, TableOutlined, UserAddOutlined, BellOutlined, TeamOutlined, ScheduleOutlined, VideoCameraAddOutlined } from '@ant-design/icons';

import { NewRegistrationsTable } from "../../../components/analytics/tables/registrationAnalyticsTable";
import { RemindersAnalyticsTable } from "../../../components/analytics/tables/remindersAnalyticsTable";
import { AttendanceAnalyticsTable } from "../../../components/analytics/tables/attendanceAnalyticsTable";
import { RetentionAnalyticsTable } from "../../../components/analytics/tables/retentionAnalyticsTable";
import { EventsAnalyticsTable } from "../../../components/analytics/tables/eventsAnalyticsTable";
import { PageTimeAnalyticsTable } from "../../../components/analytics/tables/pageTimeAnalyticsTable";
import { OnDemandAnalyticsTable } from "../../../components/analytics/tables/onDemandAnalyticsTable";
import { VTCTimeAnalyticsTable } from "../../../components/analytics/tables/VTCTimeAnalyticsTable";

import { ReminderChart } from "../../../components/analytics/charts/remindersChart";
import { NewRegistrationsChart } from "../../../components/analytics/charts/newRegistrationChart";
import { AttendanceChart } from "../../../components/analytics/charts/attendanceChart";
import { RetentionChart } from "../../../components/analytics/charts/retentionChart";
import { CommunityEventsCharts } from "../../../components/analytics/charts/communityEventsChart";
import { PageTimeSpentChart } from "../../../components/analytics/charts/pageTimeSpentChart";
import { TimeSpentOnDemandClassScheduleChart } from "../../../components/analytics/charts/timeSpentOnDemandClassScheduleChart";
import { TimeSpentVTCChart } from "../../../components/analytics/charts/timeSpentVTCChart";
import { useApiUrl, useCustom } from '@refinedev/core';
import moment from 'moment';
import dayjs from 'dayjs';
import { ICommunitySponsors } from '../../../interfaces';


const { Text, Title } = Typography;

interface AnalyticsWidgetProps {
    widgetConfig: AnalyticsWidgetConfig;
    isPreviewMode: boolean;
    reportFilters: ReportFilters;
    isExporting?: boolean;
}

export const analyticsTypeDetails: Record<AnalyticsType, { title: string; icon: React.ReactNode }> = {
    [AnalyticsType.REGISTRATIONS]: { title: "Registrations", icon: <UserAddOutlined /> },
    [AnalyticsType.REMINDERS]: { title: "Reminders", icon: <BellOutlined /> },
    [AnalyticsType.ATTENDANCE]: { title: "Attendance", icon: <TeamOutlined /> },
    [AnalyticsType.RETENTION]: { title: "Retention", icon: <ScheduleOutlined /> },
    [AnalyticsType.EVENTS]: { title: "Community Events", icon: <VideoCameraAddOutlined /> },
    [AnalyticsType.PAGE_TIME]: { title: "Page Time", icon: <LineChartOutlined /> },
    [AnalyticsType.ON_DEMAND]: { title: "On-Demand Usage", icon: <LineChartOutlined /> },
    [AnalyticsType.VTC]: { title: "VTC Usage", icon: <LineChartOutlined /> },
};

const AnalyticsWidget: React.FC<AnalyticsWidgetProps> = ({
    widgetConfig,
    isPreviewMode,
    reportFilters,
    isExporting
}) => {
    const apiUrl = useApiUrl();

    const { data: sponsorData } = useCustom<ICommunitySponsors>({
        url: `${apiUrl}/community-sponsors/get-user-sponsors`,
        method: "get"
    });

    const { analyticsType, displayFormat } = widgetConfig;
    const { communityIds, startDate, endDate } = reportFilters;

    const dateRangeForComponents: [moment.Moment, moment.Moment] | undefined = (startDate && endDate) ? [moment(startDate), moment(endDate)] : undefined;

    const renderTable = () => {
        if (!communityIds || communityIds.length === 0) {
            if (analyticsType !== AnalyticsType.REMINDERS) { // Reminders table might not need communityId
                return <Card size="small" style={{ textAlign: 'center' }}><Empty description="Select a community in global filters" image={Empty.PRESENTED_IMAGE_SIMPLE} /></Card>;
            }
        }

        if (!dateRangeForComponents) {
            return <Card size="small" style={{ textAlign: 'center' }}><Empty description="Select a date range in global filters" image={Empty.PRESENTED_IMAGE_SIMPLE} /></Card>;
        }

        if (!communityIds || communityIds.length === 0) {
            return <Card size="small" style={{ textAlign: 'center' }}><Empty description="Select commuinty in global filters" image={Empty.PRESENTED_IMAGE_SIMPLE} /></Card>;
        }


        switch (analyticsType) {
            case AnalyticsType.REGISTRATIONS:
                return <NewRegistrationsTable communityIds={communityIds} dateRange={dateRangeForComponents} apiUrl={apiUrl} />;
            case AnalyticsType.REMINDERS:
                return <RemindersAnalyticsTable communityIds={communityIds} dateRange={dateRangeForComponents} apiUrl={apiUrl} />;
            case AnalyticsType.ATTENDANCE:
                return <AttendanceAnalyticsTable communityIds={communityIds} dateRange={dateRangeForComponents} apiUrl={apiUrl} />;
            case AnalyticsType.RETENTION:
                return <RetentionAnalyticsTable communityIds={communityIds} dateRange={dateRangeForComponents} apiUrl={apiUrl} />;
            case AnalyticsType.EVENTS:
                return <EventsAnalyticsTable communityIds={communityIds} dateRange={dateRangeForComponents} apiUrl={apiUrl} />;
            case AnalyticsType.PAGE_TIME:
                return <PageTimeAnalyticsTable communityIds={communityIds} dateRange={dateRangeForComponents} apiUrl={apiUrl} />;
            case AnalyticsType.ON_DEMAND:
                return <OnDemandAnalyticsTable communityIds={communityIds} dateRange={dateRangeForComponents} apiUrl={apiUrl} />;
            case AnalyticsType.VTC:
                return <VTCTimeAnalyticsTable communityIds={communityIds} dateRange={[dayjs(dateRangeForComponents[0].toISOString()), dayjs(dateRangeForComponents[1].toISOString())]} apiUrl={apiUrl} />;
            default:
                return <Text type="danger">Unknown analytics table type</Text>;
        }
    };

    const renderChart = () => {
        if (!communityIds || communityIds.length === 0) {
            return <Card size="small" style={{ textAlign: 'center' }}><Empty description="Select a community in global filters" image={Empty.PRESENTED_IMAGE_SIMPLE} /></Card>;
        }
        if (!dateRangeForComponents) {
            return <Card size="small" style={{ textAlign: 'center' }}><Empty description="Select a date range in global filters" image={Empty.PRESENTED_IMAGE_SIMPLE} /></Card>;
        }

        const dateRangeForCharts: [dayjs.Dayjs, dayjs.Dayjs] = [dayjs(dateRangeForComponents[0].toISOString()), dayjs(dateRangeForComponents[1].toISOString())];

        switch (analyticsType) {
            case AnalyticsType.REGISTRATIONS:
                return <NewRegistrationsChart communityIds={communityIds} dateRange={dateRangeForCharts} apiUrl={apiUrl} />;
            case AnalyticsType.REMINDERS:
                return <ReminderChart communityIds={communityIds} dateRange={dateRangeForCharts} apiUrl={apiUrl} />;
            case AnalyticsType.ATTENDANCE:
                return <AttendanceChart communityIds={communityIds} dateRange={dateRangeForCharts} apiUrl={apiUrl} />;
            case AnalyticsType.RETENTION:
                return <RetentionChart communityIds={communityIds} apiUrl={apiUrl} dateRange={dateRangeForCharts} />;
            case AnalyticsType.EVENTS:
                return <CommunityEventsCharts communityIds={communityIds} dateRange={dateRangeForCharts} apiUrl={apiUrl} sponsorData={sponsorData} />;
            case AnalyticsType.PAGE_TIME:
                return <PageTimeSpentChart communityIds={communityIds} dateRange={dateRangeForCharts} apiUrl={apiUrl} />;
            case AnalyticsType.ON_DEMAND:
                return <TimeSpentOnDemandClassScheduleChart communityIds={communityIds} dateRange={dateRangeForCharts} apiUrl={apiUrl} />;
            case AnalyticsType.VTC:
                return <TimeSpentVTCChart communityIds={communityIds} dateRange={dateRangeForCharts} apiUrl={apiUrl} />;
            default:
                return <Text type="danger">Unknown analytics chart type</Text>;
        }
    };

    if (!isPreviewMode && !widgetConfig.i.startsWith('temp-')) { // Edit mode placeholder
        return (
            <Card title={`Analytics: ${analyticsTypeDetails[analyticsType]?.title || analyticsType}`} size="small" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Text type="secondary">Type: </Text>
                <Text code>{analyticsTypeDetails[analyticsType]?.title || "Not Set"}</Text>
                <br />
                <Text type="secondary">Format: </Text>
                <Text code>{displayFormat.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Text>
                <br />
                <Text type="secondary" style={{ fontStyle: 'italic', marginTop: 8 }}>(Data loads in Preview Mode)</Text>
            </Card>
        );
    }

    if (isExporting) {
        const showTable = displayFormat === AnalyticsDisplayFormat.TABLE_ONLY || displayFormat === AnalyticsDisplayFormat.BOTH;
        const showChart = displayFormat === AnalyticsDisplayFormat.CHART_ONLY || displayFormat === AnalyticsDisplayFormat.BOTH;
        const typeTitle = analyticsTypeDetails[analyticsType]?.title || analyticsType;

        return (
            <div className="analytics-widget-export-content" style={{ padding: '5mm' }}>
                {/* Main title for this widget's section in the PDF */}
                <Title level={4} className="widget-title-export" style={{ marginBottom: '5mm', borderBottom: '1px solid #eee', paddingBottom: '2mm' }}>
                    Analytics: {typeTitle}
                </Title>

                {showChart && (
                    <div className="analytics-chart-section-export print-section" style={{ marginBottom: '8mm' }}>
                        <Title level={5} className="analytics-subtitle-export" style={{ fontStyle: 'italic', color: '#555' }}>Chart View</Title>
                        {/* Render the chart directly. Ensure chart components are styled for print if needed. */}
                        {/* Charts might need specific width/height passed, or rely on container. */}
                        <div style={{ border: '1px solid #f0f0f0', padding: '5px' }}>
                            {renderChart()}
                        </div>
                    </div>
                )}

                {showTable && (
                    <div className="analytics-table-section-export print-section">
                        <Title level={5} className="analytics-subtitle-export" style={{ fontStyle: 'italic', color: '#555', marginTop: showChart ? '8mm' : '0' }}>Table View</Title>
                        {/* Render the table directly. Ensure table components are styled for print. */}
                        {/* The table wrapper inside FeedbackTableWidget had width:fit-content for full capture. */}
                        {/* We might need a similar wrapper here if the table component itself doesn't expand. */}
                        <div className="table-full-width-capture-wrapper" style={{ width: 'fit-content', minWidth: '100%' }}>
                            {renderTable()}
                        </div>
                    </div>
                )}

                {(!showChart && !showTable) && (
                    <Text type="secondary">No display format selected for this analytic.</Text>
                )}
            </div>
        );
    }


    // Preview Mode Rendering
    const showTable = displayFormat === AnalyticsDisplayFormat.TABLE_ONLY || displayFormat === AnalyticsDisplayFormat.BOTH;
    const showChart = displayFormat === AnalyticsDisplayFormat.CHART_ONLY || displayFormat === AnalyticsDisplayFormat.BOTH;
    const typeTitle = analyticsTypeDetails[analyticsType]?.title || analyticsType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

    // For "BOTH" display, use Tabs or simple sequential rendering
    if (displayFormat === AnalyticsDisplayFormat.BOTH) {
        return (
            <Card title={`Analytics: ${typeTitle}`} size="small">
                <Tabs defaultActiveKey="chart" type="line" size="small">
                    <Tabs.TabPane tab={<span><LineChartOutlined /> Chart</span>} key="chart">
                        <div>
                            {renderChart()}
                        </div>
                    </Tabs.TabPane>
                    <Tabs.TabPane tab={<span><TableOutlined /> Table</span>} key="table">
                        <div>
                            {renderTable()}
                        </div>
                    </Tabs.TabPane>
                </Tabs>
            </Card>
        );
    }

    return (
        <Card title={`Analytics: ${typeTitle} (${showTable ? 'Table' : 'Chart'})`} size="small" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flexGrow: 1, overflowY: 'auto', padding: '10px' }}>
                {showChart && renderChart()}
                {showTable && renderTable()}
            </div>
        </Card>
    );
};

export default AnalyticsWidget;