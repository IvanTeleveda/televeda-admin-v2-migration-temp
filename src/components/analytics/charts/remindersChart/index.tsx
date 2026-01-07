import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Bar, BarConfig, Mix, MixConfig, G2 } from "@ant-design/plots";
import {
    Form,
    Select,
    Space,
    Switch,
    Tooltip,
    Typography,
    Card,
    Divider,
    Spin
} from "@pankod/refine-antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Dayjs } from "dayjs";
import * as moment from 'moment-timezone';
import { useCustom } from "@refinedev/core";
import { AnalyticsGroupType } from "../../../../pages/analytics";

const { Text, Title } = Typography;

type ReminderAnalyticsQuery = {
    start_date: Date;
    title: string;
    group_key: string;
    value: number;
    types?: Array<{ type: string; value: number }>;
};

interface ReminderChartProps {
    communityIds: string | string[] | undefined | null | number | { value: string; label: string };
    dateRange: [Dayjs, Dayjs];
    apiUrl: string;
    initialData?: any;
    globalGroupBy?: AnalyticsGroupType;
    memberAggregate?: boolean;
    hideZero?: boolean;
}

export const ReminderChart: React.FC<ReminderChartProps> = ({
                                                                communityIds,
                                                                dateRange,
                                                                apiUrl,
                                                                initialData,
                                                                globalGroupBy = AnalyticsGroupType.DAY,
                                                                memberAggregate = false,
                                                                hideZero = false
                                                            }) => {

    const groupByFilter = globalGroupBy;
    const [transformedAreaData, setTransformedAreaData] = useState<ReminderAnalyticsQuery[]>([]);

    const timezone = useMemo(() => moment.tz.guess(), []);

    const query = useMemo(() => ({
        start: dateRange[0].startOf('day').toISOString(),
        end: dateRange[1].endOf('day').toISOString(),
        timezone,
        groupBy: groupByFilter,
        memberAggregate,
        communityIds
    }), [dateRange, timezone, groupByFilter, memberAggregate, communityIds]);

    const { data, isLoading } = useCustom<{
        data: any;
        total: any;
        trend: number;
    }>({
        url: `${apiUrl}/analytics/reminders`,
        method: "get",
        config: { query },
        queryOptions: initialData ? { initialData } : {}
    });

    const graphData = data?.data?.data;

    // Individual filters removed - now controlled by tab-level filters

    // Date formatting utility
    const getDateFormat = useCallback((value: string) => {
        const date = moment(value);
        switch(groupByFilter) {
            case AnalyticsGroupType.DAY:
                return date.format('MMM Do');
            case AnalyticsGroupType.WEEK:
                return `${date.format('MMM Do')} - ${date.add(6, 'days').format('Do')}\n(${date.format('wo')} week)`;
            case AnalyticsGroupType.MONTH:
                return date.format('YYYY, MMMM');
            case AnalyticsGroupType.QUARTER:
                return `${date.format('YYYY, Qo')} quarter`;
            default:
                return date.format('MMM Do');
        }
    }, [groupByFilter]);

    // Transform data for area chart
    useEffect(() => {
        if (!isLoading && graphData?.columns) {
            const data: ReminderAnalyticsQuery[] = graphData.columns;

            const transformedMap = data.reduce((acc, entry) => {
                const key = `${entry.start_date}-${entry.title}`;

                if (!acc[key]) {
                    // @ts-ignore
                    acc[key] = {
                        start_date: entry.start_date,
                        title: entry.title,
                        value: entry.value || 0,
                        types: Array.isArray(entry.group_key)
                            ? entry.group_key.map(gk => ({ type: gk, value: entry.value }))
                            : [{ type: entry.group_key, value: entry.value }],
                    };
                } else {
                    acc[key].value += entry.value || 0;
                    const existingType = acc[key].types?.find(t => t.type === entry.group_key);
                    if (!existingType) {
                        acc[key].types?.push({ type: entry.group_key, value: entry.value });
                    }
                }

                return acc;
            }, {} as Record<string, ReminderAnalyticsQuery>);

            setTransformedAreaData(Object.values(transformedMap));
        }
    }, [graphData?.columns, isLoading]);

    // Register custom interaction for G2
    useEffect(() => {
        G2.registerInteraction("custom-association-filter", {
            showEnable: [
                {
                    trigger: "element:mouseenter",
                    action: "cursor:pointer",
                },
                {
                    trigger: "element:mouseleave",
                    action: "cursor:default",
                },
            ],
            start: [
                {
                    trigger: "element:click",
                    action: (context: any) => {
                        const { view, event } = context;
                        const view1 = view.parent?.views?.[1];
                        if (view1 && event.data?.data?.title) {
                            view1.filter("title", (d: any) => d === event.data.data.title);
                            view1.render(true);
                        }
                    },
                },
            ],
            end: [
                {
                    trigger: "element:dblclick",
                    action: (context: any) => {
                        const { view } = context;
                        const view1 = view.parent?.views?.[1];
                        if (view1) {
                            view1.filter("title", null);
                            view1.render(true);
                        }
                    },
                },
            ],
        });
    }, []);

    const barConfig: BarConfig = useMemo(() => ({
        data: graphData?.columns || [],
        loading: isLoading,
        isStack: true,
        height: 320,
        autoFit: true,
        xField: "value",
        yField: "start_date",
        seriesField: "group_key",
        yAxis: {
            label: {
                formatter: getDateFormat,
            },
            line: null,
        },
        tooltip: {
            title: getDateFormat,
            formatter: (data: any) => ({
                name: data.group_key || "count",
                value: data.value || 0,
            }),
        },
        label: (graphData?.columns?.length || 0) > 17 ? undefined : {
            position: "middle",
            layout: [
                { type: "interval-adjust-position" },
                { type: "interval-hide-overlap" },
                { type: "adjust-color" },
            ],
        },
        maxBarWidth: 100,
        scrollbar: {
            type: 'vertical',
            categorySize: 10,
            style: {
                thumbColor: '#d9d9d9',
                thumbHighlightColor: '#b3b3b3'
            }
        },
        theme: {
            colors10: [
                '#5B8FF9', '#5AD8A6', '#5D7092', '#F6BD16',
                '#E86452', '#6DC8EC', '#945FB9', '#FF9845',
                '#1E9493', '#FF99C3'
            ]
        }
    }), [graphData?.columns, isLoading, getDateFormat]);

    const mixConfig: MixConfig = useMemo(() => ({
        tooltip: false,
        loading: isLoading,
        height: 450,
        autoFit: true,
        plots: [
            {
                type: "pie",
                region: {
                    start: { x: 0, y: 0 },
                    end: { x: 1, y: 0.45 },
                },
                options: {
                    data: graphData?.pie || [],
                    angleField: "value",
                    colorField: "title",
                    tooltip: {
                        showMarkers: false,
                    },
                    radius: 0.8,
                    label: {
                        type: "spider",
                        formatter: (datum: any) => {
                            return datum.title.length > 35
                                ? `${datum.title.substring(0, 32)}...`
                                : datum.title;
                        },
                        style: {
                            fontSize: 12,
                            fontWeight: 500,
                        },
                    },
                    interactions: [
                        { type: "element-highlight" },
                        { type: "custom-association-filter" },
                    ],
                    legend: {
                        position: 'right',
                        offsetX: -100,
                        itemWidth: 150,
                    },
                },
            },
            {
                type: "column",
                region: {
                    start: { x: 0, y: 0.5 },
                    end: { x: 1, y: 0.95 },
                },
                options: {
                    data: transformedAreaData,
                    xField: "start_date",
                    yField: "value",
                    seriesField: "title",
                    isStack: true,
                    maxColumnWidth: 80,
                    xAxis: {
                        label: {
                            formatter: getDateFormat,
                            style: {
                                fontSize: 11,
                            },
                        },
                        line: null,
                    },
                    yAxis: {
                        grid: {
                            line: {
                                style: {
                                    stroke: '#f0f0f0',
                                    lineWidth: 1,
                                    lineDash: [3, 3],
                                },
                            },
                        },
                    },
                    scrollbar: {
                        categorySize: 12,
                        style: {
                            thumbColor: '#d9d9d9',
                            thumbHighlightColor: '#b3b3b3'
                        }
                    },
                    label: (graphData?.columns?.length || 0) > 20 ? undefined : {
                        position: "middle",
                        formatter: ({ value }: any) => value === 0 ? '' : value,
                        layout: [
                            { type: "interval-adjust-position" },
                            { type: "interval-hide-overlap" },
                            { type: "adjust-color" },
                        ],
                    },
                    tooltip: {
                        customContent: (title: string, data: any[]) => {
                            const list = data.map((item) => `
                                <li style="list-style: none; padding: 4px 0; margin: 0;">
                                    <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${item.color}; margin-right: 8px;"></span>
                                    <span style="font-weight: 600;">${item.data.title || "count"}: ${item.value}</span>
                                    ${item.data.types?.[0]?.type ? `
                                        <div style="margin-left: 16px; margin-top: 4px;">
                                            ${item.data.types.map((type: { type: string; value: number }) =>
                                `<div style="font-size: 12px; color: #666;">• ${type.type}: ${type.value}</div>`
                            ).join('')}
                                        </div>
                                    ` : ''}
                                </li>
                            `);

                            return `
                                <div style="background: white; padding: 12px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                                    <div style="font-weight: 600; margin-bottom: 8px; color: #262626;">
                                        ${getDateFormat(title)}
                                    </div>
                                    <ul style="margin: 0; padding: 0;">
                                        ${list.join('')}
                                    </ul>
                                </div>
                            `;
                        },
                    },
                },
            },
        ],
    }), [graphData, isLoading, transformedAreaData, getDateFormat]);

    const groupByOptions = [
        { value: AnalyticsGroupType.DAY, label: 'Day' },
        { value: AnalyticsGroupType.WEEK, label: 'Week' },
        { value: AnalyticsGroupType.MONTH, label: 'Month' },
        { value: AnalyticsGroupType.QUARTER, label: 'Quarter' }
    ];

    return (
        <div
            className="reminder-analytics-card"
            style={{
                width: '100%',
                // boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                // borderRadius: '8px'
                padding: 8
            }}
        >
            <div style={{ marginBottom: 24 }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 24,
                    flexWrap: 'wrap'
                }}>
                    <Space direction="vertical" size={4}>
                        <Title level={4}>
                            RSVP & Reminders Analytics
                            <Tooltip
                                title="Shows how many reminders the members of your community have opted in for the chosen period"
                                placement="bottom"
                            >
                                <InfoCircleOutlined
                                    style={{
                                        marginLeft: 8,
                                        fontSize: 16,
                                        color: '#532d7f',
                                        cursor: 'help'
                                    }}
                                />
                            </Tooltip>
                        </Title>
                        <Text type="secondary" style={{ fontSize: 14 }}>
                            Cumulative number of reminders by selected period per {memberAggregate ? 'member' : 'type'}
                        </Text>
                    </Space>

                    {/* Individual filters removed - now controlled by tab-level filters */}
                </div>
            </div>

            <Spin spinning={isLoading}>
                <div style={{ marginBottom: 32 }}>
                    <Text strong style={{ fontSize: 15, color: '#595959', marginBottom: 12, display: 'block' }}>
                        Reminder Distribution by Time Period
                    </Text>
                    <Bar {...barConfig} />
                </div>

                <Divider style={{ margin: '32px 0 24px 0' }} />

                <div>
                    <Text strong style={{ fontSize: 15, color: '#595959', marginBottom: 12, display: 'block' }}>
                        Event Breakdown & Timeline View
                    </Text>
                    <Text type="secondary" style={{ fontSize: 13, marginBottom: 16, display: 'block' }}>
                        Top: Distribution by event • Bottom: Timeline per {memberAggregate ? 'member' : 'type'}
                        <br />
                        <em>Click on pie chart segments to filter timeline view • Double-click to reset</em>
                    </Text>
                    <Mix {...mixConfig} />
                </div>
            </Spin>
        </div>
    );
};