import React from 'react';
import {
    Drawer,
    Form,
    Input,
    Button,
    Select, InputNumber,
    DrawerProps,
    FormProps,
    ButtonProps,
    Grid,
    Avatar
} from "@pankod/refine-antd";
import { DefaultFirebaseUploaderAdapter } from "../../adapters/DefaultFirebaseUploadAdapter";
import { IClassCategory } from "../../interfaces";
import { SaveButton, useSelect } from "@refinedev/antd";
import Constants from "../../typings/constants";

const { Option, OptGroup } = Select;
interface ClassCategoryDrawerProps {
    action: string;
    drawerProps: DrawerProps;
    formProps: FormProps;
    formLoading: boolean;
    saveButtonProps: ButtonProps;

}

export const ClassCategoryDrawer: React.FC<ClassCategoryDrawerProps> = ({
    action,
    drawerProps,
    formProps,
    formLoading,
    saveButtonProps
}) => {

    const { selectProps: classCategorySelectProps } = useSelect<IClassCategory>({
        resource: "class-categories",
        optionLabel: "title",
        optionValue: "id",
        filters: [
            {
                field: "parent_id",
                operator: "eq",
                value: null,
            },
        ],
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
    });

    const breakpoint = Grid.useBreakpoint();

    const handleImageUpload = async (req: any) => {
        const url: any = await new DefaultFirebaseUploaderAdapter(req).upload();
        const downloadUrl = url?.downloadURL;
        // setImageUrl(downloadUrl);
    };

    return (
        <Drawer
            {...drawerProps}
            loading={formLoading}
            width={breakpoint.sm ? "500px" : "100%"}
        >
            <Form
                {...formProps}
                layout="vertical"
            >
                <Form.Item
                    name="title"
                    label="Title"
                    rules={[{ required: true }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="parentId"
                    label="Parent Category"
                >
                    <Select placeholder="Select parent category"
                        {...classCategorySelectProps}
                    >

                    </Select>
                </Form.Item>

                <Form.Item
                    label={"Schedule Image"}
                    name={"classImage"}
                    rules={[
                        {
                            required: true,
                            message: "Schedule Image is required"
                        },
                    ]}
                >
                    <Select placeholder="Please select a class image" data-testid="schedule-select">
                        <Option value="general"><div><Avatar src="/televeda/img/class-schedule/classes/general.svg" />General Image</div></Option>
                        <Option value="art"><div><Avatar src="/televeda/img/class-schedule/classes/art.svg" />Art</div></Option>
                        <Option value="active"><div><Avatar src="/televeda/img/class-schedule/classes/active.svg" />Active</div></Option>
                        <Option value="book-club"><div><Avatar src="/televeda/img/class-schedule/classes/book-club.svg" />Book club</div></Option>
                        <Option value="cooking"><div><Avatar src="/televeda/img/class-schedule/classes/cooking.svg" />Cooking</div></Option>
                        <Option value="exercise"><div><Avatar src="/televeda/img/class-schedule/classes/exercise.svg" />Excercise</div></Option>
                        <Option value="gardening"><div><Avatar src="/televeda/img/class-schedule/classes/gardening.svg" />Gardening</div></Option>
                        <Option value="music"><div><Avatar src="/televeda/img/class-schedule/classes/music.svg" />Music</div></Option>
                        <Option value="social-games"><div><Avatar src="/televeda/img/class-schedule/classes/social-games.svg" />Social Games</div></Option>
                        <Option value="bingo"><div><Avatar src="/televeda/img/class-schedule/classes/bingo.svg" />Bingo</div></Option>
                        <Option value="dancing"><div><Avatar src="/televeda/img/class-schedule/classes/dancing.svg" />Dancing</div></Option>
                        <Option value="music-2"><div><Avatar src="/televeda/img/class-schedule/classes/music-2.svg" />Music 2</div></Option>
                        <Option value="general-2"><div><Avatar src="/televeda/img/class-schedule/classes/general-2.svg" />General Image 2</div></Option>
                        <Option value="online-games"><div><Avatar src="/televeda/img/class-schedule/classes/online-games.svg" />Online games</div></Option>
                        <Option value="support-group"><div><Avatar src="/televeda/img/class-schedule/classes/support-group.svg" />Support Group</div></Option>
                        <Option value="veteran-holding-token"><div><Avatar style={{ width: 20 }} src="/televeda/img/class-schedule/classes/veteran-holding-token.svg" />Veteran Holding Token</div></Option>
                        <Option value="vtc-veterans"><div><Avatar src="/televeda/img/class-schedule/classes/vtc-veterans.svg" />VTC Veterans</div></Option>
                        <Option value="vtc-computer"><div><Avatar src="/televeda/img/class-schedule/classes/vtc-computer.svg" />VTC Computer</div></Option>
                        <Option value="vtc-generic"><div><Avatar src="/televeda/img/class-schedule/classes/vtc-generic.svg" />VTC generic</div></Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    label={"Lobby Image"}
                    name={"instructorImage"}
                    rules={[
                        {
                            required: true,
                            message: "Lobby Image is required"
                        },
                    ]}
                >
                    <Select placeholder="Please select a class image" data-testid="lobby-select">
                        <Option value="social-gaming"><div><Avatar src="/televeda/img/class-schedule/class-instructor-icons/social-gaming.svg" />Social Gaming</div></Option>
                        <Option value="art"><div><Avatar src="/televeda/img/class-schedule/class-instructor-icons/art.svg" />Art</div></Option>
                        <Option value="bingo"><div><Avatar src="/televeda/img/class-schedule/class-instructor-icons/bingo.svg" />Bingo</div></Option>
                        <Option value="lifelong-learning"><div><Avatar src="/televeda/img/class-schedule/class-instructor-icons/lifelong-learning.svg" />Learning</div></Option>
                        <Option value="emotional-wellbeing"><div><Avatar src="/televeda/img/class-schedule/class-instructor-icons/emotional-wellbeing.svg" />Emotional Wellbeing</div></Option>
                        <Option value="physical-wellness"><div><Avatar src="/televeda/img/class-schedule/class-instructor-icons/physical-wellness.svg" />Physical Wellness</div></Option>
                        <Option value="sports"><div><Avatar src="/televeda/img/class-schedule/class-instructor-icons/sports.svg" />Sports</div></Option>
                        <Option value="veteran-support"><div><Avatar src="/televeda/img/class-schedule/class-instructor-icons/veteran-support.svg" />Veteran Support</div></Option>
                        <Option value="zentangle"><div><Avatar src="/televeda/img/class-schedule/class-instructor-icons/zentangle.svg" />Zentangle</div></Option>
                    </Select>
                </Form.Item>


                {/* <Form.Item
                    name="order"
                    label="Order"
                >
                    <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item> */}

                {/* <Form.Item label="Category Image">
                   <Upload
                       name="categoryImage"
                       customRequest={handleImageUpload}
                       showUploadList={false}
                   >
                       <Button icon={<UploadOutlined/>}>
                           Upload Image
                       </Button>
                   </Upload>

                   {imageUrl && (
                       <div style={{
                           marginTop: 16,
                           width: 150,
                           height: 150
                       }}>
                           <img
                               src={imageUrl}
                               alt="Category"
                               style={{
                                   width: '100%',
                                   height: '100%',
                                   objectFit: 'cover'
                               }}
                           />
                       </div>
                   )}
                </Form.Item> */}

                <SaveButton {...saveButtonProps} ></SaveButton>
            </Form>
        </Drawer>
    );
};