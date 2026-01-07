import React from 'react';
import { Card, Row, Col, Statistic, Tooltip } from '@pankod/refine-antd';
import { UserOutlined } from '@ant-design/icons';

interface ChurnedUsersData {
    neverLoggedIn: number;
    neverLoggedInPercentage: number;
    churned1Month: number;
    churned1MonthPercentage: number;
    churned3Months: number;
    churned3MonthsPercentage: number;
    churned6Months: number;
    churned6MonthsPercentage: number;
    totalChurned: number;
    totalUsers: number;
    churnRate: number;
}

interface ChurnedUsersTileProps {
    data?: ChurnedUsersData | null;
    isLoading?: boolean;
    error?: any;
    total?: number;
}

export const ChurnedUsersTile: React.FC<ChurnedUsersTileProps> = ({
    data: churnedUsersData,
    isLoading,
    error,
    total
}) => {

    if (error) {
        return (
            <Card hoverable className="stat-tile">
                <Row gutter={16}>
                    <Col span={24}>
                        <Statistic
                            title="Churned Users"
                            value="Error"
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Col>
                </Row>
            </Card>
        );
    }

    // Use total prop if provided, otherwise fall back to data.totalChurned
    const displayTotal = total ?? churnedUsersData?.totalChurned ?? 0;

    return (
        <Tooltip title="Users who were active before the specified date range but have since not logged in">
            <Card hoverable className="stat-tile" title="Churned Users">
                <Row gutter={16}>
                    <Col span={24}>
                        <Statistic
                            title="Total"
                            value={displayTotal}
                            valueStyle={{ fontSize: '24px' }}
                            prefix={<UserOutlined />}
                            loading={isLoading}
                        />
                    </Col>
                </Row>
            </Card>
        </Tooltip>
    );

    // Previous logic - commented out
    /*
    return (
        <Tooltip title="Total number of users who have not logged back into the site in the specified time period">
            <Card hoverable className="stat-tile" title="Churned Users">
                <Row gutter={24}>
                    <Col span={6}>
                        <Statistic
                            title="Never Logged In"
                            value={churnedUsersData?.neverLoggedIn || 0}    
                            suffix={`(${churnedUsersData?.neverLoggedInPercentage || 0})`}
                            valueStyle={{ color: '#faad14' }}
                            prefix={<UserOutlined />}
                            loading={isLoading}
                        />
                    </Col>
                    <Col span={8}>
                        <Statistic
                            title="1-3 months"
                            value={(churnedUsersData?.churned1MonthPercentage.toFixed(2) || 0) + '%'}
                            suffix={`(${churnedUsersData?.churned1Month || 0} / ${churnedUsersData?.totalUsers || 0})`}
                            valueStyle={{ color: '#fa8c16', fontSize: '14px' }}
                            prefix={<MehOutlined />}
                            loading={isLoading}
                        />
                    </Col>
                    <Col span={8}>
                        <Statistic
                            title="3-6 months"
                            value={(churnedUsersData?.churned3MonthsPercentage.toFixed(2) || 0) + '%'}
                            suffix={`(${churnedUsersData?.churned3Months || 0} / ${churnedUsersData?.totalUsers || 0})`}
                            valueStyle={{ color: '#d4380d', fontSize: '14px' }}
                            prefix={<FrownOutlined />}
                            loading={isLoading}
                        />
                    </Col>
                    <Col span={8}>
                        <Statistic
                            title="6-12 months"
                            value={(churnedUsersData?.churned6MonthsPercentage.toFixed(2) || 0) + '%'}
                            suffix={`(${churnedUsersData?.churned6Months || 0} / ${churnedUsersData?.totalUsers || 0})`}
                            valueStyle={{ color: '#a8071a', fontSize: '14px' }}
                            prefix={<FrownOutlined />}
                            loading={isLoading}
                        />
                    </Col>
                </Row>
            </Card>
        </Tooltip>
    );
    */
};
