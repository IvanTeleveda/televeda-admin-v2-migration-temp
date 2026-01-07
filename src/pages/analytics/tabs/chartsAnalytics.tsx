import {Card, Col, Empty, Row, Tooltip} from "@pankod/refine-antd";
import {InfoCircleOutlined} from "@ant-design/icons";
import {ReminderChart} from "../../../components/analytics/charts/remindersChart";
import {NewRegistrationsChart} from "../../../components/analytics/charts/newRegistrationChart";
import {AttendanceChart} from "../../../components/analytics/charts/attendanceChart";
import {RetentionChart} from "../../../components/analytics/charts/retentionChart";
import {CommunityEventsCharts} from "../../../components/analytics/charts/communityEventsChart";
import {PageTimeSpentChart} from "../../../components/analytics/charts/pageTimeSpentChart";
import {
    TimeSpentOnDemandClassScheduleChart
} from "../../../components/analytics/charts/timeSpentOnDemandClassScheduleChart";
import {TimeSpentVTCChart} from "../../../components/analytics/charts/timeSpentVTCChart";

const ChartsAnalytics: React.FC<{
    communityIds: any;
    dateRange: any;
    apiUrl: string;
    sponsorData: any;
    globalGroupBy: any;
}> = ({communityIds, dateRange, apiUrl, sponsorData, globalGroupBy}) => {
    if (!communityIds) {
        return (
            <Card style={{textAlign: 'center', padding: 40}}>
                <Empty
                    description="Select a community to view analytics charts"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            </Card>
        );
    }

    return (
        <Row gutter={[10, 10]}>
            <Col md={24}>
                <Row gutter={[16,16]}>
                    <Col xl={24} lg={24} md={24} sm={24} xs={24}>
                        <Card
                            styles={{
                                body: {
                                    padding: 10, paddingBottom: 0, overflow: 'hidden',
                                    width: '100%'
                                }
                            }}
                        >
                            <div style={{width: '100%', maxWidth: '100%', height: '100%', maxHeight: '100%'}}>
                                <ReminderChart
                                    communityIds={communityIds}
                                    dateRange={dateRange}
                                    apiUrl={apiUrl}
                                    // initialData={analyticsData.reminders}
                                />
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} >
                            <Card
                                styles={{
                                    body: {
                                        padding: 10, paddingBottom: 0, overflow: 'hidden',
                                        width: '100%'
                                    }
                                }}
                            >
                                <div style={{width: '100%', maxWidth: '100%'}}>
                                    <NewRegistrationsChart
                                        communityIds={communityIds}
                                        dateRange={dateRange}
                                        apiUrl={apiUrl}
                                        // initialData={analyticsData.registrations}
                                    />
                                </div>
                            </Card>
                        </Col>
                        <Col xs={24} >
                            <Card
                                title={
                                    <span>
                                        Attendance Metrics
                                        <Tooltip title="Compares how many of my members have attended my community events versus all other communities for chosen period" placement="bottom">
                                            <span style={{ marginLeft: 15, fontSize: 22, color: '#532d7f' }}>
                                                <InfoCircleOutlined />
                                            </span>
                                        </Tooltip>
                                    </span>
                                }
                                styles={{
                                    body: {
                                        padding: 10, paddingBottom: 0, overflow: 'hidden',
                                        width: '100%'
                                    }
                                }}
                            >
                                <AttendanceChart
                                    communityIds={communityIds}
                                    dateRange={dateRange}
                                    apiUrl={apiUrl}
                                    // initialData={analyticsData.attendance}
                                />
                            </Card>
                    </Col>

                    <Col xl={24} lg={24} md={24} sm={24} xs={24}>
                        <Card
                            title={
                                <span>
                                    Member Retention
                                    <Tooltip title="Percentage of members who remain active over time">
                                        <InfoCircleOutlined style={{marginLeft: 8}}/>
                                    </Tooltip>
                                </span>
                            }
                            styles={{
                                body: {
                                    padding: 10, paddingBottom: 0, overflow: 'hidden',
                                    width: '100%'
                                }
                            }}
                        >
                            <div style={{width: '100%', maxWidth: '100%'}}>
                                <RetentionChart
                                    communityIds={communityIds}
                                    apiUrl={apiUrl}
                                    dateRange={dateRange}
                                    // initialData={analyticsData.retention}
                                />
                            </div>
                        </Card>
                    </Col>

                    <Col xl={24} lg={24} md={24} sm={24} xs={24}>
                        <Card
                            title={
                                <span>
                                    Community Events
                                    <Tooltip title="Event creation and participation metrics">
                                        <InfoCircleOutlined style={{marginLeft: 8}}/>
                                    </Tooltip>
                                </span>
                            }
                            styles={{
                                body: {
                                    padding: 10, paddingBottom: 0, overflow: 'hidden',
                                    width: '100%'
                                }
                            }}
                        >
                            <div style={{width: '100%', maxWidth: '100%'}}>
                                <CommunityEventsCharts
                                    sponsorData={sponsorData}
                                    communityIds={communityIds}
                                    dateRange={dateRange}
                                    apiUrl={apiUrl}
                                    // initialData={analyticsData.events}
                                />
                            </div>
                        </Card>
                    </Col>

                    <Col xl={24} lg={24} md={24} sm={24} xs={24}>
                        <Card
                            title={
                                <span>
                                    Page Time Spent Chart
                                    <Tooltip
                                      title="Shows how much time users have spent on different pages for chosen period"
                                      placement="bottom"
                                    >
                                      <InfoCircleOutlined
                                          style={{ marginLeft: 8, color: "#532d7f" }}
                                      />
                                    </Tooltip>
                                </span>
                            }
                            styles={{
                                body: {
                                    padding: 10, paddingBottom: 0, overflow: 'hidden',
                                    width: '100%'
                                }
                            }}
                        >
                            <div style={{width: '100%', maxWidth: '100%'}}>
                                <PageTimeSpentChart
                                    communityIds={communityIds}
                                    apiUrl={apiUrl}
                                    dateRange={dateRange}
                                    // initialData={analyticsData.pageTime}
                                />
                            </div>
                        </Card>
                    </Col>

                    <Col xl={24} lg={24} md={24} sm={24} xs={24}>
                        <Card
                            title={
                                <span>
                                   Class schedule and On Demand Streaming Time Spent
                                    <Tooltip
                                        title="Shows how much time users have spent watching class schedule and on demand videos for chosen period"
                                        placement="bottom"
                                    >
                                      <InfoCircleOutlined
                                          style={{ marginLeft: 8, color: "#532d7f" }}
                                      />
                                    </Tooltip>
                                </span>
                            }
                            styles={{
                                body: {
                                    padding: 10, paddingBottom: 0, overflow: 'hidden',
                                    width: '100%'
                                }
                            }}
                        >
                            <div style={{width: '100%', maxWidth: '100%'}}>
                                <TimeSpentOnDemandClassScheduleChart
                                    communityIds={communityIds}
                                    apiUrl={apiUrl}
                                    dateRange={dateRange}
                                    // initialData={analyticsData.onDemand}
                                />
                            </div>
                        </Card>
                    </Col>

                    <Col xl={24} lg={24} md={24} sm={24} xs={24}>
                        <Card
                            title={
                                <span>
                                    VTC Class Time Spent
                                    <Tooltip
                                        title="Shows how much time users have spent participating in VTC classes for chosen period"
                                        placement="bottom"
                                    >
                                      <InfoCircleOutlined
                                          style={{ marginLeft: 8, color: "#532d7f" }}
                                      />
                                    </Tooltip>
                                </span>
                            }
                            styles={{
                                body: {
                                    padding: 10, paddingBottom: 0, overflow: 'hidden',
                                    width: '100%'
                                }
                            }}
                        >
                            <div style={{width: '100%', maxWidth: '100%'}}>
                                <TimeSpentVTCChart
                                    communityIds={communityIds}
                                    apiUrl={apiUrl}
                                    dateRange={dateRange}
                                    // initialData={analyticsData.vtc}
                                />
                            </div>
                        </Card>
                    </Col>
                </Row>
            </Col>
        </Row>
    );
};

export default ChartsAnalytics;