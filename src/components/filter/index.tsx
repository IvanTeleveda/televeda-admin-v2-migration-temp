import { Button, Col, Form, FormProps, Row, TextField } from "@pankod/refine-antd";
import { CrudFilters } from "@refinedev/core";
import dayjs from "dayjs";
import { forwardRef, JSX, MutableRefObject, useEffect, useImperativeHandle, useState } from "react";

const FilterFormWrapper: React.FC<{
    formProps: FormProps;
    filters: CrudFilters | undefined;
    filterButtonRef: MutableRefObject<{ hide(): void } | undefined>;
    fieldValuesNameRef: string[];
    filterValuesNameRef: string[];
    formElement: JSX.Element;
    syncWithLocation?: boolean;
    ref: any
}> = forwardRef(({
    formProps,
    filters,
    filterButtonRef,
    fieldValuesNameRef,
    filterValuesNameRef,
    formElement,
    syncWithLocation = false
}, ref) => {
    const [displayValidation, setDisplayValidation] = useState<string>("");
    const [filterClicks, setFilterClicks] = useState<number | undefined>(undefined);

    let fieldFilters: any = {}
    filters?.map((filter: any) => {
        fieldFilters[filter.field] = filter.value
    })

    useEffect(() => {
        if (syncWithLocation) {
            fieldValuesNameRef.forEach((value, index) => {
                let tempFilterVal = fieldFilters[filterValuesNameRef[index]];

                if (Array.isArray(tempFilterVal) && tempFilterVal.length === 2 && dayjs(tempFilterVal.at(0)).isValid()) {
                    const startDate = dayjs(tempFilterVal.at(0))
                    const endDate = dayjs(tempFilterVal.at(1))
                    tempFilterVal = [];
                    tempFilterVal[0] = startDate;
                    tempFilterVal[1] = endDate;
                }
                formProps.form?.setFieldValue(value, tempFilterVal)
            })
        }
    }, [])

    useImperativeHandle(ref, () => ({
        handleValidation,
        filterClicks
    }));

    const handleValidation = async (isSubmit: boolean = false) => {

        let flagHasContent = false;
        let flagContentChanged = false;
        let concatedString = "";

        fieldValuesNameRef.forEach((value, index) => {
            let tempFieldVal = formProps.form?.getFieldValue(value);
            let tempFilterVal = fieldFilters[filterValuesNameRef[index]];

            //Checks and assings field value from date range (dayjs)
            if (Array.isArray(tempFieldVal) && tempFieldVal.length === 2 && tempFieldVal.at(0) instanceof dayjs) {
                const startDate = tempFieldVal.at(0).startOf('day').toISOString();
                const endDate = tempFieldVal.at(1).endOf('day').toISOString();
                tempFieldVal = [];
                tempFieldVal[0] = startDate;
                tempFieldVal[1] = endDate;
            }

            tempFieldVal ? tempFieldVal = tempFieldVal.toString().trim() : tempFieldVal = tempFieldVal;
            tempFilterVal ? tempFilterVal = tempFilterVal.toString().trim() : tempFilterVal = tempFilterVal;

            if (tempFieldVal) {
                concatedString += tempFieldVal.toString();
            }

            if (tempFieldVal || tempFilterVal)
                flagHasContent = true;

            if (flagHasContent && tempFieldVal !== tempFilterVal) {
                flagContentChanged = true;
            }
        })

        if (concatedString.length > 7000) {
            setDisplayValidation("Filters cannot contain more than 7000 characters!");
        }

        else if (!flagHasContent) {
            setDisplayValidation("No selected Filters");
        }

        else if (!flagContentChanged) {
            setDisplayValidation("Filters have not changed");
        }

        else {
            setDisplayValidation("");
            await formProps.form?.validateFields();
            isSubmit && filterButtonRef?.current?.hide();
        }

        flagHasContent = false;
        flagContentChanged = false;
    }

    return (
        <Form
            layout="vertical"
            {...formProps}
        >
            <Row gutter={[10, 0]} align="bottom">

                {formElement}

                <Col span={24} style={{ justifyContent: 'center' }}>
                    <TextField style={{ color: 'red', fontWeight: '600', marginBottom: '5px', display: 'flex', justifyContent: 'center' }} value={displayValidation} />
                    <Form.Item>
                        <Button
                            disabled={displayValidation === "Filters cannot contain more than 7000 characters!"}
                            style={{ maxWidth: 300, display: 'flex', justifyContent: 'center', margin: 'auto' }}
                            htmlType="submit"
                            type="primary"
                            onClick={() => {
                                handleValidation(true);
                                setFilterClicks(prevVal => prevVal === undefined ? prevVal = 1 : prevVal = prevVal + 1);
                            }}
                            block
                        >
                            Apply Filter
                        </Button>
                    </Form.Item>
                </Col>

            </Row>
        </Form>
    );
});

export default FilterFormWrapper