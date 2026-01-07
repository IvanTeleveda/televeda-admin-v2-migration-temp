import { useState } from "react";
import {
    Form,
    Select,
    InputNumber,
    DatePicker,
} from "@pankod/refine-antd";
import { IPost, ICategory } from "../../interfaces";
import { Create, useForm, useSelect } from "@refinedev/antd";
import Constants from "../../typings/constants";
import { IResourceComponentsProps, useCreate } from "@refinedev/core";

const { Option } = Select;

export const ScheduledClassCreate: React.FC<IResourceComponentsProps> = () => {
    const [showCustomduration, setShowCustomduration] = useState<boolean>(false);

    const { formProps, saveButtonProps } = useForm<IPost>();

    const { selectProps: categorySelectProps } = useSelect<ICategory>({
        resource: "categories",
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
    });

    console.log("formProps:", formProps);

    const onGenderChange = (value: string) => {
        switch (value) {
            case 'male':
                formProps.form?.setFieldsValue({ title: 'Hi, man!' });
                return;
            case 'female':
                formProps.form?.setFieldsValue({ title: 'Hi, lady!' });
                return;
            case 'other':
                formProps.form?.setFieldsValue({ title: 'Hi there!' });
                return;
        }
    };

    const onDurationOptionsChange = (value: string) => {
        setShowCustomduration(value == 'custom');
    };

    const { mutate } = useCreate<any>();

    const onFinish = (values: any) => {
        console.log(values);

        mutate({
            resource: "categories",
            values: values
        });
    };

    return (
        <Create saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical" onFinish={onFinish}>


                <Form.Item name="classData" label="Class" rules={[{ required: true }]}>
                    <Select
                        placeholder="Select a class"
                        onChange={onGenderChange}
                        allowClear
                    >
                        <Option value="male">male</Option>
                        <Option value="female">female</Option>
                        <Option value="other">other</Option>
                    </Select>
                </Form.Item>

                <Form.Item name="startDateTime" label="Start date & time" rules={[{ required: true }]}>
                    <DatePicker showTime />
                </Form.Item>

                <Form.Item name="durationOptions" label="Duration in minutes" rules={[{ required: true }]}>
                    <Select
                        placeholder="Select duration"
                        allowClear
                        onChange={onDurationOptionsChange}
                    >
                        <Option value="30">30 min</Option>
                        <Option value="60">60 min</Option>
                        <Option value="90">90 min</Option>
                        <Option value="custom">Custom</Option>
                    </Select>
                </Form.Item>
                {
                    showCustomduration ?
                        <Form.Item
                            label={"Custom duration in minutes"}
                            name="customDuration"
                            rules={[
                                {
                                    required: true,
                                },
                            ]}
                        >
                            <InputNumber />
                        </Form.Item>
                        : null
                }
            </Form>
        </Create>
    );
};
