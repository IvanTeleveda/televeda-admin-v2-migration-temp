import React from 'react';
import { Card, Col, Row, Statistic, Tooltip } from '@pankod/refine-antd';
import { TeamOutlined, UserOutlined } from '@ant-design/icons';

interface EngagedUsersData {
    engagedUsers: number;
    activeUsers: number;
    engagementPercentage: number;
}

interface EngagedUsersTileProps {
    communityIds?: any;
    dateRange?: any;
    apiUrl: string;
    data?: EngagedUsersData | null;
    isLoading?: boolean;
    error?: any;
}

export const EngagedUsersTile: React.FC<EngagedUsersTileProps> = ({
    communityIds,
    dateRange,
    apiUrl,
    data: engagedUsersData,
    isLoading,
    error
}) => {
    if (error) {
        return (
            <Card hoverable>
                <Statistic
                    title="Engaged Users"
                    value="Error"
                    valueStyle={{ color: '#ff4d4f' }}
                    prefix={<TeamOutlined />}
                />
            </Card>
        );
    }

    return (
        <Tooltip title="Percentage of active users who have engaged with content (watched on-demand classes, attended live events, or engaged with community resources) in the last 30 days">
            <Card hoverable className="stat-tile" title="Engaged Users">
                <Row gutter={24}>
                    <Col span={24}>
                        <Statistic
                            title="Engagement Percentage"
                            value={engagedUsersData ? `${engagedUsersData.engagementPercentage.toFixed(2)}% (${engagedUsersData.engagedUsers}/${engagedUsersData.activeUsers})` : '0% (0/0)'}
                            valueStyle={{ color: '#52c41a' }}
                            prefix={<UserOutlined />}
                            loading={isLoading}
                        />
                    </Col>
                </Row>
            </Card>
        </Tooltip>
    );
};
