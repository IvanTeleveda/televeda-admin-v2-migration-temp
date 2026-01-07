import React, { useMemo, useState } from 'react';
import { Space, Tabs, Empty, Card } from '@pankod/refine-antd';
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
    TrophyOutlined
} from '@ant-design/icons';
import { useCustom } from '@refinedev/core';
import moment from 'moment';

// Table components
import { NewRegistrationsTable } from '../../../components/analytics/tables/registrationAnalyticsTable';
import { RemindersAnalyticsTable } from '../../../components/analytics/tables/remindersAnalyticsTable';
import { AttendanceAnalyticsTable } from '../../../components/analytics/tables/attendanceAnalyticsTable';
import { RetentionAnalyticsTable } from '../../../components/analytics/tables/retentionAnalyticsTable';
import { PageTimeAnalyticsTable } from '../../../components/analytics/tables/pageTimeAnalyticsTable';
import { StreamingAnalyticsTable } from '../../../components/analytics/tables/streamingAnalyticsTable';

// Chart components
import { ReminderChart } from '../../../components/analytics/charts/remindersChart';
import { NewRegistrationsChart } from '../../../components/analytics/charts/newRegistrationChart';
import { AttendanceChart } from '../../../components/analytics/charts/attendanceChart';
import { RetentionChart } from '../../../components/analytics/charts/retentionChart';
import { PageTimeSpentChart } from '../../../components/analytics/charts/pageTimeSpentChart';
import { StreamingChart, StreamingData, VTCData } from '../../../components/analytics/charts/streamingChart';

// Unified view component
import { UnifiedAnalyticsView } from '../../../components/analytics/unified/UnifiedAnalyticsView';
import { AnalyticsGroupType } from '../../../pages/analytics';
import { formatTime, getDateFormat } from '../../../components/analytics/util';
import { useDebouncedValue } from '../../../components/buttons/sendEmail/useDebounce';
import { PageTimeData, RegistrationAnalyticsQuery, TimeSpentData } from '../../../components/analytics/analytics-types';

interface UnifiedAnalyticsProps {
    communityIds: any;
    dateRange: any;
    apiUrl: string;
}

