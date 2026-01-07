import { useMemo, useState, useEffect } from "react";
import { Typography, Space, Col, Button, Row, Empty } from "antd";
import dayjs from "dayjs";
import * as moment from "moment-timezone";
import {
  Form,
  Tooltip,
  Input,
  Icons,
  Select,
} from "@pankod/refine-antd";
import { Line, LineConfig } from "@ant-design/plots";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useCustom } from "@refinedev/core";
import { AnalyticsGroupType } from "../../../../pages/analytics";

export const TimeSpentVTCChart: React.FC<{
  communityIds: string[];
  dateRange: [dayjs.Dayjs, dayjs.Dayjs],
  apiUrl: string;
  initialData?: any;
  globalGroupBy?: AnalyticsGroupType;
  userEmail?: string;
}> = ({ communityIds, dateRange, apiUrl, initialData, globalGroupBy = AnalyticsGroupType.DAY, userEmail = "" }) => {

  const groupByFilter = globalGroupBy;
  const appliedUserEmail = userEmail;
  const timezone = useMemo(() => moment.tz.guess(), []);

  const query = {
    start: dateRange[0].startOf("day").toISOString(),
    end: dateRange[1].endOf("day").toISOString(),
    timezone,
    communityIds,
    groupBy: groupByFilter,
    ...(appliedUserEmail
      ? { userEmail: appliedUserEmail }
      : {}),
  };
  
  const url = `${apiUrl}/analytics/memberVTCTimeMetrics`;
  const { data, isLoading: graphIsLoading } = useCustom<{
    data: any;
    total: any;
    trend: number;
  }>({
    url,
    method: "get",
    config: {
      query,
    },
    queryOptions: initialData ? { initialData } : {},
  });

  const config: LineConfig = useMemo(
    () => ({
      data: data?.data.data || [],
      loading: graphIsLoading,
      padding: "auto",
      xField: "event_date",
      yField: "total_time_spent",
      seriesField: "page",
      point: { size: 4, shape: "circle" },
      smooth: true,
      height: 400,
      autoFit: true,
      yAxis: {
        label: {
          formatter: (value: any) => {
            const minutes = parseFloat(value);
            if (minutes < 1) {
              return `${Math.round(minutes * 60)}s`;
            } else if (minutes < 60) {
              return `${Math.round(minutes)}m`;
            } else {
              const hours = Math.floor(minutes / 60);
              const mins = Math.round(minutes % 60);
              return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
            }
          },
        },
      },
      scrollbar: {
        categorySize: 10,
        style: {
          thumbColor: "#d9d9d9",
          thumbHighlightColor: "#b3b3b3",
        },
      },
    }),
    [data, graphIsLoading]
  );

  // Individual filters removed - now controlled by tab-level filters

  return (
    <div
      style={{
        display: "flex",
        minHeight: 500,
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Individual filters removed - now controlled by tab-level filters */}
      {!graphIsLoading && (!data?.data.data || data.data.data.length === 0) ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Empty
            description="No data found. Please adjust your search and try again."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      ) : (
        <Line
            padding={0}
            appendPadding={10}
            {...config}
        />
      )}
    </div>
  );
};
