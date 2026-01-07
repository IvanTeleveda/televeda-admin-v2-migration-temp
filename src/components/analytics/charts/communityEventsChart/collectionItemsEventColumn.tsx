import dayjs from "dayjs";
import { Area, AreaConfig } from "@ant-design/plots";
import { useMemo, useContext, useState } from "react";
import { Typography, Skeleton, Tooltip, Card, Statistic, Row, Col, Empty } from "@pankod/refine-antd";
import { CollectionItemEvent } from "./index";
import { InfoCircleOutlined, CalendarOutlined } from '@ant-design/icons';
import { ColorModeContext } from "../../../../contexts/color-mode";
import { AnalyticsGroupType } from "../../../../pages/analytics";
import { getDateFormat } from "../../util";

export const CollectionItemsEventColumn: React.FC<{
    events?: CollectionItemEvent[];
    dateRange?: [dayjs.Dayjs, dayjs.Dayjs];
    periodEvents?: number;
    toDateEvents?: number;
    isLoading?: boolean;
    title?: string;
    eventDescription?: string;
    isGroup?: boolean;
    hideTooltip?: boolean;
    showLegend?: boolean;
    groupBy?: AnalyticsGroupType;
}> = ({
    events = [], // Default to empty for preview
    dateRange = [dayjs().subtract(7, 'day'), dayjs()],
    periodEvents = 150,
    toDateEvents = 1200,
    isLoading = false,
    title = "Event Trends",
    eventDescription = "Number of events over time",
    isGroup = false,
    hideTooltip,
    showLegend,
    groupBy: propsGroupBy // naming conflict handling
}) => {
        // Local state for preview interaction if props aren't provided
        const [localGroupBy, setLocalGroupBy] = useState<AnalyticsGroupType>(propsGroupBy || AnalyticsGroupType.DAY);
        const groupBy = propsGroupBy || localGroupBy;

        const { Title } = Typography;
        const { mode } = useContext(ColorModeContext); // Using mock context
        const isDark = mode === "dark";

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

        // --- CORE LOGIC: GROUPING ---
        const chartData = useMemo(() => {
            if (!events || events.length === 0) return [];

            const aggregatedMap: Record<string, CollectionItemEvent> = {};

            events.forEach((item) => {
                const dateObj = dayjs(item.event_date);
                let dateKey: string;

                // Determine the standardized date key based on the grouping type
                switch (groupBy) {
                    case AnalyticsGroupType.WEEK:
                        // Start of week (Sunday/Monday depending on locale)
                        dateKey = dateObj.startOf('week').format('YYYY-MM-DD');
                        break;
                    case AnalyticsGroupType.MONTH:
                        dateKey = dateObj.startOf('month').format('YYYY-MM-DD');
                        break;
                    case AnalyticsGroupType.QUARTER:
                        dateKey = dateObj.startOf('quarter').format('YYYY-MM-DD');
                        break;
                    case AnalyticsGroupType.DAY:
                    default:
                        dateKey = dateObj.format('YYYY-MM-DD');
                        break;
                }

                // Composite key: Date + EventType
                const compositeKey = `${dateKey}_${item.eventType}`;

                if (!aggregatedMap[compositeKey]) {
                    aggregatedMap[compositeKey] = {
                        ...item,
                        event_date: dateKey,
                        event_count: 0,
                    };
                }

                aggregatedMap[compositeKey].event_count += (item.event_count || 0);
            });

            // Convert back to array and sort chronologically
            return Object.values(aggregatedMap).sort((a, b) =>
                dayjs(a.event_date).valueOf() - dayjs(b.event_date).valueOf()
            );

        }, [events, groupBy]);

        const config: AreaConfig = useMemo(() => {
            return {
                data: chartData,
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
                        formatter: (value: any) => getDateFormat(value, groupBy)
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
                <Card style={{ marginBottom: 16, backgroundColor: themeColors.cardBg }}>
                    <Skeleton active />
                </Card>
            );
        }

        // Interactive Preview Controls (Only for this standalone demo)
        const PreviewControls = () => (
            <div style={{ marginBottom: 20, padding: 10, background: '#f5f5f5', borderRadius: 4, display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: 12 }}>Preview Controls:</span>
                {Object.values(AnalyticsGroupType).map(type => (
                    <button
                        key={type}
                        onClick={() => setLocalGroupBy(type)}
                        style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            border: '1px solid #ccc',
                            background: groupBy === type ? '#1890ff' : '#fff',
                            color: groupBy === type ? '#fff' : '#333',
                            cursor: 'pointer'
                        }}
                    >
                        {type.toUpperCase()}
                    </button>
                ))}
            </div>
        );

        return (
            <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
                {/* Control for previewing different groupings */}
                {!propsGroupBy && <PreviewControls />}

                <Card
                    style={{
                        marginBottom: 16,
                        border: `1px solid ${themeColors.cardBorder}`,
                        borderRadius: '8px',
                        backgroundColor: themeColors.cardBg,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}
                    bodyStyle={{ padding: '20px' }}
                >
                    {/* Header */}
                    <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Title level={5} style={{ margin: 0, color: themeColors.textPrimary }}>
                            {title}
                            <Tooltip title={eventDescription}>
                                <InfoCircleOutlined style={{ marginLeft: 8, fontSize: 16, color: '#986bd5', cursor: 'help' }} />
                            </Tooltip>
                        </Title>

                        <div style={{ fontSize: '12px', color: themeColors.textSecondary }}>
                            Grouped by: {groupBy ? groupBy.charAt(0).toUpperCase() + groupBy.slice(1).toLowerCase() : 'Day'}
                        </div>
                    </div>

                    {/* Stats */}
                    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                        <Col span={12}>
                            <Card size="small" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', color: '#fff' }} bodyStyle={{ padding: 16 }}>
                                <Statistic
                                    title={<span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px' }}>Selected Period</span>}
                                    value={periodEvents ?? 0}
                                    valueStyle={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}
                                    prefix={<CalendarOutlined style={{ color: '#fff' }} />}
                                />
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card size="small" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', border: 'none', color: '#fff' }} bodyStyle={{ padding: 16 }}>
                                <Statistic
                                    title={<span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px' }}>Total to Date</span>}
                                    value={toDateEvents ?? 0}
                                    valueStyle={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}
                                    prefix={<CalendarOutlined style={{ color: '#fff' }} />}
                                />
                            </Card>
                        </Col>
                    </Row>

                    {/* Chart Area */}
                    <div style={{ background: themeColors.chartBg, borderRadius: '6px', padding: '16px', minHeight: '250px' }}>
                        {!isLoading && (!chartData || chartData.length === 0) ? (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 280 }}>
                                <Empty description="No data found." />
                            </div>
                        ) : (
                            <Area {...config} />
                        )}
                    </div>

                    {/* Footer */}
                    {chartData && chartData.length > 0 && (
                        <div style={{
                            marginTop: 12,
                            padding: '8px 0',
                            borderTop: `1px solid ${themeColors.borderColor}`,
                            fontSize: '12px',
                            color: themeColors.textSecondary,
                            textAlign: 'center'
                        }}>
                            Showing data from {dayjs(dateRange[0]).format('MMM DD')} to {dayjs(dateRange[1]).format('MMM DD, YYYY')}
                        </div>
                    )}
                </Card>
            </div>
        );
    };