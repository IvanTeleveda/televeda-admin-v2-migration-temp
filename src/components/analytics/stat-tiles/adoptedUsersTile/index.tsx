import React from 'react';
import { Card, Col, Row, Statistic, Tooltip } from '@pankod/refine-antd';
import { UserAddOutlined, UserOutlined } from '@ant-design/icons';

interface AdoptedUsersData {
    totalAccounts: number;
    engagedAccounts: number;
    adoptionPercentage: number;
    averageDaysToFirstEngagement?: number;
}

interface AdoptedUsersTileProps {
    communityIds?: any;
    dateRange?: any;
    apiUrl: string;
    data?: {
        totalAccounts: number;
        engagedAccounts: number;
        adoptionPercentage: number;
        averageDaysToFirstEngagement?: number;
    } | null;
    isLoading?: boolean;
    error?: any;
}

export const AdoptedUsersTile: React.FC<AdoptedUsersTileProps> = ({
    communityIds,
    dateRange,
    apiUrl,
    data: adoptedUsersData,
    isLoading,
    error
}) => {

    if (error) {
        return (
            <Card hoverable>
                <Statistic
                    title="Adopted Users"
                    value="Error"
                    valueStyle={{ color: '#ff4d4f' }}
                    prefix={<UserAddOutlined />}
                />
            </Card>
        );
    }

    const tooltipTitle = adoptedUsersData?.averageDaysToFirstEngagement 
        ? `Percentage of accounts that joined vs engaged with content. Average time to first engagement: ${adoptedUsersData.averageDaysToFirstEngagement.toFixed(1)} days`
        : 'Percentage of accounts that joined vs engaged with content (watched on-demand classes, attended live events, or engaged with community resources)';

    return (
        <Tooltip title={tooltipTitle}>
            <Card hoverable className="stat-tile" title="Adopted Users">
                <Row gutter={24}>
                    <Col span={24}> 
                        <Statistic
                            title="Adoption Percentage"
                            value={adoptedUsersData ? `${adoptedUsersData.adoptionPercentage.toFixed(2)}% (${adoptedUsersData.engagedAccounts}/${adoptedUsersData.totalAccounts})` : '0% (0/0)'}
                            valueStyle={{ color: '#1890ff' }}
                            prefix={<UserOutlined />}
                            loading={isLoading}
                        />
                    </Col>
                </Row>
            </Card>
        </Tooltip>
    );
};
