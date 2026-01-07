import { Button, Col, Form, Icons, Input, Modal, Select, Space, Table, TextField, Typography } from "@pankod/refine-antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { ToolOutlined } from "@ant-design/icons";
import { TelevedaList } from "../../../components/page-containers/list";
import Constants from "../../../typings/constants";
import { FilterButton } from "../../../components/buttons/filter";
import FilterFormWrapper from "../../../components/filter";
import { ICommunity, IEmailTemplate, IRefineUser } from "../../../interfaces";
import { CreateButton, DeleteButton, EditButton, useModal, useSelect, useTable } from "@refinedev/antd";
import { CrudFilters, HttpError, IResourceComponentsProps, useCreate, useGetIdentity } from "@refinedev/core";

interface IEmailTemplateFilterVariables {
    name: string;
    communityId: string;
    type: string;
}

export const EmailTemplateList: React.FC<IResourceComponentsProps> = () => {
    const { data: user, isLoading } = useGetIdentity<IRefineUser>();

    const filterButtonRef = useRef<{ hide: () => void }>();
    const filterWrapperRef = useRef<{ handleValidation: () => void }>();

    const { modalProps, show, close } = useModal();
    const { mutate } = useCreate();

    const [recipientEmail, setRecipientEmail] = useState<string>("");
    const [openModalRecord, setOpenModalRecord] = useState<IEmailTemplate>();

    const { tableProps, sorters, searchFormProps, filters, tableQuery: { refetch: refetchCommunities } } = useTable<IEmailTemplate, HttpError, IEmailTemplateFilterVariables>({
        onSearch: (params) => {
            const filters: CrudFilters = [];
            const { name, communityId, type } = params;

            console.log('onSearch');

            console.log("Filter params: ", params);

            filters.push({
                field: "name",
                operator: "contains",
                value: name,
            });

            filters.push({
                field: "communityId",
                operator: "in",
                value: communityId,
            });

            filters.push({
                field: "type",
                operator: "contains",
                value: type,
            });

            console.log('Filters:', filters);

            return filters;
        },
        syncWithLocation: true,
    })

    const { selectProps } = useSelect<ICommunity>({
        resource: "Community",
        optionLabel: 'name',
        optionValue: 'id',
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
        sort: [
            { field: "name", order: 'asc' }
        ]
    });

    let communitySelectProps = selectProps
    useMemo(() => {
        communitySelectProps.options?.unshift({
            label: 'All',
            value: 'all'
        })

    }, [selectProps])

    useEffect(() => {
        if (!isLoading && user) {
            setRecipientEmail(user.email);
        }
    }, [isLoading])

    const openTriggerModal = (record: IEmailTemplate) => {
        setOpenModalRecord(record);
        show();
    }

    const testTrigger = () => {
        console.log(openModalRecord)
        mutate({
            resource: 'emails/testTrigger',
            values: {
                templateId: openModalRecord?.id,
                type: openModalRecord?.type,
                recipient: recipientEmail,
                user
            }
        });
        close();
    }

    const { Text } = Typography;

    return (
        <TelevedaList
            title="Automatic Email Templates"
            listProps={{

                headerProps: {
                    extra:
                        <>
                            <FilterButton
                                ref={filterButtonRef}
                                filters={filters}
                            >
                                <FilterFormWrapper
                                    ref={filterWrapperRef}
                                    filterButtonRef={filterButtonRef}
                                    formProps={searchFormProps}
                                    filters={filters || []}
                                    fieldValuesNameRef={['name', 'communityId', 'type']}
                                    filterValuesNameRef={['name', 'communityId', 'type']}
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
                                                <Form.Item
                                                    label="Community"
                                                    name="communityId"
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
                                                <Form.Item
                                                    label="Trigger"
                                                    name="type"
                                                >
                                                    <Select
                                                        onChange={() => filterWrapperRef.current?.handleValidation()}
                                                        options={Constants.EMAIL_TRIGGERS}
                                                        placeholder="Filter by trigger"
                                                        allowClear
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </>}
                                    syncWithLocation={true}
                                />
                            </FilterButton>
                            <CreateButton type="primary" />
                        </>
                }
            }}
        >
            <Table {...tableProps} rowKey="id">

                <Table.Column
                    dataIndex="name"
                    key="name"
                    title="Template Name"
                    render={(value) => <TextField value={value} />}
                    sorter
                />

                <Table.Column
                    dataIndex="communityName"
                    key="communityName"
                    title="Community"
                    render={(value) => <TextField value={value ? value : "All"} />}
                    sorter
                />

                <Table.Column
                    dataIndex="subject"
                    key="subject"
                    title="Email Subject"
                    render={(value) => <TextField value={value} />}
                    sorter
                />

                <Table.Column
                    dataIndex="sender"
                    key="sender"
                    title="Send email as"
                    render={(value) => <TextField value={value} />}
                    sorter
                />

                <Table.Column
                    dataIndex="type"
                    key="type"
                    title="Trigger"
                    render={(value) => <TextField
                        value={
                            Constants.EMAIL_TRIGGERS
                                .map(element => element.options)
                                .flat()
                                .find(element => element.value === value)?.label || ""}
                    />}
                    sorter
                />

                <Table.Column<IEmailTemplate>
                    width={150}
                    title={"Actions"}
                    dataIndex="id"
                    render={(_, record) => (
                        <Space>
                            <EditButton hideText size="small" recordItemId={record.id} />
                            <DeleteButton onSuccess={() => refetchCommunities()} hideText size="small" recordItemId={record.id} />
                            <Button 
                                onClick={() => openTriggerModal(record)} 
                                style={{width: 80}} 
                                size="small"
                                icon={<ToolOutlined />}
                            >
                                Test
                            </Button>
                        </Space>
                    )}
                />
            </Table>

            <Modal title="Manual Trigger" onOk={() => testTrigger()} okText="Send" onCancel={close} {...modalProps}>
                <Space direction="vertical" style={{ paddingBlock: 30 }}>
                    <Text>Send "{openModalRecord?.name}" Email Template to:</Text>
                    <Input placeholder="Please enter email recipient" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} />
                </Space>
            </Modal>
        </TelevedaList>
    )
}
