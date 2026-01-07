import React from 'react';
import { Card, Row, Col, Statistic, Tooltip } from '@pankod/refine-antd';
import { FrownOutlined, MehOutlined, UserOutlined } from '@ant-design/icons';

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
    communityIds?: any;
    dateRange?: any;
    apiUrl: string;
    data?: ChurnedUsersData | null;
    isLoading?: boolean;
    error?: any;
}

export const ChurnedUsersTile: React.FC<ChurnedUsersTileProps> = ({
    communityIds,
    dateRange,
    apiUrl,
    data: churnedUsersData,
    isLoading,
    error
}) => {

    if (error) {
        return (
            <Card hoverable className="stat-tile">
                <Row gutter={16}>
                    <Col span={8}>
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

    return (
        <Tooltip title="Total number of users who have not logged back into the site in the specified time periods">
            <Card hoverable className="stat-tile" title="Churned Users">
                <Row gutter={24}>
                    {/* <Col span={6}>
                        <Statistic
                            title="Never Logged In"
                            value={churnedUsersData?.neverLoggedIn || 0}    
                            suffix={`(${churnedUsersData?.neverLoggedInPercentage || 0})`}
                            valueStyle={{ color: '#faad14' }}
                            prefix={<UserOutlined />}
                            loading={isLoading}
                        />
                    </Col> */}
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
};
