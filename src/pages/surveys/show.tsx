import { Button, Col, DatePicker, Form, Icons, Input, Select, Space, Table, Tabs, TabsProps, Typography } from "@pankod/refine-antd";
import type { ColumnsType } from 'antd/es/table';
import { PlusSquareOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { CrudFilters, IResourceComponentsProps, LogicalFilter, useApiUrl, useCustom, useLink, useParsed } from "@refinedev/core";
import { ExportButton, useSelect, useTable } from "@refinedev/antd";
import { TelevedaShow } from "../../components/page-containers/show";
import { HttpError } from "@pankod/refine-core";
import { FilterButton } from "../../components/buttons/filter";
import FilterFormWrapper from "../../components/filter";
import { ICommunity } from "../../interfaces";
import Constants from "../../typings/constants";

interface SubmissionData {
    resultData: {
        senderCommunityId: string;
        CommunityId: string;
        json: Object;
        caretakerSubmission: boolean;
        sendBy: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        };
        onBehalfOf: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        };
        recipientCommunityId: string;
        timestamp: number;
    }[]
    metadata: {
        questions: Array<string>;
        timestamp: number;
        refId: string;
    }[],
    totalVersions: number;
}
interface ISubmissionDataFilterVariables {
    firstName?: string;
    lastName?: string;
    email?: string;
    recipientCommunityId?: string[];
    timestamp?: any[];
    surveySearch?: any
}
interface SubmissionVerionProps {
    version: number,
    setTotalTabs: React.Dispatch<React.SetStateAction<number>>
}

export const SurveySubmissions: React.FC<IResourceComponentsProps> = () => {

    const { id: idFromRoute } = useParsed();
    const Link = useLink();

    const apiUrl = useApiUrl();

    const handleChangle = (tab: string) => {
        localStorage.setItem('survey-submissions-tab', tab);
        setCurrentVersion(parseInt(tab) - 1);
    }

    const [currentVersion, setCurrentVersion] = useState(0);
    const [totalTabs, setTotalTabs] = useState(1);

    const tabItems: TabsProps['items'] = useMemo(() => {
        if (totalTabs === 1) {
            return [
                {
                    key: '1',
                    label: 'Version 1',
                    children: <SurveySubmissionsByVer version={0} setTotalTabs={setTotalTabs} />
                }
            ]
        }
        else {
            const items = [];
            for (let i = 0; i < totalTabs; i++) {
                items.push({
                    key: (i + 1).toString(),
                    label: `Version ${i + 1}`,
                    children: <SurveySubmissionsByVer version={i} setTotalTabs={setTotalTabs} />
                })
            }

            return items;
        }
    }, [totalTabs]);

    return (
        <TelevedaShow
            title="Submissions"
            headerButtons={
                <>
                    <ExportButton
                        onClick={() => window.open(`${apiUrl}/surveys/submissions/export/${idFromRoute}?version=${currentVersion}`)}
                        loading={false}
                    >
                        Export
                    </ExportButton>
                    <Button type="primary">
                        <Link style={{ color: "black" }} to={`/surveys/manual-entry/${idFromRoute}`}>
                            <PlusSquareOutlined /> Manual Entry
                        </Link>
                    </Button>
                </>
            }
        >
            <Tabs defaultActiveKey={localStorage.getItem('survey-submissions-tab') || "1"} type="card" onChange={(tab) => handleChangle(tab)} items={tabItems} />
        </TelevedaShow>
    );
};

