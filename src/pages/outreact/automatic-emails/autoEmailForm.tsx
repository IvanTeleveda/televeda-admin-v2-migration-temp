import { Card, Col, Divider, Form, Input, Row, Select, Switch, notification } from "@pankod/refine-antd";
import { SyntheticEvent, useEffect, useRef, useState } from "react";
import { EditorRef } from "react-email-editor";
import "prismjs/themes/prism-tomorrow.css";
import { v4 as uuidv4 } from 'uuid';
import { EmailBuilder } from "../emailFormItem";
import Constants from "../../../typings/constants";
import { ICommunity, IEmailTemplate } from "../../../interfaces";
import { useSelect } from "@refinedev/antd";
import { CreateResponse, HttpError, IResourceComponentsProps, useApiUrl, useCustomMutation, useNavigation, useOne, useParsed } from "@refinedev/core";

export const AutomaticEmailTemplateForm: React.FC<IResourceComponentsProps> = () => {

    const apiUrl = useApiUrl();

    const genId = uuidv4();

    const { list } = useNavigation();

    const [form] = Form.useForm<IEmailTemplate>();

    const emailEditorRef = useRef<EditorRef | null>(null);
    const [isEditorLoading, setIsEditorLoading] = useState(true);

    const [code, setCode] = useState<string>("");
    const [editorJson, setEditorJson] = useState<string>();

    const [isBuilder, setIsBuilder] = useState<boolean>(true);

    const { id: idFromRoute } = useParsed();

    const { data, isLoading, refetch } = useOne<IEmailTemplate, HttpError>({
        resource: 'emails/auto',
        id: idFromRoute || ''
    })

    const { mutate } = useCustomMutation<IEmailTemplate>();

    const { selectProps: communitySelectProps } = useSelect<ICommunity>({
        resource: "Community",
        optionLabel: 'name',
        optionValue: 'id',
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
        sort: [
            { field: "name", order: 'asc' }
        ]
    });

    useEffect(() => {
        if (isEditorLoading) return;
        emailEditorRef.current?.editor?.setMergeTags(Constants.EMAIL_MERGE_TAGS as any);

        if (data?.data.json) {
            emailEditorRef.current?.editor?.loadDesign(JSON.parse(data.data.json));
        }
    }, [isEditorLoading])

    useEffect(() => {
        console.log('idFromParams: ', idFromRoute)
        if (isLoading) return;

        if (!idFromRoute) {
            form.setFieldValue('sender', 'support@televeda.com');
            return;
        }

        if (data && !data?.data.json && data?.data.html) {
            setIsEditorLoading(false);
            setCode(data.data.html);
        }

        form.setFieldsValue({
            name: data?.data.name,
            type: data?.data.type,
            communityId: data?.data.communityId,
            sender: data?.data.sender,
            subject: data?.data.subject,
            communitySpecific: data?.data.communityId ? true : false,
            templateType: data?.data.json ? 'builder' : 'rawHtml'
        })
    }, [data?.data])

    const getHtmlWithEjsTags = (htmlContent: string) => {
        return htmlContent
            .replace(/{{{/g, '<%-')
            .replace(/{{/g, '<%=')
            .replace(/}}/g, '%>');
    };

    async function onFinish() {
        if (!emailEditorRef.current) {
            saveDraftMutation({ html: code }, null)
            return;
        }
        emailEditorRef.current?.editor?.exportHtml((exportData) => {
            emailEditorRef.current?.editor?.saveDesign((saveDesignData: Object) => {
                saveDraftMutation(exportData, saveDesignData);
            })
        });
    }

    const saveDraftMutation = (exportData: { html: string }, saveDesignData: Object | null) => {
        const { html } = exportData;
        const htmlWithEjsTags = getHtmlWithEjsTags(html);
        
        mutate({
            url: idFromRoute ? `${apiUrl}/emails/auto/${idFromRoute}` : `${apiUrl}/emails/auto`,
            method: idFromRoute ? "patch" : "post",
            values: {
                name: form.getFieldValue('name'),
                communityId: form.getFieldValue('communitySpecific') ? form.getFieldValue('communityId') : null,
                type: form.getFieldValue('type') || null,
                sender: form.getFieldValue('sender'),
                subject: form.getFieldValue('subject'),
                json: saveDesignData ? JSON.stringify(saveDesignData) : null,
                html: htmlWithEjsTags
            }
        }, {
            onSuccess: (response: CreateResponse<any>) => {
                if (response.data.text === 'accepted with warning') {
                    notification.open({
                        type: 'info',
                        message: idFromRoute ? 'Email Draft Updated' : 'Email Draft Created',
                        description:
                            <span>
                                <b>NOTE:</b> Only one trigger per template with the same community can be active at a time! <b>{response.data.templateName}</b>'s trigger has been removed!
                            </span>,
                        duration: 10,
                    })
                }
                else {
                    notification.open({
                        type: 'success',
                        message: idFromRoute ? 'Email Draft Updated' : 'Email Draft Created',
                    });
                }
                
                setIsBuilder(true);
                setIsEditorLoading(true);
                setCode("");
                setEditorJson(undefined);
                refetch();
                list('emails/auto')
            }
        });
    }

    const checkSubmitter = (e: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
        if (e.nativeEvent?.submitter?.id !== genId) {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    return (
        <Card title={idFromRoute ? "Edit Draft" : "Create Draft"}>
            <Form
                form={form}
                onFinish={onFinish}
                onSubmitCapture={(e: SyntheticEvent<HTMLFormElement, SubmitEvent>) => { checkSubmitter(e) }}
                layout="vertical"
                size="large"
            >

                <Row gutter={{ xs: 0, lg: 24, xl: 36 }}>

                    <Col xl={12} xs={24}>
                        <Form.Item
                            label={"Email Name"}
                            name="name"
                            rules={[
                                {
                                    required: true,
                                    message: "Email Name is required"
                                },
                            ]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>

                    <Col xl={12} xs={24}>
                        <Form.Item
                            label={"Trigger"}
                            name="type"
                        >
                            <Select
                                allowClear={true}
                                options={Constants.EMAIL_TRIGGERS}
                            >
                            </Select>
                        </Form.Item>
                    </Col>

                    <Col xl={12} xs={24}>
                        <Form.Item
                            label={"Send email as"}
                            name="sender"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please select a sender'
                                }
                            ]}
                        >
                            <Select
                                allowClear={true}
                                options={[
                                    { value: 'support@televeda.com' },
                                    { value: 'admin@televeda.com' },
                                    { value: 'community@televeda.com' },
                                    { value: 'outreach@televeda.com' },
                                    { value: 'lorinda@televeda.com' }
                                ]}
                            >
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col xl={12} xs={24}>
                        <Form.Item
                            label={"Email Subject"}
                            name="subject"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please select a subject'
                                }
                            ]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider />

                <Row gutter={{ xs: 0, lg: 24, xl: 36 }}>
                    <Col span={24}>
                        <Form.Item
                            name="communitySpecific"
                            label="Community Specific Template"
                            valuePropName="checked"
                        >
                            <Switch checkedChildren="YES" unCheckedChildren="NO" />
                        </Form.Item>

                    </Col>

                    <Col xl={12} xs={24}>
                        <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, currentValues) => prevValues.communitySpecific !== currentValues.communitySpecific}
                            preserve={true}
                        >
                            {({ getFieldValue }) =>
                                getFieldValue('communitySpecific') === true ? (
                                    <Form.Item
                                        name="communityId"
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Please select a community'
                                            }
                                        ]}
                                    >
                                        <Select
                                            allowClear={true}
                                            {...communitySelectProps}
                                            placeholder="Please select community"
                                        >
                                        </Select>
                                    </Form.Item>
                                ) : null
                            }
                        </Form.Item>
                    </Col>
                </Row>

                <Divider />

                <EmailBuilder
                    editorJson={editorJson}
                    setEditorJson={setEditorJson}
                    isBuilder={isBuilder}
                    setIsBuilder={setIsBuilder}
                    isEditorLoading={isEditorLoading}
                    setIsEditorLoading={setIsEditorLoading}
                    code={code}
                    setCode={setCode}
                    emailEditorRef={emailEditorRef}
                    genId={genId}
                    idFromParams={idFromRoute as string}
                    data={data}
                />
            </Form>
        </Card >
    )
}