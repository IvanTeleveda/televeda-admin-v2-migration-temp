import dayjs from "dayjs";
import {Area, AreaConfig, Column, ColumnConfig} from "@ant-design/plots";
import { useMemo, useContext, useState } from "react";
import { Space, NumberField, Typography, Skeleton, Tooltip, Card, Statistic, Row, Col, Form, Select, Empty } from "@pankod/refine-antd";
import { CollectionItemEvent } from "./index";
import { InfoCircleOutlined, WarningOutlined, CalendarOutlined } from '@ant-design/icons';
import {ColorModeContext} from "../../../../contexts/color-mode";
import { AnalyticsGroupType } from "../../../../pages/analytics";

export const CollectionItemsEventColumn: React.FC<{
    events: CollectionItemEvent[]  | undefined;
    dateRange: [dayjs.Dayjs, dayjs.Dayjs]
    periodEvents: number | undefined;
    toDateEvents: number | undefined;
    isLoading: boolean;
    title: string;
    eventDescription: string;
    isGroup: boolean,
    hideTooltip?: boolean;
    showLegend?: boolean;
    onGroupByChange?: (groupBy: AnalyticsGroupType) => void;
}> = ({
          events,
          dateRange,
          periodEvents,
          toDateEvents,
          isLoading,
          title,
          eventDescription,
          isGroup,
          hideTooltip,
          showLegend,
          onGroupByChange
      }) => {
    const { Text, Title } = Typography;
    const { mode } = useContext(ColorModeContext);
    const [form] = Form.useForm();
    const [groupByFilter, setGroupByFilter] = useState<AnalyticsGroupType>(AnalyticsGroupType.DAY);
    const isDark = mode === "dark";

    const handleGroupByChange = (value: AnalyticsGroupType) => {
        setGroupByFilter(value);
        if (onGroupByChange) {
            onGroupByChange(value);
        }
    };

    // Theme-aware colors
    const themeColors = {
        cardBg: isDark ? '#1f1f1f' : '#ffffff',
        cardBorder: isDark ? '#303030' : '#f0f0f0',
        chartBg: isDark ? '#262626' : '#fafafa',
        textPrimary: isDark ? '#ffffff' : '#262626',
        textSecondary: isDark ? '#bfbfbf' : '#8c8c8c',
        textMuted: isDark ? '#8c8c8c' : '#666',
        borderColor: isDark ? '#303030' : '#f0f0f0',
        gridColor: isDark ? '#303030' : '#f0f0f0',
        axisColor: isDark ? '#595959' : '#d9d9d9',
        tooltipBg: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        scrollbarThumb: isDark ? '#595959' : '#d9d9d9',
        scrollbarTrack: isDark ? '#262626' : '#f5f5f5'
    };

    const config: AreaConfig = useMemo(() => {
        return {
            data: events || [],
            loading: isLoading,
            autoFit: true,
            height: 280,
            padding: [20, 20, 50, 50],
            xField: 'event_date',
            yField: 'event_count',
            seriesField: 'eventType',
            isStack: true,
            smooth: true,
            color: ['#1890ff', '#52c41a', '#722ed1', '#fa8c16', '#eb2f96'],
            legend: showLegend ? {
                position: 'top',
                offsetY: -10,
                itemName: {
                    style: {
                        fontSize: 12,
                        fontWeight: 500,
                        fill: themeColors.textPrimary
                    }
                }
            } : false,
            label: events && events.length < 30 ? {
                position: 'middle',
                style: {
                    fill: '#FFFFFF',
                    opacity: 0.9,
                    fontSize: 11,
                    fontWeight: 'bold'
                },
                formatter: (datum: any) => {
                    return datum.event_count > 0 ? datum.event_count : '';
                }
            } : false,
            xAxis: {
                label: {
                    autoHide: true,
                    autoRotate: false,
                    style: {
                        fontSize: 11,
                        fill: themeColors.textMuted
                    },
                    formatter: (value: any) => {
                        if(dateRange[0].month() !== dateRange[1].month() && dateRange[1].diff(dateRange[0], 'days') > 30) {
                            return dayjs(value).format('MMM DD');
                        }
                        return dayjs(value).format('MM/DD');
                    }
                },
                line: {
                    style: {
                        stroke: themeColors.axisColor
                    }
                },
                tickLine: {
                    style: {
                        stroke: themeColors.axisColor
                    }
                }
            },
            yAxis: {
                label: {
                    style: {
                        fontSize: 11,
                        fill: themeColors.textMuted
                    }
                },
                grid: {
                    line: {
                        style: {
                            stroke: themeColors.gridColor,
                            lineDash: [2, 2]
                        }
                    }
                }
            },
            meta: {
                event_date: {
                    alias: 'Date',
                },
                event_count: {
                    alias: 'Count',
                },
            },
            tooltip: hideTooltip ? false : {
                showTitle: true,
                title: (title: string) => {
                    return dayjs(title).format('MMM DD, YYYY')
                },
                formatter: (data: any) => {
                    return {
                        name: data.community ? data.community : data.eventType,
                        value: data.event_count
                    }
                },
                domStyles: {
                    'g2-tooltip': {
                        background: themeColors.tooltipBg,
                        color: '#fff',
                        borderRadius: '6px',
                        fontSize: '12px'
                    }
                }
            },
            scrollbar: events && events.length > 20 ? {
                type: 'horizontal',
                categorySize: 40,
                style: {
                    thumbColor: themeColors.scrollbarThumb,
                    thumbHighlightColor: isDark ? '#8c8c8c' : '#b3b3b3',
                    trackColor: themeColors.scrollbarTrack
                }
            } : undefined,
            interactions: [
                {
                    type: 'active-region',
                    enable: false
                }
            ]
        };
    }, [events, dateRange, isGroup, showLegend, hideTooltip, isDark, themeColors]);

    if (isLoading) {
        return (
            <Card
                style={{
                    marginBottom: 16,
                    backgroundColor: themeColors.cardBg,
                    borderColor: themeColors.cardBorder
                }}
            >
                <Skeleton active paragraph={{ rows: 8 }} />
            </Card>
        );
    }

    if (periodEvents === 0 || !periodEvents || toDateEvents === 0 || !toDateEvents) {
        return (
            <Card
                style={{
                    marginBottom: 16,
                    border: `1px solid ${themeColors.cardBorder}`,
                    borderRadius: '8px',
                    backgroundColor: themeColors.cardBg
                }}
                bodyStyle={{ padding: '24px' }}
            >
                <div style={{ textAlign: 'center' }}>
                    <Title level={5} style={{ margin: 0, color: themeColors.textPrimary }}>
                        {title}
                        <Tooltip title={eventDescription} placement="top">
                            <InfoCircleOutlined
                                style={{
                                    marginLeft: 8,
                                    fontSize: 16,
                                    color: '#5c378c',
                                    cursor: 'help'
                                }}
                            />
                        </Tooltip>
                    </Title>
                    <div style={{
                        padding: '40px 0',
                        color: themeColors.textSecondary,
                        fontSize: '16px'
                    }}>
                        <CalendarOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                        <br />
                        No events recorded for this period
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card
            style={{
                marginBottom: 16,
                border: `1px solid ${themeColors.cardBorder}`,
                borderRadius: '8px',
                backgroundColor: themeColors.cardBg,
                boxShadow: isDark
                    ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                    : '0 2px 8px rgba(0, 0, 0, 0.06)'
            }}
            bodyStyle={{ padding: '20px' }}
        >
            {/* Header Section */}
            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title
                    level={5}
                    style={{
                        margin: 0,
                        color: themeColors.textPrimary,
                        fontSize: '16px',
                        fontWeight: 600
                    }}
                >
                    {title}
                    <Tooltip title={eventDescription} placement="top">
                        <InfoCircleOutlined
                            style={{
                                marginLeft: 8,
                                fontSize: 16,
                                color: '#986bd5',
                                cursor: 'help'
                            }}
                        />
                    </Tooltip>
                </Title>
                
                {onGroupByChange && (
                    <Form form={form} layout="inline">
                        <Form.Item name="groupBy" label="Group by" initialValue={AnalyticsGroupType.DAY}>
                            <Select 
                                size="small"
                                onChange={handleGroupByChange} 
                                options={[
                                    {value: AnalyticsGroupType.DAY, label: 'Day'},
                                    {value: AnalyticsGroupType.WEEK, label: 'Week'},
                                    {value: AnalyticsGroupType.MONTH, label: "Month"},
                                    {value: AnalyticsGroupType.QUARTER, label: "Quarter"}
                                ]} 
                            />
                        </Form.Item>
                    </Form>
                )}
            </div>

            {/* Statistics Row */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12}>
                    <Card
                        size="small"
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            borderRadius: '6px'
                        }}
                        bodyStyle={{ padding: '16px' }}
                    >
                        <Statistic
                            title={
                                <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px' }}>
                                    Selected Period
                                </span>
                            }
                            value={periodEvents ?? 0}
                            valueStyle={{
                                color: '#fff',
                                fontSize: '24px',
                                fontWeight: 'bold'
                            }}
                            prefix={<CalendarOutlined style={{ color: '#fff' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12}>
                    <Card
                        size="small"
                        style={{
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            border: 'none',
                            borderRadius: '6px'
                        }}
                        bodyStyle={{ padding: '16px' }}
                    >
                        <Statistic
                            title={
                                <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px' }}>
                                    Total to Date
                                </span>
                            }
                            value={toDateEvents ?? 0}
                            valueStyle={{
                                color: '#fff',
                                fontSize: '24px',
                                fontWeight: 'bold'
                            }}
                            prefix={<CalendarOutlined style={{ color: '#fff' }} />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Chart Section */}
            <div
                style={{
                    background: themeColors.chartBg,
                    borderRadius: '6px',
                    padding: '16px',
                    minHeight: '300px'
                }}
            >
                {!isLoading && (!events || events.length === 0) ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 280 }}>
                        <Empty
                            description="No data found. Please adjust your search and try again."
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    </div>
                ) : (
                    <Area {...config} />
                )}
            </div>

            {/* Footer Info */}
            {events && events.length > 0 && (
                <div style={{
                    marginTop: 12,
                    padding: '8px 0',
                    borderTop: `1px solid ${themeColors.borderColor}`,
                    fontSize: '12px',
                    color: themeColors.textSecondary,
                    textAlign: 'center'
                }}>
                    Showing data from {dayjs(dateRange[0]).format('MMM DD')} to {dayjs(dateRange[1]).format('MMM DD, YYYY')}
                    {events.length > 20 && ' • Use horizontal scroll to view all data'}
                </div>
            )}
        </Card>
    );
}