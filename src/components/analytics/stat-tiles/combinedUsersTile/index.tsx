import React from 'react';
import { Card, Row, Col, Statistic, Tooltip } from '@pankod/refine-antd';
import { TeamOutlined, UserOutlined, UserAddOutlined } from '@ant-design/icons';

interface CombinedUsersData {
    engaged: {
        engagedUsers: number;
        activeUsers: number;
        engagementPercentage: number;
    };
    adopted: {
        totalAccounts: number;
        engagedAccounts: number;
        adoptionPercentage: number;
        averageDaysToFirstEngagement?: number;
    };
}

interface CombinedUsersTileProps {
    communityIds?: any;
    dateRange?: any;
    apiUrl: string;
    engagedData?: CombinedUsersData['engaged'] | null;
    adoptedData?: CombinedUsersData['adopted'] | null;
    isLoading?: boolean;
    error?: any;
}

export const CombinedUsersTile: React.FC<CombinedUsersTileProps> = ({
    engagedData,
    adoptedData,
    isLoading,
    error
}) => {
    if (error) {
        return (
            <Card hoverable className="stat-tile" title="Users Metrics">
                <Statistic value="Error" valueStyle={{ color: '#ff4d4f' }} />
            </Card>
        );
    }

    const adoptionTooltip = adoptedData?.averageDaysToFirstEngagement 
        ? `Percentage of accounts that joined vs engaged with content. Average time to first engagement: ${adoptedData.averageDaysToFirstEngagement.toFixed(1)} days`
        : 'Percentage of accounts that joined vs engaged with content (watched on-demand classes, attended live events, or engaged with community resources)';

    return (
        <Card hoverable className="stat-tile" title="Engaged & Adopted Users">
            <Row gutter={16}>
                <Col span={12}>
                    <Tooltip title="Percentage of active users who have engaged with content (watched on-demand classes, attended live events, or engaged with community resources) in the last 30 days">
                        <Statistic
                            title="Engaged Users"
                            value={engagedData ? `${engagedData.engagementPercentage.toFixed(2)}% (${engagedData.engagedUsers}/${engagedData.activeUsers})` : '0% (0/0)'}
                            valueStyle={{ color: '#52c41a', fontSize: '14px' }}
                            prefix={<TeamOutlined />}
                            loading={isLoading}
                        />
                    </Tooltip>
                </Col>
                <Col span={12}>
                    <Tooltip title={adoptionTooltip}>
                        <Statistic
                            title="Adopted Users"
                            value={adoptedData ? `${adoptedData.adoptionPercentage.toFixed(2)}% (${adoptedData.engagedAccounts}/${adoptedData.totalAccounts})` : '0% (0/0)'}
                            valueStyle={{ color: '#1890ff', fontSize: '14px' }}
                            prefix={<UserAddOutlined />}
                            loading={isLoading}
                        />
                    </Tooltip>
                </Col>
            </Row>
        </Card>
    );
};