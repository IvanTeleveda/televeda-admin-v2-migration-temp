import React, { useMemo, useEffect } from "react";
import { Table, Typography, Space, Tooltip, Button } from "antd";
import { CrudFilters, HttpError } from "@refinedev/core";
import { InfoCircleOutlined } from '@ant-design/icons';
import moment from "moment";
import dayjs, { Dayjs } from "dayjs";
import { ShowButton, useTable } from "@refinedev/antd";
import { TextField } from "@pankod/refine-antd";

const { Text } = Typography;

interface ResourceData {
    resourceName: string;
    totalCount: number;
    events: {
        eventDate: string;
        eventType: string;
        userName: string;
        communityName: string;
    }[];
    id?: string;
}

interface ResourceAnalyticsTableProps {
    communityIds: string | string[] | undefined | null | number | { value: string; label: string };
    dateRange: [Dayjs, Dayjs];
    apiUrl: string;
}

export const ResourceAnalyticsTable: React.FC<ResourceAnalyticsTableProps> = ({
    communityIds,
    dateRange,
    apiUrl
}) => {
    const timezone = useMemo(() => moment.tz.guess(), []);

    // Create initial filters based on the global filters (similar to original)
    const initialFilters = useMemo(() => {
        const filters: CrudFilters = [];

        if (dateRange && dateRange[0] && dateRange[1]) {
            filters.push(
                { field: "start", operator: "gte", value: dateRange[0].startOf('day').toISOString() },
                { field: "end", operator: "lte", value: dateRange[1].endOf('day').toISOString() }
            );
        } else {
            // Default to last 7 days if no date range (like original)
            filters.push(
                { field: "start", operator: "gte", value: dayjs().subtract(7, "days").toISOString() },
                { field: "end", operator: "lte", value: dayjs().toISOString() }
            );
        }

        return filters;
    }, [dateRange, communityIds]);

    const { tableProps, setFilters } = useTable<ResourceData, HttpError>({
        resource: "analytics/communityItemsEvents",
        permanentFilter: [
            { field: 'timezone', operator: 'eq', value: timezone }
        ],
        pagination: {
            pageSize: 10,
        },
        sorters: {
            mode: 'off',
        },
        syncWithLocation: false,
        initialSorter: [
            {
                field: "createdAt",
                order: "desc",
            },
        ],
        filters: {
            initial: [
                { field: "start", operator: "gte", value: dayjs().subtract(7, "days").toISOString() },
                { field: "end", operator: "lte", value: dayjs().toISOString() }
            ]
        }
    });

    // Update filters when global filters change
    useEffect(() => {
        if (dateRange && dateRange[0] && dateRange[1]) {
            const newFilters: CrudFilters = [
                { field: "start", operator: "gte", value: dateRange[0].startOf('day').toISOString() },
                { field: "end", operator: "lte", value: dateRange[1].endOf('day').toISOString() }
            ];
            setFilters(newFilters);
        }
    }, [dateRange, setFilters]);

    // Columns configuration
    const columns = [
        {
            title: "Resource Name",
            dataIndex: "resourceName",
            key: "resourceName",
            render: (value: string) => <TextField value={value} />,
            sorter: (a: ResourceData, b: ResourceData) => 
                a.resourceName.localeCompare(b.resourceName),
        },
        {
            title: "Item Interaction",
            dataIndex: "totalCount",
            key: "totalCount",
            align: 'center' as const,
            sorter: (a: ResourceData, b: ResourceData) => 
                a.totalCount - b.totalCount,
        },
        {
            title: "Actions",
            key: "actions",
            align: 'center' as const,
            render: (_: any, record: ResourceData) => (
                <ShowButton 
                    size="small" 
                    shape="round" 
                    resourceNameOrRouteName="resource_analytics" 
                    recordItemId={record.id}
                >
                    History
                </ShowButton>
            ),
        }
    ];

    const expandedRowRender = (record: ResourceData) => {
        if (!record.events || record.events.length === 0) {
            return (
                <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                    No event details available
                </div>
            );
        }

        const expandedColumns = [
            {
                title: "Access Date",
                dataIndex: "eventDate",
                key: "eventDate",
                width: 150,
            },
            {
                title: "Access Type",
                dataIndex: "eventType",
                key: "eventType",
                width: 150,
            },
            {
                title: "User",
                dataIndex: "userName",
                key: "userName",
                width: 150,
            },
            {
                title: "Community",
                dataIndex: "communityName",
                key: "communityName",
                width: 200,
            }
        ];

        return (
            <Table 
                size="small" 
                rowKey="eventDate" 
                pagination={false}
                dataSource={record.events}
                columns={expandedColumns}
                style={{ paddingLeft: 10 }}
            />
        );
    };

    const expandIcon = ({ expanded, onExpand, record }: any) => {
        if (!record.events || record.events.length === 0) {
            return null;
        }

        return (
            <Tooltip title={expanded ? "Collapse" : "Expand event details"}>
                <Button
                    className={`ant-table-row-expand-icon ant-table-row-expand-icon-${expanded ? "expanded" : "collapsed"}`}
                    type="text"
                    size="small"
                    onClick={(e) => onExpand(record, e)}
                />
            </Tooltip>
        );
    };

    return (
        <div style={{ padding: '0 24px' }}>
            <div style={{ marginBottom: 24 }}>
                <Space direction="vertical" size={0}>
                    <Text strong style={{ fontSize: 18 }}>
                        Resource Analytics
                        <Tooltip
                            title="Shows resource interactions and usage metrics for the selected communities and time period"
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

            <Table
                {...tableProps}
                columns={columns}
                scroll={{ x: true }}
                rowKey="resourceName"
                expandable={{
                    expandedRowRender,
                    expandIcon,
                    rowExpandable: (record) => 
                        record.events && record.events.length > 0,
                }}
                locale={{
                    emptyText: "No data found. Please adjust your search and try again."
                }}
            />
        </div>
    );
};