import { Form, Input, Select, FormProps, SaveButtonProps, SaveButton, Button, SelectProps, Space, Tag } from "@pankod/refine-antd";
import { SnippetsOutlined } from '@ant-design/icons';
import { useContext, useEffect, useState } from "react";
import dayjs from "dayjs";
import type { CustomTagProps } from 'rc-select/lib/BaseSelect';
import { IClassCategory, IClassSessionEventArchives, ICommunity, IOnDemandClass } from "../../interfaces";
import Constants from "../../typings/constants";
import { TelevedaEdit } from "../../components/page-containers/edit";
import { TelevedaCreate } from "../../components/page-containers/create";
import { useSelect } from "@refinedev/antd";
import { HttpError, useCreate, useList } from "@refinedev/core";
import { ColorModeContext } from "../../contexts/color-mode";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { ClassicEditor } from "ckeditor5";
import editorConfig from "../../utils/editorConfig";
import { CkEditorFirebaseUploadAdapter } from "../../adapters/CkEditorFirebaseUploadAdapter";

const { Option, OptGroup } = Select;
const { TextArea } = Input;

export const OnDemandClassForm: React.FC<{
    action: "edit" | "create",
    saveButtonProps: SaveButtonProps,
    formProps: FormProps
}> = ({ action, saveButtonProps, formProps }) => {

    const { selectProps: templateSelectProps, query: templateQueryResult } = useSelect<any>({
        resource: "on_demand_classes/template",
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
    });

    const [isUploading, setIsUploading] = useState(false);

    const { mutate: createTemplate } = useCreate<IOnDemandClass>();

    const [templateErrorMessages, setTemplateErrorMessages] = useState<string[]>([]);

    const [templateErrorMsgCheck, setTemplateErrorMsgCheck] = useState<boolean>(false);

    const [templateSearchValue, setTemplateSearchValue] = useState<string>('');

    const filteredTemplateOptions = templateSelectProps.options?.filter((option: any) => {
        if (!templateSearchValue) return true;
        return option.label?.toLowerCase().includes(templateSearchValue.toLowerCase());
    }) || [];

    const checkCanCreateTemplate = async (check: boolean = false) => {

        let returnFunction = false;

        if (templateErrorMsgCheck || check) {
            await formProps.form?.validateFields(['title', 'communityId', 'classImage', 'categoryId', 'instructorImage', 'visibilityType'])
                .then(() => {
                    setTemplateErrorMessages([]);
                })
                .catch(() => {
                    returnFunction = true;

                    const errorArr = formProps.form?.getFieldsError(['title', 'communityId', 'classImage', 'categoryId', 'instructorImage', 'visibilityType']);

                    let errorList: any = []
                    errorArr?.forEach((error) => {
                        if (error.errors.length > 0) {
                            errorList.push(error.errors);
                        }
                    });

                    const errors = errorList.flat();
                    const createTemplateErrorMsg = errors.map((err: string) => {
                        return err + " to create template.";
                    })
                    setTemplateErrorMessages(createTemplateErrorMsg);
                })
        }
        return returnFunction;
    }

    const createTemplateFunction = async () => {

        setTemplateErrorMsgCheck(true);
        const fields = formProps.form?.getFieldsValue();
        console.log('fields: ', fields)
        const returnFunction = await checkCanCreateTemplate(true);

        if (returnFunction) {
            return;
        }

        createTemplate({
            successNotification: (() => ({
                description: "Successful",
                message: `Successfully created on demand template`,
                type: "success"
            })),
            resource: "on_demand_classes/template",
            values: {
                title: fields.title,
                classImage: fields.classImage,
                instructorImage: fields.instructorImage,
                categoryId: fields.categoryId,
                visibilityType: fields.visibilityType,
                summary: fields.summary,
                description: fields.description,
                communityId: fields.communityId,
            }
        });
        setTemplateErrorMsgCheck(false);
        setTemplateErrorMessages([]);
    }

    const selectedTemplateChanged = (value: string) => {

        const currentlySelectedTemplate: IOnDemandClass = templateQueryResult.data?.data?.filter((res) => value === res.id)[0]
        if (currentlySelectedTemplate) {

            formProps.form?.setFieldsValue({
                title: currentlySelectedTemplate.title,
                classImage: currentlySelectedTemplate.classImage,
                instructorImage: currentlySelectedTemplate.instructorImage,
                categoryId: currentlySelectedTemplate.categoryId,
                visibilityType: currentlySelectedTemplate.visibilityType,
                summary: currentlySelectedTemplate.summary,
                description: currentlySelectedTemplate.description || undefined,
                //communityId: fields.communityId,
            })
        }

        setTemplateErrorMsgCheck(false);
        setTemplateErrorMessages([]);
    }

    return (
        action === "edit" ?
            <TelevedaEdit footerButtons={() => (
                <>
                    <Button icon={<SnippetsOutlined />} onClick={() => createTemplateFunction()} type="primary">Create Template</Button>
                    <SaveButton style={isUploading ? { background: '#ECEFF2' } : {}} disabled={isUploading} {...saveButtonProps} ></SaveButton>
                </>
            )} title="Edit On-demand class">
                <FormComponent
                    action={action}
                    formProps={formProps}
                    templateSelectProps={templateSelectProps}
                    selectedTemplateChanged={selectedTemplateChanged}
                    checkCanCreateTemplate={checkCanCreateTemplate}
                    templateErrorMessages={templateErrorMessages}
                    setIsUploading={setIsUploading}
                    templateSearchValue={templateSearchValue}
                    setTemplateSearchValue={setTemplateSearchValue}
                    filteredTemplateOptions={filteredTemplateOptions}
                />
            </TelevedaEdit>
            :
            <TelevedaCreate footerButtons={() => (
                <>
                    <Button icon={<SnippetsOutlined />} onClick={() => createTemplateFunction()} type="primary">Create Template</Button>
                    <SaveButton style={isUploading ? { background: '#ECEFF2' } : {}} disabled={isUploading} {...saveButtonProps} ></SaveButton>
                </>
            )} title="Create On-demand class">
                <FormComponent
                    action={action}
                    formProps={formProps}
                    templateSelectProps={templateSelectProps}
                    selectedTemplateChanged={selectedTemplateChanged}
                    checkCanCreateTemplate={checkCanCreateTemplate}
                    templateErrorMessages={templateErrorMessages}
                    setIsUploading={setIsUploading}
                    templateSearchValue={templateSearchValue}
                    setTemplateSearchValue={setTemplateSearchValue}
                    filteredTemplateOptions={filteredTemplateOptions}
                />
            </TelevedaCreate>
    )
}

