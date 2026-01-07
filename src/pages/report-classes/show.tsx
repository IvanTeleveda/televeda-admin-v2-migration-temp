import {
    Space,
    DateField,
    Row,
    Col,
    Card,
    Typography,
    Skeleton,
    Avatar,
    Rate,
    Timeline,
    ErrorComponent,
    notification
} from "@pankod/refine-antd";

import { List as AntdList } from 'antd';
import { UserOutlined, VideoCameraOutlined, ClockCircleOutlined, StopOutlined } from '@ant-design/icons';
import { Button } from '@pankod/refine-antd'
import { ClassAttendanceTable } from "./ClassAttendanceTable";
import { CheckWebexAuthState, useWebexRedirect } from "../scheduled-class/useWebexRedirect";
import { IClassArchive, IClassFeedback, IClassReportData, IClassSessionEvent, IVTCClassFeedback, IWebexRecording } from "../../interfaces";
import { IResourceComponentsProps, useApiUrl, useList, useShow, useTranslate } from "@refinedev/core";
import { EditButton, ExportButton } from "@refinedev/antd";
import { Survey } from "survey-react-ui";
import { Model } from "survey-core";
import { surveyDefaultTheme } from "../surveys/defaultTheme";
import { EventTypes } from "../../utils/enums";
import { getEventLabel } from "../../utils/eventLabels";
import { ReactNode } from "react";

const { Text } = Typography;

// Helper function to format rating responses
const formatRatingResponse = (rating: string): string => {
    const ratingMap: { [key: string]: string } = {
        'strongly_agree': 'Strongly Agree',
        'agree': 'Agree',
        'neutral': 'Neutral',
        'disagree': 'Disagree',
        'strongly_disagree': 'Strongly Disagree'
    };
    return ratingMap[rating] || rating;
};

export const ClassReportShow: React.FC<IResourceComponentsProps> = () => {
    const t = useTranslate();

    const apiUrl = useApiUrl();

    const { query } = useShow<IClassReportData>();
    const { data, isLoading, isError } = query;
    const record = data?.data;

    const exportClassReport = () => {
        window.open(`${apiUrl}/report_classes/download_report/${btoa(JSON.stringify({ classScheduledFor: record?.scheduledFor, scheduledClassId: record?.scheduledClassId, classType: record?.classType }))}`);

        notification.open({
            description: "If you don't see it please check your browser downloads.",
            type: "success",
            message: "Download has started."
        });
    }

    const ClassReportActions: React.FC = () => (
        record ? <ExportButton onClick={exportClassReport} loading={false} /> : null
    );

    if (record && !record.id) {
        return (
            <Card title="Error" style={{ textAlign: 'center' }}>
                <Text strong={true}>Looks like the event has been deleted or edited.</Text>
                <ErrorComponent />
            </Card>);
    }

    return (
        <Card title="Class Report" extra={<ClassReportActions />}>
            <Space size={20} direction="vertical" style={{ width: "100%" }}>

                {!record && <Skeleton paragraph={{ rows: 1 }} />}

                {
                    record ? <ClassInfoCard record={record} loading={isLoading} /> : null
                }

                {
                    record && record.participantsCount > 0 ? <ClassAttendanceTable record={record} /> : null
                }

                {
                    record ? <ClassVideoRecordingsList record={record} /> : null
                }

                {
                    record ? <ClassFeedbackList record={record} /> : null
                }

            </Space>
        </Card>
    );
};

