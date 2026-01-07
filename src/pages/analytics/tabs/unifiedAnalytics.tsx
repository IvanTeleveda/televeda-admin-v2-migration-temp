import React, { useMemo, useState } from 'react';
import { Space, Tabs, Empty, Card, Typography } from '@pankod/refine-antd';
import {
    BellOutlined,
    ClockCircleOutlined,
    LineChartOutlined,
    ScheduleOutlined,
    TeamOutlined,
    UserAddOutlined,
    VideoCameraAddOutlined,
    BarChartOutlined,
    CalendarOutlined,
    TrophyOutlined,
    RiseOutlined
} from '@ant-design/icons';
import { useCustom } from '@refinedev/core';
import moment from 'moment';

// Table components
import { NewRegistrationsTable } from '../../../components/analytics/tables/registrationAnalyticsTable';
import { RemindersAnalyticsTable } from '../../../components/analytics/tables/remindersAnalyticsTable';
import { AttendanceAnalyticsTable } from '../../../components/analytics/tables/attendanceAnalyticsTable';
import { RetentionAnalyticsTable } from '../../../components/analytics/tables/retentionAnalyticsTable';
import { EventsAnalyticsTable } from '../../../components/analytics/tables/eventsAnalyticsTable';
import { PageTimeAnalyticsTable } from '../../../components/analytics/tables/pageTimeAnalyticsTable';
import { OnDemandAnalyticsTable } from '../../../components/analytics/tables/onDemandAnalyticsTable';
import { VTCTimeAnalyticsTable } from '../../../components/analytics/tables/VTCTimeAnalyticsTable';

// Chart components
import { ReminderChart } from '../../../components/analytics/charts/remindersChart';
import { NewRegistrationsChart } from '../../../components/analytics/charts/newRegistrationChart';
import { AttendanceChart } from '../../../components/analytics/charts/attendanceChart';
import { RetentionChart } from '../../../components/analytics/charts/retentionChart';
import { CommunityEventsCharts } from '../../../components/analytics/charts/communityEventsChart';
import { PageTimeSpentChart } from '../../../components/analytics/charts/pageTimeSpentChart';
import { TimeSpentOnDemandClassScheduleChart } from '../../../components/analytics/charts/timeSpentOnDemandClassScheduleChart';
import { TimeSpentVTCChart } from '../../../components/analytics/charts/timeSpentVTCChart';

// Unified view component
import { UnifiedAnalyticsView, ViewMode } from '../../../components/analytics/unified/UnifiedAnalyticsView';
import { AnalyticsGroupType } from '../../../pages/analytics';

