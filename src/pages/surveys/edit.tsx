import { Button, Col, Form, Modal, Row, Select } from "@pankod/refine-antd";
import { HttpError, IResourceComponentsProps, useNavigation, useOne, useParsed, usePermissions, useUpdate } from "@refinedev/core";
import { useEffect, useMemo, useState } from "react";
import { ICommunity, ISurvey, ISurveyAssociations } from "../../interfaces";
import { useSelect } from "@refinedev/antd";
import Constants from "../../typings/constants";
import { SaveOutlined } from "@ant-design/icons";
import { TelevedaEdit } from "../../components/page-containers/edit";
import dayjs from "dayjs";
import { surveyDefaultTheme } from "./defaultTheme";
import { Model } from "survey-react-ui";
import "./creator-style-overrides.css";
import "survey-creator-core/survey-creator-core.min.css";
import "survey-creator-core/survey-creator-core.i18n";
import "survey-core/survey.i18n.min.js";
import "survey-core/defaultV2.css"
import { SurveyCreator, SurveyCreatorComponent } from "survey-creator-react";
import { Serializer } from "survey-core";
import { surveyLocalization } from 'survey-core'
import axios from "axios";

const TRANSLATION_API_KEY = import.meta.env.VITE_TRANSLATION_API_KEY;

