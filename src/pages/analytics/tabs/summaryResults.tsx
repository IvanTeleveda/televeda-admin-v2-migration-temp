import { Col, Row, Space, Spin, Typography, Alert } from "@pankod/refine-antd";
import { useMemo, useContext } from "react";
import { ColorModeContext } from "../../../contexts/color-mode";
import "../../../components/analytics/stat-tiles/styles.css";

// Import new stat tile components
import {
    CombinedUsersTile,
    EngagementHoursTile,
    RepeatVsNewTile,
    ResourceEngagementTile,
    DisengagedUsersTile,
    ChurnedUsersTile
} from "../../../components/analytics";

// Import analytics data hook
import { useAnalyticsData } from "../../../hooks/useAnalyticsData";
import { usePermissions } from "@refinedev/core";
import { UserPermissions } from "../../../interfaces";

const { Text } = Typography;

interface SummaryResult {
    attendance: number;
    engagementMinutes: number;
    events: number;
    registrations: number;
    totalTimeAcrossCommunities: number;
    totalActiveMembers: number;
    overallAveragePerMember: number;
}

interface SummaryContainerProps {
    dateRange: any;
    summaryData: SummaryResult | undefined;
    isLoading: boolean;
    communityIds?: any;
    apiUrl: string;
}

export const SummaryContainer: React.FC<SummaryContainerProps> = ({
    dateRange,
    summaryData,
    isLoading,
    communityIds,
    apiUrl
}) => {
    const { mode } = useContext(ColorModeContext);

    const { data: permissionsData } = usePermissions<UserPermissions>();

    // Use the analytics data hook for new metrics
    const { data: analyticsData, calculatedMetrics, resourceEngagementMetrics, isLoading: analyticsLoading, hasErrors, errors } = useAnalyticsData({
        communityIds,
        dateRange,
        apiUrl
    });

    const formattedDateRange = useMemo(() => {
        if (!dateRange || !dateRange[0] || !dateRange[1]) return "";
        return `${dateRange[0].format('MMM DD, YYYY')} - ${dateRange[1].format('MMM DD, YYYY')}`;
    }, [dateRange]);


    // Check if all summary data is zero or empty
    const hasNoData = useMemo(() => {
        if (!summaryData) return false;
        return (
            summaryData.registrations === 0 &&
            summaryData.attendance === 0 &&
            summaryData.engagementMinutes === 0 &&
            summaryData.events === 0 &&
            summaryData.totalTimeAcrossCommunities === 0 &&
            summaryData.totalActiveMembers === 0 &&
            summaryData.overallAveragePerMember === 0
        );
    }, [summaryData]);

    return (
        <Spin spinning={isLoading} tip="Loading summary data...">
            <Space direction="vertical" style={{ width: '100%' }}>
                {/* Date Range Display */}
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <Text strong style={{ fontSize: 16 }}>
                        Showing data for: {formattedDateRange || 'Loading...'}
                    </Text>
                    {dateRange && (
                        <div style={{ marginTop: 4 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {dateRange[0].isSame(dateRange[1], 'day')
                                    ? 'Single day view'
                                    : `${dateRange[1].diff(dateRange[0], 'day') + 1} day period`
                                }
                            </Text>
                        </div>
                    )}
                </div>

                {/* Show "No data found" message when all values are zero */}
                {!isLoading && hasNoData && (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        background: mode === 'dark' ? '#1f1f1f' : '#fafafa',
                        borderRadius: '8px',
                        border: mode === 'dark' ? '1px solid #303030' : '1px solid #d9d9d9',
                        margin: '20px 0'
                    }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: mode === 'dark' ? '#ffffff' : '#595959' }}>
                            No data found
                        </div>
                        <div style={{ fontSize: '14px', color: mode === 'dark' ? '#8c8c8c' : '#8c8c8c' }}>
                            Please adjust your search and try again.
                        </div>
                    </div>
                )}

                {/* Show analytics errors if any */}
                {hasErrors && (
                    <Alert
                        message="Analytics Data Error"
                        description="Some analytics data could not be loaded. Please check your connection and try again."
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Row gutter={[16, 16]} style={{ display: 'flex', minHeight: '200px' }}>
                        <Col xs={24} sm={12} md={8} style={{ display: 'flex' }}>
                            <CombinedUsersTile
                                communityIds={communityIds}
                                dateRange={dateRange}
                                apiUrl={apiUrl}
                                engagedData={calculatedMetrics?.engagedUsers}
                                adoptedData={calculatedMetrics?.adoptedUsers}
                                isLoading={analyticsLoading}
                                error={errors.engagedAdoptedUsers}
                            />
                        </Col>

                        <Col xs={24} sm={12} md={8} style={{ display: 'flex' }}>
                            <EngagementHoursTile
                                totalHours={(summaryData?.engagementMinutes || 0) / 60}
                                streamingHours={(summaryData?.engagementMinutes || 0) / 60}
                                onSiteHours={(summaryData?.engagementMinutes || 0) / 60}
                                isLoading={isLoading}
                            />
                        </Col>

                        <Col xs={24} sm={12} md={8} style={{ display: 'flex' }}>
                            <RepeatVsNewTile
                                communityIds={communityIds}
                                dateRange={dateRange}
                                apiUrl={apiUrl}
                                data={calculatedMetrics?.repeatVsNew}
                                isLoading={analyticsLoading}
                                error={errors.repeatVsNew}
                            />
                        </Col>
                    </Row>

                    {permissionsData && permissionsData === 'TelevedaAdmin' &&
                        <Row gutter={[16, 16]} style={{ display: 'flex', minHeight: '200px' }}>

                            <Col xs={24} sm={12} md={8} style={{ display: 'flex' }}>
                                <ResourceEngagementTile
                                    communityIds={communityIds}
                                    dateRange={dateRange}
                                    apiUrl={apiUrl}
                                    data={resourceEngagementMetrics}
                                    isLoading={analyticsLoading}
                                    error={errors.resourceEngagement}
                                />
                            </Col>

                            <Col xs={24} sm={12} md={8} style={{ display: 'flex', }}>
                                <DisengagedUsersTile
                                    communityIds={communityIds}
                                    dateRange={dateRange}
                                    apiUrl={apiUrl}
                                    data={calculatedMetrics?.disengagedUsers}
                                    isLoading={analyticsLoading}
                                    error={errors.disengagedUsers}
                                />
                            </Col>

                            <Col xs={24} sm={12} md={8} style={{ display: 'flex' }}>
                                <ChurnedUsersTile
                                    communityIds={communityIds}
                                    dateRange={dateRange}
                                    apiUrl={apiUrl}
                                    data={calculatedMetrics?.churnedUsers}
                                    isLoading={analyticsLoading}
                                    error={errors.churnedUsers}
                                />
                            </Col>
                        </Row>
                    }
                </div>
            </Space>
        </Spin>
    );
};