import {
    Space,
    Select,
    Button,
    Spin,
    notification,
    Menu,
    Dropdown,
    Row,
    Col,
    Popover,
    Checkbox,
    Form,
    Divider,
    Input,
    Typography,
    Tooltip,
    Modal,
} from "@pankod/refine-antd";
import FullCalendar from '@fullcalendar/react' // must go before plugins
import dayGridPlugin from '@fullcalendar/daygrid' // a plugin!
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { PlusOutlined, EditOutlined, DeleteOutlined, StopOutlined, LinkOutlined, DownOutlined, InfoCircleOutlined, EyeInvisibleOutlined, NotificationFilled, RetweetOutlined } from '@ant-design/icons';
import React, { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import moment from 'moment';
import { useWebexRedirect } from "./useWebexRedirect";
import dayjs from "dayjs";
import { ICalendarEvent, ICommunity, IRefineUser, IScheduledClass, IScheduledClassReminder, UserPermissions } from "../../interfaces";
import Constants from "../../typings/constants";
import { EditClassModal } from "./editModal";
import { TelevedaList } from "../../components/page-containers/list";
import { FilterButton } from "../../components/buttons/filter";
import { convertToEvent } from "./convertToEvent";
import { DeleteScheduledClassButton, ScheduledClassAlterOccurrenceTypes } from "../../components/buttons/deleteScheduledClass";
import { ScheduledClassCreateWithDrawer } from "./create-drawer";
import { AlterPublicClassVisibilityButtons } from "../../components/buttons/hideScheduledClass";
import { useDrawerForm, useSelect } from "@refinedev/antd";
import { EventContentArg, EventDropArg } from "@fullcalendar/core";
import { HttpError, IResourceComponentsProps, UpdateResponse, useApiUrl, useCreate, useCustom, useDelete, useGetIdentity, useList, usePermissions, useUpdate } from "@refinedev/core";
import { EventTypes } from "../../utils/enums";
import { getEventLabel } from "../../utils/eventLabels";
import { useSearchParams } from "react-router-dom";
import { List } from "antd";

export interface ICalendarFilterVariables {
    start?: string;
    end?: string;
}

export interface ICalendarFilters {
    startDate?: string;
    endDate?: string;
    communityIds?: Array<string>;
    classTypes?: Array<EventTypes>;
    onlyManagedClasses?: boolean;
    onlyHostedClasses?: boolean;
}

export interface ICreateClassFormProps {
    communityId: string | undefined;
    title: string;
    startDate: Date;
    duration: number;
    selectedDuration: number;
    customDuration: number;
    classType: EventTypes;
}

export const ScheduledClassList: React.FC<IResourceComponentsProps> = () => {
    const [calendarFilters, setCalendarFilters] = useState<ICalendarFilters>({});

    const { selectProps: communitySelectProps, query: { refetch: refetchCommunityProps, data: communitySelectPropsData } } = useSelect<ICommunity>({
        resource: "Community",
        optionLabel: 'name',
        optionValue: 'id',
        fetchSize: Constants.DROPDOWN_FETCH_SIZE,
        filters: [{
            field: "includeHosted",
            operator: "eq",
            value: "true"
        }]
    });

    const { data: permissionsData } = usePermissions<UserPermissions>();

    const { data: user } = useGetIdentity<IRefineUser>();

    const { data: fetchedEvents, isFetching: isFetchingEvents, refetch: fetchScheduledEvents } = useList<IScheduledClass>({
        resource: "scheduled-class",
        filters: [
            { field: 'startDate', operator: 'eq', value: calendarFilters.startDate },
            { field: 'endDate', operator: 'eq', value: calendarFilters.endDate },
            { field: 'communityIds', operator: 'in', value: calendarFilters.communityIds },
            { field: 'classTypes', operator: 'in', value: calendarFilters.classTypes },
            { field: 'onlyManagedClasses', operator: 'eq', value: calendarFilters.onlyManagedClasses },
            { field: 'onlyHostedClasses', operator: 'eq', value: calendarFilters.onlyHostedClasses }
        ],
        queryOptions: {
            onError: () => { setSelectedEvent(undefined); },
            onSuccess: () => { setSelectedEvent(undefined); }
        }
    });

    const apiUrl = useApiUrl();

    const [searchParams] = useSearchParams();

    const { data: communityData, isLoading } = useCustom<ICommunity>({
        url: `${apiUrl}/community/current`,
        method: "get"
    });

    const [filterForm] = Form.useForm();

    const [editWarningModal, setEditWarningModal] = useState(false);
    const [editWarningEvents, setEditWarningEvents] = useState<string[]>([]);

    const currentCommunity = communityData?.data

    const {
        drawerProps: createDrawerProps,
        formProps: createFormProps,
        saveButtonProps: createSaveButtonProps,
        show: createShow,
    } = useDrawerForm<IScheduledClass, HttpError, ICreateClassFormProps>({
        action: "create",
        resource: "scheduled-class",
        redirect: false
    });

    const editDrawerFormProps = useDrawerForm<IScheduledClass>({
        action: "edit",
        resource: "scheduled-class",
        redirect: false,
        onMutationSuccess(data, variables) {
            const onDemandUpdateProps = (data.data as any as { onDemandUpdateProps: { isUpdated: boolean, events: Array<string> } })?.onDemandUpdateProps;
            if (onDemandUpdateProps.isUpdated) {
                setEditWarningModal(true);
                setEditWarningEvents(onDemandUpdateProps.events);
            }
        },
    });

    const {
        drawerProps: editDrawerProps,
        formProps: editFormProps,
        saveButtonProps: editSaveButtonProps,
        show: editShow,
        formLoading: editFormLoading
    } = editDrawerFormProps;

    const {
        drawerProps: webexCreateDrawerProps,
        formProps: webexCreateFormProps,
        saveButtonProps: webexCreateSaveButtonProps,
        show: webexCreateShow,
        mutationResult: webexCreateResult
    } = useDrawerForm<IScheduledClass, HttpError, ICreateClassFormProps>({
        action: "create",
        resource: "webex-class",
        redirect: false,
    });

    const {
        drawerProps: webexEditDrawerProps,
        formProps: webexEditFormProps,
        saveButtonProps: webexEditSaveButtonProps,
        formLoading: webexEditLoading,
        show: webexEditShow,
        mutationResult: webexEditResult
    } = useDrawerForm<IScheduledClass>({
        action: "edit",
        resource: "webex-class",
        redirect: false,
    });

    console.log("editDrawerFormProps: ", editDrawerFormProps);

    const { executeWebexAuthRedirect, isLoading: webexIsLoading } = useWebexRedirect("/admin/schedule/scheduled_classes");

    const calendarRef = useRef<any>(null)

    const [selectedEvent, setSelectedEvent] = useState<any>(undefined);

    const [draggedEvent, setDraggedEvent] = useState<{ drag: EventDropArg | undefined, classId: string }>();

    const [eventsData, setEventsData] = useState<ICalendarEvent[]>([]);

    const [hidePopover, setHidePopover] = useState<boolean>(false);

    const [editEventModal, setEditEventModal] = useState<boolean>(false);

    const [radioValue, setRadioValue] = useState<ScheduledClassAlterOccurrenceTypes>(ScheduledClassAlterOccurrenceTypes.Single);

    const { mutate: updateSingleOccurrenceTimeMutation } = useUpdate<any>();

    const { mutate: alterClassMutation } = useCreate<any>();

    const { mutate: updateReminder } = useUpdate();
    const { mutate: createReminder } = useCreate();
    const { mutate: deleteReiminder } = useDelete();

    useMemo(() => {
        if (permissionsData && permissionsData != 'TelevedaAdmin' && !calendarFilters.onlyManagedClasses && !calendarFilters.onlyHostedClasses) {
            communitySelectProps.options?.push({
                label: 'Other public events',
                value: 'public'

            })
        }
    }, [communitySelectProps.options])

    useMemo(() => {
        if (!editDrawerProps.open && !webexEditDrawerProps.open && !createDrawerProps.open && !webexCreateDrawerProps.open && !editEventModal) {
            setHidePopover(false);
        }
        else {
            setHidePopover(true);
        }
    }, [editDrawerProps.open, webexEditDrawerProps.open, createDrawerProps.open, webexCreateDrawerProps.open, editEventModal])

    const handleDatesSet = (dateInfo: any) => {
        console.log("Handle Dates Set: ", dateInfo);

        setCalendarFilters({
            startDate: dateInfo.startStr,
            endDate: dateInfo.endStr,
            communityIds: calendarFilters.communityIds,
            classTypes: calendarFilters.classTypes,
            onlyManagedClasses: calendarFilters.onlyManagedClasses,
            onlyHostedClasses: calendarFilters.onlyHostedClasses
        });
    };

    useEffect(() => {
        if (searchParams) {
            const startCustom = searchParams.get('start-custom');
            if (startCustom === 'true') {
                handleCreateEvent();
            }
        }
    }, [searchParams])

    //Refresh when editing of a Webex class is ready
    useEffect(() => {

        if (!webexEditResult.isSuccess) {
            return;
        }

        fetchScheduledEvents();

    }, [webexEditResult.isSuccess]);

    //Refresh when creating a Webex class is ready
    useEffect(() => {

        if (!webexCreateResult.isSuccess) {
            return;
        }

        fetchScheduledEvents();

    }, [webexCreateResult.isSuccess]);

    useEffect(() => {
        console.log("Fetched events:", fetchedEvents);

        if (!fetchedEvents) return;


        const mappedEvents = fetchedEvents.data
            .filter((event: any) => typeof event !== 'undefined')
            .map(convertToEvent);

        mappedEvents.push({
            id: '00ffc484-abac-459f-a374-8464b5ea946e',
            start: '1970-01-01',
            end: calendarRef.current?.calendar.currentDataManager.state.currentViewType === "dayGridMonth" ? dayjs().format('YYYY-MM-DD') : dayjs().toISOString(),
            display: 'background',
            overlay: true,
            backgroundColor: '#c2c2c2'
        });

        console.log("Mapped events", mappedEvents)
        setEventsData(mappedEvents);

        const interval = setInterval(() => {
            forceRerender(mappedEvents);
        }, 300000);
        return () => clearInterval(interval);

    }, [fetchedEvents]);

    const forceRerender = (events: ICalendarEvent[]) => {

        const newEventsData = events.map((event, index, arr) => {

            if (index + 1 === arr.length) {
                return { ...event, end: calendarRef.current?.calendar.currentDataManager.state.currentViewType === "dayGridMonth" ? dayjs().format('YYYY-MM-DD') : dayjs().toISOString(), }
            }

            return { ...event }
        });

        setEventsData(newEventsData);
    };

    const handleEventClick = (clickInfo: any) => {
        const selectedEvent = selectSingleEvent(clickInfo.event.id);
        setSelectedEvent(selectedEvent);
    };

    const selectSingleEvent = (eventId: any) => {

        let selectedEvent = undefined;

        const newEventsData = eventsData.map((event, index, arr) => {

            if (index + 1 === arr.length) {
                return { ...event }
            }

            let newEvent = { ...event };
            if (newEvent.originalBackgroundColor) {
                newEvent.backgroundColor = newEvent.originalBackgroundColor;
            }
            newEvent.isSelected = false;

            if (event.id != eventId) return newEvent;

            if (event.isSelected) return newEvent;

            newEvent.originalBackgroundColor = newEvent.backgroundColor;
            newEvent.backgroundColor = 'red';
            newEvent.isSelected = true;
            selectedEvent = newEvent;

            return newEvent;
        });

        setEventsData(newEventsData);
        return selectedEvent;
    }

    const handleCreateEvent = () => {

        createFormProps.form.setFieldsValue({
            communityId: currentCommunity?.id,
            startDate: dayjs(new Date().setSeconds(0, 0)),
            selectedDuration: 60,
            classType: EventTypes.LOCAL,
        });

        createShow();
        //history.push(`${basePath}/create`, {record: {}});
    }

    const handleEditEvent = () => {
        if (!selectedEvent) return;
        if (hasSelectedWebexEvent()) {
            console.log("Edit click");

            if (executeWebexAuthRedirect()) {
                console.log("Showing")
                webexEditShow(selectedEvent.scheduledClassId);
            }
        }
        else {
            editShow(selectedEvent.scheduledClassId);
        }

        //
        // history.push(linkToRecord(basePath, selectedEvent.id));
    }

    const handleCopyLink = () => {
        if (!selectedEvent) return;

        const classParams = {
            start: selectedEvent.start,
            end: selectedEvent.end,
            old: selectedEvent.oldDate
        }
        const urlParams = btoa(encodeURIComponent(JSON.stringify(classParams)));

        let baseUrl = window.location.protocol + "//" + window.location.host + "/class-schedule";

        baseUrl += "/" + selectedEvent.scheduledClassId + "?p=" + urlParams;

        navigator.clipboard.writeText(baseUrl);

        notification.open({
            message: 'Copied class link',
            icon: <LinkOutlined style={{ color: '#108ee9' }} />,
        });

    }

    const handleCancelEvent = () => {
        if (!selectedEvent) return;
        console.log("Cancel event: ", selectedEvent);

        alterClassMutation({
            successNotification: (() => ({
                description: "Successful",
                message: `Successfully ${selectedEvent.isCanceled ? 'restored' : 'canceled'} scheduled class`,
                type: "success"
            })),
            resource: `scheduled-class/${selectedEvent.scheduledClassId}/cancel`,
            values: {
                title: selectedEvent.title,
                date: selectedEvent.oldDate,
                currentDate: selectedEvent.start,
                shouldCancel: !selectedEvent.isCanceled
            }
        }, { onSuccess: () => { fetchScheduledEvents(); } });
    }

    const alterEventFromCalendarMutation = (communityIds: Array<string>, isToHide: boolean) => {
        alterClassMutation({
            resource: `scheduled-class/${selectedEvent.scheduledClassId}/${isToHide ? 'remove-from-calendar' : 'show-to-calendar'}`,
            values: {
                date: selectedEvent.oldDate,
                communityIds
            },
            successNotification: (() => ({
                description: "Successful",
                message: `Successfully ${isToHide ? 'hid' : 'showed'} ${selectedEvent.title} for your members.`,
                type: "success"
            })),
            errorNotification: (() => ({
                description: "Error",
                message: `Failed to ${isToHide ? 'hide' : 'show'} ${selectedEvent.title} for your members.`,
                type: "error"
            })),
        }, { onSuccess: () => { fetchScheduledEvents(); } });
        setSelectedEvent(undefined);
    }

    const handleAlterPublicClassVisibilityEvent = (communityIds: Array<string>, isToHide: boolean) => {
        if (!selectedEvent) return;
        alterEventFromCalendarMutation(communityIds, isToHide);
    }

    const handleDeleteWebexEvent = (type: ScheduledClassAlterOccurrenceTypes) => {
        if (!selectedEvent || !hasSelectedWebexEvent()) return;
        if (executeWebexAuthRedirect()) {
            handleDeleteEvent(type);
        }
    }

    const handleDeleteEvent = (type: ScheduledClassAlterOccurrenceTypes) => {
        if (!selectedEvent) return;
        console.log("selectedEvent", selectedEvent)
        const resource = hasSelectedWebexEvent() ? 'webex-class' : 'scheduled-class';
        alterClassMutation({
            successNotification: (() => ({
                description: "Successful",
                message: `Successfully deleted scheduled class`,
                type: "success"
            })),
            resource: resource + '/' + selectedEvent.scheduledClassId,
            values: {
                type,
                startDate: selectedEvent.oldDate,
                currentDate: selectedEvent.start,
                title: selectedEvent.title,
                communityId: selectedEvent.communityId
            }
        }, {
            onSuccess: () => {
                fetchScheduledEvents();
            }
        });
        setSelectedEvent(undefined);
    }

    const hasSelectedEvent = () => (selectedEvent ? true : false);

    const hasSelectedWebexEvent = () => {
        console.log("Selected Event", selectedEvent);
        return selectedEvent?.scheduledClassType === EventTypes.WEBEX
    }

    const handleDateSelect = (selectInfo: any) => {
        const calendarApi = selectInfo.view.calendar;
        calendarApi.unselect(); // clear date selection

        const startDateUTC = new Date(selectInfo.startStr);
        const endDateUTC = new Date(selectInfo.endStr);
        const duration = Math.abs(endDateUTC.getTime() - startDateUTC.getTime()) / (1000 * 60) /*% 60*/;

        const recordData = {
            startDateUTC,
            endDateUTC,
            duration
        };

        createFormProps.form.setFieldsValue({
            communityId: currentCommunity?.id,
            title: 'New Event',
            startDate: dayjs(startDateUTC),
            duration: duration,
            selectedDuration: -1,
            customDuration: duration,
            classType: EventTypes.LOCAL,
        });

        selectSingleEvent(undefined);
        setSelectedEvent(undefined);

        createShow();
    };

    const handleEventDrop = (eventInfo: EventDropArg) => {

        const singleEvent = eventsData.filter((event) => {
            return event.id === eventInfo.event.id
        })
        if (singleEvent[0].isRecurring) {
            setEditEventModal(true);
            setDraggedEvent({ drag: eventInfo, classId: singleEvent[0].scheduledClassId as string });
            return;
        }
        setNewOccurenceTime({ drag: eventInfo, classId: singleEvent[0].scheduledClassId as string });
    }

    const handleCommunityfilterChange = (value: any) => {
        setCalendarFilters({
            ...calendarFilters,
            communityIds: value
        });
    };

    const handleManagedEventsCheckboxChange = (value: any) => {
        const checked = value.target.checked
        console.log('onlyManagedClasses: ', checked);
        setCalendarFilters({
            ...calendarFilters,
            onlyManagedClasses: checked,
            communityIds: []
        });

        refetchCommunityProps();
        filterForm.resetFields();
    }

    const handleHostedEventsCheckboxChange = (value: Array<EventTypes>) => {
        // @ts-ignore
        const checked = value.target.checked
        console.log('onlyHostedClasses: ', checked);
        setCalendarFilters({
            ...calendarFilters,
            onlyHostedClasses: checked,
            communityIds: []
        });

        refetchCommunityProps();
        filterForm.resetFields();
    }

    const handleClassTypeFilterChange = (value: Array<EventTypes>) => {
        setCalendarFilters({
            ...calendarFilters,
            classTypes: value
        })
    }

    const handleWebexCreate = () => {
        if (executeWebexAuthRedirect()) {

            createFormProps.form.setFieldsValue({
                communityId: currentCommunity?.id,
                startDate: dayjs(),
                selectedDuration: 60,
            });

            webexCreateShow();
        }
    }

    const dropdownMenu = (
        <Menu
            items={[
                {
                    key: '1',
                    label: (
                        <Space onClick={handleCreateEvent} key="event_create_btn">
                            <PlusOutlined />
                            Create Any Event
                        </Space>
                    ),
                },
                {
                    key: '2',
                    label: (
                        <Space onClick={handleWebexCreate} key="event_create_btn_webex">
                            <PlusOutlined />
                            Create WebEx Event
                        </Space>
                    ),
                },
            ]}
        />
    )

    const PopoverClassContent: React.FC<{ arg: EventContentArg }> = (props) => {

        const { arg } = props;

        const customEventProps = arg.event.extendedProps as ICalendarEvent;

        const feedbackLength = customEventProps.reminders?.filter(reminder => reminder.scheduledClassId === customEventProps.scheduledClassId && reminder.receiveFeedback).length;

        const reminderLegth = customEventProps.reminders?.filter(reminder => reminder.scheduledClassId === customEventProps.scheduledClassId && reminder.reminderOffset).length;

        const [reminderForm] = Form.useForm();

        const [reminderSettingsToggle, setReminderSettingsToggle] = useState<boolean>(false);

        const reminderFormOnFinish = (values: any) => {
            if (customEventProps.haveNotifications) {
                return updateReminder({
                    resource: 'reminders/managers',
                    values: {
                        reminderOffset: values.reminderOffset || null,
                        receiveFeedback: values.feedback || false
                    },
                    id: selectedEvent.scheduledClassId
                }, {
                    onSuccess: () => {
                        fetchScheduledEvents();
                        selectSingleEvent(undefined);
                    }
                })
            }

            return createReminder({
                resource: `reminders/managers/${selectedEvent.scheduledClassId}`,
                values: {
                    reminderOffset: values.reminderOffset || null,
                    receiveFeedback: values.feedback || false,
                    scheduledClassId: selectedEvent.scheduledClassId,
                    className: selectedEvent.title
                }
            }, {
                onSuccess: () => {
                    fetchScheduledEvents();
                    selectSingleEvent(undefined);
                }
            })
        }

        // const deleteReminderFn = () => {
        //     deleteReiminder({
        //         resource: 'reminders/managers',
        //         id: selectedEvent.scheduledClassId
        //     }, {
        //         onSuccess: () => {
        //             fetchScheduledEvents();
        //             selectSingleEvent(undefined);
        //         }
        //     })
        // }

        return (
            <div
                style={{
                    width: reminderSettingsToggle ? 415 : 200
                }}>

                <Space
                    direction="vertical"
                    style={{
                        width: reminderSettingsToggle ? '50%' : '100%',
                        borderRight: reminderSettingsToggle ? '2px solid #f9f9f9' : 'none',
                        paddingRight: reminderSettingsToggle ? 10 : 0,
                        lineHeight: 1
                    }}
                >
                    {customEventProps.isHidden &&
                        <>
                            <Typography.Text strong>Hidden For</Typography.Text>
                            <ul>
                                {customEventProps.exceptionCommuinties?.map((exception: any) => { return <li key={exception?.id}>{exception?.community?.name}</li>; })}
                            </ul>
                            <Divider style={{ marginBlock: 2 }} />
                        </>
                    }
                    {dayjs(arg.event.start).format('h:mm') + ' - ' + dayjs(arg.event.end).format('h:mm')}
                    <div style={{ wordBreak: 'break-all' }}>{arg.event.title}</div>
                    {getEventLabel(customEventProps.scheduledClassType as EventTypes, false)}
                    {customEventProps.isRecurring ? 'recurring' : 'non-recurring'}

                    {selectedEvent.isAccessable && (!user?.hostOnlyCommunityIds?.includes(selectedEvent.communityId) || permissionsData === 'TelevedaAdmin') &&
                        <>
                            <Divider style={{ marginBlock: 2 }} />
                            <Button onClick={() => setReminderSettingsToggle(prevVal => !prevVal)}>Email Notifications</Button>
                        </>
                    }

                </Space>

                {reminderSettingsToggle &&
                    <Space direction="vertical" style={{ width: '50%', paddingLeft: 10 }}>
                        <Typography.Text strong>Your notifications</Typography.Text>
                        <Form layout="vertical" form={reminderForm} onFinish={reminderFormOnFinish}>
                            <Form.Item
                                style={{ marginBottom: 0 }}
                                name="feedback"
                                valuePropName="checked"

                                initialValue={feedbackLength && feedbackLength > 0}
                            >
                                <Checkbox>Event feedback</Checkbox>
                            </Form.Item>
                            <Form.Item
                                name="reminder"
                                valuePropName="checked"
                                initialValue={reminderLegth && reminderLegth > 0}
                            >
                                <Checkbox>Event reminder</Checkbox>
                            </Form.Item>
                            <Form.Item
                                noStyle
                                shouldUpdate={(prevValues, currentValues) => prevValues.reminder !== currentValues.reminder}
                                preserve={true}
                            >
                                {({ getFieldValue }) =>
                                    getFieldValue('reminder') === true ? (
                                        <Form.Item
                                            style={{ marginTop: -15 }}
                                            label={'Minutes before the event'}
                                            name="reminderOffset"
                                            initialValue={
                                                customEventProps.reminders?.find((reminder: IScheduledClassReminder) => {
                                                    return reminder.scheduledClassId === customEventProps.scheduledClassId
                                                })?.reminderOffset || 30
                                            }
                                            rules={[
                                                {
                                                    validator: async () => {
                                                        const value = reminderForm.getFieldValue('reminderOffset')
                                                        if (!value) return Promise.reject(
                                                            new Error("Value is empty or not a number"),
                                                        );
                                                        try {
                                                            const number = parseInt(value)
                                                            if (number < 5 || number > 120) {
                                                                return Promise.reject(
                                                                    new Error("Value must be between 5 and 120"),
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
                                            <Input type="number" style={{ width: 100 }} min={5} max={120} />

                                        </Form.Item>
                                    ) : null
                                }
                            </Form.Item>
                            <Form.Item
                                noStyle
                                shouldUpdate={
                                    (prevValues, currentValues) => (prevValues.reminder !== currentValues.reminder) || (prevValues.feedback !== currentValues.feedback)
                                }
                                preserve={true}
                            >
                                {({ getFieldValue }) =>
                                    <Space direction="horizontal">
                                        {customEventProps.haveNotifications ?
                                            <Button type="primary" htmlType="submit" icon={null}>
                                                Update Notifications
                                            </Button>
                                            :
                                            <Tooltip title="Please choose at least one notification">
                                                <Button
                                                    disabled={!getFieldValue("feedback") && !getFieldValue("reminder")}
                                                    type="primary"
                                                    htmlType="submit"
                                                    icon={null}
                                                >
                                                    Enable Notifications
                                                </Button>
                                            </Tooltip>
                                        }
                                    </Space>
                                }
                            </Form.Item>
                        </Form>
                    </Space>
                }

            </div>
        )
    }

    const setNewOccurenceTime = (eventInfo?: { drag: EventDropArg | undefined, classId: string }, scheduledClass?: IScheduledClass) => {

        let type = radioValue;

        if (!eventInfo) {
            eventInfo = draggedEvent;
        }
        else {
            type = ScheduledClassAlterOccurrenceTypes.All;
        }

        const currentEvent = eventsData.filter((event) => {
            return event.id === eventInfo?.drag?.event?.id;
        })

        const currentEventFromRequest = fetchedEvents?.data?.filter((event: any) => {
            return event.id === currentEvent[0].scheduledClassId;
        })

        if (!scheduledClass) {
            scheduledClass = currentEventFromRequest?.at(0)
        }

        if (currentEvent) {
            updateSingleOccurrenceTimeMutation({
                resource: "scheduled-class",
                values: {
                    ...scheduledClass, timezone: JSON.stringify({ current: moment.tz.guess(), requested: scheduledClass?.timezone }),
                    type,
                    oldDate: currentEvent[0]?.oldDate,
                    editTo: moment(eventInfo?.drag?.event?.start),
                },
                id: currentEvent[0].scheduledClassId as string
            }, {
                onSuccess: () => {
                    fetchScheduledEvents();
                    setDraggedEvent(undefined);
                    setRadioValue(ScheduledClassAlterOccurrenceTypes.Single);
                },
                onError: () => {
                    draggedEvent?.drag?.revert();
                    setDraggedEvent(undefined);
                    setRadioValue(ScheduledClassAlterOccurrenceTypes.Single);
                }
            });
        }
    }

    const CustomEventContent: React.FC<{ arg: EventContentArg }> = ({ arg }) => {

        // Trying to recreate the default styling since I did not find a way to just add extra stuff on top of it.
        let eventTimeFontSize = 11;
        let eventTitleFontSize = 12;
        let eventTime = dayjs(arg.event.start).format('h:mm') + ' - ' + dayjs(arg.event.end).format('h:mm');
        let divStyleProps: CSSProperties | undefined = { display: 'block' }

        if (arg.event.extendedProps.eventDuration < 45) {
            eventTimeFontSize = 10;
            eventTitleFontSize = 10;
            eventTime = dayjs(arg.event.start).format('h:mm') + ' - ' + dayjs(arg.event.end).format('h:mm') + ' -';
            divStyleProps = { display: 'flex', alignItems: 'center' }
        }

        if (arg.event.display === 'background') return null;

        return (
            <Popover
                key={arg.event.id}
                // Potentially could break if we change the verison of the fullcalendar library :)
                getPopupContainer={() => document.querySelector('div.fc-scroller.fc-scroller-liquid-absolute') || document.body}
                placement="top"
                open={arg.event.id === selectedEvent?.id && !hidePopover
                    // :)
                    && (calendarRef.current?.calendar.currentDataManager.state.currentViewType === 'timeGridWeek' ?
                        (arg.isStart || arg.event.start?.getDay() === 6) : arg.isStart)
                }
                showArrow={false}
                content={
                    <PopoverClassContent arg={arg} />
                }
            >
                <div style={{
                    overflow: 'hidden',
                    height: 'inherit',
                    ...divStyleProps
                }}>
                    <div style={{
                        fontSize: eventTimeFontSize,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        minWidth: '50%'
                    }}>
                        {arg.event.extendedProps.isHidden &&
                            <EyeInvisibleOutlined width={20} height={20} style={{ fontSize: 17, marginLeft: 3, marginTop: 1 }} />}
                        {arg.event.extendedProps.haveNotifications &&
                            <NotificationFilled width={20} height={20} style={{ fontSize: 17, marginLeft: 3, marginTop: 1 }} />}
                        {eventTime}
                    </div>
                    <div style={{
                        fontSize: eventTitleFontSize,
                        wordBreak: 'break-all'
                    }}>
                        {arg.event.title}
                    </div>
                </div>
            </Popover>
        );
    }

    const renderAlterPublicClassVisibilityBtns = () => {
        return (
            <AlterPublicClassVisibilityButtons
                communitySelectPropsData={communitySelectPropsData}
                onSuccessFn={handleAlterPublicClassVisibilityEvent}
                setHidePopover={setHidePopover}
                selectedEvent={selectedEvent} />
        )
    }

    const renderEventControls = () => {
        if (!hasSelectedEvent()) return null;
        if (hasSelectedWebexEvent()) {
            if (selectedEvent.isAccessable) {
                return (
                    <>
                        <Button icon={<EditOutlined />} onClick={handleEditEvent} key="event_edit_btn">
                            Edit
                        </Button>
                        <Button icon={<LinkOutlined />} onClick={handleCopyLink} key="event_copy_link_btn">
                            Copy Link
                        </Button>

                        {selectedEvent && selectedEvent.isCanceled ?
                            <Button icon={<RetweetOutlined />} onClick={handleCancelEvent} key="event_cancel_btn">
                                Restore
                            </Button>
                            :
                            <DeleteScheduledClassButton
                                classRecurring={selectedEvent.isRecurring}
                                modalBtnIcon={<StopOutlined />}
                                modalBtnTxt="Cancel"
                                modalTitle="Cancel a Webex event"
                                onSuccessFn={handleCancelEvent}
                                setHidePopover={setHidePopover}
                                modalMessage={`Are you sure you want to cancel${selectedEvent.title}?`}
                                modalBtnType="dashed" />
                        }

                        {permissionsData && permissionsData === 'TelevedaAdmin' && selectedEvent.scheduledClassVisibilityType === 'public' &&
                            renderAlterPublicClassVisibilityBtns()
                        }

                        {(!user?.hostOnlyCommunityIds.includes(selectedEvent.communityId) || permissionsData === "TelevedaAdmin") &&
                            <DeleteScheduledClassButton
                                classRecurring={selectedEvent.isRecurring}
                                modalBtnIcon={<DeleteOutlined />}
                                modalBtnTxt="Delete" modalTitle="Delete a Webex event"
                                onSuccessFn={(type) => handleDeleteWebexEvent(type)}
                                setHidePopover={setHidePopover}
                                modalMessage={selectedEvent.isRecurring ? `Delete recurring event ${selectedEvent.title}` : `Are you sure you want to delete ${selectedEvent.title}?`}
                                defaultType={selectedEvent.isRecurring ? ScheduledClassAlterOccurrenceTypes.Single : ScheduledClassAlterOccurrenceTypes.All}
                                modalBtnType="primary" />
                        }
                    </>
                );
            }
            return (
                <>
                    <Button icon={<LinkOutlined />} onClick={handleCopyLink} key="event_copy_link_btn">
                        Copy Link
                    </Button>
                    {renderAlterPublicClassVisibilityBtns()}
                </>
            )
        }
        {
            if (selectedEvent.isAccessable) {
                return (
                    <>
                        <Button icon={<EditOutlined />} onClick={handleEditEvent} key="event_edit_btn">
                            Edit
                        </Button>
                        <Button icon={<LinkOutlined />} onClick={handleCopyLink} key="event_copy_link_btn">
                            Copy Link
                        </Button>

                        {selectedEvent && selectedEvent.isCanceled ?
                            <Button icon={<RetweetOutlined />} onClick={handleCancelEvent} key="event_cancel_btn">
                                Restore
                            </Button>
                            :
                            <DeleteScheduledClassButton
                                modalBtnIcon={<StopOutlined />}
                                classRecurring={selectedEvent.isRecurring}
                                modalBtnTxt="Cancel"
                                modalTitle="Cancel an event"
                                onSuccessFn={handleCancelEvent}
                                setHidePopover={setHidePopover}
                                modalMessage={`Are you sure you want to cancel ${selectedEvent.title}?`}
                                modalBtnType="dashed" />
                        }

                        {permissionsData && permissionsData === 'TelevedaAdmin' && selectedEvent.scheduledClassVisibilityType === 'public' &&
                            renderAlterPublicClassVisibilityBtns()
                        }

                        {(!user?.hostOnlyCommunityIds.includes(selectedEvent.communityId) || permissionsData === "TelevedaAdmin") &&
                            <DeleteScheduledClassButton
                                modalBtnIcon={<DeleteOutlined />}
                                classRecurring={selectedEvent.isRecurring}
                                modalBtnTxt="Delete"
                                modalTitle="Delete an event"
                                onSuccessFn={(type) => handleDeleteEvent(type)}
                                setHidePopover={setHidePopover}
                                modalMessage={selectedEvent.isRecurring ? `Delete recurring event ${selectedEvent.title}` : `Are you sure you want to delete ${selectedEvent.title}?`}
                                defaultType={selectedEvent.isRecurring ? ScheduledClassAlterOccurrenceTypes.Single : ScheduledClassAlterOccurrenceTypes.All}
                                modalBtnType="primary" />
                        }
                    </>
                )
            }

            return (
                <>
                    <Button icon={<LinkOutlined />} onClick={handleCopyLink} key="event_copy_link_btn">
                        Copy Link
                    </Button>
                    {renderAlterPublicClassVisibilityBtns()}
                </>
            )
        }
    }

    return (
        <>
            <TelevedaList
                title={
                    <div style={{ display: 'flex', overflow: 'inherit', alignItems: 'center', gap: 20 }}>
                        <span>Live Events</span>
                        <Popover placement="bottom" title="Color Legend" content={
                            <Space direction="vertical">
                                <Space direction="horizontal">
                                    <div style={{ height: 10, width: 20, backgroundColor: '#3788d8' }}></div>
                                    <span>Active events you manage</span>
                                </Space>
                                <Space direction="horizontal">
                                    <div style={{ height: 10, width: 20, backgroundColor: '#808080' }}></div>
                                    <span>Cancelled events you manage</span>
                                </Space>
                                <Space direction="horizontal">
                                    <div style={{ height: 10, width: 20, backgroundColor: '#ff0000' }}></div>
                                    <span>Selected event</span>
                                </Space>
                                <Space direction="horizontal">
                                    <div style={{ height: 10, width: 20, backgroundColor: '#660404' }}></div>
                                    <span>Other public events</span>
                                </Space>
                            </Space>
                        }>
                            <span style={{ fontSize: 26, color: '#532d7f' }}>
                                <InfoCircleOutlined />
                            </span>
                        </Popover>
                        <Typography.Text>Calendar timezone: {moment.tz.guess()} {moment(calendarFilters.startDate).add(1, 'day').format('ZZ')} {moment(calendarFilters.startDate).add(1, 'day').isDST() ? '- Daylight savings time' : ''}</Typography.Text>
                    </div>
                }
                listProps={{
                    headerProps: {
                        extra: [
                            <Space size={[8, 16]} wrap key="event_action_btns">
                                <Space direction="vertical" style={{ width: 'fit-content', marginRight: 10 }}>
                                    <Space>
                                        {permissionsData as any && permissionsData != 'TelevedaAdmin' &&
                                            <>
                                                <Checkbox onChange={handleManagedEventsCheckboxChange} />
                                                <span>Show only my community events</span>
                                            </>}
                                    </Space>
                                    <Space>
                                        {permissionsData as any && permissionsData != 'TelevedaAdmin' &&
                                            <>
                                                {/* @ts-ignore*/}
                                                <Checkbox onChange={handleHostedEventsCheckboxChange} />
                                                <span>Show only events where I’m the host</span>
                                            </>}
                                    </Space>
                                </Space>
                                <FilterButton
                                    filters={[]}
                                >
                                    <Row gutter={[5, 5]}>
                                        <Form form={filterForm} >
                                            <Col>
                                                <Form.Item
                                                    name={'selectFilter'}>
                                                    <Select {...communitySelectProps} placeholder="Filter by community" allowClear mode="multiple" style={{ width: "300px" }} onChange={handleCommunityfilterChange} />
                                                </Form.Item>
                                            </Col>

                                            <Col>
                                                <Form.Item>
                                                    <Select placeholder="Filter by type" allowClear mode="multiple" style={{ width: '300px' }} onChange={handleClassTypeFilterChange}
                                                        options={[
                                                            { value: EventTypes.LOCAL, label: 'Televeda Live' },
                                                            { value: EventTypes.EXTERNAL, label: 'External' },
                                                            { value: EventTypes.TELEVEDA_BINGO, label: 'Bingo' },
                                                            { value: EventTypes.VTC, label: 'VTC' },
                                                            { value: EventTypes.IN_PERSON, label: 'In Person' },
                                                            { value: EventTypes.EMBEDDED, label: 'Old On-demand' },
                                                        ]} />
                                                </Form.Item>
                                            </Col>
                                        </Form>
                                    </Row>
                                </FilterButton>

                                {
                                    renderEventControls()
                                }

                                <Dropdown overlay={dropdownMenu} placement="bottomLeft">
                                    <Button type="primary" icon={<DownOutlined />}>Create</Button>
                                </Dropdown>
                            </Space>

                        ]
                    }
                }}
            >
                <div id={'react-full-calendar'} style={{ position: "relative", width: "100%" }}>
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay',
                        }}
                        initialView="timeGridWeek"
                        editable={true}
                        eventDurationEditable={false}
                        selectable={true}
                        selectAllow={(selectInfo) => { return selectInfo.start > new Date(); }}
                        eventAllow={(dropInfo) => { return dropInfo.start > new Date(); }}
                        eventContent={(arg) => { return <CustomEventContent arg={arg} /> }}
                        selectMirror={true}
                        dayMaxEvents={true}
                        snapDuration={'00:01:00'}
                        events={eventsData}
                        nowIndicator={true}
                        //events={fetchEventsFn}
                        eventDragStart={() => { if (selectedEvent) setHidePopover(true) }}
                        eventDragStop={() => { if (selectedEvent) setHidePopover(false) }}
                        eventDrop={handleEventDrop}
                        datesSet={handleDatesSet}
                        eventClick={handleEventClick}
                        select={handleDateSelect}
                    />
                    {isFetchingEvents ?
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 0,
                            textAlign: "center",
                            height: '100%',
                            width: '100%',
                            backgroundColor: "rgba(0, 0, 0, 0.45)",
                            opacity: '1',
                            zIndex: '20'
                            // display: "flex",
                            // flex: '0 0 100%',
                            // alignItems: 'center',
                            // alignContent: 'center'
                        }}>
                            <Spin
                                size="large"
                                tip="Loading..."
                                style={{
                                    //margin: "20 0",
                                    //marginBottom: "20px",
                                    //padding: "30px 50px",
                                    position: 'relative',
                                    textAlign: "center",
                                    //background: rgba(0, 0, 0, 0.05);
                                    borderRadius: "4px",
                                    top: "50%",
                                    transform: "translateY(-50%)"
                                }}
                            />
                        </div>
                        : null
                    }
                </div>

            </TelevedaList>

            <EditClassModal
                editEventModal={editEventModal}
                setEditEventModal={setEditEventModal}
                radioValue={radioValue}
                setRadioValue={setRadioValue}
                draggedEvent={draggedEvent || { drag: undefined, classId: '' }}
                setNewOccurenceTime={setNewOccurenceTime}
            />

            <Modal
                title="Edited On-Demand events"
                open={editWarningModal}
                footer={
                    <Button type="primary" onClick={() => setEditWarningModal(false)}>
                        Ok
                    </Button>
                }
            >
                <Space direction="vertical">
                    <Typography.Text><b>Event was linked to the following on-demand events.</b></Typography.Text>
                    <ul>
                        {editWarningEvents.map((event) => {
                            return (
                                <li>{event}</li>
                            )
                        })}
                    </ul>

                </Space>
            </Modal>

            <ScheduledClassCreateWithDrawer
                formId="createDrawerForm"
                drawerProps={createDrawerProps}
                title="Create Scheduled Class"
                formProps={createFormProps}
                saveButtonProps={createSaveButtonProps}
                action="create"
                formLoading={false}
                showTypeSelection
            />
            <ScheduledClassCreateWithDrawer
                formId="editDrawerForm"
                drawerProps={editDrawerProps}
                title="Edit Scheduled Class"
                formProps={editFormProps}
                saveButtonProps={editSaveButtonProps}
                action="edit"
                formLoading={editFormLoading}
                showTypeSelection
            />
            <ScheduledClassCreateWithDrawer
                formId="createWebexDrawerForm"
                drawerProps={webexCreateDrawerProps}
                title="Create Webex Scheduled Class"
                formProps={webexCreateFormProps}
                saveButtonProps={webexCreateSaveButtonProps}
                action="create"
                formLoading={false}
                showTypeSelection={false}
                preselectedClassType={EventTypes.WEBEX}
            />
            <ScheduledClassCreateWithDrawer
                formId="editWebexDrawerForm"
                drawerProps={webexEditDrawerProps}
                title="Edit Webex Scheduled Class"
                formProps={webexEditFormProps}
                saveButtonProps={webexEditSaveButtonProps}
                action="edit"
                formLoading={webexIsLoading || webexEditLoading}
                showTypeSelection={false}
                preselectedClassType={EventTypes.WEBEX}
            />
        </>
    );
};
