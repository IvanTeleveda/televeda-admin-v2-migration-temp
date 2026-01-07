import { Button, Card, Checkbox, Col, DateField, DatePicker, Divider, Form, Input, InputNumber, notification, Row, Space, Switch, Table, Tag, TextField, Typography } from '@pankod/refine-antd';
import {useContext, useEffect, useMemo, useRef, useState} from 'react';
import {ClockCircleOutlined, EditOutlined, FunctionOutlined} from '@ant-design/icons';
import { IMemberHistory, IRefineUser, IUser, UserPermissions } from '../../interfaces';
import { IMemberHistoryFilterVariables } from '../members/show';
import { EditButton, ShowButton, useForm, useTable } from '@refinedev/antd';
import { BaseRecord, HttpError, IResourceComponentsProps, useApiUrl, useCustom, useCustomMutation, useGetIdentity, useNavigation, useParsed, usePermissions, useShow, useUpdate } from '@refinedev/core';
import { ColorModeContext } from '../../contexts/color-mode';
import { ColumnsType } from 'antd/es/table';
import { List, Tooltip } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import moment from 'moment';
import { SurveySubmissionsTable } from '../../components/surveys/SurveySubmissionsTable';

interface ReferralDataForm {
    invitedFriends: number | string;
    referralPoints: number | string;
    note?: string;
}

