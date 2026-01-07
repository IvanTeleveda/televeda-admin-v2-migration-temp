import { HttpError, IResourceComponentsProps, useCreate, useDelete, useNavigation, useOne, useParsed } from "@refinedev/core";
import { Model, Serializer, UploadFilesEvent, ClearFilesEvent } from "survey-core";
import { surveyDefaultTheme } from "./defaultTheme";
import { Button, Card, Col, Form, Input, Row, Select, Switch } from "@pankod/refine-antd";
import { useEffect, useRef, useState } from "react";
import { Breadcrumb } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { PlusOutlined } from "@ant-design/icons";
import { Survey } from "survey-react-ui";
import { ICommunity, ISurveyAssociations } from "../../interfaces";
import Constants from "../../typings/constants";
import { useSelect } from "@refinedev/antd";
import { TelevedaShow } from "../../components/page-containers/show";

export enum SurveyRenderPages {
    ADMIN = "Admin Panel",
    PROFILE = "Profile Page",
    CLASS_SCHEDULE = "Class Schedule",
    COMMUNITY = "Community Page",
    EMAIL = "From Email Link",
}

export const SurveySubmissionsManualEntry: React.FC<IResourceComponentsProps> = () => {

    const { mutate } = useCreate();
    const { mutate: deleteMutate } = useDelete();

    const [form] = Form.useForm();

    const { selectProps } = useSelect<ICommunity>({
        resource: "Community",
        optionLabel: "name",
        optionValue: "id",
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
    });

    const { goBack } = useNavigation();

    const [currentSurvey, setCurrentSurvey] = useState<Model>();
    const surveyAllowCompleteRef = useRef(false);

    const { id: idFromRoute } = useParsed();

    const { data, isLoading } = useOne<ISurveyAssociations, HttpError>({
        resource: "surveys/associations",
        id: idFromRoute || "",
    });

    useEffect(() => {
        if (!isLoading) {
            const fileProps = Serializer.findProperty("file", "storeDataAsText");
            fileProps.defaultValue = false;
            fileProps.visible = false;

            const signatureStoreProps = Serializer.findProperty('signaturepad', 'storeDataAsText');
            const signatureWaitProps = Serializer.findProperty('signaturepad', 'waitForUpload');
            signatureStoreProps.defaultValue = false;
            signatureWaitProps.defaultValue = true;

            setCurrentSurvey(new Model(data?.data.survey.json));
        }
    }, [data]);

    useEffect(() => {
        if (currentSurvey) {
            currentSurvey.applyTheme(surveyDefaultTheme);

            currentSurvey.onUploadFiles.add((_, options) => uploadFile(options));
            currentSurvey.onClearFiles.add(async (_, options) => deleteFile(options));

            currentSurvey.onServerValidateQuestions.add((_, options) => validateForm(options));
            currentSurvey.onComplete.add((sender) => surveyComplete(sender));
        }
    }, [currentSurvey]);

    const validateForm = async ({ complete }: { data: Record<string, any>; errors: Record<string, string>; complete: () => void }) => {
        await form
            .validateFields()
            .then(() => {
                surveyAllowCompleteRef.current = true;
                complete();
            })
            .catch(() => {
                surveyAllowCompleteRef.current = false;
                complete();
            });
    };

    const deconstructUrl = (url: string) => {
        const bits = url.split('/');

        return {
            bucket: bits[1],
            mainFolder: bits[2],
            surveyId: bits[3],
            userId: bits[4],
            filename: bits[5]
        }
    }

    const toBase64 = (file: any) => 
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const split = reader.result?.toString().split(",");
                resolve(split?.at(1));
            };
            reader.onerror = reject;
        });

    const uploadFile = async (options: UploadFilesEvent) => {

        const date = new Date().toISOString();

        let formData = [];

        for(let file of options.files) {
            const encodedFile = await toBase64(file);
            formData.push({
                file: encodedFile,
                filename: options.question.getType() === 'signaturepad'? date + "-" + file.name : file.name,
                filetype: file.type || null,
                surveyId: idFromRoute
            })
        }

        mutate(
            {
                resource: "surveys/file-upload",
                values: {
                    formData
                },
                successNotification: false,
                errorNotification: false
            },
            {
                onSuccess(data: any) {
                    options.callback(
                        options.files.map((file: File) => {
                            return {
                                file: file,
                                name: options.question.getType() === 'signaturepad'? date + "-" + file.name : file.name,
                                content: data.data[options.question.getType() === 'signaturepad'? date + "-" + file.name : file.name][0]
                            };
                        })
                    );
                },
                onError() {
                    options.callback(
                        [],
                        ['Something went wrong. Files size cannot exceed 5 mb.']
                    )
                }
            }
        );
    };

    async function deleteMutation(path: string | null, options: ClearFilesEvent, fileName: string| null = null) {
        let name = null;

        if(fileName) {
            name = fileName;
        }
        else if (path) {
            const { filename } = deconstructUrl(path);
            name = filename;
        }
        else {
            currentSurvey?.getQuestionByName(options.question.name).addError("File could not be found");
            return;
        }

        try {
            deleteMutate(
                {
                    resource: `surveys/remove-file/${idFromRoute}`,
                    id: name!,
                    successNotification: false,
                    errorNotification: false
                },
                {
                    onSuccess() {
                        options.callback("success");
                    },
                    onError() {
                        options.callback("error");
                        currentSurvey?.getQuestionByName(options.question.name).addError("File deletion failed. Unauthorized");
                    }
                }
            );
        } catch (error) {
            console.error("Error while deleting file: ", error);
            options.callback("error");
        }
    }

    const deleteFile = async (options: ClearFilesEvent) => {
        if (!options.value || options.value.length === 0) {
            return options.callback("success");
        }

        //Erase all available files
        if (!options.fileName && !!options.value) {
            //For signature - could be only 1
            if(options.question.getType() === "signaturepad") {
                const url = new URL(options.value);
                await deleteMutation(decodeURIComponent(url.pathname), options)
            }
            //For files - potentially multiple files
            else {
                for (const item of options.value) {
                    const url = new URL(item.content);
                    await deleteMutation(decodeURIComponent(url.pathname), options);
                }
            }
        //Multi file upload - single file
        } else {
            const fileToRemove = options.value.find(
                (item: any) => item.name === options.fileName
            );
            if (fileToRemove) {
                await deleteMutation(null, options, options.fileName);
            } else {
                console.error(`File with name ${options.fileName} is not found`);
            }
        }
    }

    const surveyComplete = async (sender: Model) => {
        if (!surveyAllowCompleteRef.current) {
            currentSurvey!.clear(false, true);
            return;
        }

        mutate(
            {
                resource: "surveys/submission",
                values: {
                    json: { ...sender.data },
                    formId: idFromRoute,
                    caretakerSubmission: true,
                    sentFrom: SurveyRenderPages.ADMIN,
                    user: {
                        existingUser: form.getFieldValue("existingMember") || false,
                        firstName: form.getFieldValue("firstName"),
                        lastName: form.getFieldValue("lastName"),
                        communityId: form.getFieldValue("communityId"),
                        email: form.getFieldValue("email"),
                    },
                },
            },
            {
                onError: () => {
                    currentSurvey!.clear(false, true);
                },
            }
        );
    };

    return (
        <TelevedaShow title="Submission Manual Entry">
            {/* Disgusting refine bugs out breadcrumbs for custom pages so this stupidity is my best idea to fix it. */}
            <Row style={{ transform: "translate(-30px, -130px)" }} align={"middle"}>
                <Button type="text" icon={<ArrowLeftOutlined />} onClick={goBack} />
                <Breadcrumb>
                    <Breadcrumb.Item>Outreach</Breadcrumb.Item>
                    <Breadcrumb.Item>Survey</Breadcrumb.Item>
                    <Breadcrumb.Item>Show</Breadcrumb.Item>
                    <Breadcrumb.Item>Manual Entry</Breadcrumb.Item>
                </Breadcrumb>
            </Row>
            <Form size="large" layout="vertical" form={form}>
                <Card
                    title="Complete survey on behalf of"
                    extra={
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => window.open(window.location.origin + "/admin/all-accounts/create", "_blank")}>
                            Register new user
                        </Button>
                    }>
                    <Col span={24}>
                        <Form.Item name="existingMember" label="Existing member" valuePropName="checked">
                            <Switch checkedChildren="YES" unCheckedChildren="NO" />
                        </Form.Item>
                    </Col>

                    <Row gutter={{ xs: 0, lg: 0, xl: 36 }}>
                        <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.existingMember !== currentValues.existingMember} preserve={true}>
                            {({ getFieldValue }) =>
                                getFieldValue("existingMember") === true ? (
                                    <Col xl={12} lg={24} xs={24}>
                                        <Form.Item label="Email" name="email" rules={[{ required: true, type: "email" }]}>
                                            <Input type="email" />
                                        </Form.Item>
                                    </Col>
                                ) : (
                                    <>
                                        <Col xl={12} lg={24} xs={24}>
                                            <Form.Item label="First Name" rules={[{ required: true }]} name="firstName">
                                                <Input />
                                            </Form.Item>
                                        </Col>
                                        <Col xl={12} lg={24} xs={24}>
                                            <Form.Item label="Last Name" rules={[{ required: true }]} name="lastName">
                                                <Input />
                                            </Form.Item>
                                        </Col>
                                        <Col xl={12} lg={24} xs={24}>
                                            <Form.Item label="Choose Community" rules={[{ required: true, message: "At least one community required" }]} name="communityId">
                                                <Select {...selectProps} allowClear />
                                            </Form.Item>
                                        </Col>
                                    </>
                                )
                            }
                        </Form.Item>
                    </Row>
                </Card>
            </Form>
            {currentSurvey && <Survey model={currentSurvey} />}
        </TelevedaShow>
    );
};