export const SurveySubmissionsByVer: React.FC<SubmissionVerionProps> = (props) => {

    const { id: idFromRoute } = useParsed();

    const filterButtonRef = useRef<{ hide: () => void }>();
    const filterWrapperRef = useRef<{ handleValidation: () => void, filterClicks: number | undefined }>();

    const [surveySearchValue, setSurveySearchValue] = useState('');
    const [surveySearch, setSurveySearch] = useState(false);

    const [effectiveFilters, setEffectiveFilters] = useState<CrudFilters>([]);

    const { selectProps: communitySelectProps } = useSelect<ICommunity>({
        resource: "community",
        optionLabel: "name",
        optionValue: "id",
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
    });

    const [tableState, setTableState] = useState<{
        dataSource: Array<Object>;
        columns: ColumnsType<any>;
    }>();

    const { tableProps, tableQuery, filters, searchFormProps } = useTable<SubmissionData, HttpError, ISubmissionDataFilterVariables>({
        initialPageSize: surveySearch ? undefined : 20,
        resource: `surveys/submissions/${idFromRoute}`,
        filters: {
            permanent: [
                {
                    field: "version",
                    value: props.version,
                    operator: "eq",
                }, {
                    field: "surveySearch",
                    value: surveySearch,
                    operator: "eq"
                }
            ]
        },
        pagination: {
            mode: surveySearch ? 'client' : 'server'
        },
        onSearch: (params) => {
            const filters: CrudFilters = [];
            const { firstName, lastName, email, recipientCommunityId, timestamp } = params;

            // console.log("Filter params: ", params);

            filters.push({
                field: "firstName",
                operator: "contains",
                value: firstName,
            });

            filters.push({
                field: "lastName",
                operator: "contains",
                value: lastName,
            });

            filters.push({
                field: "email",
                operator: "eq",
                value: email,
            });

            filters.push({
                field: "recipientCommunityId",
                operator: "in",
                value: recipientCommunityId,
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
                    value: undefined
                });
            }

            return filters;
        },
        syncWithLocation: false
    });

    const queryData = useMemo(() => {
        return (tableQuery.data?.data as unknown as SubmissionData);
    }, [tableQuery.data]);

    const dateText = useMemo(() => {
        if (!queryData) {
            return '';
        }

        if (props.version === 0) {
            if (queryData.totalVersions > 1) {
                return `Current version includes entries before ${dayjs(queryData.metadata[props.version + 1].timestamp).format('MMMM D YYYY, h:mm A')}`
            }
            else {
                return '';
            }
        }
        else if (props.version === queryData.totalVersions - 1) {
            return `Current version includes entries after ${dayjs(queryData.metadata[props.version].timestamp).format('MMMM D YYYY, h:mm A')}`
        }
        else {
            return `Current version includes entries between ${dayjs(queryData.metadata[props.version].timestamp).format('MMMM D YYYY, h:mm A')} and ${dayjs(queryData.metadata[props.version + 1].timestamp).format('MMMM D YYYY, h:mm A')}`;
        }
    }, [queryData]);


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

    const deepSearch = (data: any, term: any): any => {
        const lowercasedTerm = term.toLowerCase();

        if (data === null || data === undefined) {
            return false;
        }

        // Check primitive values
        if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
            return String(data).toLowerCase().includes(lowercasedTerm.trim());
        }

        // If it's an array, search in each element
        if (Array.isArray(data)) {
            return data.some(item => deepSearch(item, lowercasedTerm));
        }

        // If it's an object, search in each value
        if (typeof data === 'object') {
            return Object.values(data).some(value => deepSearch(value, lowercasedTerm));
        }

        return false;
    };

    //onSearch fires when the apply filter is clicked, so does that, but it's handled as 2 different re-render and thus firing the fetch twice. 
    //At this point idgaf but if firestore reads become too much fix it I guess.
    //It only bugs out when doing applying or deleting client side filter (surveySearch) combined with a server side - if it's done 1 by 1 it's fine
    useEffect(() => {
        const filterClicks = filterWrapperRef.current?.filterClicks;
        if (filterClicks && filterClicks > 0) {
            if (surveySearchValue) {
                setSurveySearch(true);
            }
            else {
                setSurveySearch(false);
            }
            setEffectiveFilters(filters
                .filter((filter): filter is LogicalFilter => 'field' in filter && filter.field !== 'version' && filter.field !== 'surveySearch')
                .concat({ field: 'surveySearch', operator: 'eq', value: surveySearchValue })
            );
        }
    }, [filterWrapperRef.current?.filterClicks]);

    const filteredRawData = useMemo(() => {
        const rawData = queryData?.resultData || [];
        if (!surveySearchValue) {
            return rawData;
        }
        return rawData.filter(record => deepSearch(record.json, surveySearchValue));
    }, [queryData, filterWrapperRef.current?.filterClicks]);

    const communityMap = useMemo(() => {
        const map: Record<string, string> = {};
        if (communitySelectProps.options) {
            communitySelectProps.options.forEach(option => {
                if (option.value && typeof option.value === 'string' && option.label) {
                    map[option.value] = option.label.toString();
                }
            });
        }
        return map;
    }, [communitySelectProps.options]);

    useEffect(() => {
        if (!tableQuery.isLoading && queryData) {
            const dataSource = filteredRawData.map(
                (data, index) => {
                    const jsonData = Object.entries(data.json);
                    const returnData: any = {}

                    for (let [key, value] of jsonData) {
                        returnData[key] = iterateData(value)
                    }

                    const communityName = communityMap[data.recipientCommunityId];

                    return {
                        key: index,
                        firstName: data.sendBy.email === data.onBehalfOf.email ?
                            data.sendBy.firstName : data.onBehalfOf.firstName,
                        lastName: data.sendBy.email === data.onBehalfOf.email ?
                            data.sendBy.lastName : data.onBehalfOf.lastName,
                        email: data.sendBy.email === data.onBehalfOf.email ?
                            data.sendBy.email :
                            data.onBehalfOf.email ?
                                <Space direction="vertical">
                                    <span><b>Sender: </b>{data.sendBy.email}</span>
                                    <span><b>On behalf of: </b>{data.onBehalfOf.email}</span>
                                </Space> :
                                <Space direction="vertical">
                                    <span><b>Sender: </b>{data.sendBy.email}</span>
                                    <span><b>On behalf of: </b>Unregistered user</span>
                                </Space>,
                        recipientCommunityId: data.recipientCommunityId ?? [],
                        recipientCommunityName: communityName,
                        timestamp: dayjs(data.timestamp).format('MMMM D YYYY, h:mm A'),
                        ...returnData
                    }
                }
            );

            const columns: ColumnsType<any> = [
                {
                    title: 'First Name',
                    dataIndex: 'firstName',
                    key: 'firstName',
                    width: 150
                },
                {
                    title: 'Last Name',
                    dataIndex: 'lastName',
                    key: 'lastName',
                    width: 150
                },
                {
                    title: 'Email',
                    dataIndex: 'email',
                    key: 'email',
                    width: 200
                },
                {
                    title: 'Community',
                    dataIndex: 'recipientCommunityName',
                    key: 'recipientCommunityName',
                    render: (communityName: string) => communityName || 'N/A',
                },
                {
                    title: 'Timestamp',
                    dataIndex: 'timestamp',
                    key: 'timestamp',
                    width: 150
                }
            ]

            for (let question of queryData.metadata[props.version].questions) {
                columns.push({
                    title: question,
                    dataIndex: question,
                    key: question,
                    render: (text: any) => <div style={{ minWidth: 150 }}>{text}</div>
                })
            }

            setTableState({ dataSource: dataSource, columns: columns });

            if (props.version === 0) {
                props.setTotalTabs(queryData.totalVersions);
            }
        }
    }, [filteredRawData, communityMap, tableQuery.isLoading, queryData, props]);

    const { RangePicker } = DatePicker;

    return (
        <div>
            <div style={{ float: 'right' }}>
                <FilterButton ref={filterButtonRef} filters={effectiveFilters}>
                    <FilterFormWrapper
                        ref={filterWrapperRef}
                        filterButtonRef={filterButtonRef}
                        formProps={searchFormProps}
                        filters={effectiveFilters}
                        fieldValuesNameRef={["firstName", "lastName", "email", 'recipientCommunityId', "timestamp", "surveySearchValue"]}
                        filterValuesNameRef={["firstName", "lastName", "email", 'recipientCommunityId', "timestamp", "surveySearch"]}
                        formElement={
                            <>
                                <Col xl={24} md={8} sm={12} xs={24}>
                                    <Form.Item label="First Name (case sensitive)" name="firstName">
                                        <Input placeholder="Filter by First Name" prefix={<Icons.SearchOutlined />} />
                                    </Form.Item>
                                </Col>

                                <Col xl={24} md={8} sm={12} xs={24}>
                                    <Form.Item label="Last Name (case sensitive)" name="lastName">
                                        <Input placeholder="Filter by Last Name" prefix={<Icons.SearchOutlined />} />
                                    </Form.Item>
                                </Col>

                                <Col xl={24} md={8} sm={12} xs={24}>
                                    <Form.Item label="Email (case sensitive)" name="email">
                                        <Input placeholder="Filter by email" prefix={<Icons.SearchOutlined />} />
                                    </Form.Item>
                                </Col>

                                <Col span={24}>
                                    <Form.Item
                                        label="Community"
                                        name="recipientCommunityId"
                                    >
                                        <Select 
                                            onChange={() => filterWrapperRef.current?.handleValidation()} 
                                            {...communitySelectProps} 
                                            placeholder="Filter by community" 
                                            allowClear 
                                            mode="multiple"
                                        />
                                    </Form.Item>
                                </Col>

                                <Col xl={24} md={8} sm={12} xs={24}>
                                    <Form.Item label="Timestamp range" name="timestamp">
                                        <RangePicker style={{ width: "100%" }} />
                                    </Form.Item>
                                </Col>

                                <Col xl={24} md={8} sm={12} xs={24}>
                                    <Form.Item label="Search in survey results" name="surveySearchValue">
                                        <Input onChange={(e) => setSurveySearchValue(e.target.value)} placeholder="Filter in survey results" prefix={<Icons.SearchOutlined />} />
                                    </Form.Item>
                                </Col>
                            </>
                        }
                    />
                </FilterButton>
            </div>
            <Typography.Title style={{ marginBlock: 20 }} level={5} >{dateText}</Typography.Title>
            <div className="ph-no-capture">
                <Table
                    {...tableProps}
                    pagination={
                        surveySearchValue
                            ? { ...tableProps.pagination, total: filteredRawData.length }
                            : tableProps.pagination
                    }
                    dataSource={tableState?.dataSource as any}
                    columns={tableState?.columns}
                />
            </div>
        </div>
    );

}
