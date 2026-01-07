import { useMemo } from 'react';
import { useCustom, usePermissions } from '@refinedev/core';
import { UserPermissions } from '../interfaces';

interface EngagedAdoptedUsersData {
    total_users: string;
    active_users: string;
    adopted_users: string;
    engaged_users: string;
    engagement_percentage: number;
    adoption_percentage: number;
}

interface RepeatVsNewData {
    total: string;
    breakdown: {
        attendee_type: string;
        count: string;
    }[];
}

interface ResourceEngagementData {
    data: {
        itemId: string;
        collectionId: string;
        communityId: string;
        resource_name: string;
        category_name: string;
        community_name: string;
        modal_views: string;
        downloads: string;
        opens: string;
        page_views: string;
        unique_users: string;
    },
    pageViews: number; 
}

interface DisengagedUsersData {
    total: string;
    breakdown: {
        disengagement_status: string;
        count: string;
    }[];
}

interface ChurnedUsersData {
    churn_status: string;
    count: string;
}

interface EngagementHoursData {
    totalHours: number;
    streamingHours: number;
    onSiteHours: number;
}

interface AnalyticsData {
    engagedAdoptedUsers: EngagedAdoptedUsersData | null;
    repeatVsNew: RepeatVsNewData | null;
    resourceEngagement: ResourceEngagementData | null;
    disengagedUsers: DisengagedUsersData | null;
    churnedUsers: ChurnedUsersData | null;
    engagementHours: EngagementHoursData | null;
}

interface UseAnalyticsDataProps {
    communityIds?: any;
    dateRange?: any;
    apiUrl: string;
}