const ClassFeedbackList: React.FC<{ record: IClassReportData }> = ({ record }) => {

    const encodedParams = btoa(JSON.stringify({ classScheduledFor: record.scheduledFor, scheduledClassId: record.scheduledClassId, classType: record.classType }))

    const { data: fetchedFeedback, isLoading: isFeedbackLoading } = useList<IClassFeedback>({
        resource: `report_classes/${encodedParams}/feedback`, queryOptions: {
            enabled: record.classType !== EventTypes.VTC
        }
    });

    const { data: fetchedVTCFeedback, isLoading: isVTCFeedbackLoading } = useList<IVTCClassFeedback>({
        resource: `report_classes/${encodedParams}/feedback-vtc`, queryOptions: {
            enabled: record.classType === EventTypes.VTC
        }
    });

    // In case we want to save space in the database and fetch by surveyId...
    // const feedbackSurveyIds: Array<string> = useMemo(() => {
    //     if(!isLoading) {
    //         let ids = fetchedFeedback?.data.filter((item) => item.feedbackData?.type === 'survey').map((item) => item.feedbackData?.surveyId!);
    //         //@ts-ignore tYPe 'sET<string>' cAn oNLY bE iTeRAtEd tHRoUgH whEn uSInG tHe '--downlevelIteration' fLAg oR wItH a '--target' oF 'es2015' Or hIgHEr
    //         return ids = [...new Set(ids || [])];
    //     }
    //     return [];
    // }, [fetchedFeedback]);

    // console.log('feedbackIds', feedbackSurveyIds)

    // const { data: surveyFeedbackData, isLoading: surveyFeedbackLoading, refetch: fetchSurveyFeedbackData } = useCustom<{
    //     data: any;
    //     total: any;
    //     trend: number;
    // }>({
    //     url: `${apiUrl}/report_classes/${encodedParams}/surveys/feedback/`,
    //     method: "get",
    //     config: {
    //         query: {
    //             ids: feedbackSurveyIds
    //         },
    //     },
    //     queryOptions: {
    //         enabled: false
    //     }
    // });

    // useEffect(() => {
    //     if(feedbackSurveyIds && feedbackSurveyIds.length > 0) {
    //         fetchSurveyFeedbackData();
    //     }
    // }, [feedbackSurveyIds]);

    const renderSurvey = (item: IClassFeedback) => {
        try {
            const surveyJsonString = item.feedbackData?.json

            const survey = new Model(surveyJsonString);
            survey.mode = "display"
            survey.data = item.feedbackData?.data;
            survey.applyTheme(surveyDefaultTheme);
            survey.showTitle = false;

            return (
                <div style={{ height: 450, overflow: 'auto' }}>
                    <div style={{ transform: 'scale(0.8)', transformOrigin: "top left", width: "120%" }}>
                        <Survey model={survey} />
                    </div>
                </div>
            )
        }
        catch (error: unknown) {
            console.log('Error rendering survey', error)
            return <span>Something went wrong</span>
        }
    }

    function iterateData(data: any) {
        if (typeof data === 'object') {
            if (Array.isArray(data)) {
                // If it's an array, recursively process each element
                return <ul style={{ paddingLeft: 10 }}>{data.map((item: any) => iterateData(item))}</ul>;
            } else {
                // If it's an object, recursively process each property
                return <ul style={{ paddingLeft: 10 }}>{Object.entries(data).map(([innerKey, innerValue]: [string, any]) => <li>{innerKey}: {iterateData(innerValue)}</li>)}</ul>;
            }
        } else {
            if (data.toString().startsWith('data:image/')) {
                return <img width={'auto'} height={150} src={data} alt="image" />;
            }
            if (data.toString().startsWith('http')) {
                return <a href={data}>Link</a>;
            }
            return <span>{data.toString() + " "}</span>;
        }
    }

    function renderVTCSurveyCard(itemFeedback: Object) {
        return Object.entries(itemFeedback).map(([key, value]) => (
            <p key={key}>
                <strong>{key}: </strong>
                <span>{iterateData(value)}</span>
            </p>
        ));
    }

    return (
        <Card title={<div className="ant-page-header-heading-title">Class Feedback</div>} >
            {
                record.classType === EventTypes.VTC ?
                    isVTCFeedbackLoading ? <Skeleton avatar paragraph={{ rows: 4 }} /> :
                        <AntdList
                            size="large"
                            grid={{ gutter: 16, column: 2 }}
                            pagination={{
                                onChange: page => {
                                    console.log(page);
                                },
                                pageSize: 4,
                            }}
                            dataSource={fetchedVTCFeedback?.data}
                            renderItem={(item, index) => (
                                <AntdList.Item
                                    key={index}
                                >
                                    <Card
                                        title={
                                            <AntdList.Item.Meta
                                                avatar={<Avatar icon={<UserOutlined />} />}
                                                title={
                                                    <p>
                                                        <span>{item.metadata.name}</span>
                                                        <span>{item.isFacilitator ? " (Facilitator)" : " (Attendee)"}</span>
                                                        <span>
                                                            {item.metadata.isFlagged && <span style={{ color: 'red' }}><b> - User flagged by facilitator</b></span>}
                                                        </span>
                                                    </p>
                                                }
                                                description={<div> <div>{item.metadata.email}</div> <div>{item.metadata.communityName}</div> </div>}
                                            />
                                        }

                                    >
                                        {item.feedback &&
                                            <Row gutter={[{ xs: 8, sm: 16, md: 24, lg: 32 }, 16]}>
                                                {!item.isFacilitator ?
                                                    <Col className="gutter-row" span={24}>
                                                        {renderVTCSurveyCard(item.feedback)}
                                                    </Col>
                                                    :
                                                    <Col className="gutter-row" span={24}>
                                                        <div><strong>Additional Feedback:</strong></div>
                                                        <div>{item.feedback.additionalFeedback || item.feedback.feedbackText || 'No additional feedback provided'}</div>
                                                    </Col>}
                                            </Row>
                                        }

                                    </Card>
                                </AntdList.Item>
                            )}
                        />
                    :
                    isFeedbackLoading ? <Skeleton avatar paragraph={{ rows: 4 }} /> :
                        <AntdList
                            size="large"
                            grid={{ gutter: 16, column: 2 }}
                            pagination={{
                                onChange: page => {
                                    console.log(page);
                                },
                                pageSize: 4,
                            }}
                            dataSource={fetchedFeedback?.data}
                            renderItem={item => (
                                <AntdList.Item
                                    key={item.id}

                                >
                                    <Card
                                        title={
                                            <AntdList.Item.Meta
                                                avatar={<Avatar icon={<UserOutlined />} />}
                                                title={`${item.userName} ${item.feedbackType == 1 ? " (Host)" : " (Participant)"}`}
                                                description={<div> <div>{item.userEmail}</div> <div>{item.communityName}</div> </div>}
                                            />
                                        }

                                    >
                                        {((item.note && item.feedbackType == 1 /* hosts might not have feedbackData set */) || (item.feedbackData && !item.feedbackData.type /* participant have it */)) &&
                                            <Row gutter={[{ xs: 8, sm: 16, md: 24, lg: 32 }, 16]}>
                                                {
                                                    (item.feedbackData?.ratingClassContent || item.feedbackData?.ratingInstructor || item.feedbackData?.technicalIssues) ?
                                                        <Col className="gutter-row" span={24}>
                                                            <div>
                                                                <div ><strong>Ratings:</strong></div>
                                                                <Rate defaultValue={item.feedbackData?.ratingClassContent} disabled />
                                                                <span className="ant-rate-text">Class Content</span>
                                                                <br />

                                                                <Rate defaultValue={item.feedbackData?.ratingInstructor} disabled />
                                                                <span className="ant-rate-text">Instructor</span>
                                                                <br />
                                                            </div>
                                                            <div>
                                                                <br />
                                                                {/* <Rate defaultValue={item.feedbackData?.ratingTechnical} disabled /> */}
                                                                <span><strong>Technical issues:</strong>  {item.feedbackData?.technicalIssues}</span>
                                                                <br />
                                                                {item.feedbackData?.supportedConnected && (
                                                                    <>
                                                                        <span><strong>Supported/Connected:</strong>  {item.feedbackData?.supportedConnected}</span>
                                                                        <br />
                                                                    </>
                                                                )}
                                                            </div>
                                                        </Col>
                                                        : null
                                                }

                                                <Col className="gutter-row" span={24}>
                                                    <div><strong>Feedback:</strong></div>
                                                    <div>{item.note}</div>
                                                </Col>
                                            </Row>
                                        }

                                        {/*item.note does not exist for participants who have survey feedback, hosts can't have survey feedback*/}
                                        {item.feedbackData && item.feedbackData.type === 'survey' && renderSurvey(item)}

                                    </Card>
                                </AntdList.Item>
                            )}
                        />
            }

        </Card>

    );
}

