import { Col, Row, Space, Typography, Alert } from "@pankod/refine-antd";
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

import { usePermissions } from "@refinedev/core";
import { UserPermissions } from "../../../interfaces";

const { Text } = Typography;

interface SummaryContainerProps {
    dateRange: any;
    communityIds?: any;
    apiUrl: string;
    analyticsData: any;
    calculatedMetrics: any;
    resourceEngagementMetrics: any;
    loadingStates: {
        engagedAdoptedUsers: boolean;
        repeatVsNew: boolean;
        engagementHours: boolean;
        resourceEngagement: boolean;
        disengagedUsers: boolean;
        churnedUsers: boolean;
    };
    hasErrors: boolean;
    errors: any;
}

export const SummaryContainer: React.FC<SummaryContainerProps> = ({
    dateRange,
    communityIds,
    apiUrl,
    analyticsData,
    calculatedMetrics,
    resourceEngagementMetrics,
    loadingStates,
    hasErrors,
    errors
}) => {
    const { mode } = useContext(ColorModeContext);

    const { data: permissionsData } = usePermissions<UserPermissions>();

    // Get engagement hours from the analytics data
    const engagementHours = analyticsData?.engagementHours;

    const formattedDateRange = useMemo(() => {
        if (!dateRange || !dateRange[0] || !dateRange[1]) return "";
        return `${dateRange[0].format('MMM DD, YYYY')} - ${dateRange[1].format('MMM DD, YYYY')}`;
    }, [dateRange]);


    // Check if engagement hours data is zero or empty
    const hasNoData = useMemo(() => {
        if (!engagementHours) return false;
        return (
            (engagementHours.totalHours || 0) === 0 &&
            (engagementHours.streamingHours || 0) === 0 &&
            (engagementHours.onSiteHours || 0) === 0
        );
    }, [engagementHours]);

    return (
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
                {/* {!isLoading && hasNoData && (
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
                )} */}

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
                                isLoading={loadingStates.engagedAdoptedUsers}
                                error={errors.engagedAdoptedUsers}
                            />
                        </Col>

                        <Col xs={24} sm={12} md={8} style={{ display: 'flex' }}>
                            <EngagementHoursTile
                                totalHours={engagementHours?.totalHours || 0}
                                streamingHours={engagementHours?.streamingHours || 0}
                                onSiteHours={engagementHours?.onSiteHours || 0}
                                isLoading={loadingStates.engagementHours}
                            />
                        </Col>

                        <Col xs={24} sm={12} md={8} style={{ display: 'flex' }}>
                            <RepeatVsNewTile
                                communityIds={communityIds}
                                dateRange={dateRange}
                                apiUrl={apiUrl}
                                data={calculatedMetrics?.repeatVsNew}
                                isLoading={loadingStates.repeatVsNew}
                                error={errors.repeatVsNew}
                            />
                        </Col>
                    </Row>

                    {permissionsData && permissionsData === 'TelevedaAdmin' &&
                        <Row gutter={[16, 16]} style={{ display: 'flex', minHeight: '200px' }}>

                            <Col xs={24} sm={12} md={8} style={{ display: 'flex' }}>
                                <ResourceEngagementTile
                                    data={resourceEngagementMetrics}
                                    isLoading={loadingStates.resourceEngagement}
                                    error={errors.resourceEngagement}
                                />
                            </Col>

                            <Col xs={24} sm={12} md={8} style={{ display: 'flex', }}>
                                <DisengagedUsersTile
                                    data={calculatedMetrics?.disengagedUsers}
                                    total={calculatedMetrics?.disengagedUsers?.totalDisengaged}
                                    isLoading={loadingStates.disengagedUsers}
                                    error={errors.disengagedUsers}
                                />
                            </Col>

                            <Col xs={24} sm={12} md={8} style={{ display: 'flex' }}>
                                <ChurnedUsersTile
                                    data={calculatedMetrics?.churnedUsers}
                                    total={calculatedMetrics?.churnedUsers?.totalChurned}
                                    isLoading={loadingStates.churnedUsers}
                                    error={errors.churnedUsers}
                                />
                            </Col>
                        </Row>
                    }
                </div>
            </Space>
    );
};