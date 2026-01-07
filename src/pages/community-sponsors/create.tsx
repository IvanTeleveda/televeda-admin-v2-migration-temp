import { Form, Input } from '@pankod/refine-antd';
import React, { useContext } from 'react'
import { ICommunitySponsors } from '../../interfaces';
import { useForm } from '@refinedev/antd';
import { TelevedaCreate } from '../../components/page-containers/create';
import { UploadDragger } from '../../components/buttons/uploadDragger';
import { IResourceComponentsProps } from '@refinedev/core';
import { ColorModeContext } from '../../contexts/color-mode';

const CommunitySponsorCreate: React.FC<IResourceComponentsProps> = () => {

    const { formProps, saveButtonProps } = useForm<ICommunitySponsors>();

    const { TextArea } = Input;

    saveButtonProps.size = "large";

    const { mode } = useContext(ColorModeContext);

    return (
        <TelevedaCreate saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical" size="large">

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
                <Form.Item
                    label={"Email"}
                    name="email"
                    rules={[
                        {
                            type: "email",
                            required: true,
                        },
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label={"Logo"}
                    name="logo"
                    rules={[
                        {
                            required: true,
                        },
                    ]}
                >
                    <UploadDragger resultLogo={''} formProps={formProps} />
                </Form.Item>
                <ul style={{ margin:"1rem", color: mode === "light" ? "#001B36" : "#ffffff"}}>
                    <li>Supported files are PNG, JPG, PDF, and SVG.</li>
                    <li>Recommended size is 250 x 250 px.</li>
                </ul>
                <Form.Item
                    label={"Phone"}
                    name="phone"
                    rules={[
                        {
                            // required: true,
                        },
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label={"Site Link"}
                    name="siteLink"
                    rules={[
                        {
                            // required: true,
                        },
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label={"Sponsor Form"}
                    name="sponsorForm"
                    rules={[
                        {
                            // required: true,
                            validator(_, value) {
                                // check if the form has a 'source' param
                                const url = new URL(value);
                                if (!url.searchParams.has('source')) {
                                    url.searchParams.append("source", "televeda");
                                    formProps.form?.setFieldValue("sponsorForm",url.toString())
                                    return Promise.resolve();
                                }
                                return Promise.resolve();
                            },
                        },
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label={"Sponsor Info"}
                    name="sponsorInfo"
                >
                    <TextArea />
                </Form.Item>
            </Form>
        </TelevedaCreate>)
}


export default CommunitySponsorCreate