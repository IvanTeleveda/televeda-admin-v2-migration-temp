import React from 'react';
import { Card, Row, Col, Statistic } from '@pankod/refine-antd';
import { EyeOutlined, VideoCameraOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { formatTime } from '../../util'; // Assuming util has formatTime

interface EngagementSummaryTileProps {
    pageViews: number;
    vtcViews: number;
    streamingTime: number;
    isLoading?: boolean;
}

export const EngagementSummaryTile: React.FC<EngagementSummaryTileProps> = ({
    pageViews,
    vtcViews,
    streamingTime,
    isLoading
}) => {
    return (
        <Card hoverable className="stat-tile" title="Engagement Summary">
            <Row gutter={16}>
                <Col span={8}>
                    <Statistic
                        title="Page Views"
                        value={pageViews}
                        prefix={<EyeOutlined />}
                        loading={isLoading}
                    />
                </Col>
                <Col span={8}>
                    <Statistic
                        title="VTC Views"
                        value={vtcViews}
                        prefix={<VideoCameraOutlined />}
                        loading={isLoading}
                    />
                </Col>
                <Col span={8}>
                    <Statistic
                        title="Streaming Time"
                        value={formatTime(streamingTime)}
                        prefix={<ClockCircleOutlined />}
                        loading={isLoading}
                    />
                </Col>
            </Row>
        </Card>
    );
};
