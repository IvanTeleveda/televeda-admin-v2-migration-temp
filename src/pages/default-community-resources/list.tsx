import { Button, Card, Col, DatePicker, Drawer, Form, Grid, Icons, Input, Row, Select, Space, Switch, Tag } from "@pankod/refine-antd";
import { useEffect, useRef, useState } from "react";
import moment from "moment";
import "./list.css";
import Constants from "../../typings/constants";
import FilterFormWrapper from "../../components/filter";
import { FilterButton } from "../../components/buttons/filter";
import { ICommunity, IDefaultCommunityResource, IScheduledClass, ISelectOption, NotificationType, ResourceFile } from "../../interfaces";
import { CreateButton, useSelect, useTable } from "@refinedev/antd";
import { CrudFilters, HttpError, IResourceComponentsProps, useApiUrl, useCustomMutation, useList, useNotification, useOne, useParsed } from "@refinedev/core";
import { List } from "antd";
import { EventTypes } from "../../utils/enums";


const DefaultCommunitySponsorList: React.FC<IResourceComponentsProps> = () => {
    
    const { id: idFromRoute } = useParsed<Record<string, string>>();
    
    const { data, isLoading } = useOne<ICommunity>({
        resource: "community",
        id: idFromRoute as string
    });

    const { selectProps: communitySelectProps } = useSelect<ICommunity>({
        resource: "community",
        optionLabel: "name",
        optionValue: "id",
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
    });

    const { TextArea } = Input;
    const [form] = Form.useForm();

    const breakpoint = Grid.useBreakpoint();

    const [classList, setClassList] = useState<ResourceFile[]>([]);
    const [sponsoredClasses, setSponsoredClasses] = useState<ISelectOption[]>([]);

    const { open } = useNotification();
    const apiUrl = useApiUrl();
    const { mutate } = useCustomMutation<any>();

    const { tableProps: classTableProps, setFilters, searchFormProps: classSearchFormProps, filters: classFilters, sorters: classSorter, current: classCurrent } = useTable<any, HttpError, any>({
        syncWithLocation: true,
        resource: "scheduled-class",
        initialSorter: [
            {
                field: "classScheduledFor",
                order: "desc",
            },
        ],
        onSearch: (params) => {
            const filters: CrudFilters = [];

            const { className, communityIds, classTypes, classScheduledFor } = params;

            filters.push({
                field: "title",
                operator: "contains",
                value: className,
            });

            filters.push({
                field: "communityIds",
                operator: "in",
                value: communityIds,
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
                    value: classScheduledFor[0].startOf("day").toISOString(),
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
                    value: new Date()
                });
                filters.push({
                    field: "endDate",
                    operator: "eq",
                    value: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
                });
            }

            return filters;
        }
    });

    const { data: fetchedCommunityClasses, isFetching: isFetchingEvents, refetch: fetchCommunityClasses } = useList<IScheduledClass>({
        resource: "scheduled-class",
        config: {
            filters: classFilters && classFilters.length > 0 ? classFilters.map((filter: any) => {
                return {
                    field: filter.field,
                    operator: filter.operator,
                    value: filter.value
                };
            }) : [
                {
                    field: "startDate",
                    operator: "eq",
                    value: new Date().setHours(0, 0, 0, 0)
                },
                {
                    field: "endDate",
                    operator: "eq",
                    value: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).setHours(0, 0, 0, 0)
                }
            ],            
        }, queryOptions: {
            onSuccess(data) {
                const filteredClasses = data.data.map(sponsoredClass => {
                    const formattedDate = moment(sponsoredClass.startDate).format('MMMM Do YYYY, h:mm:ss a');
                    return {
                        value: sponsoredClass.title + "#" + sponsoredClass.id + "#" + formattedDate,
                        label: sponsoredClass.title + " " + formattedDate
                    }
                })
                // @ts-ignore
                setSponsoredClasses(filteredClasses)
            },
        }

    });

    useEffect(() => {
        mutate({
            url: `${apiUrl}/community-resources/fetch-list/default`,
            method: "post",
            values: {
                resourceType: "sponsoredClass"
            },
        }, {
            onError: (error, variables, context) => {
                console.log(error);
                openNotificationWithIcon('error', 'Failed to load resources!', "");
            },
            onSuccess: (data, variables, context) => {
                    setClassList(data.data)      
            },
        },);

    }, [])


    const openNotificationWithIcon = (type: NotificationType, message: string, description: string) => {
        open?.({
            type,
            message,
            description
        });
    };

    const saveResource = async () => {
        await form.validateFields();
        const communityResourceId = form.getFieldValue("id");
        if (classList && classList?.length === 3 && !communityResourceId) {
            openNotificationWithIcon('error', 'You can only have 3 default promoted classes at a time.', "");
            return false;
        }

        if (!form.getFieldValue("selectedClass")) {
            return;
        }
        const classTitle = form.getFieldValue("selectedClassTitle");
        const description = form.getFieldValue("selectedClassDescription");
        const order = form.getFieldValue("order");
        const [title, classId, startDate] = form.getFieldValue("selectedClass").split("#");

        const formattedDate = moment(startDate, 'MMMM Do YYYY, h:mm:ss a').toISOString();
        const communityResource: IDefaultCommunityResource = {
            downloadUrl: title + "#" + formattedDate,
            fileName: classTitle,
            extension: classId,
            order,
            resourceType: "sponsoredClass",
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
                url: `${apiUrl}/community-resources/default/${communityResourceId}`,
                method: "patch",
                values: communityResource
            },
            {
                onError: (error) => {
                    console.log(error);
                    openNotificationWithIcon('error', "Editing file failed!", "Please try again in a few seconds.");
                },
                onSuccess: (data) => {
                    setClassList((prevFileList) => {
                        const index = prevFileList.findIndex(file => file.uid === data.data.id);     
                        if (index !== -1) {
                            const newArr = prevFileList.map((file: ResourceFile, i) => {
                                if (i === index) {
                                    return {
                                        uid: data.data.id,
                                        fileName: data.data.fileName,
                                        url: data.data.downloadUrl,
                                        description: data.data.description,
                                        extension: data.data.extension,
                                        order: data.data.order,
                                        isDefault: true,
                                        associations: file.associations
                                    };
                                } else {
                                    return file;
                                }
                            });
                            return newArr;
                        } else {
                            return prevFileList;
                        }
                    });
                    openNotificationWithIcon('success', "Promoted event edited", "");
                    form.resetFields();
                    closeDrawer();
                }
            })
        } else {
            const communityIds = form.getFieldValue("communityIds");
            const classNames = classList.map(classItem => classItem.url);
            if(classNames.includes(communityResource.downloadUrl)) {
                openNotificationWithIcon('error', 'This class is already promoted.', "");
                return false;
            }
                
            mutate({
                url: `${apiUrl}/community-resources/default`,
                method: "post",
                values: {
                    ...communityResource,
                     communityIds: communityIds || [],
                },
            },
                {
                    onError: (error, variables, context) => {
                        console.log(error);
                        openNotificationWithIcon('error', "Error creating default promoted event!", "Please try again in a few seconds.");
                    },
                    onSuccess: (data, variables, context) => {
                        mutate({
                            url: `${apiUrl}/community-resources/default-associations`,
                            method: "post",
                            values: {
                                communityIds: communityIds && [...communityIds],
                                defaultCommunityResourceId: data.data.resource.id
                            },
                        },
                            {
                                onError: (error, variables, context) => {
                                    console.log(error);
                                    openNotificationWithIcon('error', "Error creating default promoted event!", "Please try again in a few seconds.");
                                },
                                onSuccess: () => {
                                    setClassList((prevFileList) => {
                                        const newArr = [...prevFileList];
                                        newArr.push({
                                            uid: data.data.resource.id,
                                            fileName: data.data.resource.fileName,
                                            url: data.data.resource.downloadUrl,
                                            description: data.data.resource.description,
                                            extension: data.data.resource.extension,
                                            order: data.data.resource.order,
                                            isDefault: true,
                                            associations: data.data.communityNames
                                        })
                                        return newArr;
                                    });
                                    openNotificationWithIcon('success', "Promoted event added", "");
                                    form.resetFields();
                                    closeDrawer();
                                },
                            },
                        );
                    },
                },
            );
        }
    }

    const onDelete = async (item: ResourceFile) => {
        if (!window.confirm("Are you sure you want to delete " + item.fileName + " ?")) {
            return false
        }

        try {
            mutate({
                url: `${apiUrl}/community-resources/default/` + item.uid,
                method: "delete",
                values: {},
            }, {
                onError: (error, variables, context) => {
                    console.log(error);
                    openNotificationWithIcon('error', "File failed to delete!", "Please try again in a few seconds.");
                },
                onSuccess: (data, variables, context) => {
                    setClassList((prevFileList) => {
                        const newArr = [...prevFileList];
                        return newArr.filter(el => el.uid != item.uid);
                    });
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

        return title + " " + moment(date).format('MMMM Do YYYY, h:mm:ss a');
    }

    const [visible, setVisible] = useState(false);
    const closeDrawer = () => {
        setVisible(false);
    };

    const { RangePicker } = DatePicker;
    const filterButtonRef = useRef<{ hide: () => void }>();
    const filterWrapperRef = useRef<{ handleValidation: () => void }>();


    return (
        <Card title={`Default Promoted Events`} extra={<CreateButton type="primary" onClick={() => {
            setVisible(true);
            form.resetFields();
        }}>Create Promoted Event</CreateButton>}>

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
                        fieldValuesNameRef={['className', 'communityIds', 'classTypes', 'classScheduledFor']}
                        filterValuesNameRef={['className', 'communityIds', 'classTypes', 'classScheduledFor']}
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
                                    <Form.Item label="Community name" name="communityIds">
                                        <Select
                                            {...communitySelectProps}
                                            onChange={() => filterWrapperRef.current?.handleValidation()}
                                            placeholder="Filter by community name"
                                            allowClear
                                            mode="multiple"
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
                                    const orderExists = classList.some(item =>item.order.toString() === value.toString() && item.uid !== id);
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
                    {!form.getFieldValue("id") && 
                    <>
                        <Form.Item
                                name="isForAllCommunities"
                                rules={[]}
                                valuePropName="checked"
                                label="For all communities"
                            >
                                <Switch checkedChildren="YES" unCheckedChildren="NO" defaultChecked />
                        </Form.Item>
                        <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, currentValues) => prevValues.isForAllCommunities !== currentValues.isForAllCommunities}
                        >
                                {({ getFieldValue }) => getFieldValue('isForAllCommunities') == false ? (
                                    <>
                                        <Col xl={22} md={22} sm={22} xs={22}>
                                            <Form.Item
                                                label="Community"
                                                name="communityIds"
                                            >
                                                <Select {...communitySelectProps} placeholder="Filter by community" allowClear mode="multiple" />
                                            </Form.Item>
                                        </Col>
                                    </>)
                                    : null}
                        </Form.Item>
                    </>
                    }
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
                        actions={[
                        <a onClick={() => { 
                            const splitted = item?.url?.split("#");
                            const formattedDate = moment(splitted[1]).format('MMMM Do YYYY, h:mm:ss a');
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
                            <Row justify="space-between" style={{flex:1,alignItems:'center'}} >
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
                                <Col span={6} style={{flex: 1}}>
                                    {item.associations && item.associations.length > 0 ? item.associations.map((tag: string, index: number) => (
                                        <Tag color="green" key={index} style={{ maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {tag}
                                        </Tag>
                                    )) :  
                                        <Tag color="green" style={{ maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            All
                                        </Tag>
                                    }
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
};

export default DefaultCommunitySponsorList
