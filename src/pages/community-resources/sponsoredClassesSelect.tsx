import { Button, Card, Col, DatePicker, Drawer, Form, Grid, Icons, Input, Select, Space, Row, Tag } from "@pankod/refine-antd";
import { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { FilterButton } from "../../components/buttons/filter";
import Constants from "../../typings/constants";
import FilterFormWrapper from "../../components/filter";
import { ICommunity, ICommunityResource, IScheduledClass, ISelectOption, NotificationType, ResourceFile } from "../../interfaces";
import { CreateButton, useSelect, useTable } from "@refinedev/antd";
import { CrudFilters, HttpError, useApiUrl, useCustomMutation, useList, useNotification } from "@refinedev/core";
import { List } from "antd";
import { EventTypes } from "../../utils/enums";

export const SponsoredClassesSelect: React.FC<{
    title: string;
    communityId: string | undefined;
    resourceType: string;
}> = ({ title, communityId, resourceType }) => {

    const [currentDate, setCurrentDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    useEffect(() => {
        const myDate = dayjs().toISOString(); 
        const endDateInterval = dayjs().add(30, 'day').endOf("day").toISOString();
        setEndDate(endDateInterval);
        setCurrentDate(myDate);
    }, [])

    
    const { TextArea } = Input;
    const [form] = Form.useForm();

    const [classList, setClassList] = useState<ResourceFile[]>([]);
    const [sponsoredClasses, setSponsoredClasses] = useState<ISelectOption[]>([]);

    const breakpoint = Grid.useBreakpoint();

    const { open } = useNotification();
    const apiUrl = useApiUrl();
    const { mutate } = useCustomMutation<any>();

    const { tableProps: classTableProps, setFilters, searchFormProps: classSearchFormProps, filters: classFilters, sorters: classSorter, current: classCurrent } = useTable<any, HttpError, any>({
        resource: "scheduled-class",
        initialSorter: [
            {
                field: "classScheduledFor",
                order: "desc",
            },
        ],
        onSearch: (params: any) => {
            const filters: CrudFilters = [];

            const { className, classTypes, classScheduledFor } = params;

            filters.push({
                field: "title",
                operator: "contains",
                value: className,
            });

            filters.push({
                field: "classTypes",
                operator: "in",
                value: classTypes
            })

            if (classScheduledFor) {
                filters.push({
                    field: "startDate",
                    operator: "eq",
                    value: classScheduledFor[0].startOf("day") < new Date().getTime() ? new Date().toISOString() : classScheduledFor[0].startOf("day").toISOString(),
                });
                filters.push({
                    field: "endDate",
                    operator: "eq",
                    value: classScheduledFor[1].endOf("day").toISOString(),
                });
            }
            else {
                filters.push({
                    field: "startDate",
                    operator: "eq",
                    value: undefined
                });
                filters.push({
                    field: "endDate",
                    operator: "eq",
                    value: undefined
                });
            }

            return filters;
        }
    });
    
    useList<IScheduledClass>({
        resource: "scheduled-class",
        config: {
            filters: [
                { 
                    field: 'communityIds', 
                    operator: 'in', 
                    value: [communityId] 
                },
                { 
                    field: 'title', 
                    operator: 'eq', 
                    value: classFilters?.find((cf: any) => cf.field === 'title')?.value ?? undefined 
                },
                // @TODO: we'll need to fix this later by a separate endpoint to fetch the classes
                { 
                    field: 'startDate', 
                    operator: 'eq', 
                    value: classFilters?.find((cf: any) => cf.field === 'startDate')?.value ?? currentDate
                },
                { 
                    field: 'endDate', 
                    operator: 'eq', 
                    value: classFilters?.find((cf: any) => cf.field === 'endDate')?.value ?? endDate
                },
                { 
                    field: 'classTypes', 
                    operator: 'in', 
                    value: classFilters?.find((cf: any) => cf.field === 'classTypes')?.value ?? []
                },
                { 
                    field: 'onlyManagedClasses', 
                    operator: 'eq', 
                    value: true 
                }
            ].map(filter => ({
                ...filter,
                ...(classFilters?.find((cf: any) => cf.field === filter.field)?.value?? filter.value)
             })),
        }, 
        queryOptions: {
            onSuccess(data) {
                const filteredClasses = data.data.map(sponsoredClass => {
                    const formattedDate = dayjs(sponsoredClass.startDate).format('MMMM Do YYYY, h:mm:ss a');
                    return {
                        value: sponsoredClass.title + "#" + sponsoredClass.id + "#" + formattedDate,
                        label: sponsoredClass.title + " " + formattedDate
                    }
                })
                setSponsoredClasses(filteredClasses)
            },
        }

    });

    const fetchList = () => {
        mutate({
            url: `${apiUrl}/community-resources/fetch-list`,
            method: "post",
            values: {
                communityId,
                resourceType
            },
        }, {
            onError: (error, variables, context) => {
                console.log(error);
                openNotificationWithIcon('error', 'Failed to load resources!', "");
            },
            onSuccess: (data, variables, context) => {
                //@ts-ignore
                setClassList(data.data)
            },
        },);
    }


    useEffect(() => {
        fetchList();
    }, [])

    const openNotificationWithIcon = (type: NotificationType, message: string, description: string) => {
        open?.({
            type,
            message,
            description
        });
    };

    const saveResource = async () => {
        // console.log("On save props:", form.getFieldsValue());

        await form.validateFields();
        const communityResourceId = form.getFieldValue("id");
        const nonDefaultSponsoredClasses = classList.reduce((acc, obj) => obj.isDefault ? acc : ++acc, 0)
        if (nonDefaultSponsoredClasses >= 3 && !communityResourceId) {
            openNotificationWithIcon('error', 'You can only have 3 promoted classes at a time.', "");
            return false;
        }

        if (!form.getFieldValue("selectedClass") || !communityId) {
            return;
        }
        const classTitle = form.getFieldValue("selectedClassTitle");
        const description = form.getFieldValue("selectedClassDescription");
        const order = form.getFieldValue("order");
        const [title, classId, startDate] = form.getFieldValue("selectedClass").split("#");

        // console.log(selectedClass, title, classId, startDate, description);
        // gonna store it as an ISO format in the DB
        const formattedDate = dayjs(startDate, 'MMMM Do YYYY, h:mm:ss a').toISOString();

        // this will be moved in the future so I'm gonna use the filename and downloadURL props for this
        const communityResource: ICommunityResource = {
            communityId: communityId,
            downloadUrl: title + "#" + formattedDate,
            fileName: classTitle,
            extension: classId,
            order,
            resourceType: resourceType,
            description
        }

        if(communityResourceId) {
            const classNames = classList
                .filter(classItem => classItem.uid !== communityResourceId)
                .map(classItem => classItem.url);

            if(classNames.includes(communityResource.downloadUrl)) {
                openNotificationWithIcon('error', 'This class is already promoted.', "");
                return false;
            }

            mutate({
                url: `${apiUrl}/community-resources/${communityResourceId}`,
                method: "patch",
                values: communityResource
            },
            {
                onError: (error) => {
                    console.log(error);
                    openNotificationWithIcon('error', "Editing file failed!", "Please try again in a few seconds.");
                },
                onSuccess: (data) => {
                    fetchList();
                    openNotificationWithIcon('success', "Promoted event edited", "");
                    form.resetFields();
                    closeDrawer();
                }
            })
        } else {
            const classNames = classList.map(classItem => classItem.url);
            if(classNames.includes(communityResource.downloadUrl)) {
                openNotificationWithIcon('error', 'This class is already promoted.', "");
                return false;
            }
            mutate({
                url: `${apiUrl}/community-resources`,
                method: "post",
                values: communityResource,
            },
                {
                    onError: (error, variables, context) => {
                        console.log(error);
                        openNotificationWithIcon('error', "File failed to upload!", "Please try again in a few seconds.");
                    },
                    onSuccess: (data, variables, context) => {
                        fetchList();
                        openNotificationWithIcon('success', "Promoted event added", "");
                        form.resetFields();
                        closeDrawer();
                    },
                },
            );
        }
    }

    const onDelete = async (item: any) => {
        // console.log(item);

        if (!window.confirm("Are you sure you want to delete " + item.fileName + " ?")) {
            return false
        }

        try {
            mutate({
                url: `${apiUrl}/community-resources/` + item.uid,
                method: "delete",
                values: {
                    communityId,
                    resourceType,
                },
            }, {
                onError: (error, variables, context) => {
                    console.log(error);
                    openNotificationWithIcon('error', "File failed to delete!", "Please try again in a few seconds.");
                },
                onSuccess: (data, variables, context) => {
                    fetchList();
                    openNotificationWithIcon('success', "Deleted successfully", "");
                },
            },);
        } catch (error) {
            console.log(error);
            openNotificationWithIcon('error', "File failed to delete!", "Please try again in a few seconds.");
        }

    }

    function formatClassListTitle(text: string): string {
        if (!text) {
            return "";
        }
        const [title, date] = text.split("#");
        // console.log(title,date);
        return title + " " + dayjs(date).format('MMMM Do YYYY, h:mm:ss a');
    }

    const [visible, setVisible] = useState(false);
    const closeDrawer = () => {
        setVisible(false);
    };


    const { selectProps: communitySelectProps } = useSelect<ICommunity>({
        resource: "community",
        optionLabel: "name",
        optionValue: "id",
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
    });

    const { RangePicker } = DatePicker;
    const filterButtonRef = useRef<{ hide: () => void }>();
    const filterWrapperRef = useRef<{ handleValidation: () => void }>();

    return (
        <Card title={title} extra={<CreateButton type="primary" onClick={() => {
            setVisible(true);
            form.resetFields();
        }}>Add a promoted event</CreateButton>}>

            <Drawer
                title={"Create promoted event"}
                width={breakpoint.sm ? "500px" : "100%"}
                open={visible}
                onClose={closeDrawer}
                styles={{
                    body: {
                      padding: 24,
                      display: 'flex',
                      flexDirection: 'column'
                    }
                }}
            >
                <Form form={form} layout="vertical">
                    <FilterButton
                        ref={filterButtonRef}
                        filters={classFilters}
                    >
                        <FilterFormWrapper
                            ref={filterWrapperRef}
                            filterButtonRef={filterButtonRef}
                            formProps={classSearchFormProps}
                            filters={classFilters || []}
                            fieldValuesNameRef={['className', 'classTypes', 'classScheduledFor']}
                            filterValuesNameRef={['className', 'classTypes', 'classScheduledFor']}
                            formElement={
                                <>
                                    <Col xl={24} md={8} sm={12} xs={24}>
                                        <Form.Item label="Class name" name="className">
                                            <Input
                                                onChange={() => filterWrapperRef.current?.handleValidation()}
                                                placeholder="Filter by class name"
                                                prefix={<Icons.SearchOutlined />}
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col xl={24} md={8} sm={12} xs={24}>
                                        <Form.Item
                                            label="Class type"
                                            name="classTypes"
                                        >
                                            <Select
                                                onChange={() => filterWrapperRef.current?.handleValidation()}
                                                placeholder="Filter by event type" allowClear mode="multiple"
                                                options={[
                                                    { value: EventTypes.LOCAL, label: 'Televeda Live' },
                                                    { value: EventTypes.EXTERNAL, label: 'External' },
                                                    { value: EventTypes.TELEVEDA_BINGO, label: 'Bingo' },
                                                    { value: EventTypes.VTC, label: 'VTC' },
                                                    { value: EventTypes.IN_PERSON, label: 'In Person' },
                                                    { value: EventTypes.ON_DEMAND, label: 'On-demand' },
                                                ]} />
                                        </Form.Item>
                                    </Col>

                                    <Col xl={24} md={8} sm={12} xs={24}>
                                        <Form.Item
                                            label="Scheduled date range"
                                            name="classScheduledFor"
                                        >
                                            <RangePicker disabledDate={(currentDate) => {
                                                    return currentDate.toDate().getTime() < new Date().setHours(0, 0, 0, 0);
                                            }}
                                                onChange={() => filterWrapperRef.current?.handleValidation()}
                                                style={{ width: "100%" }} />
                                        </Form.Item>
                                    </Col>
                                </>}
                            syncWithLocation={true}
                        />
                    </FilterButton>
                    <Form.Item name="id" hidden={true}>
                        <Input type="text" />
                    </Form.Item>
                    <Form.Item
                        label={"Select Class"}
                        name={"selectedClass"}
                        style={{ paddingTop: '20px' }}
                        rules={[{ required: true, message: "Please select a class." }]}
                    >
                        <Select 
                            size="large"
                            onChange={(value) => {
                                const title = form.getFieldValue("selectedClass").split("#")[0];
                                form.setFieldsValue({ selectedClassTitle: title });
                            }}
                            optionLabelProp="label"
                        >
                             {sponsoredClasses?.map((sponsoredClass, index) => {
                                return (
                                    <Select.Option 
                                        key={index} 
                                        value={sponsoredClass.value}  
                                        label={
                                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {sponsoredClass.label}
                                            </div>
                                        }
                                    >
                                        <div style={{ whiteSpace: 'normal', wordBreak: 'break-all' }}>
                                            {sponsoredClass.label}
                                        </div>
                                    </Select.Option>
                                )
                            })}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label={"Class order"}
                        name={"order"}
                        initialValue={1}
                        rules={[
                            { required: true },
                            {
                                validator: async () => {
                                    const value = form.getFieldValue('order')
                                    const id = form.getFieldValue('id')
                                    if (!value) return Promise.reject(
                                        new Error("Value is empty or not a number"),
                                    );
                                    const orderExists = classList.some(item =>!item.isDefault && item.order.toString() === value.toString() && item.uid !== id);
                                    if(orderExists)  return Promise.reject(
                                        new Error("Order is already taken. Please select another order"),
                                    );
                                    try {
                                        const number = parseInt(value)

                                        if (number < 1 || number > 3) {
                                            return Promise.reject(
                                                new Error("Order must be between 1 and 3"),
                                            );
                                        }
                                        else {

                                            return Promise.resolve();
                                        }

                                    } catch (error: unknown) {
                                        return Promise.reject(
                                            new Error("Value must be a number"),
                                        );
                                    }
                                },
                            }
                        ]}
                    >
                        <Input size="large" min={1} max={3} style={{ width: "100%" }} type="number" />
                    </Form.Item>
                    <Form.Item
                        label={"Promoted event title"}
                        name={"selectedClassTitle"}
                        rules={[
                            { required: true, message: "Please enter a title." },
                            { max: 80, message: 'Title cannot exceed 80 characters' }
                        ]}
                    >
                        <Input showCount={true} maxLength={80} size="large" style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item
                        label={"Promoted event description"}
                        name={"selectedClassDescription"}
                        rules={[
                            { max: 200, message: 'Description cannot exceed 200 characters' }
                        ]}
                    >
                        <TextArea showCount={true} maxLength={200} rows={2} style={{ width: "100%" }} />
                    </Form.Item>
                    <Space>
                        <Button type="primary" onClick={saveResource}>Save</Button>
                        <Button onClick={closeDrawer}>Cancel</Button>
                    </Space>
                </Form>
            </Drawer>
            <List
                itemLayout="horizontal"
                dataSource={classList}
                renderItem={(item: ResourceFile) => (
                    <List.Item
                        actions={item.isDefault ? [
                                <Tag color="green">Default</Tag>,
                            ]
                        :
                            [
                                <a onClick={() => { 
                                    const splitted = item?.url?.split("#");
                                    const formattedDate = dayjs(splitted[1]).format('MMMM Do YYYY, h:mm:ss a');
                                    const selectedClass = splitted[0] + '#' + item.extension + '#' + formattedDate;
                            
                                    form.setFieldsValue({
                                        selectedClassTitle: item?.fileName,
                                        selectedClassDescription: item?.description,
                                        selectedClass: selectedClass,
                                        order: item?.order,
                                        id: item?.uid
                                    });
                                    setVisible(true);
                                }}>
                                    edit
                                </a>, 
                                <a onClick={() => { onDelete(item) }} >delete</a>
                            ]}
                    >
                        <Row justify="space-between" style={{flex:1,alignItems:'center', marginRight: item.isDefault ? '12px' : 0}} >
                            <Col span={9}>
                                    <Row gutter={4}>
                                        <Col span={24} style={{paddingTop: '15px'}} >
                                            <p className="custom-list-text" >{item?.fileName}</p>
                                        </Col>
                                        <Col className="custom-list-text" span={24}>
                                            <p className="custom-list-text" >{item?.description}</p>
                                        </Col>
                                    </Row>
                            </Col>
                            <Col span={9}>
                                <Row gutter={4}>
                                    <Col span={24} style={{paddingTop: '15px'}}>
                                        <p>Order: {item?.order}</p>
                                    </Col>
                                    <Col span={24}>
                                        <p style={{fontWeight:'bold'}} className="custom-list-text">{formatClassListTitle(item?.url)}</p>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </List.Item>
                )}
            />
        </Card>
    );
}