// Utility function to format time values
const formatTime = (minutes: number): string => {
    if (minutes < 1) {
        return `${Math.round(minutes * 60)}s`;
    } else if (minutes < 60) {
        return `${Math.round(minutes)}m`;
    } else {
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
};

interface UnifiedAnalyticsProps {
    communityIds: any;
    dateRange: any;
    apiUrl: string;
    sponsorData?: any;
}

const UnifiedAnalytics: React.FC<UnifiedAnalyticsProps> = ({ 
    communityIds, 
    dateRange, 
    apiUrl, 
    sponsorData
}) => {
    // Tab-specific filter states
    const [registrationGroupBy, setRegistrationGroupBy] = useState<AnalyticsGroupType>(AnalyticsGroupType.WEEK);
    const [registrationHideZero, setRegistrationHideZero] = useState(false);
    
    const [reminderGroupBy, setReminderGroupBy] = useState<AnalyticsGroupType>(AnalyticsGroupType.DAY);
    const [reminderMemberAggregate, setReminderMemberAggregate] = useState(false);
    const [reminderHideZero, setReminderHideZero] = useState(false);
    
    const [attendanceGroupBy, setAttendanceGroupBy] = useState<AnalyticsGroupType>(AnalyticsGroupType.DAY);
    const [attendanceViewMode, setAttendanceViewMode] = useState<'all' | 'selected' | 'other'>('all');
    const [attendanceHideZero, setAttendanceHideZero] = useState(true);
    
    const [retentionGroupBy, setRetentionGroupBy] = useState<AnalyticsGroupType>(AnalyticsGroupType.MONTH);
    const [retentionMinParticipants, setRetentionMinParticipants] = useState(1);
    
    const [eventsHideZero, setEventsHideZero] = useState(false);
    const [eventsShowResourceInteractions, setEventsShowResourceInteractions] = useState(true);
    const [eventsShowPageViews, setEventsShowPageViews] = useState(true);
    
    const [pageTimeGroupBy, setPageTimeGroupBy] = useState<AnalyticsGroupType>(AnalyticsGroupType.DAY);
    const [pageTimeUserEmail, setPageTimeUserEmail] = useState('');
    
    const [streamingGroupBy, setStreamingGroupBy] = useState<AnalyticsGroupType>(AnalyticsGroupType.DAY);
    const [streamingUserEmail, setStreamingUserEmail] = useState('');
    
    const [vtcGroupBy, setVtcGroupBy] = useState<AnalyticsGroupType>(AnalyticsGroupType.DAY);
    const [vtcUserEmail, setVtcUserEmail] = useState('');

    const timezone = useMemo(() => moment.tz.guess(), []);

    // Create separate query parameters for each analytics type
    const createQuery = (groupBy: AnalyticsGroupType, additionalParams: any = {}) => ({
        start: dateRange?.[0]?.startOf('day').toISOString(),
        end: dateRange?.[1]?.endOf('day').toISOString(),
        timezone,
        communityIds,
        groupBy,
        ...additionalParams
    });

    // Fetch summary data for different analytics types using tab-specific queries
    const { data: registrationData, isLoading: registrationLoading } = useCustom({
        url: `${apiUrl}/analytics/registeredMembers`,
        method: "get",
        config: { query: createQuery(registrationGroupBy, { hideZero: registrationHideZero }) },
        queryOptions: { enabled: !!dateRange?.[0] && !!communityIds }
    });

    const { data: reminderData, isLoading: reminderLoading } = useCustom({
        url: `${apiUrl}/analytics/reminders`,
        method: "get",
        config: { query: createQuery(reminderGroupBy, { memberAggregate: reminderMemberAggregate, hideZero: reminderHideZero }) },
        queryOptions: { enabled: !!dateRange?.[0] && !!communityIds }
    });

    // Calculate reminder summary metrics using the same logic as the table
    const reminderSummary = useMemo(() => {
        if (!reminderData?.data?.data?.columns) return null;

        const columnTotals: Record<string, number> = { total: 0 };
        const groupKeys = Array.from(
            new Set(
                reminderData.data.data.columns
                    .map((item: any) => item.group_key)
                    .filter(Boolean)
            )
        ) as string[];

        // Calculate totals by reminder type
        reminderData.data.data.columns.forEach((item: any) => {
            const type = item.group_key || 'other';
            columnTotals[type] = (columnTotals[type] || 0) + (item.value || 0);
            columnTotals.total += item.value || 0;
        });

        // Count unique events from pie data
        const totalEvents = reminderData.data.data.pie?.length || 0;

        // Map actual column names to summary categories using pattern matching
        let emailTotal = 0;
        let textTotal = 0;
        let calendarTotal = 0;

        // Sum up all columns that match email patterns
        Object.keys(columnTotals).forEach(key => {
            // Email patterns
            if (key.toLowerCase().includes('email') || key === 'RSVP (email)') {
                emailTotal += columnTotals[key] || 0;
            } 
            // Text patterns
            else if (key.toLowerCase().includes('text') || key === 'RSVP (text)') {
                textTotal += columnTotals[key] || 0;
            } 
            // Calendar patterns - try all possible variations
            else if (key.toLowerCase().includes('calendar') || 
                     key === 'people_calendar' || 
                     key === 'outlook' || 
                     key === 'apple_calendar' ||
                     key.includes('apple')) {
                calendarTotal += columnTotals[key] || 0;
            }
        });

        return {
            total: columnTotals.total,
            email: emailTotal,
            text: textTotal,
            calendar: calendarTotal,
            totalEvents,
            groupKeys,
            columnTotals // Include raw data for debugging
        };
    }, [reminderData]);

    const { data: attendanceData, isLoading: attendanceLoading } = useCustom({
        url: `${apiUrl}/analytics/memberAttendance`,
        method: "get",
        config: { query: createQuery(attendanceGroupBy) },
        queryOptions: { enabled: !!dateRange?.[0] && !!communityIds }
    });

    // Calculate attendance summary metrics using the same logic as the table
    const attendanceSummary = useMemo(() => {
        if (!attendanceData?.data?.data) return null;

        const groupedByDate: Record<string, {
            date: string;
            selected: number;
            other: number;
            total: number;
        }> = {};

        attendanceData.data.data.forEach((item: any) => {
            if (!groupedByDate[item.date]) {
                groupedByDate[item.date] = {
                    date: item.date,
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

        // Format dates based on groupBy type
        const getDateFormat = (value: string) => {
            switch(attendanceGroupBy) {
                case AnalyticsGroupType.WEEK:
                    return `${moment(value).format('MMM Do')} - ${moment(value).add(6, 'days').format('Do')}`;
                case AnalyticsGroupType.MONTH:
                    return moment(value).format('YYYY, MMMM');
                case AnalyticsGroupType.QUARTER:
                    return moment(value).format('YYYY [Q]Q');
                default:
                    return moment(value).format('MMM DD, YYYY');
            }
        };

        const tableData = Object.values(groupedByDate).map(item => ({
            ...item,
            formattedDate: getDateFormat(item.date)
        }));

        let selectedTotal = 0;
        let otherTotal = 0;
        let overallTotal = 0;
        let maxAttendance = 0;
        let maxAttendanceDate = "";
        let periodsWithAttendance = 0;

        tableData.forEach(item => {
            selectedTotal += item.selected;
            otherTotal += item.other;
            overallTotal += item.total;

            if (item.total > 0) periodsWithAttendance++;

            if (item.total > maxAttendance) {
                maxAttendance = item.total;
                maxAttendanceDate = item.formattedDate;
            }
        });

        // Calculate total periods based on groupBy type
        const getTotalPeriods = () => {
            if (!dateRange?.[0] || !dateRange?.[1]) return 0;
            const start = dateRange[0];
            const end = dateRange[1];
            
            switch(attendanceGroupBy) {
                case AnalyticsGroupType.WEEK:
                    return Math.ceil(end.diff(start, 'weeks', true)) + 1;
                case AnalyticsGroupType.MONTH:
                    return Math.ceil(end.diff(start, 'months', true)) + 1;
                case AnalyticsGroupType.QUARTER:
                    return Math.ceil(end.diff(start, 'quarters', true)) + 1;
                default:
                    return Math.ceil(end.diff(start, 'days') + 1);
            }
        };

        const totalPeriods = getTotalPeriods();
        const avgOverall = totalPeriods > 0 ? overallTotal / totalPeriods : 0;

        return {
            overallTotal,
            maxAttendance,
            maxAttendanceDate,
            daysWithAttendance: periodsWithAttendance,
            daysInPeriod: totalPeriods,
            avgOverall: Number.isNaN(avgOverall) ? 0 : avgOverall
        };
    }, [attendanceData, dateRange, attendanceGroupBy]);



    const { data: retentionData, isLoading: retentionLoading } = useCustom({
        url: `${apiUrl}/analytics/retention`,
        method: "get",
        config: { query: createQuery(retentionGroupBy, { minParticipants: retentionMinParticipants }) },
        queryOptions: { enabled: !!dateRange?.[0] && !!communityIds }
    });

    const { data: eventsData, isLoading: eventsLoading } = useCustom({
        url: `${apiUrl}/analytics/collectionItemsEvents`,
        method: "get",
        config: { query: createQuery(AnalyticsGroupType.DAY, { hideZero: eventsHideZero }) },
        queryOptions: { enabled: !!dateRange?.[0] && !!communityIds }
    });

    const { data: pageTimeData, isLoading: pageTimeLoading } = useCustom({
        url: `${apiUrl}/analytics/memberPageTimeMetrics`,
        method: "get",
        config: { query: createQuery(pageTimeGroupBy, { userEmail: pageTimeUserEmail }) },
        queryOptions: { enabled: !!dateRange?.[0] && !!communityIds }
    });

    const { data: streamingData, isLoading: streamingLoading } = useCustom({
        url: `${apiUrl}/analytics/memberOnDemandClassScheduleTimeMetrics`,
        method: "get",
        config: { query: createQuery(streamingGroupBy, { userEmail: streamingUserEmail }) },
        queryOptions: { enabled: !!dateRange?.[0] && !!communityIds }
    });

    const { data: vtcData, isLoading: vtcLoading } = useCustom({
        url: `${apiUrl}/analytics/memberVTCTimeMetrics`,
        method: "get",
        config: { query: createQuery(vtcGroupBy, { userEmail: vtcUserEmail }) },
        queryOptions: { enabled: !!dateRange?.[0] && !!communityIds }
    });

    // Calculate retention summary metrics using the same logic as the table
    const retentionSummary = useMemo(() => {
        if (!retentionData?.data?.data) return null;

        const groupedData: Record<string, any[]> = {};
        retentionData.data.data.forEach((item: any) => {
            if (!item.interval_date) return;
            const key = item.interval_date;
            if (!groupedData[key]) groupedData[key] = [];
            groupedData[key].push(item);
        });

        const sortedDates = Object.keys(groupedData).sort();
        
        // Helper function to format dates like the table does
        const getDateFormat = (value: string) => {
            switch(retentionGroupBy) {
                case AnalyticsGroupType.WEEK:
                    return `${moment(value).format('MMM Do')} - ${moment(value).add(6, 'days').format('Do')}`;
                case AnalyticsGroupType.MONTH:
                    return moment(value).format('YYYY, MMMM');
                default:
                    return moment(value).format('MMM Do, YYYY');
            }
        };

        let prevIntervalParticipants: any[] = [];
        const processedRetentionData: any[] = [];

        // Build retention data like the table does
        sortedDates.forEach((date, index) => {
            const currentParticipants = groupedData[date];

            const retainedParticipants = currentParticipants.filter((current: any) =>
                prevIntervalParticipants.some((prev: any) => prev.participantId === current.participantId)
            );

            processedRetentionData.push({
                interval: getDateFormat(date),
                currentParticipants: currentParticipants.length,
                prevParticipants: index === 0 ? 0 : prevIntervalParticipants.length,
                retained: retainedParticipants.length,
                retentionRate: index === 0 ? 0 :
                    Math.round((retainedParticipants.length / prevIntervalParticipants.length) * 100)
            });

            prevIntervalParticipants = currentParticipants;
        });

        if (processedRetentionData.length < 2) return null;

        // Calculate comprehensive metrics like the table does
        let totalPrevParticipants = 0;
        let totalRetained = 0;
        let totalPeriods = 0;
        let lowestRetention = 100;
        let highestRetention = 0;
        let highestGrowth = 0;
        let highestGrowthPeriod = "";
        let totalParticipants = 0;

        processedRetentionData.forEach((item, index) => {
            totalParticipants += item.currentParticipants;

            if (index > 0) {
                totalPrevParticipants += item.prevParticipants;
                totalRetained += item.retained;
                totalPeriods++;

                if (item.retentionRate < lowestRetention) {
                    lowestRetention = item.retentionRate;
                }
                if (item.retentionRate > highestRetention) {
                    highestRetention = item.retentionRate;
                }

                const growth = item.currentParticipants - item.prevParticipants;
                if (growth > highestGrowth) {
                    highestGrowth = growth;
                    highestGrowthPeriod = item.interval;
                }
            }
        });

        return {
            overallRetention: Math.round((totalRetained / totalPrevParticipants) * 100),
            averageRetention: Math.round(totalRetained / totalPrevParticipants * 100),
            totalParticipants,
            totalPeriods: processedRetentionData.length,
            lowestRetention,
            highestRetention,
            highestGrowth,
            highestGrowthPeriod
        };
    }, [retentionData, retentionGroupBy]);

    // Calculate events summary metrics using the same logic as the table
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

    // Calculate page time summary metrics using the same logic as the table
    const pageTimeSummary = useMemo(() => {
        if (!pageTimeData?.data?.data) return null;

        let totalTime = 0;
        let onDemandTime = 0;
        let classScheduleTime = 0;
        let onDemandStreamingTime = 0;

        pageTimeData.data.data.forEach((item: any) => {
            if (!item.event_date) return;
            
            totalTime += item.total_time_spent;

            // Break down by page type
            if (item.page === 'on-demand') {
                onDemandTime += item.total_time_spent;
            } else if (item.page === 'class-schedule') {
                classScheduleTime += item.total_time_spent;
            } else if (item.page === 'on-demand-streaming') {
                onDemandStreamingTime += item.total_time_spent;
            }
        });

        return {
            totalTime,
            onDemandTime,
            classScheduleTime,
            onDemandStreamingTime
        };
    }, [pageTimeData]);

    // Calculate streaming time summary metrics using the same logic as the table
    const streamingSummary = useMemo(() => {
        if (!streamingData?.data?.data) return null;

        let totalTime = 0;
        let classScheduleTime = 0;
        let onDemandTime = 0;
        let externalEventTime = 0;

        streamingData.data.data.forEach((item: any) => {
            if (!item.event_date) return;

            totalTime += item.total_time_spent;

            if (item.page === "class-schedule") {
                classScheduleTime += item.total_time_spent;
            } else if (item.page === "on-demand") {
                onDemandTime += item.total_time_spent;
            } else if (item.page === "external-event") {
                externalEventTime += item.total_time_spent;
            }
        });

        return {
            totalTime,
            classScheduleTime,
            onDemandTime,
            externalEventTime
        };
    }, [streamingData]);

    // Calculate VTC summary metrics using the same logic as the table
    const vtcSummary = useMemo(() => {
        if (!vtcData?.data?.data) return null;

        let totalTime = 0;

        vtcData.data.data.forEach((item: any) => {
            if (!item.event_date) return;
            totalTime += item.total_time_spent;
        });

        return {
            totalTime
        };
    }, [vtcData]);

    if (!communityIds) {
        return (
            <Card style={{ textAlign: 'center', padding: 40 }}>
                <Empty
                    description="Select a community to view analytics"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            </Card>
        );
    }

    const tabItems = [
        {
            key: 'registrations',
            label: (
                <Space size={4}>
                    <UserAddOutlined />
                    <span>Registrations</span>
                </Space>
            ),
            children: (
                <UnifiedAnalyticsView
                    title="Registration Analytics"
                    tooltip="Shows new member registrations for the selected period"
                    icon={<UserAddOutlined />}
                    isLoading={registrationLoading}
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
                            defaultValue: registrationGroupBy,
                            onChange: setRegistrationGroupBy
                        },
                        {
                            key: 'hideZero',
                            label: 'Hide Zero Values',
                            type: 'toggle',
                            defaultValue: registrationHideZero,
                            onChange: setRegistrationHideZero
                        }
                    ]}
                    summaryStats={[
                        {
                            title: 'Total Registrations',
                            value: registrationData?.data?.data?.reduce((sum: number, item: any) => sum + item.user_count, 0) || 0,
                            tooltip: 'Total number of new member registrations for the selected period'
                        },
                        {
                            title: 'Direct Registrations',
                            value: registrationData?.data?.data?.filter((item: any) => item.registration_type === 'direct').reduce((sum: number, item: any) => sum + item.user_count, 0) || 0,
                            tooltip: 'Members who registered directly through the platform'
                        },
                        {
                            title: 'Bulk Registrations',
                            value: registrationData?.data?.data?.filter((item: any) => item.registration_type === 'admin/bulk').reduce((sum: number, item: any) => sum + item.user_count, 0) || 0,
                            tooltip: 'Members who were registered in bulk by administrators'
                        }
                    ]}
                    tableComponent={
                        <NewRegistrationsTable
                            communityIds={communityIds}
                            dateRange={dateRange}
                            apiUrl={apiUrl}
                            globalGroupBy={registrationGroupBy}
                            hideZero={registrationHideZero}
                        />
                    }
                    chartComponent={
                        <NewRegistrationsChart
                            communityIds={communityIds}
                            dateRange={dateRange}
                            apiUrl={apiUrl}
                            globalGroupBy={registrationGroupBy}
                            hideZero={registrationHideZero}
                        />
                    }
                />
            )
        },
        {
            key: 'reminders',
            label: (
                <Space size={4}>
                    <BellOutlined />
                    <span>Reminders</span>
                </Space>
            ),
            children: (
                <UnifiedAnalyticsView
                    title="Reminder Analytics"
                    tooltip="Shows reminder notifications sent to members for events and activities"
                    icon={<BellOutlined />}
                    isLoading={reminderLoading}
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
                            defaultValue: reminderGroupBy,
                            onChange: setReminderGroupBy
                        },
                        {
                            key: 'memberAggregate',
                            label: 'Member Aggregate',
                            type: 'toggle',
                            defaultValue: reminderMemberAggregate,
                            onChange: setReminderMemberAggregate
                        },
                        {
                            key: 'hideZero',
                            label: 'Hide Zero Values',
                            type: 'toggle',
                            defaultValue: reminderHideZero,
                            onChange: setReminderHideZero
                        }
                    ]}
                    summaryStats={[
                        {
                            title: 'Total Reminders',
                            value: reminderSummary?.total || 0,
                            tooltip: 'Total number of reminder notifications sent to members across all channels.',
                            icon: <BellOutlined />
                        },
                        {
                            title: 'Email Reminders',
                            value: reminderSummary?.email || 0,
                            tooltip: 'Number of email reminder notifications sent to members during the selected period.'
                        },
                        {
                            title: 'Text Reminders',
                            value: reminderSummary?.text || 0,
                            tooltip: 'Number of SMS/text reminder notifications sent to members during the selected period.'
                        },
                        {
                            title: 'Calendar Reminders',
                            value: reminderSummary?.calendar || 0,
                            tooltip: 'Number of calendar reminder notifications sent to members during the selected period.'
                        },
                        {
                            title: 'Total Events',
                            value: reminderSummary?.totalEvents || 0,
                            tooltip: 'Total number of unique events that had reminders sent during the selected period.',
                            icon: <CalendarOutlined />
                        }
                    ]}
                    tableComponent={
                        <RemindersAnalyticsTable
                            communityIds={communityIds}
                            dateRange={dateRange}
                            apiUrl={apiUrl}
                            globalGroupBy={reminderGroupBy}
                            memberAggregate={reminderMemberAggregate}
                            hideZero={reminderHideZero}
                        />
                    }
                    chartComponent={
                        <ReminderChart
                            communityIds={communityIds}
                            dateRange={dateRange}
                            apiUrl={apiUrl}
                            globalGroupBy={reminderGroupBy}
                            memberAggregate={reminderMemberAggregate}
                            hideZero={reminderHideZero}
                        />
                    }
                />
            )
        },
        {
            key: 'attendance',
            label: (
                <Space size={4}>
                    <TeamOutlined />
                    <span>Attendance</span>
                </Space>
            ),
            children: (
                <UnifiedAnalyticsView
                    title="Attendance Analytics"
                    tooltip="This table shows attendance data comparing your selected communities against all other communities in the platform. Use the filters to focus on specific data views and time periods."
                    icon={<TeamOutlined />}
                    isLoading={attendanceLoading}
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
                            defaultValue: attendanceGroupBy,
                            onChange: setAttendanceGroupBy
                        },
                        {
                            key: 'dataView',
                            label: 'Data View',
                            type: 'select',
                            options: [
                                { value: 'all', label: 'All Communities' },
                                { value: 'selected', label: 'Selected Only' },
                                { value: 'other', label: 'Other Only' }
                            ],
                            defaultValue: attendanceViewMode,
                            onChange: setAttendanceViewMode
                        },
                        {
                            key: 'hideZero',
                            label: 'Hide Zero Days',
                            type: 'toggle',
                            defaultValue: attendanceHideZero,
                            onChange: setAttendanceHideZero
                        }
                    ]}
                    summaryStats={[
                        {
                            title: 'Total Attendance',
                            value: attendanceSummary?.overallTotal || 0,
                            tooltip: 'Total number of event attendances across all communities in the selected period. Each member attending an event counts as one attendance.',
                            icon: <BarChartOutlined />
                        },
                        {
                            title: 'Peak Attendance',
                            value: attendanceSummary?.maxAttendance || 0,
                            suffix: attendanceSummary?.maxAttendanceDate ? `on ${attendanceSummary.maxAttendanceDate}` : '',
                            tooltip: 'The highest single-day attendance count during this period. This helps identify your most successful event days.',
                            icon: <TrophyOutlined />
                        },
                        {
                            title: 'Active Days',
                            value: attendanceSummary?.daysWithAttendance || 0,
                            suffix: `/ ${attendanceSummary?.daysInPeriod || 0} days`,
                            tooltip: 'Number of days with at least one attendance vs. total days in the selected period. Higher ratios indicate more consistent community engagement.',
                            icon: <CalendarOutlined />
                        },
                        {
                            title: 'Avg. Daily Attendance',
                            value: attendanceSummary?.avgOverall?.toFixed(1) || '0.0',
                            suffix: 'per day',
                            tooltip: 'Average number of daily attendances calculated by dividing total attendances by the number of days in the period. This smooths out daily variations to show overall engagement trends.'
                        }
                    ]}
                    tableComponent={
                        <AttendanceAnalyticsTable
                            communityIds={communityIds}
                            dateRange={dateRange}
                            apiUrl={apiUrl}
                            globalGroupBy={attendanceGroupBy}
                            viewMode={attendanceViewMode}
                            hideZero={attendanceHideZero}
                        />
                    }
                    chartComponent={
                        <AttendanceChart
                            communityIds={communityIds}
                            dateRange={dateRange}
                            apiUrl={apiUrl}
                            globalGroupBy={attendanceGroupBy}
                            viewMode={attendanceViewMode}
                            hideZero={attendanceHideZero}
                        />
                    }
                />
            )
        },
        {
            key: 'retention',
            label: (
                <Space size={4}>
                    <ScheduleOutlined />
                    <span>Retention</span>
                </Space>
            ),
            children: (
                <UnifiedAnalyticsView
                    title="Retention Analytics"
                    tooltip="This table analyzes how many participants continue attending events over consecutive time periods. Retention rate shows the percentage of previous participants who return, helping you understand community engagement patterns and identify periods that need attention."
                    icon={<ScheduleOutlined />}
                    isLoading={retentionLoading}
                    hideViewSwitcher={false}
                    tabFilters={[
                        {
                            key: 'groupBy',
                            label: 'Group By',
                            type: 'select',
                            options: [
                                { value: AnalyticsGroupType.MONTH, label: 'Month' },
                                { value: AnalyticsGroupType.QUARTER, label: 'Quarter' }
                            ],
                            defaultValue: retentionGroupBy,
                            onChange: setRetentionGroupBy
                        },
                        {
                            key: 'minParticipants',
                            label: 'Min Participants',
                            type: 'number',
                            defaultValue: retentionMinParticipants,
                            onChange: setRetentionMinParticipants
                        }
                    ]}
                    summaryStats={[
                        {
                            title: 'Overall Retention',
                            value: retentionSummary?.overallRetention || 0,
                            suffix: '%',
                            tooltip: 'Overall retention rate calculated across all periods in the selected date range.',
                            icon: <BarChartOutlined />
                        },
                        {
                            title: 'Average Retention',
                            value: retentionSummary?.averageRetention || 0,
                            suffix: '%',
                            tooltip: 'Average retention rate across all measured periods.',
                            icon: <RiseOutlined />
                        },
                        {
                            title: 'Total Participants',
                            value: retentionSummary?.totalParticipants || 0,
                            tooltip: 'Total number of unique participants across all periods.',
                            icon: <TeamOutlined />
                        },
                        {
                            title: 'Highest Growth',
                            value: retentionSummary?.highestGrowth || 0,
                            suffix: retentionSummary?.highestGrowthPeriod ? ` in ${retentionSummary.highestGrowthPeriod}` : '',
                            tooltip: 'Largest increase in participants between consecutive periods.',
                            icon: <TrophyOutlined />
                        },
                        {
                            title: 'Highest Retention',
                            value: retentionSummary?.highestRetention || 0,
                            suffix: '%',
                            tooltip: 'Best retention rate achieved in any single period.',
                            icon: <TrophyOutlined />
                        },
                        {
                            title: 'Lowest Retention',
                            value: retentionSummary?.lowestRetention === 100 ? 0 : (retentionSummary?.lowestRetention || 0),
                            suffix: '%',
                            tooltip: 'Lowest retention rate recorded in any period.',
                            icon: <BarChartOutlined />
                        }
                    ]}
                    tableComponent={
                        <RetentionAnalyticsTable
                            communityIds={communityIds}
                            dateRange={dateRange}
                            apiUrl={apiUrl}
                            globalGroupBy={retentionGroupBy}
                            minParticipants={retentionMinParticipants}
                        />
                    }
                    chartComponent={
                        <RetentionChart
                            communityIds={communityIds}
                            apiUrl={apiUrl}
                            dateRange={dateRange}
                            globalGroupBy={retentionGroupBy}
                            minParticipants={retentionMinParticipants}
                        />
                    }
                />
            )
        },
        {
            key: 'events',
            label: (
                <Space size={4}>
                    <VideoCameraAddOutlined />
                    <span>Community Events</span>
                </Space>
            ),
            children: (
                <UnifiedAnalyticsView
                    title="Community Events Analytics"
                    tooltip="Shows resource interactions and usage metrics for the selected communities and time period"
                    icon={<VideoCameraAddOutlined />}
                    isLoading={eventsLoading}
                    hideViewSwitcher={false}
                    tabFilters={[
                        {
                            key: 'eventTypes',
                            label: 'Event Types',
                            type: 'select',
                            options: [
                                { value: 'resourceInteractions', label: 'Resource Interactions' },
                                { value: 'pageViews', label: 'Page Views' }
                            ],
                            defaultValue: [
                                ...(eventsShowResourceInteractions ? ['resourceInteractions'] : []),
                                ...(eventsShowPageViews ? ['pageViews'] : [])
                            ],
                            onChange: (values: string[]) => {
                                setEventsShowResourceInteractions(values.includes('resourceInteractions'));
                                setEventsShowPageViews(values.includes('pageViews'));
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
                        <EventsAnalyticsTable
                            communityIds={communityIds}
                            dateRange={dateRange}
                            apiUrl={apiUrl}
                            hideZero={eventsHideZero}
                            showResourceInteractions={eventsShowResourceInteractions}
                            showPageViews={eventsShowPageViews}
                        />
                    }
                    chartComponent={
                        <CommunityEventsCharts
                            sponsorData={sponsorData}
                            communityIds={communityIds}
                            dateRange={dateRange}
                            apiUrl={apiUrl}
                            hideZero={eventsHideZero}
                            showResourceInteractions={eventsShowResourceInteractions}
                            showPageViews={eventsShowPageViews}
                        />
                    }
                />
            )
        },
        {
            key: 'pageTime',
            label: (
                <Space size={4}>
                    <ClockCircleOutlined />
                    <span>Page Time</span>
                </Space>
            ),
            children: (
                <UnifiedAnalyticsView
                    title="Page Time Analytics"
                    tooltip="Shows time spent by users on different pages of the platform, excluding time spent streaming live, external events, or on‑demand classes."
                    icon={<ClockCircleOutlined />}
                    isLoading={pageTimeLoading}
                    hideViewSwitcher={false}
                    tabFilters={[
                        {
                            key: 'userEmail',
                            label: 'Search by User Email',
                            type: 'input',
                            placeholder: 'Filter by user email',
                            onChange: setPageTimeUserEmail
                        }
                    ]}
                    summaryStats={[
                        {
                            title: 'Total Time',
                            value: formatTime(pageTimeSummary?.totalTime || 0),
                            tooltip: 'Total time spent by all users on community pages.',
                            icon: <ClockCircleOutlined />
                        },
                        {
                            title: 'On-Demand Time',
                            value: formatTime(pageTimeSummary?.onDemandTime || 0),
                            tooltip: 'Time spent on the on-demand content pages.',
                            icon: <VideoCameraAddOutlined />
                        },
                        {
                            title: 'Class Schedule Time',
                            value: formatTime(pageTimeSummary?.classScheduleTime || 0),
                            tooltip: 'Time spent on the class schedule pages.',
                            icon: <ScheduleOutlined />
                        },
                        // {
                        //     title: 'On-Demand Streaming Time',
                        //     value: formatTime(pageTimeSummary?.onDemandStreamingTime || 0),
                        //     tooltip: 'Time spent on the on-demand streaming pages.',
                        //     icon: <LineChartOutlined />
                        // }
                    ]}
                    tableComponent={
                        <PageTimeAnalyticsTable
                            communityIds={communityIds}
                            dateRange={dateRange}
                            apiUrl={apiUrl}
                            globalGroupBy={pageTimeGroupBy}
                            userEmail={pageTimeUserEmail}
                        />
                    }
                    chartComponent={
                        <PageTimeSpentChart
                            communityIds={communityIds}
                            apiUrl={apiUrl}
                            dateRange={dateRange}
                            globalGroupBy={pageTimeGroupBy}
                            userEmail={pageTimeUserEmail}
                        />
                    }
                />
            )
        },
        {
            key: 'streaming',
            label: (
                <Space size={4}>
                    <LineChartOutlined />
                    <span>Streaming Time</span>
                </Space>
            ),
            children: (
                <UnifiedAnalyticsView
                    title="Streaming Time Analytics"
                    tooltip="Shows the calculated time for all classes based on class participation. This includes users joining classes from the main lobby (Platform + external) + also includes on-demand classes viewed."
                    icon={<LineChartOutlined />}
                    isLoading={streamingLoading}
                    hideViewSwitcher={false}
                    tabFilters={[
                        {
                            key: 'userEmail',
                            label: 'Search by User Email',
                            type: 'input',
                            placeholder: 'Filter by user email',
                            onChange: setStreamingUserEmail
                        }
                    ]}
                    summaryStats={[
                        {
                            title: 'Scheduled Classes Streaming',
                            value: formatTime(streamingSummary?.classScheduleTime || 0),
                            tooltip: 'Total time spent streaming scheduled classes.',
                            icon: <ScheduleOutlined />
                        },
                        {
                            title: 'On Demand Streaming',
                            value: formatTime(streamingSummary?.onDemandTime || 0),
                            tooltip: 'Total time spent streaming on-demand content.',
                            icon: <VideoCameraAddOutlined />
                        },
                        {
                            title: 'External Event',
                            value: formatTime(streamingSummary?.externalEventTime || 0),
                            tooltip: 'Total time spent streaming external events.',
                            icon: <LineChartOutlined />
                        },
                        {
                            title: 'Total Time',
                            value: formatTime(streamingSummary?.totalTime || 0),
                            tooltip: 'Total streaming time across all categories.',
                            icon: <BarChartOutlined />
                        }
                    ]}
                    tableComponent={
                        <OnDemandAnalyticsTable
                            communityIds={communityIds}
                            dateRange={dateRange}
                            apiUrl={apiUrl}
                            globalGroupBy={streamingGroupBy}
                            userEmail={streamingUserEmail}
                        />
                    }
                    chartComponent={
                        <TimeSpentOnDemandClassScheduleChart
                            communityIds={communityIds}
                            apiUrl={apiUrl}
                            dateRange={dateRange}
                            globalGroupBy={streamingGroupBy}
                            userEmail={streamingUserEmail}
                        />
                    }
                />
            )
        },
        {
            key: 'vtc',
            label: (
                <Space size={4}>
                    <LineChartOutlined />
                    <span>VTC</span>
                </Space>
            ),
            children: (
                <UnifiedAnalyticsView
                    title="VTC Analytics"
                    tooltip="Shows time spent by users in VTC (Virtual Talking Circle) classes"
                    icon={<LineChartOutlined />}
                    isLoading={vtcLoading}
                    hideViewSwitcher={false}
                    tabFilters={[
                        {
                            key: 'userEmail',
                            label: 'Search by User Email',
                            type: 'input',
                            placeholder: 'Filter by user email',
                            onChange: setVtcUserEmail
                        }
                    ]}
                    summaryStats={[
                        {
                            title: 'Total VTC Time',
                            value: formatTime(vtcSummary?.totalTime || 0),
                            tooltip: 'Total time spent by all users in VTC classes.',
                            icon: <LineChartOutlined />
                        }
                    ]}
                    tableComponent={
                        <VTCTimeAnalyticsTable
                            communityIds={communityIds}
                            dateRange={dateRange}
                            apiUrl={apiUrl}
                        />
                    }
                    chartComponent={
                        <TimeSpentVTCChart
                            communityIds={Array.isArray(communityIds) ? communityIds : [communityIds]}
                            apiUrl={apiUrl}
                            dateRange={dateRange}
                            globalGroupBy={vtcGroupBy}
                            userEmail={vtcUserEmail}
                        />
                    }
                />
            )
        }
    ];

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Tabs 
                defaultActiveKey="registrations" 
                type="card" 
                style={{ width: '100%' }}
                items={tabItems}
            />
        </Space>
    );
};

export default UnifiedAnalytics;