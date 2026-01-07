import { Col, Form, FormProps, Input, Row, SaveButtonProps, Select, Switch } from "@pankod/refine-antd";
import { useState } from "react";
import { TelevedaEdit } from "../../components/page-containers/edit";
import { TelevedaCreate } from "../../components/page-containers/create";
import { SaveButton, useSelect } from "@refinedev/antd";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { ClassicEditor } from "ckeditor5";
import editorConfig from "../../utils/editorConfig";
import { CkEditorFirebaseUploadAdapter } from "../../adapters/CkEditorFirebaseUploadAdapter";
import { ICommunity, UserPermissions } from "../../interfaces";
import Constants from "../../typings/constants";
import { usePermissions } from "@refinedev/core";

export const NotificationTemplatesForm: React.FC<{
    action: "edit" | "create",
    saveButtonProps: SaveButtonProps,
    formProps: FormProps
}> = ({ action, saveButtonProps, formProps }) => {
    const { data: permissionsData } = usePermissions<UserPermissions>();
    const [isUploading, setIsUploading] = useState(false);

    const { selectProps: communitySelectProps } = useSelect<ICommunity>({
        resource: "community",
        optionLabel: "name",
        optionValue: "id",
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
    });

    const defaultCommunityIds = formProps.initialValues?.associations
        ? formProps.initialValues.associations.map((a: any) => a.communityId)
        : [];

    const handleFinish = (values: any) => {
        const { isForAllCommunities, ...filteredValues } = values;
        if(permissionsData === "CommunityManager") {
            if(action === "edit") {
                filteredValues.ids = defaultCommunityIds
            } else {
                if(values.isForAllCommunities) {
                    const allAvailableCommunityIds = communitySelectProps?.options?.map(option => {
                        return option.value;
                    })
                    filteredValues.ids = allAvailableCommunityIds
                }
            }
        }
        if (formProps.onFinish) {
            formProps.onFinish(filteredValues);
        }
    };

    return (
        action === "edit" ?
            <TelevedaEdit footerButtons={() => (
                <SaveButton style={isUploading ? { background: '#ECEFF2' } : {}} disabled={isUploading} {...saveButtonProps} ></SaveButton>
            )} title="Edit Notification Template">
                <FormComponent
                    formProps={{ ...formProps, onFinish: handleFinish }}
                    setIsUploading={setIsUploading}
                    showIsForAllCommunities={permissionsData === 'TelevedaAdmin'}
                    defaultCommunityIds={defaultCommunityIds}
                    permissionsData={permissionsData}
                    communitySelectProps={communitySelectProps}
                />
            </TelevedaEdit>
            :
            <TelevedaCreate footerButtons={() => (
                <SaveButton style={isUploading ? { background: '#ECEFF2' } : {}} disabled={isUploading} {...saveButtonProps} ></SaveButton>
            )} title="Create Notification template">
                <FormComponent
                    formProps={{ ...formProps, onFinish: handleFinish }}
                    setIsUploading={setIsUploading}
                    showIsForAllCommunities
                    defaultCommunityIds={defaultCommunityIds}
                    permissionsData={permissionsData}
                    communitySelectProps={communitySelectProps}
                />
            </TelevedaCreate>
    )
}

const FormComponent: React.FC<{
    formProps: FormProps;
    setIsUploading: (isUploading: boolean) => void;
    showIsForAllCommunities: boolean;
    defaultCommunityIds: string[];
    permissionsData?: UserPermissions
    communitySelectProps: any,
}> = ({ formProps, setIsUploading, showIsForAllCommunities, defaultCommunityIds, permissionsData, communitySelectProps }) => {

    return (
        <Form {...formProps} layout="vertical" size="large" 
            initialValues={{
                ...formProps.initialValues,
                isForAllCommunities: defaultCommunityIds.length > 0 ? false : true,
                ids: defaultCommunityIds
            }}
        >
            <Row gutter={{ xs: 0, lg: 24, xl: 36 }}>
                <Col xl={12} xs={24}>
                    <Form.Item
                        label={"Template Name"}
                        name={"name"}
                        rules={[
                            {
                                required: true,
                                message: 'Name is required'
                            },
                            {
                                max: 200,
                                message: 'Title cannot exceed 200 characters'
                            }
                        ]}
                    >
                        <Input maxLength={200} showCount />
                    </Form.Item>
                </Col>
                <Col xl={12} xs={24}>
                    <Form.Item
                        label={"Notification title"}
                        name={"title"}
                        rules={[
                            {
                                required: true,
                                message: 'Title is required'
                            },
                            {
                                max: 200,
                                message: 'Title cannot exceed 200 characters'
                            }
                        ]}
                    >
                        <Input maxLength={200} showCount />
                    </Form.Item>
                </Col>
                <Col xl={12} xs={24}>
                    <Form.Item
                        label={"Notification Subtitle"}
                        name={"subtitle"}
                        rules={[
                            {
                                max: 200,
                                message: 'Title cannot exceed 200 characters'
                            }
                        ]}
                    >
                        <Input maxLength={200} showCount />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item
                        name="description"
                        rules={[]}
                        label="Description"
                        valuePropName='data'

                        getValueFromEvent={(_, editor) => {
                            const data = editor.getData();
                            return data;
                        }}
                    >
                        <CKEditor
                            editor={ClassicEditor}
                            config={editorConfig}
                            onReady={(editor: any) => {
                                // You can store the "editor" and use when it is needed.
                                editor.editing.view.change((writer: any) => {
                                    writer.setStyle('min-width', 'inherit', editor.editing.view.document.getRoot());
                                    writer.setStyle(
                                        "min-height",
                                        "250px",
                                        editor.editing.view.document.getRoot()
                                    );
                                })
                                if (editor && editor.plugins) {
                                    editor.plugins.get("FileRepository").createUploadAdapter = (loader: any) => {
                                        return new CkEditorFirebaseUploadAdapter(loader, setIsUploading);
                                    };

                                    console.log('Editor is ready to use!', editor);
                                }
                            }}
                        />
                    </Form.Item>
                    {showIsForAllCommunities &&
                    <>
                        <Form.Item
                            name="isForAllCommunities"
                            valuePropName="checked"
                            label={permissionsData === 'TelevedaAdmin' ? "For all communities" : "For all my communities"}
                        >
                            <Switch checkedChildren="YES" unCheckedChildren="NO" />
                        </Form.Item>
                        <Form.Item
                                noStyle
                                shouldUpdate={(prevValues, currentValues) => prevValues.isForAllCommunities !== currentValues.isForAllCommunities}
                            >
                                {({ getFieldValue }) => getFieldValue('isForAllCommunities') == false ? (
                                    <>
                                        <Form.Item
                                            label="Community"
                                            name="ids"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: 'Selecting communities is required'
                                                }
                                            ]}
                                        >
                                            <Select {...communitySelectProps} placeholder="Filter by community" allowClear mode="multiple" />
                                        </Form.Item>
                                    </>)
                                    : null}
                        </Form.Item>
                    </>
                    }
                </Col>
            </Row>
        </Form>
    )
}