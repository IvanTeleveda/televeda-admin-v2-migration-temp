import { Button, Col, Form, Row, Select } from "@pankod/refine-antd";
import { IResourceComponentsProps, useCreate, useNavigation, usePermissions } from "@refinedev/core";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { ICommunity, ISurvey, UserPermissions } from "../../interfaces";
import Constants from "../../typings/constants";
import { SaveOutlined } from "@ant-design/icons";
import { surveyDefaultTheme } from "./defaultTheme";
import { TelevedaCreate } from "../../components/page-containers/create";
import { useSelect } from "@refinedev/antd";
import { Model } from "survey-react-ui";
import "./creator-style-overrides.css";
import "survey-creator-core/survey-creator-core.min.css";
import "survey-creator-core/survey-creator-core.i18n";
import "survey-core/survey.i18n.min.js";
import "survey-core/defaultV2.css"
import { SurveyCreator, SurveyCreatorComponent } from "survey-creator-react";
import { surveyLocalization } from 'survey-core'
import axios from "axios";
import { TRANSLATION_API_KEY } from "../../env";

export const SurveysCreate: React.FC<IResourceComponentsProps> = () => {
    const { mutate } = useCreate<ISurvey>();
    const [form] = Form.useForm();

    const { list } = useNavigation();

    const [surveyCreator, setSurveyCreator] = useState<SurveyCreator | null>(null);

    const { data: permissionsData } = usePermissions<UserPermissions>();

    const { selectProps: communitySelectProps } = useSelect<ICommunity>({
        resource: "Community",
        optionLabel: "name",
        optionValue: "id",
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
    });

    const { selectProps: eventSelectProps } = useSelect<{ id: string; title: string }>({
        resource: "scheduled-class/select",
        optionLabel: "title",
        optionValue: "id",
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
    });

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

    useMemo(() => {
        if (permissionsData === "TelevedaAdmin" && communitySelectProps.options?.at(0)?.value !== 'all') {
            communitySelectProps.options?.unshift({
                label: 'All',
                value: 'all'
            })
        }

    }, [communitySelectProps, permissionsData]);

    useEffect(() => {

        const creatorOptions = {
            showLogicTab: true,
            isAutoSave: false,
            showThemeTab: true,
            showTranslationTab: true,
            clearTranslationsOnSourceTextChange: true
        };

        setSurveyCreator(new SurveyCreator(creatorOptions));
    }, []);

    useMemo(() => {
        if (surveyCreator) {
            surveyLocalization.supportedLocales = ["en", "es"];
            surveyCreator.theme = surveyDefaultTheme as any;

            surveyCreator.saveSurveyFunc = async (saveNo: "no" | "yes", callback: (saveNo: "no" | "yes", arg: boolean) => any) => {

                const survey = new Model(surveyCreator.JSON);

                const questions = survey.getAllQuestions(false, false, false);
                const questionsArr = questions.map(question => question.name);

                try {
                    await form.validateFields();
                } catch (error: unknown) {
                    callback(saveNo, false);
                    return;
                }

                const scheduledClassIds = form.getFieldValue('renderValues')?.includes('feedback') ? form.getFieldValue('scheduledClassIds') : null;
                const communityIds = form.getFieldValue('renderValues')?.includes('feedback') ? null : form.getFieldValue('communityIds');

                mutate(
                    {
                        resource: "surveys",
                        values: {
                            json: JSON.stringify(surveyCreator.JSON),
                            communityIds,
                            scheduledClassIds,
                            renderValues: form.getFieldValue('renderValues'),
                            name: surveyCreator.JSON.title || "Untitled survey",
                            questionsArr
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

    return (
        <TelevedaCreate footerButtons={<></>}>
            <Form layout="vertical" form={form}>
                <Row gutter={[16, 16]}>
                    <Col lg={12} sm={24}>
                        <Form.Item label="Choose where to render the survey" rules={[{ required: true, message: 'Field is required' }]} name="renderValues">
                            <Select mode="multiple" onChange={handleRenderTypeChange} options={[
                                {
                                    label: 'HIPAA Compliant',
                                    options: [{
                                        label: 'Email',
                                        value: 'email'
                                    },
                                    {
                                        label: 'Onboarding',
                                        value: 'onboarding'
                                    }]
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
        </TelevedaCreate>
    );
};
