import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Button, Typography, Space, Spin, Alert, Modal, Form, notification } from '@pankod/refine-antd';
import { useCustom, useApiUrl, CrudFilters } from '@refinedev/core';
import { usePermissions } from '@refinedev/core';
import { useSelect } from '@refinedev/antd';
import {
    HeartOutlined,
    UserOutlined,
    TeamOutlined,
    LaptopOutlined, EnvironmentOutlined,
    FileTextOutlined,
    BankOutlined,
    SettingOutlined, ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { RadarChart } from './components/RadarChart';
import { CommunitySettings } from './components/CommunitySettings';
import { MouManagement } from './components/MouManagement';
import { VaSitesManagement } from './components/VaSitesManagement';
import { ICommunity } from '../../interfaces';
import Constants from '../../typings/constants';
import { useRef } from 'react';
import { ColorModeContext } from '../../contexts/color-mode';
import { SurveySubmissionsTable } from '../../components/surveys/SurveySubmissionsTable';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface RadarData {
    resources: {
        counselorRequests: number;
        platformEngagements: number;
    };
    vtc: {
        uniqueAttendees: number;
        helpfulSessions: number;
        retention: number;
    };
    hsp: {
        uniqueAttendees: number;
        hostingSites: number;
        retention: number;
    };
    members: {
        newVeterans: number;
        newWomenVeterans: number;
    };
    mou: number;
    vaSites: number;
}

const RadarDashboard: React.FC = () => {
    const apiUrl = useApiUrl();
    const { data: permissionsData } = usePermissions();

    // Check if user is admin
    const isAdmin = permissionsData === 'TelevedaAdmin';

    // Filter states (matching analytics page pattern)
    const [form] = Form.useForm();
    const [filters, setFilters] = useState<CrudFilters>([]);
    const [isFilterLoading, setIsFilterLoading] = useState(false);
    const [_, setIsInitialized] = useState(false);

    const { mode } = useContext(ColorModeContext);

    // Extract filters
    const communityIdsFilter = filters?.find((f: any) => f.field === "communityIds");
    const communityIds: any = communityIdsFilter?.value;

    const dateRangeFilter = filters?.find((f: any) => f.field === "timestamp");
    const dateRange = dateRangeFilter?.value;

    // Query parameters for API calls
    const [queryParams, setQueryParams] = useState<{
        start: string;
        end: string;
        timezone: string;
        communityIds?: string[];
    } | null>(null);

    // Modal states
    const [mouManagementVisible, setMouManagementVisible] = useState(false);
    const [vaSitesManagementVisible, setVaSitesManagementVisible] = useState(false);
    const [communitySettingsVisible, setCommunitySettingsVisible] = useState(false);

    // Fetch communities for dropdown
    const { data: communityData, isLoading: communityIsLoading } = useCustom<ICommunity>({
        url: `${apiUrl}/community/current`,
        method: "get",
    });

    const {
        selectProps: communitySelectProps,
    } = useSelect<ICommunity>({
        resource: "Community",
        optionLabel: "name",
        optionValue: "id",
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
        sort: [{ field: "name", order: "asc" }]
    });

    // Initialize with default date range (from Jan 1, 2024 to today)
    useEffect(() => {
        const defaultStart = dayjs('2024-01-01').startOf('day');
        const defaultEnd = dayjs().endOf('day');

        // Set form values first
        form.setFieldsValue({
            timestamp: [defaultStart, defaultEnd]
        });
        console.log('Set form values:', [defaultStart, defaultEnd]);

        // Set initial filters to trigger the date range display
        const initialFilters: CrudFilters = [];
        initialFilters.push({
            field: "timestamp",
            operator: "between",
            value: [defaultStart, defaultEnd]
        });
        console.log('Setting initial filters:', initialFilters);
        setFilters(initialFilters);

        // Set initial query params
        const defaultParams = {
            start: defaultStart.toISOString(),
            end: defaultEnd.toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            communityIds: communityIds || []
        };
        setQueryParams(defaultParams);
        setIsInitialized(true);
    }, []);

    // Update query parameters when communityIds changes (after initial load)
    useEffect(() => {
        if (queryParams && communityIds) {
            const updatedParams = {
                ...queryParams,
                communityIds
            };
            setQueryParams(updatedParams);
        }
    }, [communityIds]);

    // Update query parameters when filters change
    useEffect(() => {
        if (dateRange && dateRange[0] && dateRange[1]) {
            const params = {
                start: dateRange[0].startOf('day').toISOString(),
                end: dateRange[1].endOf('day').toISOString(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                communityIds
            };
            console.log('R.A.D.A.R. Query Parameters:', params);
            setQueryParams(params);
        }
    }, [communityIds, dateRange]);

    // Fetch R.A.D.A.R. data
    const { data: radarData, isLoading: radarLoading, refetch: refetchRadarData } = useCustom<RadarData>({
        url: `${apiUrl}/analytics/radar/summary`,
        method: 'get',
        config: {
            query: queryParams,
        },
        queryOptions: {
            enabled: isAdmin && !!queryParams,
            refetchOnWindowFocus: false,
            keepPreviousData: false,
            queryKey: ['radar-summary', queryParams],
            onSuccess: (data) => {
                console.log('R.A.D.A.R. data fetched successfully:', data);
            },
            onError: (error) => {
                console.error('Error fetching radar data:', error);
                notification.error({
                    message: 'R.A.D.A.R. Error',
                    description: 'Failed to load R.A.D.A.R. data. Please try again.',
                });
            }
        }
    });

    // Fetch community settings count
    const { data: communitySettingsData, refetch: refetchCommunitySettings } = useCustom<Array<{ communityIds: string[] }>>({
        url: `${apiUrl}/analytics/radar/communities`,
        method: 'get',
        queryOptions: {
            enabled: isAdmin,
            refetchOnWindowFocus: false
        }
    });

    // Combined loading state
    const isLoading = radarLoading || isFilterLoading;

    const retentionData = useMemo(() => {
        const retention = radarData?.data?.vtc?.retention || 0;
        if (retention === 0 && radarData?.data?.vtc?.uniqueAttendees && radarData?.data?.vtc?.uniqueAttendees > 0) {
            const calculated = Math.round((radarData.data.vtc.helpfulSessions / radarData.data.vtc.uniqueAttendees) * 100);
            return calculated;
        }
        return retention;
    }, [radarData?.data.vtc.retention]);

    // Format date range for display
    const formattedDateRange = useMemo(() => {
        if (!dateRange || !dateRange[0] || !dateRange[1]) return "";
        return `${dateRange[0].format('MMM DD, YYYY')} - ${dateRange[1].format('MMM DD, YYYY')}`;
    }, [dateRange]);

    // Handle view totals to date button click
    // NOTE: we currently don't have any data before 2024-01-01 for the VTC + surveys, but will do for now.
    const handleViewTotalsToDate = () => {
        const startDate = dayjs('2024-01-01').startOf('day');
        const endDate = dayjs().endOf('day');

        // Update form values
        form.setFieldsValue({
            timestamp: [startDate, endDate]
        });

        // Update filters
        const newFilters: CrudFilters = [];
        if (communityIds && communityIds.length > 0) {
            newFilters.push({
                field: "communityIds",
                operator: "in",
                value: communityIds
            });
        }
        newFilters.push({
            field: "timestamp",
            operator: "between",
            value: [startDate, endDate]
        });
        setFilters(newFilters);

        // Update query params
        const newParams = {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            communityIds: communityIds || []
        };
        setQueryParams(newParams);

        notification.success({
            message: 'Date Range Updated',
            description: 'Showing totals from January 1, 2024 to today.',
        });
    };

    if (!isAdmin) {
        return (
            <div style={{ padding: '50px', textAlign: 'center' }}>
                <Alert
                    message="Access Denied"
                    description="This dashboard is only accessible to Televeda Administrators."
                    type="error"
                    showIcon
                />
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <Title level={1} style={{ marginBottom: '8px' }}>R.A.D.A.R.</Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                    Real-time Analytics Dashboard for Assessment & Reporting for the Hero's Story Project
                </Text>
            </div>


            {/* Community Settings */}
            <Col span={24}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 10 }}>
                    <SettingOutlined style={{ fontSize: '16px', color: '#1890ff' }} />
                    <Button
                        type="link"
                        onClick={() => setCommunitySettingsVisible(true)}
                        style={{ padding: 0, height: 'auto' }}
                    >
                        Configure Communities ({communitySettingsData?.data?.[0]?.communityIds?.length || 0})
                    </Button>
                </div>
            </Col>

            {/* MOUs */}
            <Col xs={24} xl={12}>
                <Card bodyStyle={{ paddingBlock: 12 }}>
                    <Row gutter={[10, 10]} style={{ alignItems: 'center' }}>
                        <Col sm={24} md={12} style={{ width: '100%' }}>
                            <div onClick={() => isAdmin && setMouManagementVisible(true)}>
                                <Statistic
                                    style={{ display: 'flex', alignItems: 'center', gap: 30, justifyContent: 'space-between', width: '90%' }}
                                    title="Memorandums of Understanding (MOUs)"
                                    value={radarData?.data?.mou || 0}
                                    valueStyle={{ minWidth: 70 }}
                                    prefix={<FileTextOutlined />}
                                    loading={radarLoading}
                                />
                            </div>
                        </Col>
                        <Col sm={24} md={12} style={{ width: '100%' }}>
                            <div onClick={() => isAdmin && setVaSitesManagementVisible(true)}>
                                <Statistic
                                    style={{ display: 'flex', alignItems: 'center', gap: 30, justifyContent: 'space-between', width: '90%' }}
                                    title="Total VA Site Adopters of Solution"
                                    value={radarData?.data?.vaSites || 0}
                                    valueStyle={{ minWidth: 70 }}
                                    prefix={<BankOutlined />}
                                    loading={radarLoading}
                                />
                            </div>
                        </Col>
                    </Row>
                </Card>
            </Col>

            <Col xs={24} xl={16} style={{ marginBlock: 24 }}>
                <div
                    style={{
                        height: 'fit-content',
                        paddingBlock: 10,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        //paddingInline: 20,
                        //borderRadius: 8,
                        // background: 'var(--ck-color-base-background)',
                        // border: `1px solid ${mode === 'light' ? '#f0f0f0' : '#303030'}`
                    }}
                >
                    {/* Date Range Selector */}
                    <Row gutter={[10, 10]} style={{ alignItems: 'center', width: '100%' }}>
                        <Col sm={24} md={8} style={{ flexDirection: 'row', display: 'flex', gap: 10 }}>
                            <Form
                                form={form}
                                initialValues={{
                                    timestamp: [dayjs('2024-01-01').startOf('day'), dayjs().endOf('day')]
                                }}
                            >
                                <Form.Item
                                    name="timestamp"
                                    style={{ margin: 0 }}
                                >
                                    <RangePicker
                                        style={{ width: '100%' }}
                                        format="YYYY-MM-DD"
                                        placeholder={['Start Date', 'End Date']}
                                        onChange={(dates) => {
                                            if (dates && dates[0] && dates[1]) {
                                                const newFilters: CrudFilters = [];
                                                if (communityIds && communityIds.length > 0) {
                                                    newFilters.push({
                                                        field: "communityIds",
                                                        operator: "in",
                                                        value: communityIds
                                                    });
                                                }
                                                newFilters.push({
                                                    field: "timestamp",
                                                    operator: "between",
                                                    value: [dates[0].startOf('day'), dates[1].endOf('day')]
                                                });
                                                setFilters(newFilters);
                                            }
                                        }}
                                    />
                                </Form.Item>
                            </Form>

                        </Col>

                        {/* View Totals Button */}
                        <Col sm={24} md={8}>
                            <Button
                                type="primary"
                                icon={<ReloadOutlined />}
                                onClick={handleViewTotalsToDate}
                                loading={isLoading}
                            >
                                View Totals to Date
                            </Button>
                        </Col>
                    </Row>
                </div>
            </Col>


            {/* Date Range Display
                {formattedDateRange && (
                    <div style={{
                        textAlign: 'center',
                        marginTop: '16px',
                        padding: '12px',
                        backgroundColor: '#1f1f1f',
                        borderRadius: '6px',
                        border: '1px solid #434343'
                    }}>
                        <Text strong style={{ fontSize: 16, color: '#ffffff' }}>
                            Showing data for: {formattedDateRange}
                        </Text>
                        {dateRange && (
                            <div style={{ marginTop: 4 }}>
                                <Text type="secondary" style={{ fontSize: 12, color: '#bfbfbf' }}>
                                    {dateRange[0].isSame(dateRange[1], 'day')
                                        ? 'Single day view'
                                        : `${dateRange[1].diff(dateRange[0], 'day') + 1} day period`
                                    }
                                </Text>
                            </div>
                        )}
                    </div>
                )} */}


            {/* Summary Cards */}
            <Spin spinning={isLoading} tip="Loading R.A.D.A.R. data...">
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>

                    {/* Members who found sessions helpful */}
                    <Col xs={24} sm={12} md={6}>
                        <Card hoverable style={{ height: '160px', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <Statistic
                                    title="Members who found sessions helpful"
                                    value={radarData?.data?.vtc?.helpfulSessions || 0}
                                    valueStyle={{ color: '#52c41a' }}
                                    prefix={<HeartOutlined />}
                                    loading={radarLoading}
                                />
                            </div>
                        </Card>
                    </Col>

                    {/* New Users */}
                    <Col xs={24} sm={12} md={6}>
                        <Card hoverable style={{ height: '160px', overflow: 'hidden' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <Statistic
                                    title="New Users"
                                    value={radarData?.data?.members?.newVeterans || 0}
                                    valueStyle={{ color: '#1890ff' }}
                                    prefix={<UserOutlined />}
                                    loading={radarLoading}
                                />
                            </div>
                            <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                                <div>
                                    <Text strong>Total: </Text>
                                    <Text>{radarData?.data?.members?.newVeterans || 0}</Text>
                                </div>
                                <div>
                                    <Text strong>Women: </Text>
                                    <Text>{radarData?.data?.members?.newWomenVeterans || 0}</Text>
                                </div>
                            </div>
                        </Card>
                    </Col>

                    {/* Attendees */}
                    <Col xs={24} sm={12} md={6}>
                        <Card hoverable style={{ height: '160px', overflow: 'hidden' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <Statistic
                                    title="Attendees"
                                    value={(radarData?.data?.vtc?.uniqueAttendees || 0) + (radarData?.data?.hsp?.uniqueAttendees || 0)}
                                    valueStyle={{ color: '#722ed1' }}
                                    prefix={<TeamOutlined />}
                                    loading={radarLoading}
                                />
                            </div>
                            <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                                <div style={{ marginBottom: '4px' }}>
                                    <Text strong>Virtual Talking Circles: </Text>
                                    <Text>{radarData?.data?.vtc?.uniqueAttendees || 0}</Text>
                                </div>
                                <div style={{ marginBottom: '4px' }}>
                                    <Text strong>In-Person Events: </Text>
                                    <Text>{radarData?.data?.hsp?.uniqueAttendees || 0}</Text>
                                </div>
                                <div>
                                    <Text strong>Sites that hosted a session: </Text>
                                    <Text>{radarData?.data?.hsp?.hostingSites || 0}</Text>
                                    <EnvironmentOutlined style={{ marginLeft: '4px' }} />
                                </div>
                            </div>
                        </Card>
                    </Col>

                    {/* Resources */}
                    <Col xs={24} sm={12} md={6}>
                        <Card hoverable style={{ height: '160px', overflow: 'hidden' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <Statistic
                                    title="Resources"
                                    value={(radarData?.data?.resources?.platformEngagements || 0) + (radarData?.data?.resources?.counselorRequests || 0)}
                                    valueStyle={{ color: '#fa8c16' }}
                                    prefix={<LaptopOutlined />}
                                    loading={radarLoading}
                                />
                            </div>
                            <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                                <div style={{ marginBottom: '4px' }}>
                                    <Text strong>Platform Engagements: </Text>
                                    <Text>{radarData?.data?.resources?.platformEngagements || 0}</Text>
                                </div>
                                <div>
                                    <Text strong>Veteran Requests: </Text>
                                    <Text>{radarData?.data?.resources?.counselorRequests || 0}</Text>
                                </div>
                            </div>
                        </Card>
                    </Col>
                </Row>

                <SurveySubmissionsTable 
                    surveyId="bc6fc9fd-aadf-4592-a974-6dadad6f0ec1"
                    startDate={dateRange[0].toISOString()}
                    endDate={dateRange[1].toISOString()}
                />

                {/* VTC Retention Trend Chart */}
                <Card title="VTC Retention Trend" style={{ marginBottom: '24px' }}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={8}>
                            <Statistic
                                title="Retention Rate"
                                value={(() => {
                                    const retention = radarData?.data?.vtc?.retention || 0;
                                    // Backup calculation: if retention is 0 and we have data, calculate from helpfulSessions/uniqueAttendees
                                    if (retention === 0 && radarData?.data?.vtc?.uniqueAttendees && radarData?.data?.vtc?.uniqueAttendees > 0) {
                                        const calculated = Math.round((radarData.data.vtc.helpfulSessions / radarData.data.vtc.uniqueAttendees) * 100);
                                        return calculated;
                                    }
                                    return retention;
                                })()}
                                suffix="%"
                                valueStyle={{ color: '#52c41a' }}
                                loading={radarLoading}
                            />
                        </Col>
                    </Row>
                    <RadarChart
                        retentionRate={retentionData}
                        loading={radarLoading}
                    />
                </Card>
            </Spin>

            {/* MOU Management Modal */}
            <Modal
                open={mouManagementVisible}
                onCancel={() => setMouManagementVisible(false)}
                footer={null}
                width={1200}
                style={{ top: 20 }}
            >
                <MouManagement
                    onClose={() => setMouManagementVisible(false)}
                    onDataChange={() => refetchRadarData()}
                />
            </Modal>

            {/* VA Sites Management Modal */}
            <Modal
                open={vaSitesManagementVisible}
                onCancel={() => setVaSitesManagementVisible(false)}
                footer={null}
                width={1200}
                style={{ top: 20 }}
            >
                <VaSitesManagement
                    onClose={() => setVaSitesManagementVisible(false)}
                    onDataChange={() => refetchRadarData()}
                />
            </Modal>

            {/* Community Settings Modal */}
            <Modal
                title="R.A.D.A.R. Community Settings"
                open={communitySettingsVisible}
                onCancel={() => setCommunitySettingsVisible(false)}
                footer={null}
                width={800}
            >
                <CommunitySettings onSettingsChange={() => {
                    setCommunitySettingsVisible(false);
                    refetchRadarData();
                    refetchCommunitySettings();
                }} />
            </Modal>
        </div >
    );
};

export default RadarDashboard;
