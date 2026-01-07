import { Button, Col, Form, Input, Modal, notification, Radio, Row, Space, Tabs, TabsProps, Typography } from "@pankod/refine-antd";
import EmailEditor, { EditorRef } from "react-email-editor";
import { LoadTemplate } from "./LoadTemplate";
import { Dispatch, MutableRefObject, SetStateAction, useState } from "react";
import DOMPurify from "dompurify";
import { DownloadOutlined, SaveFilled, SaveOutlined } from '@ant-design/icons';
import { highlight, languages } from "prismjs";
import CodeEditor from "react-simple-code-editor";
import { IEmailTemplate } from "../../interfaces";
import { GetOneResponse, useApiUrl, useCustomMutation } from "@refinedev/core";
import { useModal } from "@refinedev/antd";

export const EmailBuilder: React.FC<{
    editorJson: string | undefined;
    setEditorJson: Dispatch<SetStateAction<string | undefined>>;
    isBuilder: boolean;
    setIsBuilder: Dispatch<SetStateAction<boolean>>;
    isEditorLoading: boolean;
    setIsEditorLoading: Dispatch<SetStateAction<boolean>>;
    code: string;
    setCode: Dispatch<SetStateAction<string>>;
    emailEditorRef: MutableRefObject<EditorRef | null>;
    genId: string;
    idFromParams: string | undefined;
    data: GetOneResponse<IEmailTemplate> | undefined;
}> = ({
    editorJson,
    setEditorJson,
    isBuilder,
    setIsBuilder,
    isEditorLoading,
    setIsEditorLoading,
    code,
    setCode,
    emailEditorRef,
    genId,
    idFromParams,
    data
}) => {

    const apiUrl = useApiUrl();

    const [savedTemplate, setSavedTemplate] = useState<string>('');

    const [saveTemplateForm] = Form.useForm<{ name: string }>();

    const { modalProps: saveTemplateModalProps, show: saveTemplateModalShow, close: saveTemplateModalClose } = useModal();
    const { modalProps: loadTemplateModalProps, show: loadTemplateModalShow, close: loadTemplateModalClose } = useModal();

    const { mutate } = useCustomMutation<IEmailTemplate>();

    const saveTemplateMutation = (exportData: { html: string }, saveDesignData: Object) => {
        mutate({
            url: `${apiUrl}/emails/saveBulderTemplate`,
            method: "post",
            values: {
                name: saveTemplateForm.getFieldValue('name'),
                json: JSON.stringify(saveDesignData),
                html: exportData.html
            }
        }, {
            onSuccess: () => {
                notification.open({
                    type: 'success',
                    message: 'Email Template Saved',
                });
                setSavedTemplate(prevState => prevState += "+");
            }
        });
    }

    const onLoad = () => {
        if (editorJson) {
            emailEditorRef.current?.editor?.loadDesign(JSON.parse(editorJson));
        }
        setIsEditorLoading(false);
    }

    const reloadBuilder = () => {
        setIsBuilder(true);
        setIsEditorLoading(true);
    }

    const reloadRawHtml = async () => {
        setIsEditorLoading(false);
        if (emailEditorRef.current) {
            emailEditorRef.current?.editor?.saveDesign((saveDesignData: Object) => {
                setEditorJson(JSON.stringify(saveDesignData));
                setIsBuilder(false);
            });
        }
    }

    const saveBuilderTemplate = async () => {

        await saveTemplateForm.validateFields();

        saveTemplateModalClose();
        emailEditorRef.current?.editor?.exportHtml((exportData) => {
            emailEditorRef.current?.editor?.saveDesign((saveDesignData: Object) => {
                saveTemplateMutation(exportData, saveDesignData)
            })
        })
    }

    const tabItems: TabsProps['items'] = [
        {
            key: '1',
            label: 'Code',
            children:
                <>
                    <Typography.Text>Although there are safety guards it's still advisable to NOT copy code from untrusted sources.</Typography.Text><CodeEditor
                        value={code}
                        onValueChange={code => setCode(code)}
                        highlight={code => highlight(code, languages.markup, 'markup')}
                        padding={10}
                        style={{
                            backgroundColor: '#2f2f2f',
                            color: 'white',
                            fontFamily: '"Fira code", "Fira Mono", monospace',
                            fontSize: 15,
                        }} />
                </>
        },
        {
            key: '2',
            label: 'Preview',
            children: <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(code) }}></div>
        }
    ]

    return (
        <Row gutter={{ xs: 0, lg: 24, xl: 36 }}>

            <Col span={24}>
                <Form.Item
                    style={{ display: 'flex', justifyContent: 'center' }}
                    name="templateType"
                    initialValue={idFromParams ? null : "builder"}
                >
                    <Radio.Group
                        name="radiogroup">
                        <Radio.Button value="builder" onClick={reloadBuilder}>Use drag and drop email builder</Radio.Button>
                        <Radio.Button value="rawHtml" onClick={reloadRawHtml}>Parse raw HTML from any source</Radio.Button>
                    </Radio.Group>
                </Form.Item>


                <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) => prevValues.templateType !== currentValues.templateType && isBuilder === false}
                    preserve={true}
                >
                    {({ getFieldValue }) => {
                        return (
                            getFieldValue('templateType') === 'builder' ? (
                                <Form.Item>
                                    <div style={{ display: 'flex', justifyContent: 'end' }}>
                                        <Button icon={<DownloadOutlined />} disabled={isEditorLoading} onClick={loadTemplateModalShow}>
                                            Load Template
                                        </Button>
                                        <Button icon={<SaveFilled />} disabled={isEditorLoading} onClick={saveTemplateModalShow} style={{ marginLeft: 10, marginBottom: 15 }}>
                                            Save Template
                                        </Button>
                                    </div>
                                    <EmailEditor
                                        onReady={onLoad}
                                        options={{
                                            appearance: {
                                                theme: 'dark'
                                            },
                                            features: {
                                                preview: true
                                            },
                                            // requires MONEY
                                            // customJS: [
                                            //   window.location.protocol +
                                            //   "//" +
                                            //   window.location.host +
                                            //   "/televeda/custom.js"
                                            // ]
                                        }}
                                        style={{ height: '80vh', overflowY: 'hidden', overflowX: 'auto' }}
                                        ref={emailEditorRef}
                                    />
                                </Form.Item>
                            ) :
                                <Form.Item>
                                    <Tabs defaultActiveKey={idFromParams ? data?.data?.json ? "1" : "2" : "1"} type="card" items={tabItems} />
                                </Form.Item>
                        )
                    }}
                </Form.Item>
            </Col>
            <Col
                style={{ marginLeft: 'auto' }}
            >
                <Space>
                    {isEditorLoading && <p style={{ marginRight: '20px' }}><i>Template loading... Please wait.</i></p>}
                    <Form.Item>
                        <Button
                            id={genId}
                            disabled={isEditorLoading}
                            htmlType="submit"
                            type="primary"
                            icon={<SaveOutlined />}
                        >
                            Save Draft
                        </Button>
                    </Form.Item>
                </Space>
            </Col>

            <Modal
                title="Save Template"
                onOk={saveBuilderTemplate}
                afterClose={() => saveTemplateForm.resetFields()}
                {...saveTemplateModalProps}
            >

                <Form
                    style={{ marginTop: 15 }}
                    layout="vertical"
                    form={saveTemplateForm}>
                    <Form.Item
                        label="Template Name"
                        name="name"
                        rules={[
                            { required: true, message: "Template Name required" }
                        ]}
                    >
                        <Input />
                    </Form.Item>
                </Form>

            </Modal>

            <Modal
                title="Load Template"
                footer={null}
                width={'75%'}
                {...loadTemplateModalProps}
            >
                <LoadTemplate savedTemplate={savedTemplate} closeModal={loadTemplateModalClose} editorRef={emailEditorRef} />
            </Modal>
        </Row>
    )
}