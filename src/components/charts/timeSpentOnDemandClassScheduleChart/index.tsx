import { useMemo, useState, useEffect } from "react";
import { Typography, Space, Col, Button } from "antd";
import dayjs from "dayjs";
import * as moment from "moment-timezone";
import {
  Form,
  Tooltip,
  Input,
  Icons,
} from "@pankod/refine-antd";
import { Line, LineConfig } from "@ant-design/plots";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useCustom } from "@refinedev/core";

export const TimeSpentOnDemandClassScheduleChart: React.FC<{
  communityIds: string[];
  dateRange: [dayjs.Dayjs, dayjs.Dayjs],
  apiUrl: string;
}> = ({ communityIds, dateRange, apiUrl }) => {
  const [form] = Form.useForm();

  const [appliedUserEmail, setAppliedUserEmail] = useState<string>("");
  const timezone = useMemo(() => moment.tz.guess(), []);

  const query = {
    start: dateRange[0].startOf("day").toISOString(),
    end: dateRange[1].endOf("day").toISOString(),
    timezone,
    communityIds,
    ...(appliedUserEmail
      ? { userEmail: appliedUserEmail }
      : {}),
  };
  
  const url = `${apiUrl}/analytics/memberOnDemandClassScheduleTimeMetrics`;
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

  useEffect(() => {
    form.setFieldsValue({
      dateRange,
      username: "",
    });
  }, []);

  const onApplyFilters = () => {
    const email = form.getFieldValue("username")?.trim() ?? "";
    setAppliedUserEmail(email);
  };

  return (
    <div
      style={{
        display: "flex",
        height: 815,
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Space direction="vertical" style={{ gap: 0 }}>
          <Typography.Text
            style={{ fontSize: 18, wordBreak: "keep-all" }}
            strong
          >
            Class schedule and On Demand Streaming Time Spent
            <Tooltip
              title="…"
              placement="bottom"
            >
              <InfoCircleOutlined
                style={{ marginLeft: 8, color: "#532d7f" }}
              />
            </Tooltip>
          </Typography.Text>
        </Space>
        <Space direction="vertical">
          <Form form={form}>
            <Col>
              <Typography.Text
                style={{
                  fontSize: 16,
                  marginLeft: 2,
                  marginBottom: 4,
                }}
                strong
              >
                Search by user email
              </Typography.Text>
              <Form.Item name="username">
                <Input
                  placeholder="Filter by user email"
                  prefix={<Icons.SearchOutlined />}
                  allowClear
                />
              </Form.Item>
              <Button
                type="primary"
                onClick={onApplyFilters}
                block
              >
                Apply
              </Button>
            </Col>
          </Form>
        </Space>
      </div>
      <Line
          padding={0}
          appendPadding={10}
          {...config}
      />
    </div>
  );
};
