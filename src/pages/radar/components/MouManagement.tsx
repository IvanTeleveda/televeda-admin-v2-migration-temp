import React, { useState, useEffect } from 'react';
import { 
    Table, 
    Button, 
    Modal, 
    Form, 
    Input, 
    Select, 
    DatePicker, 
    Space, 
    Popconfirm, 
    notification, 
    Typography,
    Tag,
    Card
} from '@pankod/refine-antd';
import { useApiUrl } from '@refinedev/core';
import { useSelect } from '@refinedev/antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { ICommunity } from '../../../interfaces';
import Constants from '../../../typings/constants';
import { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface MouAgreement {
    id: string;
    communityId?: string;
    vaSiteName: string;
    signedDate: string;
    status: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    community?: {
        name: string;
    };
}

interface MouManagementProps {
    onClose: () => void;
    onDataChange: () => void;
}

export const MouManagement: React.FC<MouManagementProps> = ({ onClose, onDataChange }) => {
    const apiUrl = useApiUrl();
    const [mouAgreements, setMouAgreements] = useState<MouAgreement[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingMou, setEditingMou] = useState<MouAgreement | null>(null);
    const [form] = Form.useForm();

    // Fetch communities for dropdown
    const { selectProps: communitySelectProps } = useSelect<ICommunity>({
        resource: "community",
        optionLabel: "name",
        optionValue: "id",
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
        sort: [{ field: "name", order: "asc" }]
    });

    // Fetch MOU agreements
    const fetchMouAgreements = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/analytics/radar/mou-agreements`, {
                method: 'GET',
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setMouAgreements(data);
            } else {
                notification.error({
                    message: 'Error',
                    description: 'Failed to fetch MOU agreements',
                });
            }
        } catch (error) {
            notification.error({
                message: 'Error',
                description: 'Error fetching MOU agreements',
            });
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMouAgreements();
    }, []);

    const handleSubmit = async (values: any) => {
        try {
            const url = editingMou 
                ? `${apiUrl}/analytics/radar/mou-agreements/${editingMou.id}`
                : `${apiUrl}/analytics/radar/mou-agreements`;
            
            const method = editingMou ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    communityId: values.communityId,
                    vaSiteName: values.vaSiteName,
                    signedDate: values.signedDate.toISOString(),
                    status: values.status,
                    notes: values.notes
                })
            });

            if (response.ok) {
                notification.success({
                    message: 'Success',
                    description: editingMou ? 'MOU agreement updated successfully' : 'MOU agreement created successfully',
                });
                setModalVisible(false);
                form.resetFields();
                setEditingMou(null);
                fetchMouAgreements();
                onDataChange();
            } else {
                const errorData = await response.json().catch(() => ({}));
                notification.error({
                    message: 'Error',
                    description: errorData.message || `Failed to ${editingMou ? 'update' : 'create'} MOU agreement`,
                });
            }
        } catch (error) {
            notification.error({
                message: 'Error',
                description: `Error ${editingMou ? 'updating' : 'creating'} MOU agreement`,
            });
            console.error('Error:', error);
        }
    };

    const handleEdit = (mou: MouAgreement) => {
        setEditingMou(mou);
        form.setFieldsValue({
            communityId: mou.communityId,
            vaSiteName: mou.vaSiteName,
            signedDate: mou.signedDate ? dayjs(mou.signedDate) : null,
            status: mou.status,
            notes: mou.notes
        });
        setModalVisible(true);
    };

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`${apiUrl}/analytics/radar/mou-agreements/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                notification.success({
                    message: 'Success',
                    description: 'MOU agreement deleted successfully',
                });
                fetchMouAgreements();
                onDataChange();
            } else {
                notification.error({
                    message: 'Error',
                    description: 'Failed to delete MOU agreement',
                });
            }
        } catch (error) {
            notification.error({
                message: 'Error',
                description: 'Error deleting MOU agreement',
            });
            console.error('Error:', error);
        }
    };

    const handleAddNew = () => {
        setEditingMou(null);
        form.resetFields();
        setModalVisible(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'green';
            case 'pending': return 'orange';
            case 'inactive': return 'red';
            default: return 'default';
        }
    };

    const columns: ColumnsType<MouAgreement> = [
        {
            title: 'Tribe/VSO',
            dataIndex: 'vaSiteName',
            key: 'vaSiteName',
            sorter: (a, b) => a.vaSiteName.localeCompare(b.vaSiteName),
        },
        {
            title: 'Community',
            dataIndex: ['community', 'name'],
            key: 'communityName',
            render: (communityName: string) => communityName || 'N/A',
        },
        {
            title: 'Signed Date',
            dataIndex: 'signedDate',
            key: 'signedDate',
            render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
            sorter: (a, b) => dayjs(a.signedDate).unix() - dayjs(b.signedDate).unix(),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={getStatusColor(status)}>
                    {status.toUpperCase()}
                </Tag>
            ),
            filters: [
                { text: 'Active', value: 'active' },
                { text: 'Pending', value: 'pending' },
                { text: 'Inactive', value: 'inactive' },
            ],
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'Notes',
            dataIndex: 'notes',
            key: 'notes',
            render: (notes: string) => notes ? (notes.length > 50 ? `${notes.substring(0, 50)}...` : notes) : 'N/A',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Are you sure you want to delete this MOU agreement?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                        >
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <Title level={4} style={{ margin: 0 }}>MOU Agreements Management</Title>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddNew}
                    >
                        Add New MOU
                    </Button>
                </div>

                <Table
                    columns={columns}
                    dataSource={mouAgreements}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                    }}
                    scroll={{ x: 800 }}
                />
            </Card>

            <Modal
                title={editingMou ? 'Edit MOU Agreement' : 'Add MOU Agreement'}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    setEditingMou(null);
                    form.resetFields();
                }}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        label="Tribe/VSO"
                        name="vaSiteName"
                        rules={[{ required: true, message: 'Please enter Tribe/VSO name' }]}
                    >
                        <Input placeholder="e.g., Navajo Nation, VFW Post 123" />
                    </Form.Item>
                    
                    <Form.Item
                        label="Community"
                        name="communityId"
                    >
                        <Select 
                            {...communitySelectProps} 
                            placeholder="Select a community (optional)"
                            allowClear
                            showSearch
                            filterOption={(input, option) =>
                                // @ts-ignore
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                        />
                    </Form.Item>
                    
                    <Form.Item
                        label="Signed Date"
                        name="signedDate"
                        rules={[{ required: true, message: 'Please select signed date' }]}
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    
                    <Form.Item
                        label="Status"
                        name="status"
                        rules={[{ required: true, message: 'Please select status' }]}
                    >
                        <Select>
                            <Select.Option value="active">Active</Select.Option>
                            <Select.Option value="pending">Pending</Select.Option>
                            <Select.Option value="inactive">Inactive</Select.Option>
                        </Select>
                    </Form.Item>
                    
                    <Form.Item
                        label="Notes"
                        name="notes"
                    >
                        <Input.TextArea rows={3} placeholder="Additional notes..." />
                    </Form.Item>
                    
                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => {
                                setModalVisible(false);
                                setEditingMou(null);
                                form.resetFields();
                            }}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit">
                                {editingMou ? 'Update' : 'Create'} MOU
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};