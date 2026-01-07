import { Col, Space, Table, TextField, Typography, Button } from "@pankod/refine-antd";
import { useMemo, useEffect, useContext } from "react";
import { CrudFilters, HttpError, IResourceComponentsProps } from "@refinedev/core";
import dayjs from "dayjs";
import moment from "moment";
import { ShowButton, useTable } from "@refinedev/antd";
import { Tooltip } from 'antd';
import { ColorModeContext } from "../../contexts/color-mode";

interface ResourceListProps extends IResourceComponentsProps {
    communityIds?: any;
    dateRange?: any;
    apiUrl?: string;
}

const ResourceList: React.FC<ResourceListProps> = ({ communityIds, dateRange, apiUrl }) => {
    const { mode } = useContext(ColorModeContext);
    const tz = useMemo(() => {
        return moment.tz.guess()
    }, []);

    // Create initial filters based on global filters
    const initialFilters = useMemo(() => {
        const filters: CrudFilters = [];

        if (dateRange && dateRange[0] && dateRange[1]) {
            filters.push(
                { field: "start", operator: "gte", value: dateRange[0].startOf('day').toISOString() },
                { field: "end", operator: "lte", value: dateRange[1].endOf('day').toISOString() }
            );
        } else {
            // Default to last 7 days if no date range
            filters.push(
                { field: "start", operator: "gte", value: dayjs().subtract(7, "days").toISOString() },
                { field: "end", operator: "lte", value: dayjs().toISOString() }
            );
        }

        // Add community filter if available
        if (communityIds && Array.isArray(communityIds) && communityIds.length > 0) {
            filters.push({ field: "communityIds", operator: "in", value: communityIds });
        } else if (communityIds && typeof communityIds === 'string' && communityIds !== 'all') {
            filters.push({ field: "communityIds", operator: "eq", value: communityIds });
        }

        return filters;
    }, [dateRange, communityIds]);

    const { tableProps: tableUserPageInteractionProps, setFilters } = useTable<{ 
        resourceName: string;
        totalCount: number;
        events: { date: string; eventType: string }[];
    }, HttpError>({
        resource: "analytics/communityItemsEvents",
        permanentFilter: [
            { field: 'timezone', operator: 'eq', value: tz }
        ],
        pagination: {
            pageSize: 10,
        },
        sorters: {
            mode: 'off',
        },
        syncWithLocation: false, // Don't sync with location since we're using global filters
        initialSorter: [
            {
                field: "createdAt",
                order: "desc",
            },
        ],
        filters: {
            initial: initialFilters
        }
    });

    // Update filters when global filters change
    useEffect(() => {
        setFilters(initialFilters);
    }, [initialFilters, setFilters]);

    return (
        <>
             <Col span={24}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ marginBottom: 24 }}>
                            <Space direction="vertical" size={0}>
                                <Typography.Text style={{ fontSize: 18 }} strong>
                                    Resource Analytics
                                </Typography.Text>
                                <Typography.Text type="secondary" style={{ fontSize: 14 }}>
                                    {dateRange && dateRange[0] && dateRange[1] 
                                        ? `Period: ${dateRange[0].format('MMM DD, YYYY')} - ${dateRange[1].format('MMM DD, YYYY')}`
                                        : 'Using default date range (last 7 days)'
                                    }
                                </Typography.Text>
                            </Space>
                        </div>

                         <Table 
                            {...tableUserPageInteractionProps} 
                            rowKey="resourceName"
                            locale={{
                                emptyText: (
                                    <div style={{ 
                                        textAlign: 'center', 
                                        padding: '60px 20px',
                                        background: mode === 'dark' ? '#1f1f1f' : '#fafafa',
                                        borderRadius: '8px',
                                        border: mode === 'dark' ? '1px solid #303030' : '1px solid #d9d9d9',
                                        margin: '20px 0'
                                    }}>
                                        <div style={{ fontSize: '48px', marginBottom: '16px', color: mode === 'dark' ? '#595959' : '#bfbfbf' }}>
                                            📁
                                        </div>
                                        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: mode === 'dark' ? '#ffffff' : '#595959' }}>
                                            No data found
                                        </div>
                                        <div style={{ fontSize: '14px', color: mode === 'dark' ? '#8c8c8c' : '#8c8c8c' }}>
                                            Please adjust your search and try again.
                                        </div>
                                    </div>
                                )
                            }}
                            expandable={{
                                expandedRowRender: (record: any) => {
                                    return (
                                        <Table 
                                            size="small" 
                                            rowKey="event_date" 
                                            pagination={false}
                                            dataSource={record.events}
                                            style={{paddingLeft: 10}}
                                        >
                                            <Table.Column
                                                title="Access Date"
                                                dataIndex="eventDate"
                                                key="eventDate"
                                                width={100}
                                            />
                                            <Table.Column
                                                title="Access Type"
                                                dataIndex="eventType"
                                                key="eventType"
                                                width={150}
                                            />
                                             <Table.Column
                                                title="User"
                                                dataIndex="userName"
                                                key="userName"
                                                width={100}
                                            />
                                             <Table.Column
                                                title="Community"
                                                dataIndex="communityName"
                                                key="communityName"
                                                width={200}
                                            />
                                        </Table>
                                    );
                                },
                                expandIcon: ({ expanded, onExpand, record }) => (
                                    record.events && record.events.length > 0 ? (
                                        <Tooltip title={expanded ? "Collapse" : "Expand event details"}>
                                            <Button
                                                className={`ant-table-row-expand-icon ant-table-row-expand-icon-${expanded ? "expanded" : "collapsed"}`}
                                                type="text"
                                                size="small"
                                                onClick={e => {
                                                    onExpand(record, e)
                                                }}
                                            >
                                            </Button>
                                        </Tooltip>
                                    ) : null
                                )
                            }}
                        >
                            <Table.Column
                                dataIndex="resourceName"
                                key="resourceName"
                                title="Resource Name"
                                render={(value) => <TextField value={value} />}
                                sorter
                            />
                            <Table.Column
                                dataIndex="totalCount"
                                key="totalCount"
                                title="Item interaction"
                                sorter
                            />
                             <Table.Column
                                title="Actions"
                                render={(_, record) => (
                                    <ShowButton size="small" shape="round" resourceNameOrRouteName="resource_analytics" recordItemId={record.id}>History</ShowButton>
                                )}
                            />
                        </Table>
                    </div>
            </Col>
        </>
    );
};

export default ResourceList;
