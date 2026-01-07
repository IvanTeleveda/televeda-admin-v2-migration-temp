import React, { useMemo } from "react";
import { Table, Typography, Space, Tooltip, Card, Row, Col } from "antd";
import { useCustom } from "@refinedev/core";
import { InfoCircleOutlined } from '@ant-design/icons';
import moment from "moment";
import dayjs, { Dayjs } from "dayjs";
import { formatTime } from "../../util";

const { Text } = Typography;

interface CommunityTimeData {
    communityId: string;
    communityName: string;
    totalTimeSpent: number;
    memberCount: number;
    averageTimeSpent: number;
}

interface CommunityTimeTableProps {
    communityIds: string | string[] | undefined | null | number | { value: string; label: string };
    dateRange: [Dayjs, Dayjs];
    apiUrl: string;
}

export const CommunityTimeAnalyticsTable: React.FC<CommunityTimeTableProps> = ({
    communityIds,
    dateRange,
    apiUrl
}) => {
    const timezone = useMemo(() => moment.tz.guess(), []);

    const query = useMemo(() => ({
        start: dateRange[0].startOf('day').toISOString(),
        end: dateRange[1].endOf('day').toISOString(),
        timezone,
        communityIds,
    }), [communityIds, dateRange, timezone]);

    const url = `${apiUrl}/analytics/communityTimeMetrics`;
    const { data, isLoading } = useCustom<{
        data: CommunityTimeData[];
    }>({
        url,
        method: "get",
        config: { query }
    });

    // Calculate totals
    const totals = useMemo(() => {
        if (!data?.data?.data) return { totalTime: 0, totalMembers: 0, overallAverage: 0 };
        
        const totalTime = data.data.data.reduce((sum, item) => sum + item.totalTimeSpent, 0);
        const totalMembers = data.data.data.reduce((sum, item) => sum + item.memberCount, 0);
        const overallAverage = totalMembers > 0 ? totalTime / totalMembers : 0;
        
        return { totalTime, totalMembers, overallAverage };
    }, [data]);

    // Columns configuration
    const columns = [
        {
            title: "Community",
            dataIndex: "communityName",
            key: "communityName",
            sorter: (a: CommunityTimeData, b: CommunityTimeData) => 
                a.communityName.localeCompare(b.communityName),
        },
        {
            title: "Total Time Spent",
            dataIndex: "totalTimeSpent",
            key: "totalTimeSpent",
            render: (value: number) => formatTime(value),
            align: 'center' as const,
            sorter: (a: CommunityTimeData, b: CommunityTimeData) => 
                a.totalTimeSpent - b.totalTimeSpent,
        },
        {
            title: "Active Members",
            dataIndex: "memberCount",
            key: "memberCount",
            align: 'center' as const,
            sorter: (a: CommunityTimeData, b: CommunityTimeData) => 
                a.memberCount - b.memberCount,
        },
        {
            title: "Average Time per Member",
            dataIndex: "averageTimeSpent",
            key: "averageTimeSpent",
            render: (value: number) => formatTime(value),
            align: 'center' as const,
            sorter: (a: CommunityTimeData, b: CommunityTimeData) => 
                a.averageTimeSpent - b.averageTimeSpent,
        }
    ];

    if (!communityIds) {
        return (
            <Card style={{ textAlign: 'center', padding: 40 }}>
                <Text type="secondary">Select a community to view time analytics</Text>
            </Card>
        );
    }

    return (
        <div style={{ padding: '0 24px' }}>
            <div style={{ marginBottom: 24 }}>
                <Space direction="vertical" size={0}>
                    <Text strong style={{ fontSize: 18 }}>
                        Community Time Analytics
                        <Tooltip
                            title="Shows average and total time spent by members per community over the selected period"
                            placement="bottom"
                        >
                            <InfoCircleOutlined
                                style={{
                                    marginLeft: 10,
                                    fontSize: 16,
                                    color: '#1890ff'
                                }}
                            />
                        </Tooltip>
                    </Text>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                        Period: {dateRange[0].format('MMM DD, YYYY')} - {dateRange[1].format('MMM DD, YYYY')}
                    </Text>
                </Space>
            </div>

            {/* Summary Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card size="small">
                        <Text type="secondary">Total Time Across Communities</Text>
                        <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
                            {formatTime(totals.totalTime)}
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card size="small">
                        <Text type="secondary">Total Active Members</Text>
                        <div style={{ fontSize: 20, fontWeight: 'bold', color: '#52c41a' }}>
                            {totals.totalMembers}
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card size="small">
                        <Text type="secondary">Overall Average per Member</Text>
                        <div style={{ fontSize: 20, fontWeight: 'bold', color: '#722ed1' }}>
                            {formatTime(totals.overallAverage)}
                        </div>
                    </Card>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={data?.data?.data || []}
                loading={isLoading}
                pagination={false}
                scroll={{ x: true }}
                rowKey="communityId"
                locale={{
                    emptyText: "No data found. Please adjust your search and try again."
                }}
            />
        </div>
    );
};