export const useAnalyticsData = ({ communityIds, dateRange, apiUrl }: UseAnalyticsDataProps) => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const { data: permissionsData } = usePermissions<UserPermissions>();

    const query = useMemo(() => {
        if (!dateRange?.[0] || !dateRange?.[1] || !communityIds) return null;

        return {
            start: dateRange[0].startOf('day').toISOString(),
            end: dateRange[1].endOf('day').toISOString(),
            timezone,
            communityIds
        };
    }, [dateRange, communityIds, timezone]);

    // Fetch Engaged & Adopted Users data
    const {
        data: engagedAdoptedUsersData,
        isLoading: engagedAdoptedUsersLoading,
        error: engagedAdoptedUsersError
    } = useCustom<EngagedAdoptedUsersData>({
        url: `${apiUrl}/report_classes/analytics/stats/engaged-adopted-users`,
        method: 'get',
        config: { query },
        queryOptions: {
            enabled: !!query,
            refetchOnWindowFocus: false,
            keepPreviousData: false
        }
    });

    // Fetch Repeat vs New data
    const {
        data: repeatVsNewData,
        isLoading: repeatVsNewLoading,
        error: repeatVsNewError
    } = useCustom<RepeatVsNewData>({
        url: `${apiUrl}/report_classes/analytics/stats/repeat-vs-new-attendees`,
        method: 'get',
        config: { query },
        queryOptions: {
            enabled: !!query,
            refetchOnWindowFocus: false,
            keepPreviousData: false
        }
    });

    // Fetch Resource Engagement data
    const {
        data: resourceEngagementData,
        isLoading: resourceEngagementLoading,
        error: resourceEngagementError
    } = useCustom<ResourceEngagementData>({
        url: `${apiUrl}/report_classes/analytics/stats/resource-engagement`,
        method: 'get',
        config: { query },
        queryOptions: {
            enabled: !!query && permissionsData && permissionsData === 'TelevedaAdmin',
            refetchOnWindowFocus: false,
            keepPreviousData: false
        }
    });

    // Fetch Disengaged Users data
    const {
        data: disengagedUsersData,
        isLoading: disengagedUsersLoading,
        error: disengagedUsersError
    } = useCustom<DisengagedUsersData>({
        url: `${apiUrl}/report_classes/analytics/stats/disengaged-users`,
        method: 'get',
        config: { query },
        queryOptions: {
            enabled: !!query && permissionsData && permissionsData === 'TelevedaAdmin',
            refetchOnWindowFocus: false,
            keepPreviousData: false
        }
    });

    // Fetch Churned Users data
    const {
        data: churnedUsersData,
        isLoading: churnedUsersLoading,
        error: churnedUsersError
    } = useCustom<ChurnedUsersData>({
        url: `${apiUrl}/report_classes/analytics/stats/churned-users`,
        method: 'get',
        config: { query },
        queryOptions: {
            enabled: !!query && permissionsData && permissionsData === 'TelevedaAdmin',
            refetchOnWindowFocus: false,
            keepPreviousData: false
        }
    });

    // Fetch Engagement Hours data
    const {
        data: engagementHoursData,
        isLoading: engagementHoursLoading,
        error: engagementHoursError
    } = useCustom<EngagementHoursData>({
        url: `${apiUrl}/report_classes/analytics/stats/engagement-hours`,
        method: 'get',
        config: { query },
        queryOptions: {
            enabled: !!query,
            refetchOnWindowFocus: false,
            keepPreviousData: false
        }
    });

    // Combined loading state - only consider queries that are actually enabled
    const isLoading = useMemo(() => {
        const isAdmin = permissionsData === 'TelevedaAdmin';

        return engagedAdoptedUsersLoading ||
            repeatVsNewLoading ||
            engagementHoursLoading ||
            (isAdmin && resourceEngagementLoading) ||
            (isAdmin && disengagedUsersLoading) ||
            (isAdmin && churnedUsersLoading);
    }, [
        engagedAdoptedUsersLoading,
        repeatVsNewLoading,
        engagementHoursLoading,
        resourceEngagementLoading,
        disengagedUsersLoading,
        churnedUsersLoading,
        permissionsData
    ]);

    // Combined error state - only consider queries that are actually enabled
    const hasErrors = useMemo(() => {
        const isAdmin = permissionsData === 'TelevedaAdmin';

        return engagedAdoptedUsersError ||
            repeatVsNewError ||
            engagementHoursError ||
            (isAdmin && resourceEngagementError) ||
            (isAdmin && disengagedUsersError) ||
            (isAdmin && churnedUsersError);
    }, [
        engagedAdoptedUsersError,
        repeatVsNewError,
        engagementHoursError,
        resourceEngagementError,
        disengagedUsersError,
        churnedUsersError,
        permissionsData
    ]);

    // Consolidated data
    const analyticsData: AnalyticsData = useMemo(() => ({
        engagedAdoptedUsers: engagedAdoptedUsersData?.data || null,
        repeatVsNew: repeatVsNewData?.data || null,
        resourceEngagement: resourceEngagementData?.data || null,
        disengagedUsers: disengagedUsersData?.data || null,
        churnedUsers: churnedUsersData?.data || null,
        engagementHours: engagementHoursData?.data || null
    }), [
        engagedAdoptedUsersData,
        repeatVsNewData,
        resourceEngagementData,
        disengagedUsersData,
        churnedUsersData,
        engagementHoursData
    ]);

    // Calculate metrics for backward compatibility
    const calculatedMetrics = useMemo(() => {
        // Process engaged/adopted users data
        const engagedAdoptedData = engagedAdoptedUsersData?.data;
        const engagedUsers = engagedAdoptedData ? {
            engagedUsers: parseInt(engagedAdoptedData.engaged_users) || 0,
            activeUsers: parseInt(engagedAdoptedData.active_users) || 0,
            engagementPercentage: engagedAdoptedData.engagement_percentage || 0
        } : null;

        const adoptedUsers = engagedAdoptedData ? {
            totalAccounts: parseInt(engagedAdoptedData.total_users) || 0,
            engagedAccounts: parseInt(engagedAdoptedData.adopted_users) || 0,
            adoptionPercentage: engagedAdoptedData.adoption_percentage || 0
        } : null;

        // Process repeat vs new data
        const repeatVsNewRaw = repeatVsNewData?.data;
        let repeatVsNew = null;
        if (repeatVsNewRaw && repeatVsNewRaw.breakdown && Array.isArray(repeatVsNewRaw.breakdown)) {
            const repeatItem = repeatVsNewRaw.breakdown.find(item => item.attendee_type === 'Repeat');
            const newItem = repeatVsNewRaw.breakdown.find(item => item.attendee_type === 'New');
            const repeatCount = parseInt(repeatItem?.count || '0');
            const newCount = parseInt(newItem?.count || '0');
            const total = parseInt(repeatVsNewRaw.total || '0');  // Use backend total

            // Validate: If sum doesn't match total, log warning (for dev)
            if (repeatCount + newCount !== total) {
                console.warn('Repeat vs New total mismatch:', { calculated: repeatCount + newCount, backend: total });
            }

            repeatVsNew = {
                repeatAttendees: repeatCount,
                newAttendees: newCount,
                repeatPercentage: total > 0 ? Math.round((repeatCount / total) * 100 * 100) / 100 : 0,
                newPercentage: total > 0 ? Math.round((newCount / total) * 100 * 100) / 100 : 0,
                totalAttendees: total
            };
        }

        // Process disengaged users data
        const disengagedRaw = disengagedUsersData?.data;
        let disengagedUsers = null;

        if (disengagedRaw) {
            disengagedUsers = {
                totalDisengaged: disengagedRaw.total
            }
        }

        // if (disengagedRaw && disengagedRaw.breakdown && Array.isArray(disengagedRaw.breakdown)) {
        //     const totalUsers = parseInt(disengagedRaw.total || '0');
        //     const oneMonth = disengagedRaw.breakdown.find(item => item.disengagement_status === '1-3 months');
        //     const threeMonths = disengagedRaw.breakdown.find(item => item.disengagement_status === '3-6 months');
        //     const sixMonths = disengagedRaw.breakdown.find(item => item.disengagement_status === '6+ months');

        //     const oneMonthCount = parseInt(oneMonth?.count || '0');
        //     const threeMonthsCount = parseInt(threeMonths?.count || '0');
        //     const sixMonthsCount = parseInt(sixMonths?.count || '0');
        //     const total = parseInt(disengagedRaw.total || '0');  // Use backend total

        //     // Validate: If sum doesn't match total, log warning
        //     if (oneMonthCount + threeMonthsCount + sixMonthsCount !== total) {
        //         console.warn('Disengaged total mismatch:', {calculated: oneMonthCount + threeMonthsCount + sixMonthsCount, backend: total});
        //     }

        //     disengagedUsers = {
        //         disengaged1Month: oneMonthCount,
        //         disengaged1MonthPercentage: totalUsers > 0 ? Math.round((oneMonthCount / totalUsers) * 100) : 0,
        //         disengaged3Months: threeMonthsCount,
        //         disengaged3MonthsPercentage: totalUsers > 0 ? Math.round((threeMonthsCount / totalUsers) * 100) : 0,
        //         disengaged6Months: sixMonthsCount,
        //         disengaged6MonthsPercentage: totalUsers > 0 ? Math.round((sixMonthsCount / totalUsers) * 100) : 0,
        //         totalDisengaged: total
        //     };
        // }

        // Process churned users data
        const churnedRaw = churnedUsersData?.data;
        let churnedUsers = null;

        if (churnedRaw) {
            churnedUsers = {
                totalChurned: churnedRaw.count
            }
        }

        // if (churnedRaw && Array.isArray(churnedRaw)) {
        //     const totalUsers = parseInt(engagedAdoptedData?.total_users || '0');
        //     const neverLoggedIn = churnedRaw.find(item => item.churn_status === 'Never Logged In');
        //     const oneMonth = churnedRaw.find(item => item.churn_status === '1-3 months');
        //     const threeMonths = churnedRaw.find(item => item.churn_status === '3-6 months');
        //     const sixMonths = churnedRaw.find(item => item.churn_status === '6-12 months');

        //     const neverLoggedInCount = parseInt(neverLoggedIn?.count || '0');
        //     const oneMonthCount = parseInt(oneMonth?.count || '0');
        //     const threeMonthsCount = parseInt(threeMonths?.count || '0');
        //     const sixMonthsCount = parseInt(sixMonths?.count || '0');
        //     const totalChurned = neverLoggedInCount + oneMonthCount + threeMonthsCount + sixMonthsCount;

        //     churnedUsers = {
        //         neverLoggedIn: neverLoggedInCount,
        //         neverLoggedInPercentage: totalUsers > 0 ? Math.round((neverLoggedInCount / totalUsers) * 100) : 0,
        //         churned1Month: oneMonthCount,
        //         churned1MonthPercentage: totalUsers > 0 ? Math.round((oneMonthCount / totalUsers) * 100) : 0,
        //         churned3Months: threeMonthsCount,
        //         churned3MonthsPercentage: totalUsers > 0 ? Math.round((threeMonthsCount / totalUsers) * 100) : 0,
        //         churned6Months: sixMonthsCount,
        //         churned6MonthsPercentage: totalUsers > 0 ? Math.round((sixMonthsCount / totalUsers) * 100) : 0,
        //         totalChurned: totalChurned,
        //         totalUsers: totalUsers,
        //         churnRate: totalUsers > 0 ? Math.round((totalChurned / totalUsers) * 100 * 100) / 100 : 0
        //     };
        // }

        return {
            engagedUsers,
            adoptedUsers,
            repeatVsNew,
            disengagedUsers,
            churnedUsers
        };
    }, [
        engagedAdoptedUsersData,
        repeatVsNewData,
        disengagedUsersData,
        churnedUsersData
    ]);

    // Process resource engagement data
    const resourceEngagementMetrics = useMemo(() => {
        const resourceData = resourceEngagementData?.data?.data
        const totalPageViews = resourceEngagementData?.data?.pageViews || 0;

        if (!resourceData || !Array.isArray(resourceData)) return null;

        let totalInteractions = 0;
        let totalUniqueUsers = 0;

        resourceData.forEach(item => {
            totalInteractions += parseInt(item.modal_views || '0') +
                parseInt(item.downloads || '0') +
                parseInt(item.opens || '0');
            totalUniqueUsers += parseInt(item.unique_users || '0');
        });

        const engagementPercentage = totalPageViews > 0
            ? Math.round((totalInteractions / totalPageViews) * 100 * 100) / 100
            : 0;

        return {
            totalInteractions,
            totalPageViews,
            engagementPercentage
        };
    }, [resourceEngagementData]);

    return {
        data: analyticsData,
        calculatedMetrics,
        resourceEngagementMetrics,
        isLoading,
        hasErrors,
        loadingStates: {
            engagedAdoptedUsers: engagedAdoptedUsersLoading,
            repeatVsNew: repeatVsNewLoading,
            engagementHours: engagementHoursLoading,
            resourceEngagement: resourceEngagementLoading,
            disengagedUsers: disengagedUsersLoading,
            churnedUsers: churnedUsersLoading
        },
        errors: {
            engagedAdoptedUsers: engagedAdoptedUsersError,
            repeatVsNew: repeatVsNewError,
            engagementHours: engagementHoursError,
            resourceEngagement: resourceEngagementError,
            disengagedUsers: disengagedUsersError,
            churnedUsers: churnedUsersError
        }
    };
};
