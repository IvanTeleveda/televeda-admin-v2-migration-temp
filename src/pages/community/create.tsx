import { useContext, useState } from "react";
import {
    Form,
    Input,
    Select,
    Row,
    Col,
    Switch,
    Typography
} from "@pankod/refine-antd";
import { ICommunity, ICommunitySponsors, UserPermissions } from "../../interfaces";
import { TelevedaCreate } from "../../components/page-containers/create";
import { useForm, useSelect } from "@refinedev/antd";
import { IResourceComponentsProps, useNavigation, usePermissions } from "@refinedev/core";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { ClassicEditor } from "ckeditor5";
import editorConfig from "../../utils/editorConfig";
import { CkEditorFirebaseUploadAdapter } from "../../adapters/CkEditorFirebaseUploadAdapter";
import { ColorModeContext } from "../../contexts/color-mode";
import { UploadDragger } from "../../components/buttons/uploadDragger";

export const CommunityCreate: React.FC<IResourceComponentsProps> = () => {
    const { data: permissionsData } = usePermissions<UserPermissions>();

    const { list } = useNavigation();
    const [isUploading, setIsUploading] = useState(false);

    const { mode } = useContext(ColorModeContext);

    const { formProps, saveButtonProps } = useForm<ICommunity>({
        resource: permissionsData === 'TelevedaAdmin' ? 'Community' : 'community-associations/community/createAndSelfAssign',
        redirect: false,
        onMutationSuccess: () => {
            list('community');
        }
    });

    const { selectProps } = useSelect<ICommunitySponsors>({
        resource: "community-sponsors",
        optionLabel: "name",
        queryOptions: {
            enabled: permissionsData === 'TelevedaAdmin'
        }
    })

    saveButtonProps.size = "large";

    return (
        <TelevedaCreate title="Create Community" saveButtonProps={{ ...saveButtonProps, disabled: isUploading }}>
            <Form {...formProps} layout="vertical" size="large">

                <Row gutter={{ xs: 0, lg: 0, xl: 36 }}>

                    <Col xl={12} lg={24} xs={24}>
                        <Form.Item
                            label={"Name"}
                            name="name"
                            rules={[
                                {
                                    required: true,
                                },
                            ]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>

                    <Col xl={12} lg={24} xs={24}>
                        <Form.Item
                            label={"Display Name"}
                            name="displayName"
                        >
                            <Input />
                        </Form.Item>
                    </Col>

                </Row>

                <Row gutter={{ xs: 0, lg: 0, xl: 36 }}>
                    {true ?

                        <Col xl={12} lg={24} xs={24}>
                            <Form.Item label="Sponsor" name="sponsorId">
                                <Select {...selectProps} allowClear />
                            </Form.Item>
                        </Col>
                        : <></>
                    }

                    <Col xl={12} lg={24} xs={24}>
                        <Form.Item
                            label={"Community Logo"}
                            name="logo"
                        >
                            <ul style={{ margin: "1rem", color: mode === "light" ? "#001B36" : "#ffffff" }}>
                                <li>Supported files are PNG, JPG, PDF, and SVG.</li>
                                <li>Recommended size is 250 x 100 px.</li>
                            </ul>
                            <UploadDragger resultLogo={''} formProps={formProps} />
                        </Form.Item>
                    </Col>

                    <Col xl={12} lg={24} xs={24}>
                        <Col span={18}>
                            <Typography.Text>
                                Make my Community Visible to the Public to Join
                            </Typography.Text>
                        </Col>
                        <Form.Item
                            style={{ height: 0 }}
                            name="isPublic"
                            valuePropName="checked"
                            initialValue={true}
                        >
                            <Switch checkedChildren="YES" unCheckedChildren=" NO" style={{ float: "right", marginRight: 20, marginTop: -42 }} />
                        </Form.Item>
                        <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, currentValues) => prevValues.isPublic !== currentValues.isPublic}
                            preserve={true}
                        >
                            {({ getFieldValue }) =>
                                getFieldValue('isPublic') === true &&
                                <>
                                    <Col span={18}>
                                        <Typography.Text>
                                            Allow Members to Join This Community Without Approval
                                        </Typography.Text>
                                    </Col>
                                    <Form.Item
                                        style={{ height: 0 }}
                                        name="autoJoin"
                                        valuePropName="checked"
                                        initialValue={true}
                                    >
                                        <Switch checkedChildren="YES" unCheckedChildren=" NO" style={{ float: "right", marginRight: 20, marginTop: -42 }} />
                                    </Form.Item>
                                </>
                            }
                        </Form.Item>
                        <Col span={18}>
                            <Typography.Text>
                                Allow recommendations for this community
                            </Typography.Text>
                        </Col>
                        <Form.Item
                            style={{ height: 0 }}
                            name="allowRecommendations"
                            valuePropName="checked"
                            initialValue={true}
                        >
                            <Switch checkedChildren="YES" unCheckedChildren=" NO" style={{ float: "right", marginRight: 20, marginTop: -42 }} />
                        </Form.Item>
                    </Col>

                </Row>

                <Row gutter={{ xs: 0, lg: 0, xl: 36 }}>

                    <Col xl={12} lg={24} xs={24}>
                        <Form.Item
                            label={"Address"}
                            name="address"
                        >
                            <Input />
                        </Form.Item>
                    </Col>

                    <Col xl={12} lg={24} xs={24}>
                        <Form.Item
                            label={"Zip Code"}
                            name="zipCode"
                        >
                            <Input />
                        </Form.Item>
                    </Col>

                </Row>

                <Row gutter={{ xs: 0, lg: 0, xl: 36 }}>

                    <Col xl={12} lg={24} xs={24}>
                        <Form.Item
                            label={"City"}
                            name="city"
                        >
                            <Input />
                        </Form.Item>
                    </Col>

                    <Col xl={12} lg={24} xs={24}>
                        <Form.Item
                            label={"Country"}
                            name="country"
                        >
                            <Input />
                        </Form.Item>
                    </Col>

                </Row>

                <Row gutter={{ xs: 0, lg: 0, xl: 36 }}>

                    <Col xl={24} lg={24} xs={24}>
                        <Form.Item
                            name="termsAndConditions"
                            rules={[]}
                            label="Terms and Conditions"
                            valuePropName='data'
                            getValueFromEvent={(event, editor) => {
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
                    </Col>

                </Row>
                <Row gutter={{ xs: 0, lg: 0, xl: 36 }}>
                    <Col>
                        <Typography.Text>
                            Terms and conditions required
                        </Typography.Text>
                    </Col>
                    <Form.Item
                        style={{ height: 0 }}
                        name="termsAndConditionsRequired"
                        valuePropName="checked"
                        initialValue={true}
                    >
                        <Switch checkedChildren="YES" unCheckedChildren="NO" style={{ marginTop: -15 }} />
                    </Form.Item>
                </Row>
            </Form>
        </TelevedaCreate>
    );
};