const ClassInfoCard: React.FC<{ record: IClassReportData; loading: any; }> = ({ record, loading }) => {

    const { data: fetchedEvents, isLoading } = useList<IClassSessionEvent>({ resource: `report_classes/${btoa(JSON.stringify({ classScheduledFor: record.scheduledFor, scheduledClassId: record.scheduledClassId, classType: record.classType }))}/class_events` });
    let showClassDidnotStop = false;

    if (fetchedEvents && fetchedEvents.data) {
        showClassDidnotStop = fetchedEvents.data[fetchedEvents.data.length - 1].eventType != 1;
    }

    let classType: string = getEventLabel(record?.classType, loading);

    return (
        <Card
            title={<div className="ant-page-header-heading-title">Class Info</div>}
            extra={record.canSeeOverrideButton && <EditButton>Override Participants Count</EditButton>}
        >

            <Row gutter={[{ xs: 8, sm: 16, md: 24, lg: 32 }, 16]}>
                <Col className="gutter-row" xs={24} sm={24} md={12} lg={12} xl={12}>

                    <Text strong={true}>Class Name: </Text>
                    <span className="ant-rate-text">{record.className}</span>
                    <br /><br />

                    <Text strong={true}>Class Type: </Text>
                    <span className="ant-rate-text">{classType}</span>
                    <br /><br />

                    <Text strong={true}>Community: </Text>
                    <span className="ant-rate-text">{record.communityName}</span>
                    <br /><br />

                    <Text strong={true}>Scheduled For: </Text>
                    <span className="ant-rate-text"><DateField value={record.scheduledFor} format="LLL" /></span>
                    <br /><br />

                    <Text strong={true}>Participants count: </Text>
                    <span className="ant-rate-text">{record.participantsCount}</span>
                    <br />

                    {record.classReportOverridden &&
                        <>
                            <Text italic={true} style={{ color: 'orange' }}>participant count overridden by {record.overriddenBy}</Text>
                            <br /><br />
                            <Text strong={true}>Note: </Text>
                            <span style={{ color: 'orange', wordBreak: 'break-all' }} className="ant-rate-text">{record.info}</span>
                            <br /><br />
                        </>
                    }
                </Col>

                {record?.classType === EventTypes.LOCAL || record.classType === EventTypes.TELEVEDA_BINGO || record.classType === EventTypes.VTC || !record?.classType && !loading ?
                    <Col className="gutter-row" xs={24} sm={24} md={12} lg={12} xl={12}>
                        <Timeline>
                            {
                                fetchedEvents && !fetchedEvents.data &&
                                <Timeline.Item color="red" dot={<StopOutlined style={{ fontSize: '16px' }} />} >
                                    <Text strong={true}>Event have not started</Text>
                                </Timeline.Item>
                            }
                            {
                                fetchedEvents && fetchedEvents.data ? fetchedEvents.data.map((classEvent) => (
                                    <Timeline.Item key={classEvent.id} color="green" dot={<ClockCircleOutlined style={{ fontSize: '16px' }} />} >
                                        <Text strong={true}>{classEvent.eventType == 0 ? 'Started: ' : 'Ended: '}</Text>
                                        <DateField value={classEvent.timestamp} format="LLL" />
                                    </Timeline.Item>
                                )) : null
                            }
                            {
                                showClassDidnotStop && record.classType !== EventTypes.TELEVEDA_BINGO ?
                                    <Timeline.Item color="red" dot={<ClockCircleOutlined style={{ fontSize: '16px' }} />} >
                                        <Text strong={true}>Host didn't stop the class properly.</Text>
                                    </Timeline.Item>
                                    : null
                            }
                        </Timeline>
                    </Col>
                    : null}
            </Row>

        </Card>

    );
}

