import { useMemo, useEffect, useState } from "react";
import { Typography, Space, Row, Col, Empty } from "antd";
import { LineConfig } from "@ant-design/plots/lib/components/line";
import dayjs, { Dayjs } from "dayjs";
import * as moment from 'moment-timezone';
import { Form, Tooltip, Select } from "@pankod/refine-antd";
import { Line, Pie, PieConfig } from "@ant-design/plots";
import { useCustom } from "@refinedev/core";
import { AnalyticsGroupType } from "../../../../pages/analytics";

export const AttendanceChart: React.FC<{
    communityIds: string | string[] | undefined | null | number | { value: string; label: string };
    dateRange: [Dayjs, Dayjs];
    apiUrl: string;
    initialData?: any;
    globalGroupBy?: AnalyticsGroupType;
    viewMode?: 'all' | 'selected' | 'other';
    hideZero?: boolean;
}> = ({
          communityIds,
          dateRange,
          apiUrl,
          initialData,
          globalGroupBy = AnalyticsGroupType.DAY,
          viewMode = 'all',
          hideZero = true
      }) => {

    const groupByFilter = globalGroupBy;
    const { Text } = Typography;
    const timezone = useMemo(() => {
        return moment.tz.guess()
    }, []);
    const query = {
        start: dateRange[0].startOf('day').toISOString(),
        end: dateRange[1].endOf('day').toISOString(),
        timezone,
        communityIds,
        groupBy: globalGroupBy
    };
    const url = `${apiUrl}/analytics/memberAttendance`;
    const { data, isLoading: graphIsLoading } = useCustom<{
        data: any;
        total: any;
        trend: number;
    }>({
        url,
        method: "get",
        config: {
            query
        },
        queryOptions: initialData ? { initialData } : {}
    });

    // Individual filters removed - now controlled by tab-level filters

    const getDateFormat = (value: any, isTooltip = false) => {
        switch(globalGroupBy) {
            case AnalyticsGroupType.WEEK:
                return isTooltip 
                    ? `${dayjs(value).format('MMM Do')} - ${dayjs(value).add(6, 'days').format('Do, YYYY')}`
                    : dayjs(value).format('MMM Do');
            case AnalyticsGroupType.MONTH:
                return isTooltip 
                    ? dayjs(value).format('MMMM YYYY')
                    : dayjs(value).format('MMM YY');
            case AnalyticsGroupType.QUARTER:
                return isTooltip 
                    ? dayjs(value).format('YYYY [Q]Q')
                    : dayjs(value).format('[Q]Q YY');
            default:
                return isTooltip 
                    ? dayjs(value).format('MMM-DD-YYYY')
                    : dayjs(value).format('MM/DD');
        }
    };

    const config = useMemo(() => {
        const lineConfig: LineConfig = {
            data: data?.data.data || [],
            loading: graphIsLoading,
            padding: "auto",
            xField: "date",
            yField: "count",
            autoFit: true,
            seriesField: 'type',
            point: {
                size: 4,
                shape: 'circle',
            },
            xAxis: {
                label: {
                    formatter: (value: any) => getDateFormat(value, false)
                },
                line: null,
            },
            tooltip: {
                title: (title: any) => {
                    return getDateFormat(title, true);
                },
            },
            color: ['#532D7F', '#FEBF00'],
            smooth: true,
            scrollbar: {
                categorySize: 10,
                style: {
                    thumbColor: '#d9d9d9',
                    thumbHighlightColor: '#b3b3b3'
                }
            }
        };

        const pieConfig: PieConfig = {
            appendPadding: 10,
            data: data?.data.total || [],
            angleField: 'count',
            colorField: 'type',
            radius: 0.8,
            height: 250,
            width: 475,
            legend: false,
            autoFit: true,
            label: {
                type: 'spider',
                content: ({ percent, count, }: any) => `${(percent * 100).toFixed(0)}% \n${count} attendances`,
                style: {
                    fontSize: 15
                },
            },
            interactions: [
                {
                    type: 'element-active',
                },
            ],
            color: ['#532D7F', '#FEBF00'],
        };

        return { lineConfig, pieConfig };
    }, [data, globalGroupBy]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 16,
            borderRadius: 8,
            boxShadow: '0 1px 2px -2px rgba(0, 0, 0, 0.16), 0 3px 6px 0 rgba(0, 0, 0, 0.12), 0 5px 12px 4px rgba(0, 0, 0, 0.09)'
        }}>
            {/* Individual filters removed - now controlled by tab-level filters */}
            
            {!graphIsLoading && (!data?.data.data || data.data.data.length === 0) ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                    <Empty
                        description="No data found. Please adjust your search and try again."
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <Pie {...config.pieConfig} />
                    </div>
                    <div style={{ flexGrow: 1 }}>
                        <Line
                            padding={0}
                            appendPadding={10}
                            {...config.lineConfig}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};