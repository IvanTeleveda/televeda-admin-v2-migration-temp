import { Button, Col, Form, Icons, Input, notification, Row, Select, Space, Table, Tag, Tooltip, Typography } from "@pankod/refine-antd";
import { useEffect, useMemo, useRef } from "react";
import { CloudUploadOutlined, CloudDownloadOutlined, LinkOutlined, DeleteOutlined } from "@ant-design/icons";
import { CrudFilters, HttpError, IResourceComponentsProps, useCreate, usePermissions } from "@refinedev/core";
import { EmailHistory, ICommunity, ISurvey } from "../../interfaces";
import Constants from "../../typings/constants";
import { initMessageFunc, useEmailNotification } from "../../adapters/EmailNotificationHelper";
import { TelevedaList } from "../../components/page-containers/list";
import { FilterButton } from "../../components/buttons/filter";
import FilterFormWrapper from "../../components/filter";
import CopyLinkButton from "../../components/buttons/copyLinks";
import { EmailHistoryTable } from "../../components/tables/emailHistoryTable";
import { CreateButton, DeleteButton, EditButton, ShowButton, useSelect, useTable } from "@refinedev/antd";
import { SendEmailButton } from "../../components/buttons/sendEmail";

interface ISurveyemplateFilterVariables {
    name: string;
    communityIds: string;
}

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

