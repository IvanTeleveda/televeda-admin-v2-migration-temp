import { DashboardConfig } from "../pages/custom-reports/types";
import { EventTypes } from "../utils/enums";

export type NotificationType = "success" | "error" | "progress";

export type UserPermissions = "TelevedaAdmin" | "CommunityManager" | "CommunityHost";
export interface ICategory {
  id: string;
  title: string;
}
export interface IPost {
  id: string;
  title: string;
  content: string;
  status: "published" | "draft" | "rejected";
  createdAt: string;
  category: ICategory;
}
export interface ICalendarEvent {
  id: string;
  scheduledClassId?: string;
  isCanceled?: boolean;
  isRecurring?: boolean;
  isAccessable?: boolean;
  isHidden?: boolean;
  isSelected?: boolean;
  eventDuration?: number;
  scheduledClassType?: Omit<EventTypes, EventTypes.EMBEDDED | EventTypes.ON_DEMAND>
  scheduledClassVisibilityType?: "public" | "community" | "hidden";
  exceptionCommuinties?: Array<{
    communityId: string;
    community: { name: string };
  }>;
  haveNotifications?: boolean;
  reminders?: IScheduledClassReminder[];
  communityId?: string;
  title?: string;
  oldDate?: Date | string;
  start: Date | string;
  end: Date | string;
  backgroundColor: string;
  originalBackgroundColor?: string;
  editable?: boolean;
  display?:
    | "auto"
    | "block"
    | "list-item"
    | "background"
    | "inverse-background"
    | "none";
  overlay?: boolean;
}

export interface IScheduledClassReminder {
  id: string;
  userEmail: string;
  reminderFor: "Manager" | "Member" | "Host";
  scheduledClassId: string;
  scheduledClassFor: Date;
  reminderOffset: number;
  receiveFeedback: boolean;
}

export interface ICommunity {
  id: string;
  name: string;
  logo: string;
  displayName: string;
  UserCommunityAssociation?: IUserCommunityAssociation;
  communityManagers: IUser[];
  sponsorId: string;
  registrationType?: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface ICommunitySponsors {
  id: string;
  name: string;
  email: string;
  logo: string;
  phone: string;
  siteLink: string;
  sponsorInfo: string;
  sponsorForm: string;
}

export interface IClassData {
  id: string;
  name: string;
  community: ICommunity;
}

export interface IScheduledClass {
  id: string;
  title: string;
  classUrl?: string;
  community: ICommunity;
  classType: EventTypes;
  startDate: string;
  endDate: string;
  oldDate: string;
  timezone:
    | {
        current: string;
        requested: string;
      }
    | string;
  duration: number;
}

export interface IAuthLog {
  id: string;
  username: string;
  email: string;
  timestamp: Date;
  action: string;
}

export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  auth0Id: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  memberOfCommunities?: ICommunity[];
  accountData: IUserAccountData;
}

export interface IUserAccountData {
  id: string;
  isTelevedaAdmin: boolean;
  mobilePhoneNumber: string;
  isActive: boolean;
}

export interface IRefineUser {
  id: string;
  auth0Id: string;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  icon: string;
  countAs: number;
  externalId: string;
  createAt: Date;
  updatedAt: Date;
  deleteAt: Date;
  roles: Array<'TelevedaAdmin' | 'CommunityManager' | 'CommunityHost'>;
  surveyPermission: {
    general: boolean,
    master: boolean
  };
  picture: string;
  name: string;
  hostOnlyCommunityIds: string[];
}

export interface ICommunityCodes {
  id?: string;
  code: string;
  signupCount: number;
  isCommunity?: boolean;
}

