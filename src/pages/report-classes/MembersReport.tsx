import { Col, DatePicker, Form, Icons, Input, Select, Space, Table, TextField, Typography } from "@pankod/refine-antd";
import { Dispatch, SetStateAction, useEffect, useRef } from "react";
import { LoadingOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import Constants from "../../typings/constants";
import { TelevedaList } from "../../components/page-containers/list";
import { IClassReportData, ICommunity } from "../../interfaces";
import FilterFormWrapper from "../../components/filter";
import { FilterButton } from "../../components/buttons/filter";
import { ShowButton, useSelect, useTable } from "@refinedev/antd";
import { CrudFilters, HttpError, useApiUrl, useCustom } from "@refinedev/core";

export interface IMemberReportFilterVariables {
    participantName?: string;
    participantEmail?: string;
    communityIds?: Array<string>;
    timestamp?: any[];
}

export const MemberReportList: React.FC<{
    setParamKeys: Dispatch<SetStateAction<{
        tabOne: string;
        tabTwo: string;
    }>>
}> = ({ setParamKeys }) => {
    const filterButtonRef = useRef<{ hide: () => void }>();
    const filterWrapperRef = useRef<{ handleValidation: () => void }>();

    const apiUrl = useApiUrl();

    const { selectProps: communitySelectProps } = useSelect<ICommunity>({
        resource: "community",
        optionValue: "id",
        optionLabel: "name",
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
    });

    const { tableProps: memberTableProps, searchFormProps: memberSearchFormProps, filters: memberFilters, sorters: memberSorter, current: memberCurrent, tableQuery: memberTableQuery } = useTable<IClassReportData, HttpError, IMemberReportFilterVariables>({
        syncWithLocation: true,
        resource: "report_classes/members",
        queryOptions: {
            retry: 2
        },
        errorNotification: ((error: any) => 
            {
                if(error.statusCode === 503) {
                    return  ({
                        description: "Error",
                        message: `Request took too long. Try shorter timeframe or specific email`,
                        type: "error"
                    })
                }
                else {
                    return ({
                        description: error?.response?.statusText,
                        message: error?.message || '',
                        type: "error"
                    })
                }
            }
           ),
        initialSorter: [
            {
                field: "hybridAttendanceCount",
                order: "desc",
            },
        ],
        initialFilter: [
            {
                field: "timestamp",
                operator: "between",
                value: [dayjs().subtract(8, 'days').startOf('day').toISOString(), dayjs().subtract(1, 'day').endOf('day').toISOString()]
            }
        ],
        onSearch: (params) => {
            const filters: CrudFilters = [];

            const { participantName, participantEmail, communityIds, timestamp } = params;

            filters.push({
                field: "participantName",
                operator: "contains",
                value: participantName,
            });

            filters.push({
                field: "participantEmail",
                operator: "contains",
                value: participantEmail
            })

            filters.push({
                field: "communityIds",
                operator: "in",
                value: communityIds,
            });


            if (timestamp) {
                filters.push({
                    field: "timestamp",
                    operator: "between",
                    value: [timestamp[0].startOf("day").toISOString(), timestamp[1].endOf("day").toISOString()],
                });
            }
            else {
                filters.push({
                    field: "timestamp",
                    operator: "between",
                    value: [dayjs().subtract(8, 'days').startOf('day').toISOString(), dayjs().subtract(1, 'day').endOf('day').toISOString()]
                });
            }

            return filters;
        }
    });

    const { data: totalMembers, isLoading: totalMembersLoading } = useCustom({
        url: `${apiUrl}/report_classes/members/total`,
        method: "get",
        config: {
            filters: memberFilters
        },
        queryOptions: {
            keepPreviousData: false
        }
    });

    useEffect(() => {
        setParamKeys((prevState) => { return { ...prevState, tabTwo: window.location.search } })
    }, [memberFilters, memberSorter, memberCurrent]);

    const dateRangeFilter = memberFilters?.filter((item: any) => item.field === 'timestamp')[0]?.value || null;

    const { RangePicker } = DatePicker;

    const CustomFooterNode: React.FC<{ total: number; range: Array<number> }> = ({ total, range }) => {

        return (
            <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography.Text style={{ position: 'absolute', left: 20, bottom: window.innerWidth > 575 ? 5 : -20 }}>
                     <b>Attendance sum: </b>
                     {
                        totalMembersLoading || memberTableProps.loading ?
                            <LoadingOutlined /> :
                            totalMembers?.data[0].total || 0
                     }
                </Typography.Text>
                <Typography.Text>
                    {range[0]}-{range[1]} of {total}
                </Typography.Text>
            </Space>)
    }

    if (memberTableProps.pagination) {
        memberTableProps.pagination.showTotal = (total, range) => <CustomFooterNode total={total} range={range} />
    }

    return (
        <TelevedaList
            title={
                `Member reports - ${dateRangeFilter ?
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
                                filters={memberFilters}
                            >
                                <FilterFormWrapper
                                    ref={filterWrapperRef}
                                    filterButtonRef={filterButtonRef}
                                    formProps={memberSearchFormProps}
                                    filters={memberFilters || []}
                                    fieldValuesNameRef={['participantName', 'participantEmail', 'communityIds', 'timestamp']}
                                    filterValuesNameRef={['participantName', 'participantEmail', 'communityIds', 'timestamp']}
                                    formElement={
                                        <>

                                            <Col xl={24} md={8} sm={12} xs={24}>
                                                <Form.Item label="Participant Email" name="participantEmail">
                                                    <Input
                                                        onChange={() => filterWrapperRef.current?.handleValidation()}
                                                        placeholder="Filter by Participant Email"
                                                        prefix={<Icons.SearchOutlined />}
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col xl={24} md={8} sm={12} xs={24}>
                                                <Form.Item label="Participant Community" name="communityIds">
                                                    <Select
                                                        {...communitySelectProps}
                                                        onChange={() => filterWrapperRef.current?.handleValidation()}
                                                        placeholder="Filter by community"
                                                        allowClear
                                                        mode="multiple"
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col xl={24} md={8} sm={12} xs={24}>
                                            <Form.Item
                                                    noStyle
                                                    shouldUpdate={(prevValues, currentValues) => 
                                                        prevValues.participantEmail !== currentValues.participantEmail ||
                                                        prevValues.communityIds !== currentValues.communityIds
                                                    }
                                                    preserve={true}
                                                >
                                                    {({ getFieldValue }) =>
                                                        (getFieldValue('participantEmail') || getFieldValue('communityIds')?.length > 0) ? (
                                                            <Form.Item label="Participant Name" name="participantName">
                                                                <Input
                                                                    onChange={() => filterWrapperRef.current?.handleValidation()}
                                                                    placeholder="Filter by Participant Name"
                                                                    prefix={<Icons.SearchOutlined />}
                                                                />
                                                            </Form.Item>
                                                        ) : null
                                                    }
                                                </Form.Item>
                                            </Col>

                                            <Col xl={24} md={8} sm={12} xs={24}>
                                                <Form.Item
                                                    label="Attendance Date Range"
                                                    name="timestamp"
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
                        </>
                }
            }}
        >
            <Table
                {...memberTableProps}
                rowKey={(record) => { return record.id + '|' + record.participantId }}
            >
                <Table.Column
                    dataIndex="participantId"
                    key="participantId"
                    title="User Identifier"
                    render={(value) => <TextField value={value} />}
                    sorter
                />

                <Table.Column
                    dataIndex="participantName"
                    key="participantName"
                    title="Participant Name"
                    render={(value) => <TextField value={value} />}
                    sorter
                />

                <Table.Column
                    dataIndex="participantEmail"
                    key="participantEmail"
                    title="Participant Email"
                    render={(value) => <TextField value={value} />}
                    sorter
                />

                <Table.Column
                    dataIndex="communityName"
                    key="communityName"
                    title="Participant Community"
                    render={(value) => <TextField value={value} />}
                    sorter
                />

                <Table.Column
                    dataIndex="hybridAttendanceCount"
                    key="hybridAttendanceCount"
                    title="Total Attendance"
                    render={(value) => <TextField value={value} />}
                    sorter
                />

                <Table.Column<IClassReportData>
                    title="Actions"
                    render={(_, record) => (
                        <ShowButton size="small" shape="round" resourceNameOrRouteName="community-associations/members" recordItemId={record.participantId}>History</ShowButton>
                    )}
                />
            </Table>
        </TelevedaList>
    )
};