const ClassVideoRecordingsList: React.FC<{ record: IClassReportData }> = ({ record }) => {

    const classReportId = btoa(JSON.stringify({ classScheduledFor: record.scheduledFor, scheduledClassId: record.scheduledClassId, classType: record.classType }));

    const { checkWebexAuth, executeWebexAuthRedirect, isLoading: webexIsLoading } = useWebexRedirect(`/admin/reports/report_classes`); //show/${classReportId}


    const { data: fetchedArchives, isLoading } = useList<IClassArchive>({ resource: `report_classes/${classReportId}/archives` });

    const { data: fetchedWebexRecordings, isLoading: isWebexRecordingsLoading } = useList<IWebexRecording>({ resource: `webex-class/${record.scheduledClassId}/recordings` });

    console.log('Archives: ', fetchedArchives);
    console.log('Webex recordings: ', fetchedWebexRecordings);

    if (record.classType == EventTypes.WEBEX) {

        if (checkWebexAuth() == CheckWebexAuthState.LOGGED_OUT) {
            return (
                <Card title={<div className="ant-page-header-heading-title">Webex Recordings</div>} >
                    <Button style={{ color: '#4775ff' }} type="default" size="small" shape="round" onClick={executeWebexAuthRedirect}>
                        Webex Sign In
                    </Button>
                </Card>
            );
        }
        else if (checkWebexAuth() == CheckWebexAuthState.LOADING) {
            return (
                <Card title={<div className="ant-page-header-heading-title">Webex Recordings</div>} >
                    <Button style={{ color: '#4775ff' }} type="default" size="small" shape="round" onClick={() => { }} loading disabled>
                        Webex Sign In
                    </Button>
                </Card>
            );
        }

        return (
            <Card title={<div className="ant-page-header-heading-title">Webex Recordings</div>} >
                {isWebexRecordingsLoading ? <Skeleton avatar paragraph={{ rows: 4 }} /> :

                    <AntdList
                        size="large"
                        dataSource={fetchedWebexRecordings?.data}
                        renderItem={item => (
                            <AntdList.Item
                                key={item.id}

                                actions={[
                                    <a key="list-loadmore-edit" href={item.playbackUrl} target="_blank">Play</a>,
                                    <a key="list-loadmore-edit" href={item.downloadUrl} target="_blank">Download</a>,
                                ]}
                            >

                                <AntdList.Item.Meta
                                    avatar={<Avatar icon={<VideoCameraOutlined />} />}
                                    title={<Text>{item.topic} | {item.password}</Text>}
                                />

                                <Text>{item.status}</Text>

                            </AntdList.Item>
                        )}
                    />
                }
            </Card>

        );
    }

    return (
        <Card title={<div className="ant-page-header-heading-title">Video Recordings</div>} >
            {isLoading ? <Skeleton avatar paragraph={{ rows: 4 }} /> :

                <AntdList
                    size="large"
                    dataSource={fetchedArchives?.data}
                    renderItem={item => (
                        <AntdList.Item
                            key={item.id}

                            actions={[<a key="list-loadmore-edit" href={item.url} target="_blank">view</a>]}
                        >

                            <AntdList.Item.Meta
                                avatar={<Avatar icon={<VideoCameraOutlined />} />}
                                title={<DateField value={item.timestamp} format="LLL" />}
                            />

                        </AntdList.Item>
                    )}
                />
            }
        </Card>

    );
}