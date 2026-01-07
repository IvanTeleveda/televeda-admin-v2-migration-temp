import React, { useContext, useMemo, useState } from "react";
import { Typography, Space, Row, Col } from "antd";
import { Dayjs } from "dayjs";
import { Form, NumberField, Select, Tooltip } from "@pankod/refine-antd";
import { Column, G2 } from "@ant-design/plots";
import { InfoCircleOutlined } from '@ant-design/icons';
import { AnalyticsGroupType } from "../../../../pages/analytics";
import moment from "moment";
import { ColumnConfig } from "@ant-design/plots/lib/interface";
import { each, groupBy } from '@antv/util';
import { useCustom } from "@refinedev/core";
import { ColorModeContext } from "../../../../contexts/color-mode";

interface RegistrationAnalyticsQuery {
    start_date: string;
    registration_type: 'admin/bulk' | 'direct' | null;
    user_count: number;
}

export const NewRegistrationsChart: React.FC<{
    communityIds: string | string[] | undefined | null | number | { value: string; label: string };
    dateRange: [Dayjs, Dayjs];
    apiUrl: string;
    initialData?: any;
    globalGroupBy?: AnalyticsGroupType;
    hideZero?: boolean;
}> = ({
          communityIds,
          dateRange,
          apiUrl,
          initialData,
          globalGroupBy = AnalyticsGroupType.WEEK,
          hideZero = false
      }) => {
    const { mode } = useContext(ColorModeContext);
    // Use global group by instead of local state
    const groupByFilter = globalGroupBy;
    const { Text } = Typography;
    const timezone = useMemo(() => {
        return moment.tz.guess()
    }, []);
    const query = {
        start: dateRange[0].startOf('day').toISOString(),
        end: dateRange[1].endOf('day').toISOString(),
        timezone,
        groupBy: groupByFilter,
        communityIds,
        hideZero
    };
    const url = `${apiUrl}/analytics/registeredMembers`;
    const { data, isLoading } = useCustom<{
        data: any;
        total: number;
    }>({
        url,
        method: "get",
        config: {
            query
        },
        queryOptions: initialData ? { initialData } : {}
    });

    const getDateFormat = (value: string) => {
        switch(groupByFilter) {
            case AnalyticsGroupType.DAY: default:
                return  moment(value).format('MMM Do');
            case AnalyticsGroupType.WEEK:
                return moment(value).format('MMM Do') + ' - ' + moment(value).add(6, 'days').format('Do') + '\n' + '( ' + moment(value).format('wo') + ' week )';
            case AnalyticsGroupType.MONTH:
                return moment(value).format('YYYY, MMMM');
            case AnalyticsGroupType.QUARTER:
                return moment(value).format('YYYY, Qo') + ' quarter ';
        }
    }

    const config = useMemo(() => {
        const configData: RegistrationAnalyticsQuery[] = data?.data.data || [];
        let prevDateVal: number | null = null;
        const annotations: any = [];
        let dateIndex = 0;
        each(groupBy(configData, 'start_date'), (values: RegistrationAnalyticsQuery[], k) => {
            dateIndex += 1;
            const value = values.reduce((a, b) => a + b.user_count, 0);
            if(value !== 0) {
                if(prevDateVal) {
                    let percentVal = ''
                    if(prevDateVal > value) {
                        percentVal = '-' + Math.round((((prevDateVal - value) / prevDateVal) * 100) * 100) / 100 + '%';
                    }
                    else if(prevDateVal < value) {
                        percentVal = '+' + Math.round(((Math.abs(prevDateVal - value) / prevDateVal) * 100)) * 100 / 100 + '%';
                    }
                    annotations.push({
                        type: 'text',
                        position: [k, value],
                        content: `(${value}) ${percentVal}`,
                        style: {
                            textAlign: 'center',
                            fontSize: 14,
                            fill: mode === 'light' ? 'black' : 'white',
                        },
                        offsetY: -10
                    })
                }
                else {
                    annotations.push({
                        type: 'text',
                        position: [k, value],
                        content: `(${value})`,
                        style: {
                            textAlign: 'center',
                            fontSize: 14,
                            fill: mode === 'light' ? 'black' : 'white',
                        },
                        offsetY: -10
                    })
                }
            }
            prevDateVal = value;
        });

        G2.registerInteraction('element-link', {
            start: [
                {
                    trigger: 'interval:mouseenter',
                    action: 'element-link-by-color:link',
                },
            ],
            end: [
                {
                    trigger: 'interval:mouseleave',
                    action: 'element-link-by-color:unlink',
                },
            ],
        });

        const config: ColumnConfig = {
            data: configData,
            loading: isLoading,
            padding: "auto",
            xField: "start_date",
            yField: "user_count",
            isStack: true,
            autoFit: true,
            seriesField: 'registration_type',
            xAxis: {
                label: {
                    formatter: (value: string) => {
                        return getDateFormat(value);
                    }
                },
                line: null,
            },
            yAxis: {
                label: {
                    formatter: (value: any) => {
                        if(value % 1 !== 0) return ''
                        else return value;
                    },
                }
            },
            legend: {
                position: 'top-left'
            },
            label: {},
            interactions: [{
                type: 'element-highlight-by-color',
            }, {
                type: 'element-link',
            }, {
                type: 'active-region'
            }, {
                type: 'legend-filter',
                enable: false,
            }, {
                type: 'legend-click-filter'
            }],
            tooltip: {
                title: (title: string) => {
                    return getDateFormat(title)
                },
                customItems(originalItems: any) {
                    if(originalItems[0].name === '') {
                        originalItems[0] = {...originalItems[0], name: 'user_count', color: 'black'}
                    }
                    return originalItems;
                },
            },
            maxColumnWidth: 75,
            scrollbar: {
                categorySize: 75,
                style: {
                    thumbColor: '#d9d9d9',
                    thumbHighlightColor: '#b3b3b3'
                }
            },
            color: (datum: any) => {
                if(datum.registration_type === 'direct') return '#fec20d';
                else if (datum.registration_type === 'admin/bulk') return '#5c3886';
                return 'black';
            },
            annotations
        };

        return config;
    }, [data, mode]);

    return (
        <div style={{
            minHeight: 400,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 16,
            backgroundColor: mode === 'light' ? '#ffffff' : '#141414',
            borderRadius: 8,
            boxShadow: '0 1px 2px -2px rgba(0, 0, 0, 0.16), 0 3px 6px 0 rgba(0, 0, 0, 0.12), 0 5px 12px 4px rgba(0, 0, 0, 0.09)'
        }}>
            {/* Summary stats removed - now handled by UnifiedAnalyticsView */}
            <div style={{ flexGrow: 1 }}>
                <Column
                    padding={0}
                    appendPadding={10}
                    {...config}
                />
            </div>
        </div>
    );
};