export const SurveysEdit: React.FC<IResourceComponentsProps> = () => {
    const { mutate } = useUpdate<ISurvey>();
    const [form] = Form.useForm();

    const [confirmationModal, setConfirmationModal] = useState<boolean>(false);
    const [saveModel, setSaveModel] = useState<{
        saveNo: "no" | "yes",
        callback: (saveNo: "no" | "yes", arg: boolean) => any,
        questionsArr: string[]
    }>();

    const { list } = useNavigation();

    const [surveyCreator, setSurveyCreator] = useState<SurveyCreator | null>(null);

    const { data: permissionsData } = usePermissions();

    const { id: idFromRoute } = useParsed();

    const [formRendered, setFormRendered] = useState(false);

    const { data, isLoading, refetch } = useOne<ISurveyAssociations, HttpError>({
        resource: "surveys/associations",
        id: idFromRoute || "",
    });

    const { selectProps: communitySelectProps } = useSelect<ICommunity>({
        resource: "Community",
        optionLabel: "name",
        optionValue: "id",
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
    });

    const { selectProps: eventSelectProps, query: { refetch: refetchEvents } } = useSelect<{ id: string; title: string }>({
        resource: `scheduled-class/select`,
        optionLabel: "title",
        optionValue: "id",
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
        //used for custom order ...yeah
        filters: [
            {
                field: 'topIds',
                operator: 'in',
                value: form.getFieldValue('scheduledClassIds')
            }
        ],
        queryOptions: {
            enabled: formRendered
        }
    });

    useMemo(() => {
        if (permissionsData === "TelevedaAdmin" && communitySelectProps.options?.at(0)?.value !== 'all') {
            communitySelectProps.options?.unshift({
                label: 'All',
                value: 'all'
            })
        }

    }, [communitySelectProps, permissionsData]);

    useMemo(() => {
        if (eventSelectProps.options && eventSelectProps.options.length > 0) {
            eventSelectProps.options = eventSelectProps.options.map((option) => {
                const labelParts = (option.label as string).split(',');
                const labelText = labelParts[0];
                const labelDate = dayjs(labelParts[1]).format("LLL");
                return {
                    label: labelText + " ( Created at: " + labelDate + " )",
                    value: option.value
                }
            })
        }
    }, [eventSelectProps]);

    const handleRenderTypeChange = (value: string[]) => {
        if (value[value.length - 1] === 'feedback') {
            form.setFieldValue('renderValues', ['feedback']);
        }
        else if (value.includes('feedback')) {
            const feedbackValIndex = value.indexOf('feedback');
            if (feedbackValIndex > -1) {
                value.splice(feedbackValIndex, 1);
            }
            form.setFieldValue('renderValues', value);
        }
        else {
            form.setFieldValue('renderValues', value);
        }
    }

    useEffect(() => {

        if (!isLoading) {

            const isSystemSurvey = data?.data.survey.systemSurvey;

            const creatorOptions = {
                isAutoSave: false,
                showLogicTab: !isSystemSurvey,
                showJSONEditorTab: !isSystemSurvey,
                showDesignerTab: !isSystemSurvey,
                showTranslationTab: !isSystemSurvey,
                clearTranslationsOnSourceTextChange: !isSystemSurvey
            };

            setSurveyCreator(new SurveyCreator(creatorOptions));
        }
    }, [data]);

    useEffect(() => {

        if (!isLoading && data) {

            const surveyData: ISurveyAssociations = data.data;

            form.setFieldValue(
                "communityIds",
                surveyData.communityAssociations?.map((assoc) => assoc.communityId || 'all')
            );

            form.setFieldValue(
                "scheduledClassIds",
                surveyData.scheduledClassAssociations?.map((assoc) => assoc.scheduledClassId)
            );

            form.setFieldValue("renderValues", surveyData.surveyRenders?.map((render) => render.render_at));

            if (surveyCreator) {
                surveyCreator.text = surveyData.survey.json;
                setFormRendered(true);
            }
        }

    }, [data, surveyCreator]);

    const handleOkConfirmation = () => {
        if(saveModel) {
            editSurvey(saveModel.saveNo, saveModel.callback, saveModel.questionsArr)
        }
        setSaveModel(undefined);
        setConfirmationModal(false);
    }

    const handleCancelConfirmation = () => {
        setSaveModel(undefined);
        setConfirmationModal(false);
    }

    const editSurvey = async (saveNo: "no" | "yes", callback: (saveNo: "no" | "yes", arg: boolean) => any, questionsArr: string[]) => {
        try {
            await form.validateFields();
        } catch (error: unknown) {
            callback(saveNo, false);
            return;
        }

        const scheduledClassIds = form.getFieldValue('renderValues')?.includes('feedback') ? form.getFieldValue('scheduledClassIds') : null;
        const communityIds = form.getFieldValue('renderValues')?.includes('feedback') ? null : form.getFieldValue('communityIds');

        if (idFromRoute) {
            mutate(
                {
                    resource: "surveys",
                    id: idFromRoute,
                    values: {
                        json: JSON.stringify(surveyCreator!.JSON),
                        communityIds,
                        scheduledClassIds,
                        renderValues: form.getFieldValue('renderValues'),
                        name: surveyCreator!.JSON.title || "Untitled survey",
                        questionsArr: questionsArr
                    },
                },
                {
                    onSuccess: () => {
                        callback(saveNo, true);
                        list('surveys');
                    },
                    onError: () => {
                        callback(saveNo, false);
                    },
                }
            );
        }
    }

    useMemo(() => {
        if (surveyCreator) {
            surveyLocalization.supportedLocales = ["en", "es"];
            surveyCreator.theme = surveyDefaultTheme as any;

            const prop = Serializer.findProperty("file", "storeDataAsText");
            prop.defaultValue = false;
            prop.visible = false;

            surveyCreator.saveSurveyFunc = async (saveNo: "no" | "yes", callback: (saveNo: "no" | "yes", arg: boolean) => any) => {

                const survey = new Model(surveyCreator.JSON);
                const existingModel = new Model(data?.data.survey.json);

                const newQuestions = survey.getAllQuestions(false, false, false);
                const newQuestionsArr = newQuestions.map(question => question.name);

                const existingQuestions = existingModel.getAllQuestions(false, false, false);
                const existingQuestionsArr = existingQuestions.map(question => question.name);

                let updateMetadata = false

                if (existingQuestionsArr.length === newQuestionsArr.length) {
                    updateMetadata = !existingQuestionsArr.every((question) => {
                        if (newQuestionsArr.includes(question)) {
                            return true
                        }
                        return false
                    })
                }
                else {
                    updateMetadata = true;
                }


                if (updateMetadata && data?.data.hasEntries) {
                    setConfirmationModal(true);
                    setSaveModel({
                        saveNo,
                        callback,
                        questionsArr: newQuestionsArr
                    });
                }
                else {
                    editSurvey(saveNo, callback, newQuestionsArr);
                }
            };

            surveyCreator.onMachineTranslate.add((_, options) => {
                const url = `https://translation.googleapis.com/language/translate/v2?key=${TRANSLATION_API_KEY}`;

                axios.post(url, {
                    q: options.strings,
                    target: options.toLocale,
                    format: 'text'
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then((response) => {
                    const data = response.data;
                    const apiTranslations: { translatedText: string }[] = data?.data.translations;
                    const translatedTexts = apiTranslations.map(translation => translation.translatedText);
                    //@ts-ignore
                    surveyCreator.clearTranslationsOnSourceTextChange = false;
                    options.callback(translatedTexts);
                    //@ts-ignore
                    surveyCreator.clearTranslationsOnSourceTextChange = true;
                    const str = translatedTexts.length + " strings are translated"
                    surveyCreator.notify(str);
                }).catch((error) => {
                    options.callback([]);
                    console.error("Translation error: ", error);
                });
            });
        }
    }, [surveyCreator]);


    return (
        <TelevedaEdit footerButtons={<></>}>
            <Form layout="vertical" form={form}>
                <Row gutter={[16, 16]}>
                    <Col lg={12} sm={24}>
                        <Form.Item label="Choose where to render the survey" rules={[{ required: true, message: 'Field is required' }]} name="renderValues">
                            <Select disabled={data?.data.survey.systemSurvey} mode="multiple" onChange={handleRenderTypeChange} options={[
                                {
                                    label: 'HIPAA Compliant',
                                    options: [{
                                        label: 'Email',
                                        value: 'email'
                                    },
                                    {
                                        label: 'Onboarding',
                                        value: 'onboarding'
                                    },]
                                },
                                {
                                    label: 'Other',
                                    options: [{
                                        label: 'Feedback',
                                        value: 'feedback'
                                    }]
                                }
                            ]} />
                        </Form.Item>
                    </Col>
                    <Col lg={12} sm={24}>
                        <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, currentValues) => prevValues.renderValues !== currentValues.renderValues}
                            preserve={true}
                        >
                            {({ getFieldValue }) =>
                                getFieldValue('renderValues') ? (
                                    !getFieldValue('renderValues').includes('feedback') ? (
                                        <Form.Item
                                            label="Choose Communities"
                                            name="communityIds"
                                            rules={[{ required: true, message: 'At least one community is required' }]}
                                        >
                                            <Select {...communitySelectProps} mode="multiple" allowClear />
                                        </Form.Item>
                                    ) : (
                                        <Form.Item
                                            label={<span>Choose Events ( <i>Excludes VTC</i> )</span>}
                                            name="scheduledClassIds"
                                            rules={[{ required: true, message: 'At least one event is required' }]}
                                        >
                                            <Select {...eventSelectProps} mode="multiple" allowClear />
                                        </Form.Item>
                                    )
                                ) :
                                    null
                            }
                        </Form.Item>
                    </Col>
                </Row>
            </Form>

            <Modal
                title="Confirmation required"
                open={confirmationModal}
                onOk={handleOkConfirmation}
                okText="Yes"
                onCancel={handleCancelConfirmation}
            >
                The current survey has member submissions. Changing the structure would result in a new version. Are you sure you wish to proceed?
            </Modal>

            {surveyCreator &&
                <div style={{ height: 1200 }}>
                    <SurveyCreatorComponent creator={surveyCreator} />
                </div>
            }
            <Button
                icon={<SaveOutlined />}
                type="primary"
                size="large"
                style={{ float: "right", marginTop: 40, paddingInline: 30 }}
                onClick={() => surveyCreator && surveyCreator.doSave()}>
                Save
            </Button>
        </TelevedaEdit>
    );
};
