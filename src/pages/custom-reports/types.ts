import { Layout as RGL_Layout } from 'react-grid-layout';

export enum WidgetType {
  TEXT = 'TEXT_WIDGET',
  RICH_TEXT = 'RICH_TEXT_WIDGET', // CKEditor
  FILE_UPLOAD = 'FILE_UPLOAD_WIDGET',
  FEEDBACK_TABLE = 'FEEDBACK_TABLE',
  MEMBER_REPORT_TABLE = 'MEMBER_REPORT_TABLE_WIDGET',
  HOST_REPORT_TABLE = 'HOST_REPORT_TABLE_WIDGET',
  ANALYTICS_WIDGET = 'ANALYTICS_WIDGET',
  EVENT_CANCELATIONS_WIDGET = 'EVENT_CANCELATIONS_WIDGET'
}

export interface BaseWidgetConfig {
  i: string;
  componentType: WidgetType;
}

export interface TextWidgetConfig extends BaseWidgetConfig {
  componentType: WidgetType.TEXT;
  content: string;
}

export interface RichTextWidgetConfig extends BaseWidgetConfig {
  componentType: WidgetType.RICH_TEXT;
  content: string;
}

export interface FileUploadWidgetConfig extends BaseWidgetConfig {
  componentType: WidgetType.FILE_UPLOAD;
  fileName?: string;
  isLoading?: boolean;
  fileUrl?: string;
  filePath?: string;
}

export interface FeedbackTableWidgetConfig extends BaseWidgetConfig {
  componentType: WidgetType.FEEDBACK_TABLE;
  dataSourceKey: string;
  aggregationType?: FeedbackTableAggregationType;
}

export interface MemberReportTableWidgetConfig extends BaseWidgetConfig {
  componentType: WidgetType.MEMBER_REPORT_TABLE;
  defaultDateRange?: [string, string]; // [ISOString, ISOString]
  defaultCommunityIds?: string[];
}
export interface HostReportTableWidgetConfig extends BaseWidgetConfig {
  componentType: WidgetType.HOST_REPORT_TABLE;
  defaultDateRange?: [string, string]; // [ISOString, ISOString]
  defaultCommunityIds?: string[];
}

export interface AnalyticsWidgetConfig extends BaseWidgetConfig {
  componentType: WidgetType.ANALYTICS_WIDGET;
  analyticsType: AnalyticsType;       // e.g., AnalyticsType.REGISTRATIONS
  displayFormat: AnalyticsDisplayFormat; // e.g., AnalyticsDisplayFormat.BOTH
}

export interface EventCancelationsWidgetConfig extends BaseWidgetConfig {
  componentType: WidgetType.EVENT_CANCELATIONS_WIDGET;
  cancelationType: CancelationTypes
}

export enum AnalyticsType {
  REGISTRATIONS = 'registrations',
  REMINDERS = 'reminders',
  ATTENDANCE = 'attendance',
  RETENTION = 'retention',
  EVENTS = 'events',
  PAGE_TIME = 'pageTime',
  ON_DEMAND = 'onDemand',
  VTC = 'vtc',
}

export enum AnalyticsDisplayFormat {
  TABLE_ONLY = 'tableOnly',
  CHART_ONLY = 'chartOnly',
  BOTH = 'both',
}

export enum FeedbackTableAggregationType {
  MEMBER_COMMUNITY = 'member',
  EVENT_COMMUNITY = 'event',
}

export enum CancelationTypes {
  HOST_NOT_STARTED = 'AUTO_CANCELED',
  MANUAL = 'CANCELED'
}
export interface ReportFilters {
  occurrenceId?: string;
  startDate?: string;
  endDate?: string;
  communityIds?: string[];
}

export interface WidgetFeedbackData {
  id: string;
  eventId: string;
  eventTitle: string;
  eventScheduledFor: string;
  feedbackType: string;
  isFromHost: boolean;
  userName: string;
  userEmail: string;
  surveyId?: string;
  surveyJSON?: any;
  data: Record<string, any>;
}

export interface FetchedFeedbackWidgetPayload {
  metadata: {
    sql: {
      uniqueSurveyIds: string[];
      hasDefaultEntries: boolean
      hasHostEntries: boolean;
    };
    noSql: { // For VTC
      // uniqueSurveyIds?: string[]; // If VTC ever gets distinct survey types
      hasDefaultEntries: boolean;
      hasHostEntries: boolean;
    };
  };
  data: WidgetFeedbackData[];        // SQL feedback data
  total: number;                     // Total SQL feedback entries
  vtcData: WidgetFeedbackData[];     // VTC feedback data
  vtcTotal: number;                  // Total VTC feedback entries
}

export interface IMemberReportDataRow {
  id: string;
  participantId: string;
  participantName: string;
  participantEmail: string;
  communityName: string;
  hybridAttendanceCount: number;
}

export type AppWidgetConfig =
  TextWidgetConfig
  | RichTextWidgetConfig
  | FileUploadWidgetConfig
  | FeedbackTableWidgetConfig
  | MemberReportTableWidgetConfig
  | HostReportTableWidgetConfig
  | AnalyticsWidgetConfig
  | EventCancelationsWidgetConfig;

export interface GridCellData {
  id: string;
  layout: RGL_Layout; // Defines x, y, w, h for the cell in the main RGL
  widgetId?: string; // ID of the widget contained within this cell (references AppWidgetConfig.i)
}

// For react-grid-layout's layouts state (managing GridCellData.layout)
export interface AppLayouts {
  [breakpoint: string]: RGL_Layout[];
}

// Data passed when dragging a menu item (widget type from menu)
export interface DraggableMenuItemData {
  type: WidgetType;
  isMenuItem: true;
  defaultWidth: number; // Default width for the widget itself (if applicable, not cell)
  defaultHeight: number; // Default height for the widget itself
}

export interface DashboardConfig {
  gridCells: GridCellData[];
  widgets: Record<string, AppWidgetConfig>;
  rglLayouts?: AppLayouts;
  reportName: string;
}