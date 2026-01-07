import dayjs from "dayjs";
import { SponsorEvent } from "./index";
import { Column, ColumnConfig } from "@ant-design/plots";
import { useMemo } from "react";
import { Space, NumberField, Typography, Skeleton } from "@pankod/refine-antd";

export const SponsorEventColumn: React.FC<{
    events: SponsorEvent[] | undefined;
    dateRange: [dayjs.Dayjs, dayjs.Dayjs]
    periodEvents: number | undefined;
    toDateEvents: number | undefined;
    isLoading: boolean;
    title: string;
    isGroup: boolean
}> = ({
    events,
    dateRange,
    periodEvents,
    toDateEvents,
    isLoading,
    title,
    isGroup
}) => {

        const { Text } = Typography;

        const config: ColumnConfig = useMemo(() => {

            return {
                data: events || [],
                loading: isLoading,
                isGroup: isGroup,
                padding: "auto",
                xField: 'event_date',
                yField: 'event_count',
                seriesField: 'community',
                groupField: 'eventType',
                maxColumnWidth: 100,
                isStack: true,
                legend: {
                    position: 'top-left',
                    columnWidthRatio: 0.25
                },
                label: {
                    position: 'middle',
                    style: {
                        fill: '#FFFFFF',
                        opacity: 0.7,
                        fontSize: 15
                    },
                },
                xAxis: {
                    label: {
                        autoHide: true,
                        autoRotate: false,
                        formatter: (value: any) => {
                            if(dateRange[0].month() !== dateRange[1].month() && dateRange[1].diff(dateRange[0], 'days') > 30) return dayjs(value).format('YYYY-MMM');
                            return dayjs(value).format('MM-DD');
                        }
                    },
                },
                meta: {
                    event_date: {
                        alias: 'Date',
                    },
                    event_count: {
                        alias: 'count',
                    },
                },
                tooltip: {
                    title: (title) => {
                        return dayjs(title).format('MMM-DD-YYYY')
                    },
                    formatter: (data: any) => {
                        return {
                            name: data.community? data.community : data.eventType,
                            value: data.event_count
                        }
                    }
                },
                scrollbar: {
                    categorySize: 100,
                    style: {
                        thumbColor: '#d9d9d9',
                        thumbHighlightColor: '#b3b3b3'
                    }
                }
            };
        }, [events]);

        if (isLoading) {
            return <Skeleton />;
        }

        if (periodEvents === 0 || !periodEvents || toDateEvents === 0 || !toDateEvents) {
            return (
                <Space direction="vertical" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                }}>
                    <Text
                        style={{ fontSize: 18 }}
                        strong
                    >
                        {title}
                    </Text>
                    <Text
                        style={{ fontSize: 18 }}
                        strong
                    >
                        No events for this period
                    </Text>
                    <br />
                </Space>
            )
        }

        return (
            <>
                <Space direction="vertical">
                    <Text
                        style={{ fontSize: 18 }}
                        strong
                    >
                        {title}
                    </Text>
                    <Text
                        style={{ fontSize: 15 }}
                        strong
                    >
                        Total For Selected Period:  
                        <NumberField
                            style={{ fontSize: 20, marginRight: 20, marginLeft: 5 }}
                            strong
                            value={periodEvents ?? 0}
                        />
                    </Text>
                    <Text
                        style={{ fontSize: 15 }}
                        strong
                    >
                        Total Until Selected Date:
                        <NumberField
                            style={{ fontSize: 20, marginLeft: 5 }}
                            strong
                            value={toDateEvents ?? 0}
                        />
                    </Text>
                </Space>
                <Space direction="vertical">
                    <Column
                        padding={0}
                        appendPadding={10}
                        {...config}
                    />
                </Space>

            </>
        );
    }