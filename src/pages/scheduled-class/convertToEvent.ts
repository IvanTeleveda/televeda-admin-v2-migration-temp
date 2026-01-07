import dayjs from "dayjs";
import { v4 as uuidv4 } from 'uuid';
import { ICalendarEvent } from "../../interfaces";
import { EventTypes } from "../../utils/enums";

export const convertToEvent = (event: any) => {
    console.log("Converting event: ", event);

    const tmpEventColor: string = event.isCanceled ? 'gray' : '#3788D8';
    const eventColor: string = event.isAccessable ? tmpEventColor : '#660404';

    const calendarEvent: ICalendarEvent = {
        id: uuidv4(),
        scheduledClassId: event.id,
        isCanceled: event.isCanceled,
        isRecurring: event.isRecurring,
        isAccessable: event.isAccessable,
        isHidden: event.isHidden,
        eventDuration: event.duration,
        scheduledClassType: event.classType ? event.classType : EventTypes.LOCAL,
        scheduledClassVisibilityType: event.visibilityType,
        exceptionCommuinties: event.calendarExceptions,
        haveNotifications: event.reminders.length > 0 ? true : false,
        reminders: event.reminders,
        communityId: event.communityId,
        title: event.title,
        oldDate: event.oldDate,
        start: event.startDate,
        end: dayjs(event.startDate).add(event.duration, 'minute').toISOString(),
        backgroundColor: eventColor,
        originalBackgroundColor: eventColor,
        editable: event.classType != EventTypes.WEBEX && event.isAccessable
    };

    return calendarEvent;
};