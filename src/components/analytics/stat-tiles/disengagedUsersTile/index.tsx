import React from 'react';
import { Card, Row, Col, Statistic, Tooltip } from '@pankod/refine-antd';
import { FrownOutlined, MehOutlined, UserOutlined } from '@ant-design/icons';

interface DisengagedUsersData {
    disengaged1Month: number;
    disengaged1MonthPercentage: number;
    disengaged3Months: number;
    disengaged3MonthsPercentage: number;
    disengaged6Months: number;
    disengaged6MonthsPercentage: number;
    totalDisengaged: number;
}

interface DisengagedUsersTileProps {
    communityIds?: any;
    dateRange?: any;
    apiUrl: string;
    data?: DisengagedUsersData | null;
    isLoading?: boolean;
    error?: any;
}

export const DisengagedUsersTile: React.FC<DisengagedUsersTileProps> = ({
    communityIds,
    dateRange,
    apiUrl,
    data: disengagedUsersData,
    isLoading,
    error
}) => {

    if (error) {
        return (
            <Card hoverable className="stat-tile">
                <Row gutter={16}>
                    <Col span={8}>
                        <Statistic
                            title="Disengaged Users"
                            value="Error"
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Col>
                </Row>
            </Card>
        );
    }

    return (
        <Tooltip title="Total number of users who have not engaged with any content (classes, events, or resources) in the specified time periods">
            <Card hoverable className="stat-tile" title="Disengaged Users">
                <Row gutter={24}>
                    <Col span={8}>
                        <Statistic
                            title="1 Month"
                            value={(disengagedUsersData?.disengaged1MonthPercentage.toFixed(2) || 0) + '%'}
                            suffix={`(${disengagedUsersData?.disengaged1Month || 0} / ${disengagedUsersData?.totalDisengaged || 0})`}
                            valueStyle={{ color: '#faad14', fontSize: '14px' }}
                            prefix={<MehOutlined />}
                            loading={isLoading}
                        />
                    </Col>
                    <Col span={8}>
                        <Statistic
                            title="3 Months"
                            value={(disengagedUsersData?.disengaged3MonthsPercentage.toFixed(2) || 0) + '%'}
                            suffix={`(${disengagedUsersData?.disengaged3Months || 0} / ${disengagedUsersData?.totalDisengaged || 0})`}
                            valueStyle={{ color: '#fa8c16', fontSize: '14px' }}
                            prefix={<FrownOutlined />}
                            loading={isLoading}
                        />
                    </Col>
                    <Col span={8}>
                        <Statistic
                            title="6 Months"
                            value={(disengagedUsersData?.disengaged6MonthsPercentage.toFixed(2) || 0) + '%'}
                            suffix={`(${disengagedUsersData?.disengaged6Months || 0} / ${disengagedUsersData?.totalDisengaged || 0})`}
                            valueStyle={{ color: '#d4380d', fontSize: '14px' }}
                            prefix={<FrownOutlined />}
                            loading={isLoading}
                        />
                    </Col>
                </Row>
            </Card>
        </Tooltip>
    );
};