const UnifiedAnalytics: React.FC<UnifiedAnalyticsProps> = ({
    communityIds,
    dateRange,
    apiUrl
}) => {
    const [activeTab, setActiveTab] = useState<string>('registrations');

    // Tab-specific filter states
    const [registrationGroupBy, setRegistrationGroupBy] = useState<AnalyticsGroupType>(AnalyticsGroupType.WEEK);
    const [registrationHideZero, setRegistrationHideZero] = useState(false);

    const [reminderGroupBy, setReminderGroupBy] = useState<AnalyticsGroupType>(AnalyticsGroupType.DAY);
    const [reminderMemberAggregate, setReminderMemberAggregate] = useState(false);
    const [reminderHideZero, setReminderHideZero] = useState(false);

    const [attendanceGroupBy, setAttendanceGroupBy] = useState<AnalyticsGroupType>(AnalyticsGroupType.DAY);
    const [attendanceViewMode, setAttendanceViewMode] = useState<'all' | 'selected' | 'other'>('all');
    const [attendanceHideZero, setAttendanceHideZero] = useState(false);

    const [retentionGroupBy, setRetentionGroupBy] = useState<AnalyticsGroupType>(AnalyticsGroupType.MONTH);

    const [pageTimeGroupBy, setPageTimeGroupBy] = useState<AnalyticsGroupType>(AnalyticsGroupType.DAY);
    const [pageTimeUserEmail, setPageTimeUserEmail] = useState('');
    const pageTimeUserEmailValue = useDebouncedValue(pageTimeUserEmail, 1000);

    const [streamingGroupBy, setStreamingGroupBy] = useState<AnalyticsGroupType>(AnalyticsGroupType.DAY);
    const [streamingUserEmail, setStreamingUserEmail] = useState('');
    const streamingUserEmailValue = useDebouncedValue(streamingUserEmail, 1000);

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

    const queryOptionsBase = {
        keepPreviousData: false,
        retry: 2,
        staleTime: 5 * 60 * 1000
    };

    const { data: registrationData, isLoading: registrationLoading } = useCustom<{
        data: RegistrationAnalyticsQuery[];
        total: number;
    }>({
        url: `${apiUrl}/analytics/registeredMembers`,
        method: "get",
        config: { query: createQuery(registrationGroupBy) },
        queryOptions: {
            ...queryOptionsBase,
            enabled: activeTab === 'registrations' && !!communityIds,
        }
    });

    const { data: reminderData, isLoading: reminderLoading } = useCustom<{
        data: any;
        total: any;
        trend: number;
    }>({
        url: `${apiUrl}/analytics/reminders`,
        method: "get",
        config: { query: createQuery(reminderGroupBy, { memberAggregate: reminderMemberAggregate }) },
        queryOptions: {
            ...queryOptionsBase,
            enabled: activeTab === 'reminders' && !!communityIds
        }
    });

    const { data: attendanceData, isLoading: attendanceLoading } = useCustom<{
        data: any;
        total: any;
        trend: number;
    }>({
        url: `${apiUrl}/analytics/memberAttendance`,
        method: "get",
        config: { query: createQuery(attendanceGroupBy) },
        queryOptions: {
            ...queryOptionsBase,
            enabled: activeTab === 'attendance' && !!communityIds
        }
    });

    const { data: retentionData, isLoading: retentionLoading } = useCustom<{
        data: any;
        total: number;
    }>({
        url: `${apiUrl}/analytics/retention`,
        method: "get",
        config: { query: createQuery(retentionGroupBy) },
        queryOptions: {
            ...queryOptionsBase,
            enabled: activeTab === 'retention' && !!communityIds
        }
    });

    const { data: pageTimeData, isLoading: pageTimeLoading } = useCustom<{
        data: PageTimeData[];
    }>({
        url: `${apiUrl}/analytics/memberPageTimeMetrics`,
        method: "get",
        config: { query: createQuery(pageTimeGroupBy, { userEmail: pageTimeUserEmailValue }) },
        queryOptions: {
            ...queryOptionsBase,
            enabled: activeTab === 'pageTime' && !!communityIds
        }
    });

    const { data: streamingData, isLoading: streamingLoading } = useCustom<{
        data: StreamingData[];
    }>({
        url: `${apiUrl}/analytics/memberOnDemandClassScheduleTimeMetrics`,
        method: "get",
        config: { query: createQuery(streamingGroupBy, { userEmail: streamingUserEmailValue }) },
        queryOptions: {
            ...queryOptionsBase,
            enabled: activeTab === 'streaming' && !!communityIds
        }
    });

    const { data: vtcData, isLoading: vtcLoading } = useCustom<{
        data: VTCData[];
    }>({
        url: `${apiUrl}/analytics/memberVTCTimeMetrics`,
        method: "get",
        config: { query: createQuery(vtcGroupBy, { userEmail: vtcUserEmail }) },
        queryOptions: {
            ...queryOptionsBase,
            enabled: activeTab === 'streaming' && !!communityIds
        }
    });

    // Calculate reminder summary metrics
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

        reminderData.data.data.columns.forEach((item: any) => {
            const type = item.group_key || 'other';
            columnTotals[type] = (columnTotals[type] || 0) + (item.value || 0);
            columnTotals.total += item.value || 0;
        });

        const totalEvents = reminderData.data.data.pie?.length || 0;

        let emailTotal = 0;
        let textTotal = 0;
        let calendarTotal = 0;

        Object.keys(columnTotals).forEach(key => {
            if (key.toLowerCase().includes('email') || key === 'RSVP (email)') {
                emailTotal += columnTotals[key] || 0;
            }
            else if (key.toLowerCase().includes('text') || key === 'RSVP (text)') {
                textTotal += columnTotals[key] || 0;
            }
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
            columnTotals
        };
    }, [reminderData]);

    // Calculate attendance summary metrics
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


        const tableData = Object.values(groupedByDate).map(item => ({
            ...item,
            formattedDate: getDateFormat(item.date, attendanceGroupBy)
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

        const getTotalPeriods = () => {
            if (!dateRange?.[0] || !dateRange?.[1]) return 0;
            const start = dateRange[0].startOf('day');
            const end = dateRange[1].startOf('day');

            switch (attendanceGroupBy) {
                case AnalyticsGroupType.WEEK:
                    const startWeek = start.startOf('week');
                    const endWeek = end.startOf('week');
                    return Math.max(1, Math.floor(endWeek.diff(startWeek, 'weeks', true)) + 1);
                case AnalyticsGroupType.MONTH:
                    const startMonth = start.startOf('month');
                    const endMonth = end.startOf('month');
                    return Math.max(1, endMonth.diff(startMonth, 'months', true) + 1);
                case AnalyticsGroupType.QUARTER:
                    const startQuarter = start.startOf('quarter');
                    const endQuarter = end.startOf('quarter');
                    return Math.max(1, endQuarter.diff(startQuarter, 'quarters', true) + 1);
                default:
                    return Math.max(1, end.diff(start, 'days', true) + 1);
            }
        };

        const totalPeriods = getTotalPeriods();
        const avgOverall = totalPeriods > 0 ? overallTotal / totalPeriods : 0;

        const getPeriodLabel = (singular: boolean = false) => {
            switch (attendanceGroupBy) {
                case AnalyticsGroupType.WEEK:
                    return singular ? 'week' : 'weeks';
                case AnalyticsGroupType.MONTH:
                    return singular ? 'month' : 'months';
                case AnalyticsGroupType.QUARTER:
                    return singular ? 'quarter' : 'quarters';
                default:
                    return singular ? 'day' : 'days';
            }
        };

        return {
            overallTotal,
            maxAttendance,
            maxAttendanceDate,
            daysWithAttendance: periodsWithAttendance,
            daysInPeriod: totalPeriods,
            avgOverall: Number.isNaN(avgOverall) ? 0 : avgOverall,
            periodLabel: getPeriodLabel(false),
            periodLabelSingular: getPeriodLabel(true)
        };
    }, [attendanceData, dateRange, attendanceGroupBy]);

    // Calculate Retention summary
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

        if (sortedDates.length < 2) return null;

        let prevIntervalParticipants: any[] = [];
        const processedRetentionData: any[] = [];
        const activeUniqueParticipants = new Set<string>();

        sortedDates.forEach((date, index) => {
            const currentParticipants = groupedData[date];

            if (index > 0) {
                currentParticipants.forEach((p: any) => {
                    if (p.participantId) activeUniqueParticipants.add(p.participantId);
                });
            }

            const retainedParticipants = currentParticipants.filter((current: any) =>
                prevIntervalParticipants.some((prev: any) => prev.participantId === current.participantId)
            );

            processedRetentionData.push({
                interval: getDateFormat(date, retentionGroupBy),
                currentParticipants: currentParticipants.length,
                prevParticipants: index === 0 ? 0 : prevIntervalParticipants.length,
                retained: retainedParticipants.length,
                retentionRate: index === 0 ? 0 :
                    Math.round((retainedParticipants.length / prevIntervalParticipants.length) * 100)
            });

            prevIntervalParticipants = currentParticipants;
        });

        let totalPrevParticipants = 0;
        let totalRetained = 0;
        let highestGrowth = 0;
        let highestGrowthPeriod = "";

        processedRetentionData.forEach((item, index) => {
            if (index > 0) {
                totalPrevParticipants += item.prevParticipants;
                totalRetained += item.retained;

                const growth = item.currentParticipants - item.prevParticipants;
                if (growth > highestGrowth) {
                    highestGrowth = growth;
                    highestGrowthPeriod = item.interval;
                }
            }
        });

        return {
            retention: totalPrevParticipants === 0 ? 0 : Math.round((totalRetained / totalPrevParticipants) * 100),
            totalParticipants: activeUniqueParticipants.size,
            totalPeriods: processedRetentionData.length - 1,
            highestGrowth,
            highestGrowthPeriod
        };
    }, [retentionData, retentionGroupBy]);

    // Page Time summary
    const pageTimeSummary = useMemo(() => {
        if (!pageTimeData?.data?.data) return null;

        let totalTime = 0;
        let onDemandTime = 0;
        let classScheduleTime = 0;
        let onDemandStreamingTime = 0;

        pageTimeData.data.data.forEach((item: any) => {
            if (!item.event_date) return;
            totalTime += item.total_time_spent;
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

    // Streaming summary
    const streamingSummary = useMemo(() => {
        if (!streamingData?.data?.data && !vtcData?.data?.data) return null;

        let totalTime = 0;
        let classScheduleTime = 0;
        let onDemandTime = 0;
        let externalEventTime = 0;
        let vtcTime = 0;

        if (streamingData?.data?.data) {
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
        }

        if (vtcData?.data?.data) {
            vtcData.data.data.forEach((item: any) => {
                if (!item.event_date) return;
                vtcTime += item.total_time_spent;
                totalTime += item.total_time_spent;
            });
        }

        return {
            totalTime,
            classScheduleTime,
            onDemandTime,
            externalEventTime,
            vtcTime
        };
    }, [streamingData, vtcData]);

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

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                type="card"
                style={{ width: '100%' }}
                items={[
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
                                        enableFetching={false}
                                        isLoading={registrationLoading}
                                        passedData={registrationData}
                                    />
                                }
                                chartComponent={
                                    <NewRegistrationsChart
                                        communityIds={communityIds}
                                        dateRange={dateRange}
                                        apiUrl={apiUrl}
                                        globalGroupBy={registrationGroupBy}
                                        hideZero={registrationHideZero}
                                        enableFetching={false}
                                        isLoading={registrationLoading}
                                        passedData={registrationData}
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
                                        enableFetching={false}
                                        isLoading={reminderLoading}
                                        passedData={reminderData}
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
                                        enableFetching={false}
                                        isLoading={reminderLoading}
                                        passedData={reminderData}
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
                                title="Live Attendance Analytics"
                                tooltip="This table shows attendance data comparing your selected communities against all other communities in the platform."
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
                                        tooltip: 'Total number of event attendances across all communities in the selected period.',
                                        icon: <BarChartOutlined />
                                    },
                                    {
                                        title: 'Peak Attendance',
                                        value: attendanceSummary?.maxAttendance || 0,
                                        suffix: attendanceSummary?.maxAttendanceDate ? `on ${attendanceSummary.maxAttendanceDate}` : '',
                                        tooltip: 'The highest single-day attendance count during this period.',
                                        icon: <TrophyOutlined />
                                    },
                                    {
                                        title: `Active ${attendanceSummary?.periodLabel ? attendanceSummary.periodLabel.charAt(0).toUpperCase() + attendanceSummary.periodLabel.slice(1) : 'Days'}`,
                                        value: attendanceSummary?.daysWithAttendance || 0,
                                        suffix: `/ ${attendanceSummary?.daysInPeriod || 0} ${attendanceSummary?.periodLabel || 'days'}`,
                                        tooltip: `Number of days with at least one attendance.`,
                                        icon: <CalendarOutlined />
                                    },
                                    {
                                        title: `Avg. ${attendanceSummary?.periodLabelSingular ? attendanceSummary.periodLabelSingular.charAt(0).toUpperCase() + attendanceSummary.periodLabelSingular.slice(1) : 'Daily'} Attendance`,
                                        value: attendanceSummary?.avgOverall?.toFixed(1) || '0.0',
                                        suffix: `per ${attendanceSummary?.periodLabelSingular || 'day'}`,
                                        tooltip: `Average number of attendances.`
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
                                        enableFetching={false}
                                        isLoading={attendanceLoading}
                                        passedData={attendanceData}
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
                                        enableFetching={false}
                                        isLoading={attendanceLoading}
                                        passedData={attendanceData}
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
                                tooltip="This table analyzes how many participants continue attending events over consecutive time periods."
                                icon={<ScheduleOutlined />}
                                isLoading={retentionLoading}
                                hideViewSwitcher={false}
                                tabFilters={[
                                    {
                                        key: 'groupBy',
                                        label: 'Group By',
                                        type: 'select',
                                        options: [
                                            { value: AnalyticsGroupType.WEEK, label: 'Week' },
                                            { value: AnalyticsGroupType.MONTH, label: 'Month' },
                                            { value: AnalyticsGroupType.QUARTER, label: 'Quarter' }
                                        ],
                                        defaultValue: retentionGroupBy,
                                        onChange: setRetentionGroupBy
                                    }
                                ]}
                                summaryStats={[
                                    {
                                        title: 'Retention',
                                        value: retentionSummary?.retention || 0,
                                        suffix: '%',
                                        tooltip: 'Overall retention rate.',
                                        icon: <BarChartOutlined />
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
                                    }
                                ]}
                                tableComponent={
                                    <RetentionAnalyticsTable
                                        communityIds={communityIds}
                                        dateRange={dateRange}
                                        apiUrl={apiUrl}
                                        globalGroupBy={retentionGroupBy}
                                        enableFetching={false}
                                        isLoading={retentionLoading}
                                        passedData={retentionData}
                                    />
                                }
                                chartComponent={
                                    <RetentionChart
                                        communityIds={communityIds}
                                        apiUrl={apiUrl}
                                        dateRange={dateRange}
                                        globalGroupBy={retentionGroupBy}
                                        enableFetching={false}
                                        isLoading={retentionLoading}
                                        passedData={retentionData}
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
                                tooltip="Shows time spent by users on different pages."
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
                                        value: formatTime(pageTimeSummary?.totalTime || 0, true),
                                        tooltip: 'Total time spent by all users on community pages.',
                                        icon: <ClockCircleOutlined />
                                    },
                                    {
                                        title: 'On-Demand Time',
                                        value: formatTime(pageTimeSummary?.onDemandTime || 0, true),
                                        tooltip: 'Time spent on the on-demand content pages.',
                                        icon: <VideoCameraAddOutlined />
                                    },
                                    {
                                        title: 'Class Schedule Time',
                                        value: formatTime(pageTimeSummary?.classScheduleTime || 0, true),
                                        tooltip: 'Time spent on the class schedule pages.',
                                        icon: <ScheduleOutlined />
                                    }
                                ]}
                                tableComponent={
                                    <PageTimeAnalyticsTable
                                        communityIds={communityIds}
                                        dateRange={dateRange}
                                        apiUrl={apiUrl}
                                        globalGroupBy={pageTimeGroupBy}
                                        userEmail={pageTimeUserEmailValue}
                                        enableFetching={false}
                                        isLoading={pageTimeLoading}
                                        passedData={pageTimeData}
                                    />
                                }
                                chartComponent={
                                    <PageTimeSpentChart
                                        communityIds={communityIds}
                                        apiUrl={apiUrl}
                                        dateRange={dateRange}
                                        globalGroupBy={pageTimeGroupBy}
                                        userEmail={pageTimeUserEmailValue}
                                        enableFetching={false}
                                        isLoading={pageTimeLoading}
                                        passedData={pageTimeData}
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
                                tooltip="Shows the calculated time for all classes based on class participation."
                                icon={<LineChartOutlined />}
                                isLoading={streamingLoading || vtcLoading}
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
                                        title: 'Scheduled Classes',
                                        value: formatTime(streamingSummary?.classScheduleTime || 0, true),
                                        tooltip: 'Total time spent streaming scheduled classes.',
                                        icon: <ScheduleOutlined />
                                    },
                                    {
                                        title: 'On Demand',
                                        value: formatTime(streamingSummary?.onDemandTime || 0, true),
                                        tooltip: 'Total time spent streaming on-demand content.',
                                        icon: <VideoCameraAddOutlined />
                                    },
                                    {
                                        title: 'External Event',
                                        value: formatTime(streamingSummary?.externalEventTime || 0, true),
                                        tooltip: 'Total time spent streaming external events.',
                                        icon: <LineChartOutlined />
                                    },
                                    {
                                        title: 'VTC Time',
                                        value: formatTime(streamingSummary?.vtcTime || 0, true),
                                        tooltip: 'Total time spent in VTC.',
                                        icon: <TeamOutlined />
                                    },
                                    {
                                        title: 'Total Time',
                                        value: formatTime(streamingSummary?.totalTime || 0, true),
                                        tooltip: 'Total streaming time.',
                                        icon: <BarChartOutlined />
                                    }
                                ]}
                                tableComponent={
                                    <StreamingAnalyticsTable
                                        communityIds={communityIds}
                                        dateRange={dateRange}
                                        apiUrl={apiUrl}
                                        globalGroupBy={streamingGroupBy}
                                        userEmail={streamingUserEmailValue}
                                        enableFetching={false}
                                        isLoading={streamingLoading || vtcLoading}
                                        passedStreamingData={streamingData}
                                        passedVtcData={vtcData}
                                    />
                                }
                                chartComponent={
                                    <StreamingChart
                                        communityIds={Array.isArray(communityIds) ? communityIds : [communityIds]}
                                        apiUrl={apiUrl}
                                        dateRange={dateRange}
                                        globalGroupBy={streamingGroupBy}
                                        userEmail={streamingUserEmailValue}
                                        enableFetching={false}
                                        isLoading={streamingLoading || vtcLoading}
                                        passedStreamingData={streamingData}
                                        passedVtcData={vtcData}
                                    />
                                }
                            />
                        )
                    }
                ]}
            />
        </Space>
    );
};

export default UnifiedAnalytics;