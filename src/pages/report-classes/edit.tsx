import { Button, Card, Form, Input, InputNumber, Result } from '@pankod/refine-antd';
import React, { useEffect } from 'react';
import { SaveOutlined } from '@ant-design/icons';
import { Link } from '@pankod/refine-react-router-v6';
import { IClassReportData } from '../../interfaces';
import { IResourceComponentsProps, useCreate, useShow } from '@refinedev/core';

export const ClassReportAttendanceOverride: React.FC<IResourceComponentsProps> = () => {

    const [form] = Form.useForm<IClassReportData>();
    const { mutate } = useCreate();
    const { query } = useShow<IClassReportData>();

    const { data, isLoading } = query;
    const result = data?.data;

    useEffect(() => {
        if (!isLoading) {
            form.setFieldsValue({
                participantsCount: result?.participantsCount,
                info: result?.info
            })
        }
    }, [isLoading]);

    function onFinish() {
        mutate(
            {
                resource: `hybrid_attendance/${btoa(JSON.stringify({ classScheduledFor: result?.scheduledFor, scheduledClassId: result?.scheduledClassId, classType: result?.classType }))}`,
                values: {
                    participantsCount: form.getFieldValue('participantsCount'),
                    info: form.getFieldValue('info'),
                    userId: null,
                    isClass: true
                },
            }
        );
    }

    if(!isLoading && !result?.canSeeOverrideButton) {
        return <Result
            status="403"
            title="403"
            subTitle="Sorry, you are not authorized to access this page."
            extra={<Button type="primary"><Link to='/'>Back Home</Link></Button>}
        />
    }

    return (
        <Card
            title="Override Participant Count">
            <Form
                form={form}
                onFinish={onFinish}
                layout="vertical"
            >
                <Form.Item
                    label="Total Participant Count"
                    name="participantsCount"
                    rules={[
                        { required: true }
                    ]}
                >
                    <InputNumber min={1} />
                </Form.Item>

                <Form.Item
                    label="Note"
                    name="info"
                >
                    <Input.TextArea />
                </Form.Item>
                
                <Form.Item>
                    <Button
                        htmlType="submit"
                        type="primary"
                        style={{ float: "right" }}
                        icon={<SaveOutlined />}
                    >
                        Save
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
}