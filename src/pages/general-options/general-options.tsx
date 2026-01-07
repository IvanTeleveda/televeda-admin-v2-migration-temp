import { Button, Card, Col, DatePicker, Form, Input, Row, Select } from "@pankod/refine-antd"
import { SaveOutlined } from '@ant-design/icons';
import { useEffect } from "react";
import { IGeneralOptions } from "../../interfaces";
import { IResourceComponentsProps, useApiUrl, useCustom, useCustomMutation } from "@refinedev/core";
import dayjs, { Dayjs } from "dayjs";
import { TimeZoneHelper } from "../../adapters/TimeZoneHelper";
import moment from "moment-timezone";

export const GeneralOptions: React.FC<IResourceComponentsProps> = () => {
    const [form] = Form.useForm<IGeneralOptions>();
    const [calendarForm] = Form.useForm();

    const { MonthPicker } = DatePicker;

    const { mutate } = useCustomMutation<IGeneralOptions>();
    const apiUrl = useApiUrl()

    const { data, isLoading } = useCustom({
        url: `${apiUrl}/select_general_options`,
        method: 'get',
    })

    useEffect(() => {
        if (isLoading) return;

        form.setFieldValue('monthly_calendar_url', data?.data?.monthly_calendar_url);
    }, [data]);

    function onFinish() {
        mutate({
            url: `${apiUrl}/general_options`,
            method: "post",
            values: form.getFieldsValue(),
            successNotification: (() => ({
                description: "Successful",
                message: `Successfully Updated Calendar`,
                type: "success"
            })),
        });
    }

    function onDownload(values: { timezone: string, date: Dayjs }) {
        const month = values.date.format('M');
        const year = values.date.format('YYYY');
        window.open(`/general_options/pdf_calendar?year=${year}&month=${month}&timezone=${values.timezone}`);
    }

    return (
        <>

            <Card
                title="General options"
            >
                <Form
                    onFinish={onFinish}
                    form={form}
                    layout="vertical"
                    autoComplete="off"
                    size="large"
                >

                    <Form.Item
                        label="Default Monthly Calendar Download link"
                        name="monthly_calendar_url"
                        rules={[
                            { type: 'url', warningOnly: true }, { type: 'string' }
                        ]}
                    >
                        <Input />
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
            <br />
            <Card
                title="Download Calendar Section"
            >
                <Form
                    onFinish={onDownload}
                    form={calendarForm}
                    layout="vertical"
                    autoComplete="off"
                    size="large"
                >
                    <Row gutter={[24, 24]}>
                        <Col span={24} md={12}>
                            <Form.Item
                                label="Time Zone"
                                name="timezone"
                                initialValue={moment.tz.guess()}
                            >
                                <Select allowClear
                                    showSearch
                                    filterOption={(input, option) => { return (option?.label ?? '').toLowerCase().includes(input.toLowerCase().trim()) }}
                                    options={TimeZoneHelper.getTimezonesNames().map((timeZone) => { return { label: timeZone.tzPresentationName, value: timeZone.tzName } })}
                                    placeholder="Optional: Select time zone" />
                            </Form.Item>
                        </Col>
                        <Col span={24} md={12}>
                            <Form.Item
                                label="Choose month"
                                name="date"
                                initialValue={dayjs().add(1, 'month').startOf('month')}
                                rules={[
                                    {
                                        required: true
                                    }
                                ]}
                            >
                                <MonthPicker />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item>
                        <Button type="primary" htmlType="submit">Download Calendar</Button>
                    </Form.Item>
                </Form>
            </Card>
        </>

    )
}