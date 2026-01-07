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
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface VaSite {
    id: string;
    siteName: string;
    siteType: string;
    adoptionDate?: string;
    status: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

interface VaSitesManagementProps {
    onClose: () => void;
    onDataChange: () => void;
}

export const VaSitesManagement: React.FC<VaSitesManagementProps> = ({ onClose, onDataChange }) => {
    const apiUrl = useApiUrl();
    const [vaSites, setVaSites] = useState<VaSite[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingSite, setEditingSite] = useState<VaSite | null>(null);
    const [form] = Form.useForm();

    // Fetch VA sites
    const fetchVaSites = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/analytics/radar/va-sites`, {
                method: 'GET',
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setVaSites(data);
            } else {
                notification.error({
                    message: 'Error',
                    description: 'Failed to fetch VA sites',
                });
            }
        } catch (error) {
            notification.error({
                message: 'Error',
                description: 'Error fetching VA sites',
            });
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVaSites();
    }, []);

    const handleSubmit = async (values: any) => {
        try {
            const url = editingSite 
                ? `${apiUrl}/analytics/radar/va-sites/${editingSite.id}`
                : `${apiUrl}/analytics/radar/va-sites`;
            
            const method = editingSite ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    siteName: values.siteName,
                    siteType: values.siteType,
                    adoptionDate: values.adoptionDate?.toISOString(),
                    status: values.status,
                    notes: values.notes
                })
            });

            if (response.ok) {
                notification.success({
                    message: 'Success',
                    description: editingSite ? 'VA site updated successfully' : 'VA site created successfully',
                });
                setModalVisible(false);
                form.resetFields();
                setEditingSite(null);
                fetchVaSites();
                onDataChange();
            } else {
                const errorData = await response.json().catch(() => ({}));
                notification.error({
                    message: 'Error',
                    description: errorData.message || `Failed to ${editingSite ? 'update' : 'create'} VA site`,
                });
            }
        } catch (error) {
            notification.error({
                message: 'Error',
                description: `Error ${editingSite ? 'updating' : 'creating'} VA site`,
            });
            console.error('Error:', error);
        }
    };

    const handleEdit = (site: VaSite) => {
        setEditingSite(site);
        form.setFieldsValue({
            siteName: site.siteName,
            siteType: site.siteType,
            adoptionDate: site.adoptionDate ? dayjs(site.adoptionDate) : null,
            status: site.status,
            notes: site.notes
        });
        setModalVisible(true);
    };

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`${apiUrl}/analytics/radar/va-sites/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                notification.success({
                    message: 'Success',
                    description: 'VA site deleted successfully',
                });
                fetchVaSites();
                onDataChange();
            } else {
                notification.error({
                    message: 'Error',
                    description: 'Failed to delete VA site',
                });
            }
        } catch (error) {
            notification.error({
                message: 'Error',
                description: 'Error deleting VA site',
            });
            console.error('Error:', error);
        }
    };

    const handleAddNew = () => {
        setEditingSite(null);
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

    const getSiteTypeLabel = (siteType: string) => {
        switch (siteType) {
            case 'va_medical_center': return 'VA Medical Center';
            case 'cboc': return 'CBOC';
            case 'vet_center': return 'Vet Center';
            default: return siteType;
        }
    };

    const columns: ColumnsType<VaSite> = [
        {
            title: 'Site Name',
            dataIndex: 'siteName',
            key: 'siteName',
            sorter: (a, b) => a.siteName.localeCompare(b.siteName),
        },
        {
            title: 'Site Type',
            dataIndex: 'siteType',
            key: 'siteType',
            render: (siteType: string) => getSiteTypeLabel(siteType),
            filters: [
                { text: 'VA Medical Center', value: 'va_medical_center' },
                { text: 'CBOC', value: 'cboc' },
                { text: 'Vet Center', value: 'vet_center' },
            ],
            onFilter: (value, record) => record.siteType === value,
        },
        {
            title: 'Adoption Date',
            dataIndex: 'adoptionDate',
            key: 'adoptionDate',
            render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : 'N/A',
            sorter: (a, b) => {
                if (!a.adoptionDate && !b.adoptionDate) return 0;
                if (!a.adoptionDate) return 1;
                if (!b.adoptionDate) return -1;
                return dayjs(a.adoptionDate).unix() - dayjs(b.adoptionDate).unix();
            },
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
                        title="Are you sure you want to delete this VA site?"
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
                    <Title level={4} style={{ margin: 0 }}>VA Sites Management</Title>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddNew}
                    >
                        Add New VA Site
                    </Button>
                </div>

                <Table
                    columns={columns}
                    dataSource={vaSites}
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
                title={editingSite ? 'Edit VA Site' : 'Add VA Site'}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    setEditingSite(null);
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
                        label="Site Name"
                        name="siteName"
                        rules={[{ required: true, message: 'Please enter site name' }]}
                    >
                        <Input placeholder="e.g., VA Medical Center Phoenix" />
                    </Form.Item>
                    
                    <Form.Item
                        label="Site Type"
                        name="siteType"
                        rules={[{ required: true, message: 'Please select site type' }]}
                    >
                        <Select placeholder="Select site type">
                            <Select.Option value="va_medical_center">VA Medical Center</Select.Option>
                            <Select.Option value="cboc">CBOC</Select.Option>
                            <Select.Option value="vet_center">Vet Center</Select.Option>
                        </Select>
                    </Form.Item>
                    
                    <Form.Item
                        label="Adoption Date"
                        name="adoptionDate"
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
                                setEditingSite(null);
                                form.resetFields();
                            }}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit">
                                {editingSite ? 'Update' : 'Create'} VA Site
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
