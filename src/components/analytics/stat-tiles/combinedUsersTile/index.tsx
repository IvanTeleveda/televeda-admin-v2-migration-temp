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

    return (
        <Card hoverable className="stat-tile" title="Engaged & Adopted Users">
            <Row gutter={16}>
                <Col span={12}>
                    <Tooltip title="Users who logged in and engaged with content">
                        <Statistic
                            title="Engaged Users"
                            value={engagedData ? engagedData.engagedUsers : '0'}
                            valueStyle={{ color: '#52c41a', fontSize: '14px' }}
                            prefix={<TeamOutlined />}
                            loading={isLoading}
                        />
                    </Tooltip>
                </Col>
                <Col span={12}>
                    <Tooltip title={"Users who joined televeda and engaged with content"}>
                        <Statistic
                            title="Adopted Users"
                            value={adoptedData ? adoptedData.engagedAccounts : '0'}
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