export interface IClassCodes {
  id: string;
  classId: string;
  hashedPass: string;
  expirationDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IClassReportData {
  id: string;
  className: string;
  classScheduledFor?: Date;
  scheduledFor?: Date;
  timestamp?: Date;
  scheduledClassId: string;
  communityName: string;
  classType: EventTypes;
  isScheduledClass: boolean;

  startedAt: Date;
  endedAt: Date;
  hasVideoRecordings: boolean;

  participantsCount: number;
  participantId: string;
  info: string;
  classReportOverridden: boolean;
  canSeeOverrideButton: boolean;
  overriddenBy: string;

  hybridAttendanceCount: number;
}

export interface IClassAttendee {
  classType: EventTypes;
  participantName: string;
  participantEmail: string;
  participantId: string;
  communityName: string;
}

export interface IMemberHistory {
  participantId: string;
  className: string;
  timestamp: Date;
  eventType: number;
}

export interface IClassArchive {
  id: string;
  url: string;
  timestamp: string;
  classScheduledFor: Date;
  scheduledClassId: string;
}

export interface IClassSessionEventArchives {
  id: string;
  url: string;
  timestamp: string;
  classScheduledFor: Date;
  scheduledClassId: string;
  className?: string;
  archive: {
    url: string;
    timestamp: Date;
  };
}

export interface IWebexRecording {
  id: string;
  topic: string;
  playbackUrl: string;
  downloadUrl: string;
  password: string;
  status: string;
}

export interface IClassSessionEvent {
  id: string;
  eventType: number;
  timestamp: string;
}

export interface IClassFeedback {
  id: string;
  feedbackType: number;

  userName: string;
  userEmail?: string;
  communityName?: string;
  note?: string;

