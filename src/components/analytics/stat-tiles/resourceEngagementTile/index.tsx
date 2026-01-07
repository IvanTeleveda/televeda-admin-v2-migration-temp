import React from 'react';
import { Card, Row, Col, Statistic, Tooltip } from '@pankod/refine-antd';
import { VideoCameraAddOutlined, EyeOutlined } from '@ant-design/icons';

interface ResourceEngagementTileProps {
    data?: {
        totalInteractions: number;
        totalPageViews: number;
        engagementPercentage: number;
    } | null;
    isLoading?: boolean;
    error?: any;
}

export const ResourceEngagementTile: React.FC<ResourceEngagementTileProps> = ({
    data: resourceEngagementData,
    isLoading,
    error
}) => {

    if (error) {
        return (
            <Card hoverable className="stat-tile">
                <Row gutter={16}>
                    <Col span={12}>
                        <Statistic
                            title="Resource Engagement"
                            value="Error"
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Col>
                </Row>
            </Card>
        );
    }

    return (
        <Card hoverable className="stat-tile" title="Resource Engagement">
            <Row gutter={16}>
                <Col span={12}>
                    <Tooltip title="Total resource interactions including downloads, clicks, and views">
                        <Statistic
                            title="Total Interactions"
                            value={resourceEngagementData?.totalInteractions || 0}
                            valueStyle={{ color: '#f5222d', fontSize: '14px' }}
                            prefix={<VideoCameraAddOutlined />}
                            loading={isLoading}
                            formatter={(value) => {
                                const num = Number(value);
                                if (num >= 1000000) {
                                    return `${(num / 1000000).toFixed(1)}M`;
                                } else if (num >= 1000) {
                                    return `${(num / 1000).toFixed(1)}K`;
                                }
                                return num.toLocaleString();
                            }}
                        />
                    </Tooltip>
                </Col>
                <Col span={12}>
                    <Tooltip title="Percentage of page views that resulted in resource engagement">
                        <Statistic
                            title="Engagement"
                            value={resourceEngagementData?.engagementPercentage || 0}
                            suffix="%"
                            valueStyle={{ color: '#722ed1', fontSize: '14px' }}
                            prefix={<EyeOutlined />}
                            loading={isLoading}
                            precision={2}
                        />
                    </Tooltip>
                </Col>
            </Row>
        </Card>
    );
};
