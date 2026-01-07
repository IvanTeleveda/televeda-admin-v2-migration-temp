import { Col, Popconfirm, Row, Typography } from "@pankod/refine-antd";
import { MutableRefObject, useEffect } from "react";
import { EditorRef } from "react-email-editor";
import "./loadTemplate.css";
import { IEmailTemplate } from "../../interfaces";
import { HttpError, useList } from "@refinedev/core";

export const LoadTemplate: React.FC<{
    savedTemplate: string,
    closeModal: () => void,
    editorRef: MutableRefObject<EditorRef | null>
}> = ({ savedTemplate, closeModal, editorRef }) => {

    const { data, refetch } = useList<IEmailTemplate, HttpError>({
        resource: "emails/savedBulderTemplates",
    });

    const loadEditor = (json: string) => {
        editorRef?.current?.editor?.loadDesign(JSON.parse(json));
        closeModal();
    }

    useEffect(() => {
        refetch();
    }, [savedTemplate])

    const renderTemplates = () => {
        const templates = data?.data.map(template => {

            return (
                <Col key={template.id} className="col" xl={7} lg={11} xs={24}>
                    <div className="template-wrap">
                        <div className="template-wrap-inner">
                            <Popconfirm
                                getPopupContainer={() => document.getElementById("load-template-body") || document.body}
                                style={{ transform: 'translate(100px,100px)' }}
                                title="Are you sure?"
                                description="This will override current template."
                                okText="Yes"
                                cancelText="No"
                                onConfirm={() => loadEditor(template.json)}
                            >
                                <Typography.Text className="template-edit-txt">Apply</Typography.Text>
                            </Popconfirm>
                        </div>
                    </div>
                    <div className="template-name-field">{template.name}</div>
                    <div className="template"
                        dangerouslySetInnerHTML={{ __html: template.html }}>
                    </div>
                </Col>
            )
        })
        return templates
    }

    return (
        <Row id="load-template-body" className="row">
            {renderTemplates()}
        </Row>
    )
}