  feedbackData?: {
    technicalIssues?: string;
    ratingInstructor?: number;
    ratingClassContent?: number;
    supportedConnected?: string;
    type?: 'survey';
    surveyId?: string;
    data: Object;
    json: Object;
  };
}

export interface IVTCClassFeedback {
  metadata: {
    avatarImage: string;
    clans: string;
    tribes: string;
    militaryService: string;
    id: string;
    name: string;
    email: string;
    communityId: string;
    communityName: string;
    isAnonymous: boolean;
    isFlagged: boolean;
  },
  feedback: {
    [key: string]: any;
    // Legacy fields for backwards compatibility
    isSessionHelpfull?: 'yes' | 'no' | 'null';
    sessionHelpful?: 'yes' | 'no' | 'null';
    feedbackText?: string;
    technicalIssues?: 'yes' | 'no' | 'null';
    technicalIssuesText?: string;
    supportedConnected?: 'yes' | 'no' | 'null';
  },
  communityId: string;
  communityName: string;
  coveredEntity: boolean;
  isFacilitator: boolean;
}

export interface IMemberFilterVariables {
  email?: string;
  firstName?: string;
  lastName?: string;
  communityIds?: Array<string>;
  createdAt?: any[];
  isActive?: boolean;
}

export interface IUserCommunityAssociation {
  id: string;
  associationType: string;
  community: ICommunity;
  communityId: string;
  isInstructor?: number;
  createdAt: Date;
  updatedAt: Date;
  user: IUser;
  userId: string;
}

export interface IUserFilterVariables {
  email?: string;
  firstName?: string;
  lastName?: string;
  associationType?: string[];
  communityIds: string[];
  createdAt?: any[];
  updatedAt?: any[];
  isActive: boolean;
  noAssociation: boolean;
}

export interface IGeneralOptions {
  id?: string;
  monthly_calendar_url?: string;
  bingo_card_logo?: string;
  createdAt?: any[];
  updatedAt?: any[];
}

export interface IOnDemandClass {
  id?: string;
  title: string;
  communityId: string;
  classImage: string;
  instructorImage: string;
  externalUrl: string;
  privacyType?: string;
  visibilityType: string;
  summary: string;
  description: string;
  community: ICommunity;
  category?: string;
  categoryId: string;
}

export interface INotificationTemplates {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  description: string;
  notificationHistory: EmailHistory[];
  associations?: INotificationTemplateAssociation[];
  createdAt?: any[];
  updatedAt?: any[];
}
interface INotificationTemplateAssociation {
  id: string;
  community: {
    id: string;
    name: string;
  }
}

export interface ICustomReportTemplate {
  id: string;
  name: string;
  communityIds: string[];
  occurrence: string;
  startDate: string;
  endDate: string;
  configJSON: DashboardConfig;
  associations: {
    id: string;
    reportId: string;
    communityId: string;
    community: {
      id: string;
      name: string;
    }
  }[];
  createdAt?: any[];
  updatedAt?: any[];
}

export interface IEmailTemplate {
  id: string;
  name: string;
  communityId: string;
  communitySpecific: boolean;
  templateType?: string;
  sender: string;
  subject: string;
  json: string;
  html: string;
  type: string;
  manualEmails?: EmailHistory[];
  createdAt?: any[];
  updatedAt?: any[];
}

export interface ISurvey {
  id: string;
  name: string;
  json: string;
  autoEmail: boolean;
  systemSurvey: boolean;
  communityAssociations?: {
    id: string;
    communityId: string;
    isPublished: boolean;
  }[];
  scheduledClassAssociations?: {
    id: string;
    scheduledClassId: string;
    scheduledClass?: {
      id: string;
      title: string;
      communityId: string;
      startDate: string;
    }
    isPublished: boolean;
  }[];
  surveyEmails: EmailHistory[];
  surveyRenders: {
    id: string;
    render_at: string;
  }[];
}

export interface EmailHistory {
  id: string;
  associationId: string;
  sender: {
    email: string;
  };
  totalUsers: number;
  status: string;
  configJson: any;
  createdAt: string;
}

export interface IOnboardingHistory {
  id: string;
  userId: string;
  user: {
    id: string
    firstName: string;
    lastName: string;
    email: string;
  };
  community: {
    name: string;
  };
  communityId: string;
  withReferral: boolean;
  request: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISurveyAssociations {
  survey: {
    id: string;
    name: string;
    json: string;
    systemSurvey: boolean;
  };
  communityAssociations: {
    id: string;
    communityId: string;
    surveyId: string;
    isPublished: boolean;
    createdAt: Date;
    updateAt: Date;
  }[];
  scheduledClassAssociations: {
    id: string;
    scheduledClassId: string;
    surveyId: string;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
  }[];
  surveyRenders: {
    id: string;
    surveyId: string;
    render_at: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
  hasEntries: boolean;
}

export interface ICommunityResource {
  id?: string;
  communityId: string;
  resourceType: string;
  fileName: string;
  downloadUrl: string;
  extension?: string;
  order: number;
  description?: string;
}

export interface IDefaultCommunityResource {
  id?: string;
  resourceType: string;
  fileName: string;
  downloadUrl: string;
  extension?: string;
  order: number;
  description?: string;
}
export interface ICommunityCollection {
  id?: string;
  communityId: string;
  title: string;
  description: string | undefined;
  visibility: 0 | 1 | 2;  // 0 - hidden, 1 - public, 2 - private
  order: number;
  community?: any;
  exceptions?: any;
}

export interface ICommunityCollectionItem {
  id?: string;
  collectionId: string;
  title?: string;
  description?: string | undefined;
  resourceType?: string;
  fileName?: string;
  fileSize?: number;
  downloadUrl: string;
  extension?: string;
  linkImageDownloadUrl?: string;
  linkImageFileName?: string;
  linkImageCropDownloadUrl?: string;
  linkImageCropFileName?: string;
  dropdownImage?: string;
  order?: number;
  itemFile?: any;
  itemLinkImage?: any;
  thumbnailImage?: any
  visibility?: any;
  uploader?: any;
  // visibility: 0 | 1 | 2;  // 0 - hidden, 1 - public, 2 - private
}

export interface ResourceFile<T = any> {
  uid: string;
  url: string;
  description: string;
  fileName: string;
  extension: string;
  order: number;
  associations?: string[];
  isDefault?: boolean;
}

export interface ISelectOption {
  label: string;
  value: string;
}

export interface ICommunityFilterVariables {
  //name?: string;
  communityIds?: Array<string>;
  managerEmail: string;
}

export interface  IClassCategory {
  id?: string;
  parentId: string;
  title: string;
  imageUrl: string | undefined;
  order: number;
}