import React from 'react';
import { Card, Row, Col, Statistic, Tooltip } from '@pankod/refine-antd';
import { TeamOutlined, UserAddOutlined } from '@ant-design/icons';

interface RepeatVsNewData {
    repeatAttendees: number;
    newAttendees: number;
    repeatPercentage: number;
    newPercentage: number;
    totalAttendees: number;
}

interface RepeatVsNewTileProps {
    communityIds?: any;
    dateRange?: any;
    apiUrl: string;
    data?: {
        repeatAttendees: number;
        newAttendees: number;
        repeatPercentage: number;
        newPercentage: number;
        totalAttendees: number;
    } | null;
    isLoading?: boolean;
    error?: any;
}

export const RepeatVsNewTile: React.FC<RepeatVsNewTileProps> = ({
    communityIds,
    dateRange,
    apiUrl,
    data: repeatVsNewData,
    isLoading,
    error
}) => {

    if (error) {
        return (
            <Card hoverable className="stat-tile">
                <Row gutter={16}>
                    <Col span={12}>
                        <Statistic
                            title="Repeat vs New"
                            value="Error"
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Col>
                </Row>
            </Card>
        );
    }

    return (
        <Card hoverable className="stat-tile" title="Repeat vs New Attendees">
            <Row gutter={16}>
                <Col span={12}>
                    <Tooltip title="Number of users who have attended multiple events during this period">
                        <Statistic
                            title="Repeat Attendees"
                            value={repeatVsNewData?.repeatPercentage?.toFixed(2) + '%'}
                            suffix={`(${repeatVsNewData?.repeatAttendees || 0} / ${repeatVsNewData?.totalAttendees || 0})`}
                            valueStyle={{ color: '#52c41a', fontSize: '14px' }}
                            loading={isLoading}
                        />
                    </Tooltip>
                </Col>
                <Col span={12}>
                    <Tooltip title="Number of users attending their first event during this period">
                        <Statistic
                            title="New Attendees"
                            value={repeatVsNewData?.newPercentage?.toFixed(2) + '%'}
                            suffix={`(${repeatVsNewData?.newAttendees || 0} / ${repeatVsNewData?.totalAttendees || 0})`}
                            valueStyle={{ color: '#1890ff', fontSize: '14px' }}
                            loading={isLoading}
                        />
                    </Tooltip>
                </Col>
            </Row>
        </Card>
    );
};
