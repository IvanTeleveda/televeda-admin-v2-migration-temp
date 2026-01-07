import { Dayjs } from "dayjs";
import moment from "moment";

export interface PageTimeData {
    event_date: string;
    page: string;
    total_time_spent: number;
}

export interface ReminderAnalyticsQuery {
    start_date: string;
    title: string | null;
    group_key: string | null;
    value: number | null;
}

export interface BaseTableRow {
    key: string;
    date: string;
    rawDate: string;
    total: number;
}

export interface PageTimeTableRow extends BaseTableRow {
    pageData: Record<string, number>; // Maps page names to time spent
}

export interface ReminderTableRow extends BaseTableRow {
    groupKeys: string[];
    reminderData: Record<string, number>; // Maps group keys to values
}

export interface PageTimeTableData {
    tableRows: PageTimeTableRow[];
    allPages: string[];
}

export interface ReminderTableData {
    tableRows: ReminderTableRow[];
    groupKeys: string[];
}

export interface ColumnTotals {
    total: number;
    // yeah this is kinda shit :_)
    [key: string]: number;
}

export type PageName = string & { readonly __brand: unique symbol };
export type GroupKey = string & { readonly __brand: unique symbol };

export interface StrictPageTimeTableRow extends BaseTableRow {
    pageData: Record<PageName, number>;
}

export interface StrictReminderTableRow extends BaseTableRow {
    groupKeys: GroupKey[];
    reminderData: Record<GroupKey, number>;
}

export interface CollectionItemEvent {
    event_date: string;
    event_count: number;
    eventType: string;
}

export interface EventsAnalyticsData {
    collectionItemsEvents: CollectionItemEvent[];
    sponsorEventsPeriod: number;
    sponsorEventsToDate: number;
    pageVisits: CollectionItemEvent[];
    pageVisitsPeriod: number;
    pageVisitsToDate: number;
}

export interface EventsTableProps {
    communityIds: string | string[] | undefined | null | number | { value: string; label: string };
    dateRange: [Dayjs, Dayjs];
    apiUrl: string;
}

export interface EventsTableDataItem {
    key: string;
    date: string;
    eventType: string;
    count: number;
    description: string;
    rawDate: string;
}

export interface AttendanceDataItem {
    date: string;
    count: number;
    type: "Selected Communities" | "All other communities";
}

export interface AnalyticsTableProps {
    communityIds: string | string[] | { value: string; label: string };
    dateRange: [moment.Moment, moment.Moment];
    apiUrl: string;
}

export interface TimeSpentData {
    event_date: string;
    page: string;
    total_time_spent: number;
}

export interface RegistrationAnalyticsQuery {
    start_date: string;
    registration_type: 'admin/bulk' | 'direct' | null;
    user_count: number;
}

export interface RetentionDataItem {
    interval_date: string;
    participantId: string;
    attendance_count: number;
    email?: string;
    first_name?: string;
}