export const UserShow: React.FC<IResourceComponentsProps> = () => {

    const apiUrl = useApiUrl();

    const { id: idFromRoute } = useParsed();

    const { mode } = useContext(ColorModeContext);

    const { formProps: profileFormProps, saveButtonProps: profileSaveButtonProps } = useForm<IUser>({
        action: 'edit',
        redirect: false
    });

    const { data: permissionsData } = usePermissions<UserPermissions>();

    const { data: myUserData, isLoading: userDataLoading } = useGetIdentity<IRefineUser>();

    const { push } = useNavigation();

    const { tableProps } = useTable<IMemberHistory, HttpError, IMemberHistoryFilterVariables>({
        resource: `community-associations/members/${idFromRoute}`,
        initialPageSize: 5,
    });

    const { mutate: customMutation, isLoading: mutationLoading } = useCustomMutation<any>();

    const { data: enrollmentData, isLoading: enrollmentDataIsLoading, refetch: fetchEnrollmentData } = useCustom({
        url: `${apiUrl}/2fa/check-enrollment`,
        method: 'get',
        queryOptions: {
            enabled: false
        }
    });

    const { mutate: updateReferrals } = useUpdate({
        resource: "_User/referral-points"
    });

    const [referralForm] = Form.useForm<ReferralDataForm>();

    const [referralFormInitialData, setReferralFormInitialData] = useState<ReferralDataForm>({
        invitedFriends: 0,
        referralPoints: 0
    });

    const [code, setCode] = useState<string>("");

    const [saveDisabled, setSaveDisabled] = useState<boolean>(true);

    const [surveyPrivileges, setSurveyPrivileges] = useState<boolean | undefined>(undefined);
    const [masterSurveyPrivilege, setMasterSurveyPrivilege] = useState<boolean>(false);

    const [active2FA, setActive2FA] = useState(false);

    const [countdown, setCountdown] = useState<number>(0);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    const { query } = useShow({
        resource: "_User/details",
        id: idFromRoute
    });
    const { data, isLoading, refetch } = query;

    const [selectedUserRecord, setSelectedUserRecord] = useState<BaseRecord | undefined>(undefined);

    const referredUsersColumns: ColumnsType<any> = [{
        title: 'First Name',
        dataIndex: 'firstName',
        key: 'firstName',
        onCell: (data) => ({
            colSpan: data.email === '[ User Deleted ]' ? 3 : 1
        }),
        render: (value, data) => (
            <TextField style={{ width: '100%' }} value={value} />
        )
    }, {
        title: 'Last Name',
        dataIndex: 'lastName',
        key: 'lastName',
        onCell: (data) => ({
            colSpan: data.email === '[ User Deleted ]' ? 0 : 1
        })
    }, {
        title: 'Email',
        dataIndex: 'email',
        key: 'email',
        onCell: (data) => ({
            colSpan: data.email === '[ User Deleted ]' ? 0 : 1
        }),
    }, {
        title: 'Has Attended',
        dataIndex: 'hasAttended',
        key: 'hasAttended',
        render: (value) => (
            <Checkbox checked={value} />
        )
    }, {
        title: 'Actions',
        dataIndex: 'actions',
        key: 'actions',
        render: (_, data) => (
            <ShowButton size="small" shape="round" style={{ width: 95 }} resource="community-associations/members" recordItemId={data.id}>History</ShowButton>
        )
    }];

    useMemo(() => {
        if (permissionsData === 'TelevedaAdmin' || myUserData?.id === idFromRoute) {
            setSaveDisabled(false);
        }
        if (myUserData?.surveyPermission.master) {
            setMasterSurveyPrivilege(true)
        }
    }, [permissionsData, !userDataLoading]);

    const referredUsersSource = useMemo(() => {
        return selectedUserRecord?.referredUsersData.map((entry: any) => {
            if (!entry.userRef) {
                return {
                    id: entry.userId,
                    firstName: '[ User Deleted ]',
                    lastName: '[ User Deleted ]',
                    email: '[ User Deleted ]',
                    hasAttended: entry.hasAttended
                }
            }
            return {
                ...entry.userRef,
                hasAttended: entry.hasAttended
            }
        })
    }, [selectedUserRecord]);

    useEffect(() => {
        if (data) {
            setSelectedUserRecord(data.data);

            setSurveyPrivileges(data.data.surveyPermission.general);

            setReferralFormInitialData({
                invitedFriends: data.data.invitedFriends,
                referralPoints: data.data.referralPoints
            });

            referralForm.setFieldsValue({
                invitedFriends: data.data.invitedFriends,
                referralPoints: data.data.referralPoints,
                note: ''
            });
        }

    }, [data]);

    useEffect(() => {
        if (permissionsData === 'TelevedaAdmin') {
            fetchEnrollmentData();
        }
    }, [permissionsData]);

    useEffect(() => {
        if (!enrollmentDataIsLoading) {
            if (enrollmentData?.data.isActive) {
                setActive2FA(true);
            }
        }
    }, [enrollmentData])

    useEffect(() => {
        if (countdown > 0) {
            countdownRef.current = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
        }

        return () => {
            if (countdownRef.current) {
                clearTimeout(countdownRef.current);
            }
        };
    }, [countdown]);

    const handleGenerateCode = () => {
        setCountdown(30);

        customMutation({
            url: `${apiUrl}/_User/api/admin/send-login-code`,
            method: 'post',
            values: {
                email: selectedUserRecord?.email,
                whereToSendTheCode: 'email',
                sendAsResponse: true
            }
            },
            {
            onSuccess: (data) => {
                setCode(data.data.code);
            },
            onError: () => {
                // Will leave this for now, so that we don't spam it too much
                // Reset countdown on error
                // setCountdown(0);
                // if (countdownRef.current) {
                //     clearTimeout(countdownRef.current);
                // }
            }
        })
    }

    const onProfileUpdate = async (values: Object) => {
        if (masterSurveyPrivilege && surveyPrivileges !== data?.data.surveyPermission.general) {
            customMutation({
                url: `${apiUrl}/surveys/update-privileges/${idFromRoute}`,
                method: "patch",
                values: { setTo: surveyPrivileges }
            },
                {
                    onError: (error: unknown) => {
                        console.log('error:', error)
                    },
                    onSuccess: () => {
                        refetch();
                        profileFormProps.onFinish?.(values);
                    }
                })
            return;
        }
        profileFormProps.onFinish?.(values);
    }

    const onReferralUpdate = (values: ReferralDataForm) => {
        if (referralFormInitialData.invitedFriends !== values.invitedFriends || referralFormInitialData.referralPoints !== values.referralPoints) {
            updateReferrals({
                id: idFromRoute,
                values: {
                    invitedFriends: typeof (values.invitedFriends === 'string') ? parseInt(values.invitedFriends as string) : values.invitedFriends,
                    referralPoints: typeof (values.referralPoints === 'string') ? parseInt(values.referralPoints as string) : values.referralPoints,
                    note: values.note
                }
            }, {
                onSuccess: () => {
                    refetch();
                },
                onError: (error: unknown) => {
                    console.log('error: ', error);
                }
            });
        }

        else {
            notification.open({
                description: "Values have not changed!",
                type: "info",
                message: "No update"
            });
        }

    }

    const CustomFooterNode: React.FC<{ total: number, range: Array<number> }> = ({ total, range }) => {
        return (
            <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
                <ShowButton
                    style={{ position: 'absolute', left: 20, bottom: 0 }}
                    size="small"
                    type='link'
                    icon={<></>}
                    resource="community-associations/members"
                    recordItemId={selectedUserRecord?.id}
                >
                    View All
                </ShowButton>
                <Typography.Text style={{ marginLeft: 100 }}>
                    {range[0]}-{range[1]} of {total}
                </Typography.Text>
            </Space>
        )
    }

    if (tableProps.pagination) {
        tableProps.pagination.size = "small";
        tableProps.pagination.showTotal = (total, range) => <CustomFooterNode total={total} range={range} />
    }

    const { TextArea } = Input;

    const tz = useMemo(() => {
        return moment.tz.guess()
    }, []);

    const { RangePicker } = DatePicker;
    const [form] = Form.useForm();
    const [queryFilters, setQueryFilters] = useState<{
        dateRange: [Dayjs, Dayjs],
        timezone: string,
    }>({
        dateRange: [
            dayjs().subtract(7, "days"),
            dayjs()
        ],
        timezone: tz
    });
    const { dateRange, timezone } = queryFilters;

    const { tableProps: tableUserItemInteractionProps } = useTable<{ 
        resourceName: string;
        totalCount: number;
        events: { date: string; eventType: string }[];
    }, HttpError>({
        resource: "analytics/userCommunityItemsEvents",
        permanentFilter: [
            { field: 'userId', operator: 'eq', value: selectedUserRecord?.id },
            { field: 'start', operator: 'gte', value: dateRange[0].toISOString()},
            { field: 'end', operator: 'lte', value: dateRange[1].toISOString() },
            { field: 'timezone', operator: 'eq', value: timezone }
        ],
        pagination: {
            pageSize: 10,
        },
        sorters: {
            mode: 'off',
        },
        syncWithLocation: true,
    });

    const { tableProps: tableUserPageInteractionProps } = useTable<{ 
        resourceName: string;
        totalCount: number;
        events: { date: string; eventType: string }[];
    }, HttpError>({
        resource: "analytics/userCommunityPageEvents",
        permanentFilter: [
            { field: 'userId', operator: 'eq', value: selectedUserRecord?.id },
            { field: 'start', operator: 'gte', value: dateRange[0].toISOString()},
            { field: 'end', operator: 'lte', value: dateRange[1].toISOString() }
        ],
        pagination: {
            pageSize: 10,
        },
        sorters: {
            mode: 'off',
        },
        syncWithLocation: true,
    });

    return (
        <Row gutter={[0, 16]}>
            <Col span={24}>
                <Card
                    title="Profile"
                >
                    <Row>
                        <Col xl={13} xs={24}>
                            <Space size={[0, 30]} direction='vertical'>

                                <Space style={{ width: '100%', justifyContent: 'center' }}>
                                    <Typography.Title level={5}>{`${selectedUserRecord?.firstName} ${selectedUserRecord?.lastName}`}</Typography.Title>
                                </Space>

                                <Space>
                                    <TextField
                                        style={{ wordBreak: 'keep-all' }}
                                        value={selectedUserRecord?.privileges?.some((item: string) => item === 'Admin') ?
                                            "Main community:" : selectedUserRecord?.communityNames.length > 1 ?
                                                "Communities:" : "Community:"}>

                                    </TextField>
                                    <Space size={[0, 6]} wrap>
                                        {selectedUserRecord?.privileges?.some((item: string) => item === 'Admin') ?
                                            <Tag
                                                style={{
                                                    borderRadius: '30px',
                                                    paddingInline: '12px',
                                                    paddingBlock: '2px',
                                                    fontSize: '15px',
                                                    fontWeight: 'lighter',
                                                    whiteSpace: 'wrap',
                                                    wordBreak: 'break-all',
                                                    textAlign: 'center'
                                                }}
                                                key={selectedUserRecord.id}
                                                color="#532D7F"
                                            >
                                                {selectedUserRecord.communityName}
                                            </Tag>
                                            :
                                            selectedUserRecord?.communityNames?.map((community: string) => {
                                                return (
                                                    <Tag
                                                        style={{
                                                            borderRadius: '30px',
                                                            paddingInline: '12px',
                                                            paddingBlock: '2px',
                                                            fontSize: '15px',
                                                            fontWeight: 'lighter',
                                                            whiteSpace: 'wrap',
                                                            wordBreak: 'break-all',
                                                            textAlign: 'center'
                                                        }}
                                                        color="#532D7F"
                                                    >
                                                        {community}
                                                    </Tag>)
                                            })
                                        }
                                    </Space>
                                </Space>

                                <Space>
                                    <Typography.Text>Access Privileges: </Typography.Text>

                                    {selectedUserRecord?.privileges?.map((priv: string, index: number) => {
                                        const length = selectedUserRecord.privileges.length;
                                        if (priv === "Admin") priv = "Super-Admin";
                                        if (priv === "Host") priv = "Instructor";
                                        return <TextField key={priv} value={index === length - 1 ? priv : `${priv}  |`} />
                                    })}

                                </Space>

                                <Space>
                                    <Typography.Text>Registration Code: </Typography.Text>
                                    <TextField key={selectedUserRecord?.registrationData?.referralCode} value={selectedUserRecord?.registrationData?.referralCode} />
                                </Space>

                                <Space style={{ marginBlock: '20px' }}>
                                    <Form {...profileFormProps} onFinish={(values) => onProfileUpdate(values)} layout="vertical" size="large">
                                        <Row gutter={[{ xs: 0, lg: 36 }, 0]}>
                                            <Col lg={12} xs={24}>
                                                <Form.Item
                                                    label={"First Name"}
                                                    labelCol={{ style: { fontWeight: 'bold' } }}
                                                    name="firstName"
                                                >
                                                    <Input disabled={idFromRoute !== myUserData?.id}/>
                                                </Form.Item>
                                            </Col>

                                            <Col lg={12} xs={24}>
                                                <Form.Item
                                                    label={"Last Name"}
                                                    labelCol={{ style: { fontWeight: 'bold' } }}
                                                    name="lastName"
                                                >
                                                    <Input disabled={idFromRoute !== myUserData?.id}/>
                                                </Form.Item>
                                            </Col>

                                            <Col lg={12} xs={24}>
                                                <Form.Item
                                                    label={"Email"}
                                                    labelCol={{ style: { fontWeight: 'bold' } }}
                                                    name="email"
                                                >
                                                    <Input disabled={idFromRoute !== myUserData?.id} />
                                                </Form.Item>
                                            </Col>

                                            <Col lg={12} xs={24}>
                                                <Form.Item
                                                    label={"Contact Number"}
                                                    labelCol={{ style: { fontWeight: 'bold' } }}
                                                    name={["accountData", "mobilePhoneNumber"]}
                                                >
                                                    <Input disabled={idFromRoute !== myUserData?.id} />
                                                </Form.Item>
                                            </Col>
                                            {permissionsData === 'TelevedaAdmin' &&
                                                <>
                                                    <Col lg={12} xs={24}>
                                                        <Form.Item
                                                            label={"Hybrid Attendance Count"}
                                                            labelCol={{ style: { fontWeight: 'bold' } }}
                                                            name="countAs"
                                                        >
                                                            <InputNumber min={1} />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col lg={12} xs={24}>
                                                        <b>
                                                            <Typography.Text style={{ display: 'block', transform: 'translate(70px, 31px)' }}>
                                                                Is Televeda Admin
                                                            </Typography.Text>
                                                        </b>
                                                        <Form.Item
                                                            name={["accountData", "isTelevedaAdmin"]}
                                                            valuePropName="checked"
                                                        >
                                                            <Switch disabled={!active2FA} checkedChildren="YES" unCheckedChildren=" NO"></Switch>
                                                        </Form.Item>
                                                        {masterSurveyPrivilege && surveyPrivileges !== undefined &&
                                                            <>
                                                                <b>
                                                                    <Typography.Text style={{ display: 'block', transform: 'translate(70px, -21px)' }}>
                                                                        Is Covered Entity
                                                                    </Typography.Text>
                                                                </b>
                                                                <Switch
                                                                    disabled={!active2FA}
                                                                    defaultChecked={surveyPrivileges}
                                                                    onChange={(checked) => setSurveyPrivileges(checked)}
                                                                    style={{ marginTop: -86 }}
                                                                    checkedChildren="YES"
                                                                    unCheckedChildren=" NO"
                                                                ></Switch>
                                                            </>
                                                        }
                                                    </Col>
                                                    <Col span={24}>
                                                        <Space.Compact size="large" style={{ width: '100%', marginBottom: 10 }}>
                                                            <Button
                                                                icon={countdown > 0 ? <ClockCircleOutlined /> : <FunctionOutlined />}
                                                                value={code}
                                                                type="primary"
                                                                disabled={!active2FA || mutationLoading || countdown > 0}
                                                                loading={mutationLoading}
                                                                onClick={handleGenerateCode}
                                                            >
                                                                {countdown > 0 ? `Generate Code (${countdown}s)` : "Generate Code"}
                                                            </Button>
                                                            <Input value={code} />

                                                        </Space.Compact>
                                                        {!active2FA &&
                                                            <Typography.Text>Some features now require 2FA&nbsp;
                                                                <Typography.Text
                                                                    strong
                                                                    underline
                                                                    style={{ cursor: 'pointer' }}
                                                                    onClick={() => push(`../../totp-auth?goto=admin/all-accounts/show/${idFromRoute}`)}
                                                                >
                                                                    HERE
                                                                </Typography.Text>
                                                            </Typography.Text>
                                                        }
                                                    </Col>
                                                </>
                                            }
                                            {!saveDisabled && !userDataLoading &&
                                                <Col style={{ display: 'flex', flexDirection: 'row-reverse' }} span={24}>
                                                    <EditButton style={{ marginTop: 24 }} {...profileSaveButtonProps} size="large" type='primary'>Save</EditButton>
                                                </Col>
                                            }
                                        </Row>
                                    </Form>
                                </Space>
                            </Space>
                        </Col>
                        <Col xl={1} xs={0}>
                            <div style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                                <div style={{
                                    width: 1,
                                    height: '100%',
                                    backgroundColor: mode === 'light' ? 'rgba(5, 5, 5, 0.06)' : 'rgba(253, 253, 253, 0.12)'
                                }}></div>
                            </div>
                        </Col>
                        <Col xl={10} xs={24}>
                            <Typography.Title style={{ textAlign: "center", marginBottom: '30px' }} level={5}> Attendance History</Typography.Title>
                            <Table {...tableProps} rowKey="id">
                                <Table.Column
                                    dataIndex="className"
                                    key="className"
                                    ellipsis={true}
                                    title="Event name"
                                    render={(value) => <TextField value={value} />}
                                    sorter
                                />

                                <Table.Column
                                    dataIndex="eventType"
                                    key="eventType"
                                    ellipsis={true}
                                    title="Action"
                                    render={(value) => <TextField value={value === 0 ? "Joined" : "Left"} />}
                                    sorter
                                />

                                <Table.Column
                                    dataIndex="timestamp"
                                    key="timestamp"
                                    ellipsis={true}
                                    title="Timestamp"
                                    render={(value) => <DateField value={value} format="LLL" />}
                                    sorter
                                />

                                <Table.Column
                                    dataIndex="classCommunityName"
                                    key="classCommunityName"
                                    ellipsis={true}
                                    title="Event Community"
                                    render={(value) => <TextField value={value} />}
                                    sorter
                                />

                                <Table.Column
                                    dataIndex="classScheduledFor"
                                    key="classScheduledFor"
                                    ellipsis={true}
                                    title="Event start"
                                    render={(value) => <DateField value={value} format="LLL" />}
                                    sorter
                                />

                            </Table>
                        </Col>
                    </Row>
                </Card>
            </Col>

            <Col span={24}>
                <Card
                    title="Referral Info"
                >
                    <Space>
                        <Typography.Text>Referral ID: </Typography.Text>
                        <TextField key={selectedUserRecord?.id} value={selectedUserRecord?.referralId} />
                    </Space>
                    <br /><br />

                    {selectedUserRecord?.referralOverrides.length > 0 && (
                        <Space>
                            <List>
                                {
                                    selectedUserRecord?.referralOverrides.map((override: any) => {
                                        return (
                                            <List.Item key={override.id}>
                                                <Col span={24}>
                                                    <Typography.Text strong>
                                                        {override.overriddenBy} updated referral entries on <DateField value={override.createdAt} format="LLL" />: <br />
                                                    </Typography.Text>

                                                    {override.inviteesOffset !== 0 &&
                                                        <Typography.Text italic style={{ color: 'orange' }}>
                                                            {override.inviteesOffset > 0 ? "Added" : "Subtracted"}
                                                            &nbsp;{Math.abs(override.inviteesOffset)}
                                                            &nbsp;invited user{Math.abs(override.inviteesOffset) > 1 ? 's' : ''}
                                                            <br />
                                                        </Typography.Text>
                                                    }

                                                    {override.pointsOffset !== 0 &&
                                                        <Typography.Text italic style={{ color: 'orange' }}>
                                                            {override.pointsOffset > 0 ? "Added" : "Subtracted"}
                                                            &nbsp;{Math.abs(override.pointsOffset)}
                                                            &nbsp;referral point{Math.abs(override.pointsOffset) > 1 ? 's' : ''}
                                                            <br />
                                                        </Typography.Text>
                                                    }

                                                    {override.note &&
                                                        <>
                                                            <Typography.Text strong>Note: </Typography.Text>
                                                            <Typography.Text italic style={{ color: 'orange' }}>{override.note}</Typography.Text>
                                                        </>
                                                    }
                                                </Col>
                                            </List.Item>
                                        )
                                    })
                                }
                            </List>
                        </Space>
                    )}

                    <Row style={{ marginTop: 24 }}>
                        <Col xl={13} xs={24}>
                            <Form form={referralForm} layout='vertical' onFinish={onReferralUpdate}>
                                <Row gutter={[{ xs: 0, lg: 36 }, 12]}>
                                    <Col lg={12} xs={24}>
                                        <Form.Item
                                            label="Invited Friends"
                                            name="invitedFriends"
                                            rules={[{
                                                type: 'integer'
                                            }]}
                                        >
                                            <InputNumber style={{ width: '100%' }} size='large' />
                                        </Form.Item>
                                    </Col>
                                    <Col lg={12} xs={24}>
                                        <Form.Item
                                            label="Referral Points"
                                            name="referralPoints"
                                            rules={[{
                                                type: 'integer'
                                            }]}
                                        >
                                            <InputNumber style={{ width: '100%' }} size='large' />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            noStyle
                                            shouldUpdate={(prevValues, currentValues) => prevValues.invitedFriends !== currentValues.invitedFriends ||
                                                prevValues.referralPoints !== currentValues.referralPoints}
                                            preserve={true}
                                        >
                                            {({ getFieldValue }) => {
                                                return parseInt(getFieldValue('invitedFriends')) !== referralFormInitialData.invitedFriends ||
                                                    parseInt(getFieldValue('referralPoints')) !== referralFormInitialData.referralPoints ? (
                                                    <Form.Item
                                                        label="Note"
                                                        name="note"
                                                    >
                                                        <TextArea rows={2} />
                                                    </Form.Item>
                                                ) : null
                                            }}
                                        </Form.Item>
                                    </Col>
                                    <Col style={{ display: 'flex', flexDirection: 'row-reverse' }} span={24}>
                                        <Form.Item>
                                            <Button icon={<EditOutlined />} size='large' type='primary' htmlType='submit'>Save</Button>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Form>
                        </Col>
                    </Row>

                    <Divider />

                    <Space style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }}>
                        <Typography.Title level={5}>Invited users list</Typography.Title>
                    </Space>

                    <Table scroll={{ x: true }} size='large' columns={referredUsersColumns} dataSource={referredUsersSource}></Table>
                </Card>
            </Col>

            <Col span={24}>
                <Card>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start'
                        }}>
                            <Space direction="vertical" style={{ gap: '0' }}>
                                <Typography.Text style={{ fontSize: 18 }} strong>
                                    Resource Analytics
                                </Typography.Text>
                            </Space>
                            
                            {/* Move Date Picker to the Right */}
                            <Space direction="vertical" style={{ marginLeft: 'auto' }}>  
                                <Form form={form}>
                                    <Form.Item name="dateRange">
                                        <RangePicker
                                            style={{
                                                height: 35,
                                                background: 'rgba(255, 255, 255, 0.3)'
                                            }}
                                            size="small"
                                            placeholder={[
                                                dayjs(dateRange[0]).format('YYYY-MM-DD'), 
                                                dayjs(dateRange[1]).format('YYYY-MM-DD')
                                            ]}
                                            onChange={(values: any) => {
                                                if (values && values[0] && values[1]) {
                                                    setQueryFilters(prevValue => ({
                                                        ...prevValue, 
                                                        dateRange: [values[0].startOf('day'), values[1].endOf('day')]
                                                    }));
                                                }
                                            }}
                                            ranges={{
                                                "This Week": [dayjs().startOf("week"), dayjs().endOf("week")],
                                                "Last Month": [dayjs().startOf("month").subtract(1, "month"), dayjs().endOf("month").subtract(1, "month")],
                                                "This Month": [dayjs().startOf("month"), dayjs().endOf("month")],
                                                "This Year": [dayjs().startOf("year"), dayjs().endOf("year")],
                                            }}
                                            format="YYYY/MM/DD"
                                            allowClear={false}
                                        />
                                    </Form.Item>
                                </Form>
                            </Space>
                        </div>

                        <Space direction="vertical" style={{ gap: '0', marginTop: 24 }}>
                            <Typography.Text style={{ fontSize: 18 }} strong>
                                Survey Submissions
                            </Typography.Text>
                        </Space>
                        <SurveySubmissionsTable 
                            surveyId="bc6fc9fd-aadf-4592-a974-6dadad6f0ec1"
                            startDate={dateRange[0].toISOString()}
                            endDate={dateRange[1].toISOString()}
                        />

                        <Space direction="vertical" style={{ gap: '0' }}>
                            <Typography.Text
                                style={{ fontSize: 18 }}
                                strong
                                >
                                Community page views
                            </Typography.Text>
                        </Space>
                        <Table 
                            {...tableUserPageInteractionProps} 
                            rowKey="resourceName" 
                        >
                            <Table.Column
                                dataIndex="eventDate"
                                key="eventDate"
                                title={<span style={{ paddingLeft: "40px", display: "inline-block" }}>Date</span>}
                                render={(value) => <TextField value={value}  style={{ paddingLeft: "40px" }} />}
                                width={400}
                            />
                            <Table.Column
                                dataIndex="eventCount"
                                key="eventCount"
                                title="Count"
                                width={400}
                            />
                        </Table>

                        <Space direction="vertical" style={{ gap: '0' }}>
                            <Typography.Text
                                style={{ fontSize: 18 }}
                                strong
                                >
                                Community items events
                            </Typography.Text>
                        </Space>
                        <Table 
                            {...tableUserItemInteractionProps} 
                            rowKey="resourceName" 
                            expandable={{
                                expandedRowRender: (record: any) => {
                                    return (
                                        <Table 
                                            size="small" 
                                            rowKey="event_date" 
                                            pagination={false}
                                            dataSource={record.events}
                                            style={{ paddingLeft: 10}}
                                        >
                                            <Table.Column
                                                title="Access Date"
                                                dataIndex="eventDate"
                                                key="eventDate"
                                            />
                                            <Table.Column
                                                title="Access Type"
                                                dataIndex="eventType"
                                                key="eventType"
                                            />
                                        </Table>
                                    );
                                },
                                expandIcon: ({ expanded, onExpand, record }) => (
                                    record.events && record.events.length > 0 ? (
                                        <Tooltip title={expanded ? "Collapse" : "Expand event details"}>
                                            <Button
                                                className={`ant-table-row-expand-icon ant-table-row-expand-icon-${expanded ? "expanded" : "collapsed"}`}
                                                type="text"
                                                size="small"
                                                onClick={e => {
                                                    onExpand(record, e)
                                                }}
                                            >
                                            </Button>
                                        </Tooltip>
                                    ) : null
                                )
                            }}
                        >
                            <Table.Column
                                dataIndex="resourceName"
                                key="resourceName"
                                title="Resource Name"
                                render={(value) => <TextField value={value} />}
                            />
                            <Table.Column
                                dataIndex="totalCount"
                                key="totalCount"
                                title="Item interaction"
                            />
                        </Table>
                    </div>
                </Card>
            </Col>
        </Row>
    )
}
