import { Button, Col, Form, Input, Modal, notification, Select, Space, Table, Tag, TextField, Tooltip } from "@pankod/refine-antd";
import { useEffect, useRef, useState } from "react";
import { DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { CreateButton, DeleteButton, EditButton, useModal, useTable } from "@refinedev/antd";
import { FilterButton } from "../../components/buttons/filter";
import FilterFormWrapper from "../../components/filter";
import { TelevedaList } from "../../components/page-containers/list";
import { EmailHistory,INotificationTemplates } from "../../interfaces";
import { SendEmailButton } from "../../components/buttons/sendEmail";
import { EmailHistoryTable } from "../../components/tables/emailHistoryTable";
import { initMessageFunc, useEmailNotification } from "../../adapters/EmailNotificationHelper";
import { CrudFilters, HttpError, IResourceComponentsProps, useDeleteMany } from "@refinedev/core";

interface INotificationFilterVariables {
    name: string;
    title: string;
}

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

export const NotificationsList: React.FC<IResourceComponentsProps> = () => {

    const filterButtonRef = useRef<{ hide: () => void }>();
    const filterWrapperRef = useRef<{ handleValidation: () => void }>();

    const { handleDelete, handleConfirm } = useEmailNotification();

    const { show, close, modalProps } = useModal();
    const [form] = Form.useForm();

    const [selectedNotificationTemplatesId, setSelectedNotificationTemplatesId] = useState('');
    const [notificationTemplatesCommunities, setNotificationTemplatesCommunities] = useState<any[]>([]);

    const openModal = (notificationTemplateId: string, associations: any[]) => {
        const formattedCommunities = associations.map((item) => ({
            label: item.community.name,
            value: item.community.id,
        }));
        setSelectedNotificationTemplatesId(notificationTemplateId);
        setNotificationTemplatesCommunities(formattedCommunities);
        show();
    };

    const { mutate: mutateDeleteMany } = useDeleteMany();
    const handleDeletion = async () => {
        await form.validateFields();
        const communityIds =  form.getFieldValue('communityIds');
        mutateDeleteMany({
            resource: `notifications/template/${selectedNotificationTemplatesId}/communities`,
            ids: communityIds,
        },
        {
            onSuccess: (data, variables, context) => {
                refetchList();
                close();
            },
        })
    }
    
    console.log('sersverURL', SERVER_URL)

    useEffect(() => {

        const es = new EventSource(`${SERVER_URL}/api/sse/events`, { withCredentials: true });

        initMessageFunc(es, notification, {handleConfirm, handleDelete}, refetchList);

        window.onbeforeunload = () => {
            es.close();
        }

        return () => {
            console.log('Email connection closed');
            es.close();
        }

    }, []);

    const { tableProps, sorters, searchFormProps, filters, tableQuery: { refetch: refetchList } } = useTable<INotificationTemplates, HttpError, INotificationFilterVariables>({
        syncWithLocation: true,
        initialSorter: [
            {
                field: "title",
                order: "desc",
            },
        ],
        onSearch: (params) => {
            const filters: CrudFilters = [];
            const { name, title } = params;
            
            filters.push({
                field: "name",
                operator: "contains",
                value: name,
            });
            filters.push({
                field: "title",
                operator: "contains",
                value: title,
            });

            return filters;
        }
    });

    return (
        <TelevedaList
            title="Notification Templates"
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
                                        fieldValuesNameRef={['name', 'title']}
                                        filterValuesNameRef={['name', 'title']}
                                        formElement={
                                            <>
                                                <Col span={24}>
                                                    <Form.Item label="Template name" name="name">
                                                        <Input
                                                            onChange={() => filterWrapperRef.current?.handleValidation()}
                                                            placeholder="Filter by template name"
                                                            prefix={<SearchOutlined />}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={24}>
                                                    <Form.Item label="Notification title" name="title">
                                                        <Input
                                                            onChange={() => filterWrapperRef.current?.handleValidation()}
                                                            placeholder="Filter by notification title"
                                                            prefix={<SearchOutlined />}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            </>
                                        }
                                        syncWithLocation={true}
                                    />
                                </FilterButton>
                                <CreateButton title="Create" type="primary" />
                            </>
                    }
                }}
        >
           <Table 
                {...tableProps} 
                rowKey="id"
                expandable={{
                    expandedRowRender: (record) => expandedRowRender(record.id, record.notificationHistory || [], refetchList),
                    expandIcon: ({ expanded, onExpand, record }) => 
                    record.notificationHistory && record.notificationHistory.length > 0 ? (
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
                    dataIndex="title"
                    key="title"
                    title="Notification Title"
                    render={(value) => <TextField value={value} />}
                    sorter
                />
                <Table.Column<INotificationTemplates>
                    title="Communities"
                    dataIndex="associations"
                    key="communities"
                    render={(associations) => {
                        return (
                            <>
                                {Array.isArray(associations) && associations.length > 0 ? (
                                    associations
                                        .filter(a => a?.community?.name)
                                        .map((association, index) => (
                                            <Tag color="blue" key={index}>
                                                {association.community.name}
                                            </Tag>
                                        ))
                                ) : (
                                    <Tag color="blue">All</Tag>
                                )}
                            </>
                        );
                    }}
                />
                <Table.Column<INotificationTemplates>
                    title={"Actions"}
                    dataIndex="actions"
                    render={(_, record) => (
                        <Space>
                            <EditButton hideText size="small" recordItemId={record.id} />
                            {record.associations && record.associations.length > 0 ?
                            <>
                                <Button
                                    icon={<DeleteOutlined />}
                                    danger
                                    size="small"
                                    onClick={() => 
                                        openModal(record.id, record.associations || [])
                                    }
                                />
                            </>
                            :
                            <>
                                 <DeleteButton
                                    onSuccess={() => refetchList()} 
                                    hideText 
                                    size="small" 
                                    recordItemId={record.id} 
                                 />
                            </>
                            }
                            <SendEmailButton 
                                url={`notifications/init-send/${record.id}`} 
                                templateId={record.id} 
                                communitiesIdsFilterList={
                                    record.associations?.length
                                        ? record.associations.map(assoc => assoc.community.id)
                                        : undefined
                                } 
                                btnText="Send" 
                                btnShape="default" 
                                btnType="primary"
                                btnWidth={80}
                                includeInstructors={false}
                            />
                        </Space>
                    )}
                />
            </Table>  

            <Modal
                okText="Delete"
                onOk={() => handleDeletion()}
                width={700}
                destroyOnClose
                cancelButtonProps={{ size: 'large' }}
                title="Which communities should have this notification deleted in?"
                {...modalProps}
            >
                <Form.Item
                    name="communityIds"
                    rules={[{ required: true, message: 'Choose at least one community' }]}
                >
                    <Select
                        size="large"
                        onChange={(value: any) => form.setFieldValue('communityIds',value)}
                        mode="multiple"
                        options={notificationTemplatesCommunities}
                    />
                </Form.Item>
            </Modal>
        </TelevedaList>
    )
}

const expandedRowRender = (id: string, record: EmailHistory[], refetch: () => void) => {
    return <EmailHistoryTable resource="notifications/send" templateId={id} record={record} refetch={refetch}/>
};