export const SurveysList: React.FC<IResourceComponentsProps> = () => {
    const { selectProps: communitySelectProps, query } = useSelect<ICommunity>({
        resource: "community",
        optionLabel: "name",
        optionValue: "id",
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
    });

    const { data: permissionsData } = usePermissions();

    const { mutate } = useCreate();

    const { handleDelete, handleConfirm } = useEmailNotification();

    const filterButtonRef = useRef<{ hide: () => void }>();
    const filterWrapperRef = useRef<{ handleValidation: () => void }>();

    const {
        tableProps,
        searchFormProps,
        filters,
        tableQuery: { refetch: refetchTable, data: tableQuery },
    } = useTable<ISurvey, HttpError, ISurveyemplateFilterVariables>({
        initialSorter: [
            {
                field: "createdAt",
                order: "desc",
            },
        ],
        onSearch: (params) => {
            const filters: CrudFilters = [];
            const { name, communityIds } = params;

            console.log("onSearch");

            // console.log("Filter params: ", params);

            filters.push({
                field: "name",
                operator: "contains",
                value: name,
            });

            filters.push({
                field: "communityIds",
                operator: "in",
                value: communityIds,
            });

            // console.log("Filters:", filters);

            return filters;
        },
        syncWithLocation: true,
    });

    const communityData = query.data?.data;

    useEffect(() => {

        const es = new EventSource(`${SERVER_URL}/api/sse/events`, { withCredentials: true });

        initMessageFunc(es, notification, { handleConfirm, handleDelete }, refetchTable);

        window.onbeforeunload = () => {
            es.close();
        }

        return () => {
            console.log('Email connection closed');
            es.close();
        }

    }, []);

    useMemo(() => {
        if (permissionsData === "TelevedaAdmin" && communitySelectProps.options && communitySelectProps.options[0]?.value !== 'all') {
            communitySelectProps.options?.unshift({
                label: "All",
                value: "all",
            });
        }
    }, [communitySelectProps]);

    const renderCommunityList = (recordId: string) => {
        if (tableQuery) {
            const data = tableQuery.data.filter((survey) => survey.id === recordId)?.at(0);

            if (!data) return undefined;

            return data.communityAssociations?.map((assoc) => assoc.communityId).filter((id) => id !== null);
        }

        return undefined;
    };

    function copyURL(id: string) {
        const el = document.createElement("input");
        el.value = window.location.origin + '/' + 'surveys/' + id;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    }

    const publishSurvey = (recordId: string, toPublish: boolean, isFeedback: boolean) => {
        mutate(
            {
                resource: `surveys/publish/${recordId}`,
                values: {
                    toPublish,
                    isFeedback
                },
                successNotification: () => ({
                    description: "Successful",
                    message: "Successfully published survey",
                    type: "success",
                }),
            },
            {
                onSuccess: () => {
                    refetchTable();
                },
            }
        );
    };

    const toggleSurveyAutoEmail = (recordId: string, setTo: boolean) => {
        mutate(
            {
                resource: `surveys/update-auto-email/${recordId}`,
                values: {
                    setTo
                },
                successNotification: () => ({
                    description: "Successful",
                    message: "Successfully updated auto email setting",
                    type: "success",
                }),
            },
            {
                onSuccess: () => {
                    refetchTable();
                },
            }
        )
    }

    return (
        <TelevedaList
            listProps={{
                headerProps: {
                    extra: (
                        <>
                            <FilterButton ref={filterButtonRef} filters={filters}>
                                <FilterFormWrapper
                                    ref={filterWrapperRef}
                                    filterButtonRef={filterButtonRef}
                                    formProps={searchFormProps}
                                    filters={filters || []}
                                    fieldValuesNameRef={["name", "communityIds"]}
                                    filterValuesNameRef={["name", "communityIds"]}
                                    formElement={
                                        <>
                                            <Col xl={24} md={8} sm={12} xs={24}>
                                                <Form.Item label="Template Name" name="name">
                                                    <Input
                                                        onChange={() => filterWrapperRef.current?.handleValidation()}
                                                        placeholder="Filter by template name"
                                                        prefix={<Icons.SearchOutlined />}
                                                        allowClear
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col xl={24} md={8} sm={12} xs={24}>
                                                <Form.Item label="Community" name="communityIds">
                                                    <Select
                                                        onChange={() => filterWrapperRef.current?.handleValidation()}
                                                        {...communitySelectProps}
                                                        placeholder="Filter by community"
                                                        allowClear
                                                        mode="multiple"
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </>
                                    }
                                    syncWithLocation={true}
                                />
                            </FilterButton>
                            <CreateButton type="primary" />
                        </>
                    ),
                },
            }}>
            <Table
                {...tableProps}
                rowClassName={(record) => {
                    try {
                        const systemSurveys = tableProps.dataSource?.filter(row => row.systemSurvey);
                        const systemSurveysCount = systemSurveys?.length;
                        if (systemSurveysCount && systemSurveysCount > 0) {
                            const lastIndexId = systemSurveys[systemSurveysCount - 1].id;
                            return record.id === lastIndexId ? 'bottom-border' : ''
                        }
                        return '';
                    } catch {
                        console.log('Error calculating table border');
                        return '';
                    }
                }
                }
                rowKey={"id"}
                expandable={{
                    expandedRowRender: (record) => expandedRowRender(record.id, record.surveyEmails, refetchTable),
                    expandIcon: ({ expanded, onExpand, record }) =>
                        record.surveyEmails.length > 0 ? (
                            <Tooltip title={expanded ? "Collapse" : "Expand sent manual emails"}>
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
                <Table.Column<ISurvey>
                    dataIndex={"name"}
                    key={"name"}
                    title="Name"
                    sorter
                    width={300}
                    render={(value, record) => {
                        return (
                            <Typography.Text>
                                <b>{record.systemSurvey ? "[System] " : ""}</b> {value}
                            </Typography.Text>
                        )
                    }}
                />
                <Table.Column<ISurvey>
                    dataIndex={"surveyRenders"}
                    key={"surveyRenders"}
                    title={"Render as"}
                    width={160}
                    render={(value) => {
                        return (
                            <Space wrap>
                                {value.map((val: any) => {
                                    return (
                                        <Tag color="geekblue" key={val.id}>
                                            {val.render_at?.replace("_", " ")}
                                        </Tag>
                                    );
                                })}
                            </Space>
                        );
                    }}
                />
                <Table.Column<ISurvey>
                    title={"Community / Event Associations"}
                    dataIndex={"communityAssociations"}
                    key={"communityAssociations"}
                    width={310}
                    render={(_, record) => {

                        if (record.communityAssociations && record.communityAssociations.length > 0) {
                            const value = record.communityAssociations;

                            return (
                                <Space wrap>
                                    {value.map((val) => {
                                        const community = communityData?.filter((community) => community.id === val.communityId)[0];

                                        return (
                                            <Tag color="geekblue" key={val.id} style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {community?.name || "All"}
                                            </Tag>
                                        );
                                    })}
                                </Space>
                            )
                        }

                        else if (record.scheduledClassAssociations && record.scheduledClassAssociations.length > 0) {
                            const value = record.scheduledClassAssociations;

                            return (
                                <Space wrap>
                                    {value.map((val) => {
                                        const community = communityData?.filter((community) => community.id === val.scheduledClass?.communityId)[0];

                                        return (
                                            <Tag color="geekblue" key={val.id} style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {community ? <span>{community.name + " / "} </span> : 'Community not defined / '}
                                                <span>{val.scheduledClass?.title || ""}</span>
                                            </Tag>
                                        )
                                    })}
                                </Space>
                            )
                        }

                        else {
                            return (
                                <Typography.Text><b>NONE</b></Typography.Text>
                            )
                        }
                    }}
                />
                <Table.Column<ISurvey>
                    title={permissionsData === "TelevedaAdmin" ? "Active For" : "Status"}
                    dataIndex={"isPublished"}
                    key={"isPublished"}
                    width={310}
                    render={(_, record) => {

                        if (record.communityAssociations && record.communityAssociations.length > 0) {
                            const value = record.communityAssociations;

                            const assocLength = value.length;
                            const publishedAssocLength = value.filter((assoc) => assoc.isPublished === true).length;
                            //handles the "All" community associations
                            const allFlag = value.filter((assoc) => assoc.communityId === null && assoc.isPublished).length;

                            return permissionsData === "TelevedaAdmin" ? (
                                publishedAssocLength || allFlag ? (
                                    <Space wrap>
                                        {value.map((val) => {
                                            const community = communityData?.filter((community) => community.id === val.communityId && val.isPublished)[0];

                                            if (!community && !allFlag) return <></>;
                                            return (
                                                <Tag color="green" key={val.id} style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {community?.name || "All"}
                                                </Tag>
                                            );
                                        })}
                                    </Space>
                                ) : (
                                    <strong style={{ color: 'red' }}>INACTIVE</strong>
                                )
                            ) : assocLength === publishedAssocLength && assocLength > 0 ? (
                                <strong style={{ color: 'green' }}>ACTIVE</strong>
                            ) : (
                                <strong style={{ color: 'red' }}>INACTIVE</strong>
                            );
                        }
                        else if (record.scheduledClassAssociations && record.scheduledClassAssociations.length > 0) {
                            const value = record.scheduledClassAssociations;

                            const assocLength = value.filter((assoc) => assoc.scheduledClass !== null).length;
                            const publishedAssocLength = value.filter((assoc) => assoc.isPublished === true && assoc.scheduledClass !== null).length;

                            return permissionsData === "TelevedaAdmin" ? (
                                publishedAssocLength ? (
                                    <Space wrap>
                                        {value.map((val) => {
                                            const community = communityData?.filter((community) => community.id === val.scheduledClass?.communityId && val.isPublished)[0];

                                            if (!community) return <></>;
                                            return (
                                                <Tag color="green" key={val.id} style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    <span>{community?.name + " / " || ""} </span>
                                                    <span>{val.scheduledClass?.title || ""}</span>
                                                </Tag>
                                            );
                                        })}
                                    </Space>
                                ) : (
                                    <strong style={{ color: 'red' }}>INACTIVE</strong>
                                )
                            ) : assocLength === publishedAssocLength && assocLength > 0 ? (
                                <strong style={{ color: 'green' }}>ACTIVE</strong>
                            ) : (
                                <strong style={{ color: 'red' }}>INACTIVE</strong>
                            );
                        }
                        else {
                            return <strong style={{ color: 'green' }}>INACTIVE</strong>
                        }
                    }}
                />
                <Table.Column<ISurvey>
                    title={"General Actions"}
                    dataIndex="actions1"
                    width={250}
                    render={(_, record) => {
                        const isFeedback = record.scheduledClassAssociations && record.scheduledClassAssociations?.length > 0;

                        return (
                            <Row gutter={[15, 15]}>
                                {!isFeedback &&
                                    <Col span={24}>
                                        <ShowButton size="small" recordItemId={record.id} style={{ width: 190 }}>
                                            View submissions
                                        </ShowButton>
                                    </Col>
                                }
                                <Col span={24}>
                                    <EditButton size="small" recordItemId={record.id} style={{ width: 88, marginRight: 14 }} />
                                    {record.systemSurvey ?
                                        <Button icon={<DeleteOutlined />} disabled={true} danger style={{ width: 88 }} size="small">Delete</Button> :
                                        <DeleteButton size="small" recordItemId={record.id} style={{ width: 88 }} />
                                    }
                                </Col>
                            </Row>
                        );
                    }}
                />
                <Table.Column<ISurvey>
                    title={"Publishing"}
                    dataIndex="actions2"
                    width={320}
                    render={(_, record) => {
                        const isFeedback = record.scheduledClassAssociations && record.scheduledClassAssociations?.length > 0;
                        const keyWord = isFeedback ? "scheduledClassAssociations" : "communityAssociations";

                        const assocLength = record[keyWord]?.length;
                        //@ts-ignore
                        const publishedAssocLength = record[keyWord]?.filter((assoc) => assoc.isPublished === true).length;
                        const toPublish = assocLength !== publishedAssocLength;
                        return (
                            <Row style={{ width: 300, display: 'flex', justifyContent: 'center' }} gutter={[15, 15]}>
                                <Col span={12}>
                                    <Button
                                        onClick={() => publishSurvey(record.id, toPublish, isFeedback ? true : false)}
                                        icon={toPublish ? <CloudUploadOutlined /> : <CloudDownloadOutlined />}
                                        type="primary"
                                        size="small"
                                        style={{ marginRight: 5, width: 140 }}
                                    >
                                        {toPublish ? "Publish" : "Unpublish"}
                                    </Button>
                                </Col>
                                {!isFeedback &&
                                    <>
                                        <Col span={12}>
                                            <CopyLinkButton
                                                style={{ width: 140 }}
                                                btnShape="default"
                                                code={record.id}
                                                icon={<LinkOutlined />}
                                                copyURL={copyURL} />
                                        </Col><Col span={12}>
                                            {tableQuery && record.id && (
                                                <SendEmailButton
                                                    url={`surveys/init-email/${record.id}`}
                                                    templateId={record.id}
                                                    communitiesIdsFilterList={renderCommunityList(record.id)}
                                                    btnText="Send as email"
                                                    btnShape="default"
                                                    btnType="default"
                                                    btnWidth={140}
                                                    includeInstructors={true}
                                                />
                                            )}
                                        </Col><Col span={12}>
                                            <Tooltip
                                                mouseEnterDelay={1}
                                                title="Email with the survey link will be automatically sent to associated community members after registration."
                                            >
                                                <Button
                                                    size="small"
                                                    style={{ width: 140 }}
                                                    onClick={() => toggleSurveyAutoEmail(record.id, !record.autoEmail)}
                                                >
                                                    Auto Email:<b>{record.autoEmail ? " On" : " Off"}</b>
                                                </Button>
                                            </Tooltip>
                                        </Col>
                                    </>
                                }
                            </Row>
                        )
                    }}
                />
            </Table>
        </TelevedaList>
    );
};

const expandedRowRender = (id: string, record: EmailHistory[], refetch: () => void) => {
    return <EmailHistoryTable resource="surveys/send-email" templateId={id} record={record} refetch={refetch} />
};
