import { Button, Col, Form, Icons, Input, Modal, notification, Space, Table, TextField, Tooltip, Typography} from "@pankod/refine-antd";
import { useEffect, useRef, useState } from "react";
import { ToolOutlined } from "@ant-design/icons";
import { FilterButton } from "../../../components/buttons/filter";
import FilterFormWrapper from "../../../components/filter";
import { TelevedaList } from "../../../components/page-containers/list";
import { EmailHistory, IEmailTemplate, IRefineUser } from "../../../interfaces";
import { SendEmailButton } from "../../../components/buttons/sendEmail";
import { EmailHistoryTable } from "../../../components/tables/emailHistoryTable";
import { initMessageFunc, useEmailNotification } from "../../../adapters/EmailNotificationHelper";
import { CreateButton, DeleteButton, EditButton, useModal, useTable } from "@refinedev/antd";
import { CrudFilters, HttpError, IResourceComponentsProps, useCreate, useGetIdentity } from "@refinedev/core";

interface IEmailTemplateFilterVariables {
    name: string;
}

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

export const ManualEmailList: React.FC<IResourceComponentsProps> = () => {
    const { data: user, isLoading } = useGetIdentity<IRefineUser>();

    const filterButtonRef = useRef<{ hide: () => void }>();
    const filterWrapperRef = useRef<{ handleValidation: () => void }>();

    const { modalProps, show, close } = useModal();
    const { mutate } = useCreate();

    const { handleDelete, handleConfirm } = useEmailNotification();

    const [recipientEmail, setRecipientEmail] = useState<string>("");
    const [openModalRecord, setOpenModalRecord] = useState<IEmailTemplate>();

    const { tableProps, sorters, searchFormProps, filters, tableQuery: { refetch: refetchEmails } } = useTable<IEmailTemplate, HttpError, IEmailTemplateFilterVariables>({
        onSearch: (params) => {
            const filters: CrudFilters = [];
            const { name } = params;

            filters.push({
                field: "name",
                operator: "contains",
                value: name,
            });

            return filters;
        },
        syncWithLocation: true,
    })

    useEffect(() => {

        const es = new EventSource(`${SERVER_URL}/api/sse/events`, { withCredentials: true });

        initMessageFunc(es, notification, {handleConfirm, handleDelete}, refetchEmails);

        window.onbeforeunload = () => {
            es.close();
        }

        return () => {
            console.log('Email connection closed');
            es.close();
        }

    }, []);

    useEffect(() => {
        if (!isLoading && user) {
            setRecipientEmail(user.email)
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
            title="Manual Email Templates"
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
                                    fieldValuesNameRef={['name']}
                                    filterValuesNameRef={['name']}
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
                                        </>
                                    }
                                    syncWithLocation={true}
                                />
                            </FilterButton>
                            <CreateButton type="primary" />
                        </>
                }
            }}
        >
            <Table 
                {...tableProps} 
                rowKey="id"
                expandable={{
                    expandedRowRender: (record) => expandedRowRender(record.id, record.manualEmails || [], refetchEmails),
                    expandIcon: ({ expanded, onExpand, record }) => 
                    record.manualEmails && record.manualEmails.length > 0 ? (
                        <Tooltip title={expanded ? "Collapse" : "Expand email history"}>
                          <Button
                            className={`ant-table-row-expand-icon ant-table-row-expand-icon-${expanded? "expanded" : "collapsed" }`}
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
                    dataIndex="name"
                    key="name"
                    title="Template Name"
                    render={(value) => <TextField value={value} />}
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

                <Table.Column<IEmailTemplate>
                    width={150}
                    title={"Actions"}
                    dataIndex="id"
                    render={(_, record) => (
                        <Space>
                            <EditButton hideText size="small" recordItemId={record.id} />
                            <DeleteButton onSuccess={() => refetchEmails()} hideText size="small" recordItemId={record.id} />
                            <Button 
                                onClick={() => openTriggerModal(record)} 
                                style={{width: 80}} 
                                size="small"
                                icon={<ToolOutlined />}
                            >
                                Test
                            </Button>
                            <SendEmailButton 
                                url={'emails/init-manual-email'} 
                                templateId={record.id} 
                                communitiesIdsFilterList={undefined} 
                                btnText="Send" 
                                btnShape="default" 
                                btnType="primary"
                                btnWidth={80}
                            />
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

const expandedRowRender = (id: string, record: EmailHistory[], refetch: () => void) => {
    return <EmailHistoryTable resource="emails/send-manual-email" templateId={id} record={record} refetch={refetch}/>
};