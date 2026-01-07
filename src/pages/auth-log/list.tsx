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
    Typography,
    Badge
} from "@pankod/refine-antd";
import { useRef } from "react";
import Constants from "../../typings/constants";
import { IAuthLog, ICommunity } from "../../interfaces";
import { TelevedaList } from "../../components/page-containers/list";
import FilterFormWrapper from "../../components/filter";
import { FilterButton } from "../../components/buttons/filter";
import { useSelect, useTable } from "@refinedev/antd";
import { CrudFilters, HttpError, IResourceComponentsProps } from "@refinedev/core";

export interface IAuthLogFilterVariables {
    username?: string;
    actionType?: string;
    timestamp?: any[];
}

export const AuthLogList: React.FC<IResourceComponentsProps> = () => {
    const filterButtonRef = useRef<{ hide: () => void }>();
    const filterWrapperRef = useRef<{ handleValidation: () => void }>();

    const { selectProps: communitySelectProps, query } = useSelect<ICommunity>({
        resource: "community",
        optionLabel: "name",
        optionValue: "id",
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
    });

    const { tableProps, sorters, searchFormProps, filters } = useTable<IAuthLog, HttpError, IAuthLogFilterVariables>({
        initialSorter: [
            {
                field: "createdAt",
                order: "desc",
            },
        ],
        onSearch: (params) => {
            const filters: CrudFilters = [];
            const { username, actionType, timestamp } = params;

            console.log("Filter params: ", params);

            filters.push({
                field: "username",
                operator: "contains",
                value: username,
            });

            filters.push({
                field: "eventType",
                operator: "eq",
                value: actionType,
            });

            if(timestamp) {
                filters.push({
                    field: "createdAt",
                    operator: "between",
                    value: [timestamp[0].startOf("day").toISOString(), timestamp[1].endOf("day").toISOString()],
                });
            }
            else {
                filters.push({
                    field: "createdAt",
                    operator: "between",
                    value: undefined
                });
            }

            return filters;
        },
        resource: "auth/auth-events",
    });

    console.log("Auth log props:", tableProps);

    const camelCaseToWords = (text: string) => {
        const result = text.replace(/([A-Z])/g, " $1");
        return result.charAt(0).toUpperCase() + result.slice(1);
    };

    const renderText = (text: string) => {
        switch (text) {
            case "countAs":
                return "Hybrid Participant Count";
            case "mobilePhoneNumber":
                return "Contact Number";
            default:
                return camelCaseToWords(text);
        }
    };

    const renderEventFields = (field: string, newData: any) => {
        let message = <></>;

        switch (field) {
            case "recurringRules":
                message = <Typography.Text>Changed {renderText(field)}</Typography.Text>;
                break;
            case "startDate":
                message = (
                    <Typography.Text>
                        Changed {renderText(field)} to <DateField value={newData[field]} format="LLL" />
                    </Typography.Text>
                );
                break;
            case "communityId":
                message = (
                    <Typography.Text>
                        Changed community to {query.data?.data.filter((community) => community.id === newData[field])[0].name}
                    </Typography.Text>
                );
                break;
            default:
                message = (
                    <Typography.Text>
                        Changed {renderText(field)} to {newData[field] || "null"}
                    </Typography.Text>
                );
                break;
        }

        return <Badge color="black" text={message} />;
    };

    const constructMessage = (value: string, record: any) => {
        try {
            switch (value) {
                case "EVENT OPERATION":
                    const dataEvent = JSON.parse(record.relevantData);

                    // old way - means it's not edit
                    if (dataEvent.eventName) {
                        return (
                            <Typography.Text>
                                {record.changeType?.charAt(0) + record.changeType?.substring(1).toLowerCase()} event{" "}
                                {JSON.parse(record.relevantData)?.eventName}
                                {record.changeType === "DELETED ALL OCCURRENCES OF" && " after "}{" "}
                                {dataEvent.eventTime ? <DateField value={dataEvent.eventTime} format="LLL"></DateField> : ""}
                            </Typography.Text>
                        );
                    // basically applies only for edit
                    } else {
                        const changedFields: string[] = dataEvent.changedFields;
                        const newData: Object = dataEvent.newData;
                        const changedDesc: false | string[] = dataEvent.descriptionChange;
                        const changedInstructorAssoc: boolean = dataEvent.instructorAssocChange;
                        const changedEventPasswords: {
                            newPasswords: number;
                            deletedPasswords: number;
                        } = dataEvent.passwordChange;

                        const changedFieldsArr = changedFields
                            ?.filter((field: string) => field !== "endDate" && field)
                            .map((field: string) => {
                                return renderEventFields(field, newData);
                            });

                        return (
                            <Space direction="vertical">
                                {record.changeType === "EDITED" ? (
                                    <Typography.Text>Updated event {dataEvent.oldTitle}</Typography.Text>
                                ) : (
                                    <Typography.Text>
                                        Updated single occurrence of event {dataEvent.oldTitle} - <DateField value={dataEvent.oldStartDate} format="LLL" />
                                    </Typography.Text>
                                )}

                                {changedFieldsArr}

                                {changedDesc &&
                                    changedDesc.map((field: string) => {
                                        return <Badge color="black" text={`Changed ${renderText(field)}`}></Badge>;
                                    })}

                                {changedInstructorAssoc && <Badge color="black" text={"Changed Assigned Instructors"} />}

                                {changedEventPasswords.newPasswords > 0 && (
                                    <Badge
                                        color="black"
                                        text={`Added ${changedEventPasswords.newPasswords} new event password${
                                            changedEventPasswords.newPasswords > 1 ? "s" : ""
                                        }`}
                                    />
                                )}
                                {changedEventPasswords.deletedPasswords > 0 && (
                                    <Badge
                                        color="black"
                                        text={`Deleted ${changedEventPasswords.deletedPasswords} event password${
                                            changedEventPasswords.deletedPasswords > 1 ? "s" : ""
                                        }`}
                                    />
                                )}
                            </Space>
                        );
                    }
                case "PROFILE OPERATION":
                    const dataProfile = JSON.parse(record.relevantData);
                    const changedFields = dataProfile.changedFields;
                    const newData = dataProfile.newData;

                    const arr = changedFields?.map((field: string) => {
                        return <Badge color="black" text={`Changed ${renderText(field)} to ${newData[field] || newData.accountData[field] || "null"}`}></Badge>;
                    });

                    return (
                        <Space direction="vertical">
                            <Typography.Text>Updated user {dataProfile.oldEmail}</Typography.Text>
                            {arr}
                        </Space>
                    );
                case "LOGIN":
                    return "Logged into admin dashboard";
                case "SURVEYS":
                case "FEEDBACK_SURVEYS":
                    const surveyData = JSON.parse(record.relevantData);
                    if(record.changeType === "VIEWED") {
                        return `Viewed submissions for survey template - ${surveyData?.surveyName}`;
                    }
                    else {
                        return `${record.changeType?.charAt(0) + record.changeType?.substring(1).toLowerCase()} survey template - ${surveyData.surveyName}`;
                    }
                default:
                    return value;
            }
        } catch (error: unknown) {
            console.log("error: ", error);
            return "Error while trying to render text";
        }
    };

    const { RangePicker } = DatePicker;

    return (
        <TelevedaList
            title={"Audit History"}
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
                                    fieldValuesNameRef={["username", "actionType", "timestamp"]}
                                    filterValuesNameRef={["username", "eventType", "createdAt"]}
                                    formElement={
                                        <>
                                            <Col xl={24} md={8} sm={12} xs={24}>
                                                <Form.Item label="User name" name="username">
                                                    <Input placeholder="Filter by username" prefix={<Icons.SearchOutlined />} />
                                                </Form.Item>
                                            </Col>

                                            <Col xl={24} md={8} sm={12} xs={24}>
                                                <Form.Item label="Action type" name="actionType">
                                                    <Select
                                                        placeholder="Filter by action type"
                                                        options={[
                                                            { value: "LOGIN", label: "Login" },
                                                            { value: "EVENT OPERATION", label: "Event Operation" },
                                                            { value: "PROFILE OPERATION", label: "Profile Operation" },
                                                            { value: "SURVEYS", label: "Surveys" },
                                                        ]}
                                                        allowClear
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col xl={24} md={8} sm={12} xs={24}>
                                                <Form.Item label="Timestamp range" name="timestamp">
                                                    <RangePicker style={{ width: "100%" }} />
                                                </Form.Item>
                                            </Col>
                                        </>
                                    }
                                    syncWithLocation={true}
                                />
                            </FilterButton>
                        </>
                    ),
                },
            }}>
            <Table {...tableProps} rowKey="id">
                <Table.Column dataIndex="username" key="username" title="User name" render={(value) => <TextField value={value} />} sorter />

                <Table.Column dataIndex="email" key="email" title="Email" render={(value) => <TextField value={value} />} sorter />

                <Table.Column dataIndex="eventType" key="eventType" title="Type" render={(value) => <TextField value={value} />} />

                <Table.Column
                    dataIndex="eventType"
                    key="eventType"
                    title="Action"
                    render={(value, record: any) => <TextField value={constructMessage(value, record)} />}
                />

                <Table.Column dataIndex="createdAt" key="createdAt" title="Timestamp" render={(value) => <DateField value={value} format="LLL" />} sorter />
            </Table>
        </TelevedaList>
    );
};
