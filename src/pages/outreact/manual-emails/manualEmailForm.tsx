import { Card, Col, Divider, Form, Input, notification, Row, Select } from "@pankod/refine-antd";
import { SyntheticEvent, useEffect, useRef, useState } from "react";
import { EditorRef } from "react-email-editor";
import "prismjs/themes/prism-tomorrow.css";
import { v4 as uuidv4 } from 'uuid';
import { EmailBuilder } from "../emailFormItem";
import { IEmailTemplate, IRefineUser, UserPermissions } from "../../../interfaces";
import { useCustomMutation, useGetIdentity, useParsed, HttpError, IResourceComponentsProps, useOne, usePermissions, useApiUrl, useNavigation } from "@refinedev/core";
import Constants from "../../../typings/constants";

export const ManualEmailForm: React.FC<IResourceComponentsProps> = () => {

    const genId = uuidv4();

    const { data: user } = useGetIdentity<IRefineUser>();
    const { data: permissionData } = usePermissions<UserPermissions>();

    const apiUrl = useApiUrl()

    const options = permissionData === "TelevedaAdmin" ? [
        { value: user?.email },
        { value: 'support@televeda.com' },
        { value: 'admin@televeda.com' },
        { value: 'community@televeda.com' },
        { value: 'outreach@televeda.com' },
        { value: 'lorinda@televeda.com' }
    ] : [
        { value: user?.email }
    ]

    const { list } = useNavigation();

    const [form] = Form.useForm<IEmailTemplate>();

    const emailEditorRef = useRef<EditorRef | null>(null);
    const [isEditorLoading, setIsEditorLoading] = useState(true);

    const [code, setCode] = useState<string>("");
    const [editorJson, setEditorJson] = useState<string>();

    const [isBuilder, setIsBuilder] = useState<boolean>(true);

    const { id: idFromRoute } = useParsed(); 

    const { data, isLoading, refetch } = useOne<IEmailTemplate, HttpError>({
        resource: 'emails/manual',
        id: idFromRoute || ''
    })

    const { mutate } = useCustomMutation<IEmailTemplate>();

    useEffect(() => {
        if (isEditorLoading) return;
        emailEditorRef.current?.editor?.setMergeTags(Constants.MANUAL_EMAIL_MERGE_TAGS as any);

        if (data?.data.json) {
            emailEditorRef.current?.editor?.loadDesign(JSON.parse(data.data.json));
        }
    }, [isEditorLoading])

    useEffect(() => {
        console.log('idFromParams: ', idFromRoute)
        if (isLoading) return;

        if (!idFromRoute) {
            if(permissionData === "TelevedaAdmin") {
                form.setFieldValue('sender', 'support@televeda.com');
            }
            else {
                form.setFieldValue('sender',  user?.email);
            }
            return;
        }

        if (data && !data?.data.json && data?.data.html) {
            setIsEditorLoading(false);
            setCode(data.data.html);
        }

        form.setFieldsValue({
            name: data?.data.name,
            sender: data?.data.sender,
            subject: data?.data.subject,
            communitySpecific: data?.data.communityId ? true : false,
            templateType: data?.data.json ? 'builder' : 'rawHtml'
        })
    }, [data?.data])

    async function onFinish() {
        if (!emailEditorRef.current) {
            saveDraftMutation({ html: code }, null)
            return;
        }
        emailEditorRef.current?.editor?.exportHtml((exportData) => {
            emailEditorRef.current?.editor?.saveDesign((saveDesignData: Object) => {
                saveDraftMutation(exportData, saveDesignData);
            })
        })
    }

    const getHtmlWithEjsTags = (htmlContent: string) => {
        return htmlContent
            .replace(/{{{/g, '<%-')
            .replace(/{{/g, '<%=')
            .replace(/}}/g, '%>');
    };
    
    const saveDraftMutation = (exportData: { html: string }, saveDesignData: Object | null) => {
        const { html } = exportData;
        const htmlWithEjsTags = getHtmlWithEjsTags(html);

        mutate({
            url: idFromRoute ? `${apiUrl}/emails/manual/${idFromRoute}` : `${apiUrl}/emails/manual`,
            method: idFromRoute ? "patch" : "post",
            values: {
                name: form.getFieldValue('name'),
                sender: form.getFieldValue('sender'),
                type: 'manual',
                subject: form.getFieldValue('subject'),
                json: saveDesignData ? JSON.stringify(saveDesignData) : null,
                html: htmlWithEjsTags
            }
        }, {
            onSuccess: () => {
                notification.open({
                    type: 'success',
                    message: idFromRoute ? 'Email Draft Updated' : 'Email Draft Created',
                });

                setIsBuilder(true);
                setIsEditorLoading(true);
                setCode("");
                setEditorJson(undefined);
                refetch();
                list('emails/manual')
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
                                options={options}
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