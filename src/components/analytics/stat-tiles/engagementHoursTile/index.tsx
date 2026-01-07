import React from 'react';
import { Card, Row, Col, Statistic, Tooltip } from '@pankod/refine-antd';
import { EyeOutlined, VideoCameraOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { formatTime } from '../../util';

interface EngagementHoursTileProps {
    totalHours: number;
    streamingHours: number;
    onSiteHours: number;
    isLoading?: boolean;
}

export const EngagementHoursTile: React.FC<EngagementHoursTileProps> = ({
    totalHours,
    streamingHours,
    onSiteHours,
    isLoading
}) => {
    return (
        <Card hoverable className="stat-tile" title="Engagement Hours">
            <Row gutter={16}>
                <Col span={8}>
                    <Tooltip title="Total engagement time across all activities (streaming + on-site page time)">
                        <Statistic
                            title="Total"
                            value={formatTime(totalHours * 60)} // Convert hours to minutes for formatTime
                            prefix={<ClockCircleOutlined />}
                            loading={isLoading}
                            valueStyle={{ fontSize: '14px' }}
                        />
                    </Tooltip>
                </Col>
                <Col span={8}>
                    <Tooltip title="Time spent on streaming content including live events, on-demand classes, and VTC sessions">
                        <Statistic
                            title="Streaming"
                            value={formatTime(streamingHours * 60)} // Convert hours to minutes for formatTime
                            prefix={<VideoCameraOutlined />}
                            loading={isLoading}
                            valueStyle={{ fontSize: '14px' }}
                        />
                    </Tooltip>
                </Col>
                <Col span={8}>
                    <Tooltip title="Time spent browsing pages and engaging with community resources">
                        <Statistic
                            title="On-Site"
                            value={formatTime(onSiteHours * 60)} // Convert hours to minutes for formatTime
                            prefix={<EyeOutlined />}
                            loading={isLoading}
                            valueStyle={{ fontSize: '14px' }}
                        />
                    </Tooltip>
                </Col>
            </Row>
        </Card>
    );
};