const FormComponent: React.FC<{
    action: "edit" | "create",
    formProps: FormProps;
    templateSelectProps: SelectProps;
    selectedTemplateChanged: (value: string) => void;
    checkCanCreateTemplate: (check?: boolean) => Promise<boolean>;
    templateErrorMessages: Array<string>
    setIsUploading: (isUploading: boolean) => void;
    templateSearchValue: string;
    setTemplateSearchValue: (value: string) => void;
    filteredTemplateOptions: any[];
}> = ({ action, formProps, templateSelectProps, selectedTemplateChanged, checkCanCreateTemplate, templateErrorMessages, setIsUploading, templateSearchValue, setTemplateSearchValue, filteredTemplateOptions }) => {

    const { mode } = useContext(ColorModeContext);

    const { selectProps: communitySelectProps } = useSelect<ICommunity>({
        resource: "Community",
        optionLabel: 'name',
        optionValue: 'id',
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
        sort: [
            { field: "name", order: 'asc' }
        ],
        filters: [{
            field: "includeHosted",
            operator: "eq",
            value: "true"
        }]
    });

    const { data, isLoading, isError } = useList<IClassSessionEventArchives, HttpError>({
        resource: "on_demand_classes/archives",
    });

    const [selectOptions, setSelectOptions] = useState<any>(null);

    useEffect(() => {
        const options = data?.data?.map(item => {
            return { label: `${item.className && item.className?.length > 45 ? item.className?.substring(0, 45) + '...' : item.className} - ${dayjs(item.classScheduledFor).format('MMMM DD YYYY - hh:mm A')} | Recording: ${dayjs(item.archive.timestamp).format('MMMM DD YYYY - hh:mm A')}`, value: item.archive?.url }
        })
        setSelectOptions(options);
    }, [isLoading]);

    const selectOnChange = (value: any) => {
        checkCanCreateTemplate();

        formProps.form?.setFieldValue('externalUrl', value.pop());
    }

    const tagRender = (props: CustomTagProps) => {
        const { label, closable, onClose } = props;
        const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
            event.preventDefault();
            event.stopPropagation();
        };
        return (
            <Tag
                onMouseDown={onPreventMouseDown}
                closable={closable}
                onClose={onClose}
                style={{ marginRight: 3, wordBreak: 'break-all' }}
            >
                {label}
            </Tag>
        );
    };

    const { selectProps: categorySelectProps } = useSelect<IClassCategory>({
        resource: "class-categories",
        optionLabel: 'title',
        optionValue: 'id',
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
        filters: [{
            field: "includeHosted",
            operator: "eq",
            value: "true"
        }]
    });

    return (
        <Form {...formProps} layout="vertical" size="large">

            {action === "create" && <Form.Item
                label={"Template"}
                name="template"
            >
                <Select
                    {...templateSelectProps}
                    options={filteredTemplateOptions}
                    showSearch
                    onSearch={setTemplateSearchValue}
                    filterOption={false}
                    onChange={(value: any) => selectedTemplateChanged(value)}
                    placeholder="Optional: Choose template"
                />
            </Form.Item>}

            <Form.Item
                label={"Title"}
                name="title"
                rules={[
                    {
                        required: true,
                        message: 'Title is required'
                    },
                    {
                        max: 80,
                        message: "Event name is too long"
                    }
                ]}
            >
                <Input onChange={() => checkCanCreateTemplate()} />
            </Form.Item>

            <Form.Item
                label="Assign to community"
                name="communityId"
                rules={[{ required: true, message: 'Please select community' }]}
            >
                <Select onChange={() => checkCanCreateTemplate()}
                    {...communitySelectProps}
                    placeholder="Select community"
                    allowClear
                />
            </Form.Item>

            <Form.Item
                label={"Category"}
                name={"categoryId"}
                rules={[
                    {
                        required: true,
                        message: 'Category is required'
                    },
                ]}
            >
                <Select
                    onChange={() => checkCanCreateTemplate()}
                    getPopupContainer={() => document.getElementById('drawerForm') || document.body}
                    {...categorySelectProps}
                    placeholder="Please select event category"
                />
            </Form.Item>

            <Form.Item name="summary" label="Class Summary" rules={[]}>
                <TextArea placeholder="2-sentence description" rows={2} maxLength={250} />
            </Form.Item>

            <Form.Item
                name="description"
                rules={[]}
                label="Class Description"
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

            <Form.Item
                label="Video URL or Event Recording"
                name="externalUrl"
                rules={[
                    {
                        validator: async () => {
                            const value = formProps.form?.getFieldValue('externalUrl')
                            console.log("validator", value);

                            if (!value) return Promise.reject(
                                new Error("Video URL is required"),
                            );

                            const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
                                '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
                                '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
                                '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
                                '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
                                '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator

                            if (!!pattern.test(value)) {
                                return Promise.resolve();
                            } else {
                                return Promise.reject(
                                    new Error("Please enter a valid Url!"),
                                );
                            }
                        },
                    }
                ]}
            >
                <Select
                    options={selectOptions}
                    maxTagTextLength={120}
                    filterOption={(input, option) => (option?.label ?? '').toString().toLocaleLowerCase().includes(input.toLocaleLowerCase())}
                    mode="tags"
                    onChange={(value) => selectOnChange(value)}
                    placeholder="Select Video"
                />
            </Form.Item>

            <ul style={{ margin: "1rem", color: mode === "light" ? "#001B36" : "#ffffff" }}>
                <strong>Supported URLs examples:</strong>
                <li>Youtube: "https://www.youtube.com/watch?v=VideoID" & "https://youtu.be/VideoID"</li>
                <li>Vimeo: "https://vimeo.com/VideoID"</li>
                <li>Direct Video links: "https://my-site.com/video.mp4"</li>
            </ul>

            <Form.Item
                label="Event visibility"
                name="visibilityType"
                rules={[{ required: true, message: 'Event visibility is required' }]}
                initialValue={'community'}
            >
                <Select
                    onChange={() => checkCanCreateTemplate()}
                    getPopupContainer={() => document.getElementById('drawerForm') || document.body}
                    placeholder="Please select visibility type"
                    defaultValue={"community"}
                >
                    <Option value="community">Only Community</Option>
                    <Option value="public">Entire Network</Option>
                    <Option value="hidden">Hidden</Option>
                </Select>
            </Form.Item>
            <Space direction="vertical" style={{ color: '#fa541c', lineHeight: '8px' }}>
                {templateErrorMessages}
            </Space>
        </Form>
    )
}