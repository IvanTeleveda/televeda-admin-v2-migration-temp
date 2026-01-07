import {
    Form,
    Input,
    Select,
    Row,
    Col,
    InputNumber
} from "@pankod/refine-antd";
import { ICommunity, UserPermissions } from "../../interfaces";
import Constants from "../../typings/constants";
import { TelevedaCreate } from "../../components/page-containers/create";
import { useForm, useSelect } from "@refinedev/antd";
import { IResourceComponentsProps, useNavigation, usePermissions } from "@refinedev/core";

export interface ICreateUser {
    firstName: string;
    lastName: string;
    email: string;
    telephoneMobile: string;
    communityId: string;
}


export const UserCreate: React.FC<IResourceComponentsProps> = () => {
    const { list } = useNavigation();
    const { data: permissionsData } = usePermissions<UserPermissions>();

    const { formProps, saveButtonProps } = useForm<ICreateUser>({
        successNotification: (() => ({
            description: "Successful",
            message: `Successfully Created User`,
            type: "success"
        })),
        errorNotification: (error) => ({
            description: (error as any).message,
            message: `Error Creating User. `,
            type: "error"
        }),
        onMutationSuccess: () => {
            list(permissionsData === 'TelevedaAdmin' ? '_User' : 'community-associations/members');
        },
        redirect: false
    });

    const { selectProps: communitySelectProps } = useSelect<ICommunity>({
        resource: "community",
        optionLabel: "name",
        optionValue: "id",
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
    });


    return (
        <TelevedaCreate saveButtonProps={saveButtonProps} title="Create User">
            <Form {...formProps} layout="vertical" size="large">

                <Row gutter={{ xs: 0, lg: 0, xl: 36 }}>
                    <Col xl={12} lg={24} xs={24}>
                        <Form.Item
                            label={"First name"}
                            name="firstName"
                            rules={[
                                {
                                    required: true,
                                    message: "First name is required"
                                },
                                {
                                    validator: async (_, value) => {
                                        if (!value) return;

                                        const pattern = new RegExp('^[^;]+$')

                                        if (!!pattern.test(value)) {
                                            return Promise.resolve();
                                        } else {
                                            return Promise.reject(
                                                new Error("First name must not contain semicolons"),
                                            );
                                        }


                                    },
                                }
                            ]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>

                    <Col xl={12} lg={24} xs={24}>
                        <Form.Item
                            label={"Last name"}
                            name="lastName"
                            rules={[
                                {
                                    required: true,
                                    message: "Last name is required"
                                },
                                {
                                    validator: async (_, value) => {
                                        if (!value) return;

                                        const pattern = new RegExp('^[^;]+$')

                                        if (!!pattern.test(value)) {
                                            return Promise.resolve();
                                        } else {
                                            return Promise.reject(
                                                new Error("Last name must not contain semicolons"),
                                            );
                                        }


                                    },
                                }
                            ]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={{ xs: 0, lg: 0, xl: 36 }}>
                    <Col xl={12} lg={24} xs={24}>
                        <Form.Item
                            label={"Email"}
                            name="email"
                            rules={[
                                {
                                    required: true,
                                    type: "email",
                                    message: "The input is not valid e-mail!",
                                },
                            ]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>

                    <Col xl={12} lg={24} xs={24}>
                        <Form.Item
                            label={"Mobile phone"}
                            name="telephoneMobile"
                            rules={[
                                {
                                    pattern: new RegExp(/^\+[1-9]\d{10,14}$/),
                                    message: 'Please enter a valid phone number in E.164 format without any spaces.',
                                },
                            ]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>

                    <Col xl={12} lg={24} xs={24}>
                        <Form.Item
                            label="Assign to community"
                            name="communityId"
                            rules={[{ required: true, message: 'Please select community!' }]}
                        >
                            <Select {...communitySelectProps} placeholder="Select community" allowClear />
                        </Form.Item>
                    </Col>

                    <Col xl={12} lg={24} xs={24}>
                        <Form.Item
                            label="Hybrid attendance count"
                            name="countAs"
                        >
                            <InputNumber defaultValue={1} min={1} />
                        </Form.Item>
                    </Col>
                </Row>


            </Form>
        </TelevedaCreate>
    );
};
