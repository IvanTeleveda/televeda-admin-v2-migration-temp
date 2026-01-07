import {
    Table,
    TextField,
    DateField,
    Col,
    Form,
    Input,
    Icons,
    Select,
    DatePicker,
    Space,
    notification,
    Tooltip,
    Button,
    Typography,
    MenuProps,
    Dropdown,
} from "@pankod/refine-antd";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { DownOutlined, LoadingOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { IClassReportData, ICommunity, UserPermissions } from "../../interfaces";
import Constants from "../../typings/constants";
import { FilterButton } from "../../components/buttons/filter";
import { TelevedaList } from "../../components/page-containers/list";
import FilterFormWrapper from "../../components/filter";
import { ClassAttendanceTable } from "./ClassAttendanceTable";
import { ExportButton, ShowButton, useSelect, useTable } from "@refinedev/antd";
import { CrudFilters, HttpError, useApiUrl, useCustom, usePermissions } from "@refinedev/core";
import { EventTypes } from "../../utils/enums";
import { getEventLabel } from "../../utils/eventLabels";

export interface IClassReportFilterVariables {
    className?: string;
    communityIds?: string;
    classTypes?: Array<EventTypes>;
    classScheduledFor?: any[];
}

export const ClassReportList: React.FC<{
    setParamKeys: Dispatch<SetStateAction<{
        tabOne: string;
        tabTwo: string;
    }>>
}> = ({ setParamKeys }) => {
    const filterButtonRef = useRef<{ hide: () => void }>();
    const filterWrapperRef = useRef<{ handleValidation: () => void }>();

    const apiUrl = useApiUrl();

    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    const [disabledExport, setDisabledExport] = useState(false);

    const { data: permissionsData } = usePermissions<UserPermissions>();

    const { selectProps: communitySelectProps } = useSelect<ICommunity>({
        resource: "community",
        optionValue: "id",
        optionLabel: "name",
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
        filters: [{
            field: "includeHosted",
            operator: "eq",
            value: "true"
        }]
    });

    const { tableProps: classTableProps, setFilters, searchFormProps: classSearchFormProps, filters: classFilters, sorters: classSorters, current: classCurrent } = useTable<IClassReportData, HttpError, IClassReportFilterVariables>({
        syncWithLocation: true,
        // hasPagination: false,
        resource: "report_classes",
        initialSorter: [
            {
                field: "classScheduledFor",
                order: "desc",
            },
        ],
        initialFilter: [
            {
                field: "classScheduledFor",
                operator: "between",
                value: [dayjs().subtract(8, 'days').startOf('day').toISOString(), dayjs().subtract(1, 'day').endOf('day').toISOString()]
            }
        ],
        onSearch: (params) => {
            const filters: CrudFilters = [];

            const { className, communityIds, classTypes, classScheduledFor } = params;

            filters.push({
                field: "className",
                operator: "contains",
                value: className,
            });

            filters.push({
                field: "communityId",
                operator: "in",
                value: communityIds,
            });

        filters.push({
                field: "classType",
                operator: "in",
                value: classTypes
            })

            if (classScheduledFor) {
                filters.push({
                    field: "classScheduledFor",
                    operator: "between",
                    value: [classScheduledFor[0].startOf("day").toISOString(), classScheduledFor[1].endOf("day").toISOString()],
                });
            }
            else {
                filters.push({
                    field: "classScheduledFor",
                    operator: "between",
                    value: [dayjs().subtract(8, 'days').startOf('day').toISOString(), dayjs().subtract(1, 'day').endOf('day').toISOString()]
                });
            }

            return filters;
        }
    });

    const { data: totalMembers, isLoading: totalMembersLoading } = useCustom({
        url: `${apiUrl}/report_classes/classMembers/total`,
        method: "get",
        config: {
            filters: classFilters
        },
        queryOptions: {
            enabled: classTableProps.loading === false,
            keepPreviousData: false
        }
    });

    const { refetch: initDownload } = useCustom<{
        data: any;
        total: number;
    }>({
        url: downloadUrl!,
        method: "get",
        queryOptions: {
            enabled: false
        },
        config: {
            filters: classFilters,
            sorters: classSorters,
        }
    });

    const dateRangeFilter = classFilters?.filter((item: any) => item.field === 'classScheduledFor')[0]?.value || null;

    useEffect(() => {
        setParamKeys((prevState) => { return { ...prevState, tabOne: window.location.search } })
    }, [classFilters, classSorters, classCurrent])

    useEffect(() => {

        if (classTableProps?.loading) return;

        console.log("Report data loaded:", classTableProps);

    }, [classTableProps?.loading]);

    useEffect(() => {
        if (downloadUrl) {
            initDownload();
            setDownloadUrl(null);
        }
    }, [downloadUrl]);

    const exportCommunityEventReport = (isPublic: boolean) => {

        if (isPublic) {
            setDownloadUrl(`${apiUrl}/report_classes/init_download_report/public`);
        }
        else {
           setDownloadUrl(`${apiUrl}/report_classes/init_download_report`);
        }

        setDisabledExport(true);

        notification.open({
            key: 'EXPORTS_NOTIFICATION',
            description: "Export is getting processed.",
            icon: <LoadingOutlined />,
            message: "Download will begin shortly!",
            duration: null,
            closable: false,
            onClose() {
                setDisabledExport(false);
            },
        });
    }

    const items: MenuProps['items'] = [{
        key: 'my-events',
        label: (<ExportButton disabled={disabledExport} onClick={() => exportCommunityEventReport(false)} style={{ width: 160, justifyContent: 'start' }} loading={false}>My events</ExportButton>),
    }, {
        key: 'public-events',
        label: (<ExportButton disabled={disabledExport} onClick={() => exportCommunityEventReport(true)} style={{ width: 160, justifyContent: 'center' }} loading={false}>All public events</ExportButton>),
    }
    ]

    const ClassReportActions: React.FC = () => (
        permissionsData === "CommunityHost" ?
            (<ExportButton disabled={disabledExport} onClick={() => exportCommunityEventReport(false)} loading={false}>Export</ExportButton>)
            :
            (<Dropdown overlayStyle={{ padding: 10 }} menu={{ items }}>
                <Button>
                    <Space>
                        Export
                        <DownOutlined />
                    </Space>
                </Button>
            </Dropdown>)
    );

    const { RangePicker } = DatePicker;

    const CustomFooterNode: React.FC<{ total: number; range: Array<number> }> = ({ total, range }) => {

        return (
            <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography.Text style={{ position: 'absolute', left: 20, bottom: window.innerWidth > 575 ? 5 : -20 }}>
                    <b>Attendance sum: </b>
                    {
                        totalMembersLoading || classTableProps.loading ?
                            <LoadingOutlined /> :
                            totalMembers?.data[0].total || 0
                    }
                </Typography.Text>
                <Typography.Text>
                    {range[0]}-{range[1]} of {total}
                </Typography.Text>
            </Space>)
    }

    if (classTableProps.pagination) {
        classTableProps.pagination.showTotal = (total, range) => <CustomFooterNode total={total} range={range} />
    }

    return (
        <TelevedaList
            title={
                `Class reports - ${dateRangeFilter ?
                    'from ' + dayjs(dateRangeFilter[0]).format('MMMM DD YYYY') + ' to ' + dayjs(dateRangeFilter[1]).format('MMMM DD YYYY')
                    :
                    'from ' + dayjs().subtract(8, 'day').format('MMMM DD YYYY') + ' to ' + dayjs().subtract(1, 'days').format('MMMM DD YYYY')}
            `}
            listProps={{
                headerProps: {
                    extra:
                        <>
                            <FilterButton
                                ref={filterButtonRef}
                                filters={classFilters}
                            >
                                <FilterFormWrapper
                                    ref={filterWrapperRef}
                                    filterButtonRef={filterButtonRef}
                                    formProps={classSearchFormProps}
                                    filters={classFilters || []}
                                    fieldValuesNameRef={['className', 'communityIds', 'classTypes', 'classScheduledFor']}
                                    filterValuesNameRef={['className', 'communityId', 'classType', 'classScheduledFor']}
                                    formElement={
                                        <>
                                            <Col xl={24} md={8} sm={12} xs={24}>
                                                <Form.Item label="Class name" name="className">
                                                    <Input
                                                        onChange={() => filterWrapperRef.current?.handleValidation()}
                                                        placeholder="Filter by class name"
                                                        prefix={<Icons.SearchOutlined />}
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col xl={24} md={8} sm={12} xs={24}>
                                                <Form.Item label="Community name" name="communityIds">
                                                    <Select
                                                        {...communitySelectProps}
                                                        onChange={() => filterWrapperRef.current?.handleValidation()}
                                                        placeholder="Filter by community name"
                                                        allowClear
                                                        mode="multiple"
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col xl={24} md={8} sm={12} xs={24}>
                                                <Form.Item
                                                    label="Class type"
                                                    name="classTypes"
                                                >
                                                    <Select
                                                        onChange={() => filterWrapperRef.current?.handleValidation()}
                                                        placeholder="Filter by event type" allowClear mode="multiple"
                                                        options={[
                                                            { value: EventTypes.LOCAL, label: 'Televeda Live' },
                                                            { value: EventTypes.EXTERNAL, label: 'External' },
                                                            { value: EventTypes.TELEVEDA_BINGO, label: 'Bingo' },
                                                            { value: EventTypes.VTC, label: 'VTC' },
                                                            { value: EventTypes.IN_PERSON, label: 'In Person' },
                                                            { value: EventTypes.ON_DEMAND, label: 'On-demand' },
                                                        ]} />
                                                </Form.Item>
                                            </Col>

                                            <Col xl={24} md={8} sm={12} xs={24}>
                                                <Form.Item
                                                    label="Scheduled date range"
                                                    name="classScheduledFor"
                                                >
                                                    <RangePicker disabledDate={(currentDate) => {
                                                        return currentDate.toDate().getTime() > Date.now() ? true : false
                                                    }}
                                                        onChange={() => filterWrapperRef.current?.handleValidation()}
                                                        style={{ width: "100%" }}
                                                        allowClear={false}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </>}
                                    syncWithLocation={true}
                                />
                            </FilterButton>
                            <ClassReportActions />
                        </>
                }
            }}
        >
            <Table
                locale={{
                    emptyText: (
                        <Space style={{ color: 'black', fontSize: 18, marginBlock: 36 }}>
                            Sorry you have not created any events during this time. You can only see reports of events you manage.
                        </Space>)
                }}
                {...classTableProps}
                rowKey={(record) => { return record.id + "|" + record.classScheduledFor }}
                //dataSource={dataSource}
                expandable={{
                    expandedRowRender: expandedRowRender,
                    expandIcon: ({ expanded, onExpand, record }) =>
                        record.participantsCount > 0 ? (
                            <Tooltip title={expanded ? "Collapse" : "Expand"}>
                                <Button
                                    className={`ant-table-row-expand-icon ant-table-row-expand-icon-${expanded ? "expanded" : "collapsed"}`}
                                    type="text"
                                    size="small"
                                    onClick={e => onExpand(record, e)}
                                >
                                </Button>
                            </Tooltip>
                        ) : null
                }}
            >
                <Table.Column
                    dataIndex="className"
                    key="className"
                    title="Class Name"
                    render={(value) => <TextField value={value} />}
                    //defaultSortOrder={getDefaultSortOrder("className", sorter)}
                    sorter
                />

                <Table.Column
                    dataIndex="classScheduledFor"
                    key="classScheduledFor"
                    title="Scheduled for"
                    render={(value) => <DateField value={value} format="LLL" />}
                    // defaultSortOrder={getDefaultSortOrder("timestamp", sorter)}
                    sorter
                />

                <Table.Column
                    dataIndex="communityName"
                    key="communityName"
                    title="Community"
                    render={(value) => <TextField value={value} />}
                    // defaultSortOrder={getDefaultSortOrder("timestamp", sorter)}
                    sorter
                />

                <Table.Column
                    dataIndex="classType"
                    key="classType"
                    title="Event Type"
                    render={(value) => <TextField value={getEventLabel(value, false)} />}
                // defaultSortOrder={getDefaultSortOrder("timestamp", sorter)}
                />

                <Table.Column
                    dataIndex="participantsCount"
                    key="participantsCount"
                    title="Participants Count"
                    render={(value) => <TextField value={value === -2 ? "Event canceled" : value === -1 ? "Host not shown" : value} />}
                // defaultSortOrder={getDefaultSortOrder("timestamp", sorter)}
                //sorter
                />

                <Table.Column<IClassReportData>
                    title="Actions"
                    render={(_, record) => (
                        record.isScheduledClass ? "No History" :
                            <Tooltip title="View report">
                                <ShowButton
                                    hideText
                                    recordItemId={btoa(JSON.stringify({ classScheduledFor: record.classScheduledFor, scheduledClassId: record.scheduledClassId, classType: record.classType }))}
                                />
                            </Tooltip>
                    )}
                />
            </Table>
        </TelevedaList>
    )
};

const expandedRowRender = (record: IClassReportData) => {
    return <ClassAttendanceTable record={record} />;
};