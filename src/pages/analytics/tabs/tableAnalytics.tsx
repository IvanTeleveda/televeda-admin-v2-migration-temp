import {Card, Col, Empty, Row, Space, Statistic, Tabs, Tooltip, Typography} from "@pankod/refine-antd";
import TabPane from "antd/es/tabs/TabPane";
import { useMemo, useEffect } from "react";
import {
    BellOutlined,
    ClockCircleOutlined,
    LineChartOutlined,
    ScheduleOutlined,
    TeamOutlined,
    UserAddOutlined, VideoCameraAddOutlined
} from "@ant-design/icons";
import {NewRegistrationsTable} from "../../../components/analytics/tables/registrationAnalyticsTable";
import {RemindersAnalyticsTable} from "../../../components/analytics/tables/remindersAnalyticsTable";
import {AttendanceAnalyticsTable} from "../../../components/analytics/tables/attendanceAnalyticsTable";
import {RetentionAnalyticsTable} from "../../../components/analytics/tables/retentionAnalyticsTable";
import {EventsAnalyticsTable} from "../../../components/analytics/tables/eventsAnalyticsTable";
import {PageTimeAnalyticsTable} from "../../../components/analytics/tables/pageTimeAnalyticsTable";
import {OnDemandAnalyticsTable} from "../../../components/analytics/tables/onDemandAnalyticsTable";
import {VTCTimeAnalyticsTable} from "../../../components/analytics/tables/VTCTimeAnalyticsTable";
import {
    CombinedTimeAnalyticsTable,
} from "../../../components/analytics/tables/pageTimeCombinedTable";

const TableAnalytics: React.FC<{
    communityIds: any;
    dateRange: any;
    apiUrl: string;
    globalGroupBy: any;
}> = ({ communityIds, dateRange, apiUrl, globalGroupBy }) => {
    const { Text } = Typography;

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Tabs defaultActiveKey="registrations" type="card" style={{ width: '100%' }}>

                <TabPane
                    tab={
                        <span>
                            Registrations
                            <Tooltip title="New member signups and registration sources">
                                <UserAddOutlined style={{ marginLeft: 8 }}/>
                            </Tooltip>
                        </span>
                    }
                    key="registrations"
                >
                    {communityIds ? (
                        <Card>
                            <NewRegistrationsTable
                                communityIds={communityIds}
                                dateRange={dateRange}
                                apiUrl={apiUrl}
                            />
                        </Card>
                    ) : (
                        <Card>
                            <Empty
                                description="Select a community to view registration analytics"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        </Card>
                    )}
                </TabPane>

                <TabPane
                    tab={
                        <span>
                            Reminders
                            <Tooltip title="Notification effectiveness and member response rates">
                                <BellOutlined style={{ marginLeft: 8 }}/>
                            </Tooltip>
                        </span>
                    }
                    key="reminders"
                >
                    <Card>
                        <RemindersAnalyticsTable
                            communityIds={communityIds}
                            dateRange={dateRange}
                            apiUrl={apiUrl}
                        />
                    </Card>
                </TabPane>

                <TabPane
                    tab={
                        <span>
                            Attendance
                            <Tooltip title="Event participation rates and engagement metrics">
                                <TeamOutlined style={{ marginLeft: 8 }}/>
                            </Tooltip>
                        </span>
                    }
                    key="attendance"
                >
                    <Card>
                        <AttendanceAnalyticsTable
                            communityIds={communityIds}
                            dateRange={dateRange}
                            apiUrl={apiUrl}
                        />
                    </Card>
                </TabPane>

                <TabPane
                    tab={
                        <span>
                            Retention
                            <Tooltip title="Percentage of members who remain active over time">
                                <ScheduleOutlined style={{ marginLeft: 8 }}/>
                            </Tooltip>
                        </span>
                    }
                    key="retention"
                >
                    <Card>
                        <RetentionAnalyticsTable
                            communityIds={communityIds}
                            dateRange={dateRange}
                            apiUrl={apiUrl}
                        />
                    </Card>
                </TabPane>

                <TabPane
                    tab={
                        <span>
                            Community Page Interactions
                            <Tooltip title="Community resource interactions metrics">
                                <VideoCameraAddOutlined style={{ marginLeft: 8 }}/>
                            </Tooltip>
                        </span>
                    }
                    key="events"
                >
                    <Card>
                        <EventsAnalyticsTable
                            communityIds={communityIds}
                            dateRange={dateRange}
                            apiUrl={apiUrl}
                        />
                    </Card>
                </TabPane>

                <TabPane
                    tab={
                        <span>
                            Page Time
                            <Tooltip title="Time spent on different community sections">
                                <LineChartOutlined style={{ marginLeft: 8 }}/>
                            </Tooltip>
                        </span>
                    }
                    key="pageTime"
                >
                    <Card>
                        <PageTimeAnalyticsTable
                            communityIds={communityIds}
                            dateRange={dateRange}
                            apiUrl={apiUrl}
                        />
                        {/*<CombinedTimeAnalyticsTable*/}
                        {/*    communityIds={communityIds}*/}
                        {/*    dateRange={dateRange}*/}
                        {/*    apiUrl={apiUrl}*/}
                        {/*/>*/}
                    </Card>
                </TabPane>

                <TabPane
                    tab={
                        <span>
                            Streaming time
                            <Tooltip title="Usage of self-paced learning resources">
                                <LineChartOutlined style={{ marginLeft: 8 }}/>
                            </Tooltip>
                        </span>
                    }
                    key="onDemand"
                >
                    <Card>
                        <OnDemandAnalyticsTable
                            communityIds={communityIds}
                            dateRange={dateRange}
                            apiUrl={apiUrl}
                        />
                    </Card>
                </TabPane>

                <TabPane
                    tab={
                        <span>
                            VTC
                            <Tooltip title="Virtual Tele-Connect usage metrics">
                                <LineChartOutlined style={{ marginLeft: 8 }}/>
                            </Tooltip>
                        </span>
                    }
                    key="vtc"
                >
                    <Card>
                        <VTCTimeAnalyticsTable
                            communityIds={communityIds}
                            dateRange={dateRange}
                            apiUrl={apiUrl}
                        />
                    </Card>
                </TabPane>
            </Tabs>
        </Space>
    );
};

export default TableAnalytics;
