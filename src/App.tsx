import {
  Authenticated, Refine
} from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import { ErrorComponent } from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";

import routerBindings, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router-v6";
import { App as AntdApp, ConfigProvider } from "antd";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { ColorModeContextProvider } from "./contexts/color-mode";
import {
  CommunityCreate,
  CommunityEdit,
  CommunityList
} from "./pages/community";

import './App.css';
import 'ckeditor5/ckeditor5.css';

import { authProvider } from "./providers/AuthProvider";
import axios from "axios";

import CommunitiesIcon from './icons/communities_icon.svg?react';
import ScheduledClassesIcon from './icons/scheduled_classes_icon.svg?react';
import ClassReportsIcon from './icons/class_reports_icon.svg?react';
import MembersIcon from './icons/members_icon.svg?react';
import GeneralOptionsIcon from './icons/general_options_icon.svg?react';
import OutreachIcon from './icons/outreach_icon.svg?react';

import { CommunityResourcesList } from "./pages/community-resources/list";
import { CommunityResourcesEdit } from "./pages/community-resources/edit";
import { EmailTemplateCreate, EmailTemplateEdit, EmailTemplateList } from "./pages/outreact/automatic-emails";
import { ManualEmailList } from "./pages/outreact/manual-emails/list";
import { ManualEmailEdit } from "./pages/outreact/manual-emails/edit";
import { ManualEmailCreate } from "./pages/outreact/manual-emails/create";
import { CardGenerator } from "./pages/bingo/card-generator";
import CommunitySponsorList from "./pages/community-sponsors/list";
import CommunitySponsorEdit from "./pages/community-sponsors/edit";
import CommunitySponsorCreate from "./pages/community-sponsors/create";
import DefaultCommunitySponsorList from "./pages/default-community-resources/list";
import { GeneralOptions } from "./pages/general-options/general-options";
import { ClassReportAttendanceOverride, ClassReportShow, ReportList } from "./pages/report-classes";
import { AuthLogList } from "./pages/auth-log/list";
import AnalyticsList from "./pages/analytics/list";
import SponsorAnalyticsList from "./pages/analytics/sponsor-list";
import RadarDashboard from "./pages/radar";
import { ManagersList } from "./pages/managers/list";
import { HostsList } from "./pages/hosts";
import { UserCreate, UserList, UserShow } from "./pages/users";
import { NotificationsCreate, NotificationsEdit, NotificationsList } from "./pages/notifications";
import { ScheduledClassCreate, ScheduledClassList } from "./pages/scheduled-class";
import OnDemandList from "./pages/on-demand/list";
import { OnDemandClassCreate } from "./pages/on-demand/create";
import { OnDemandClassEdit } from "./pages/on-demand/edit";
import NestsxCrudDataProvider from "./providers/dataProvider-nest";
import { Footer, Header, Layout, OffLayoutArea, Sider, Title } from "./components/layout";
import { MemberShow, MembersList } from "./pages/members";
import { TwoFactorVerificationPage } from "./pages/login/totp-auth";
import { UserBulkCreate } from "./pages/users/create-bulk";
import { SurveysCreate, SurveysEdit, SurveysList, SurveySubmissions } from "./pages/surveys";
import { setLicenseKey } from "survey-core";
import { SurveySubmissionsManualEntry } from "./pages/surveys/manual-entry";
import { notificationProvider } from "./providers/notificationProvider";
import './widget.css';
import { ClassCategoryList } from "./pages/class-categories";
import ResourceList from "./pages/analytics/resource-list";
import { ResourceUsersShow } from "./pages/analytics/show";
import { CustomReportCreate, CustomReportEdit, CustomReportOccurrences, CustomReports, ReportExportPreview, ReportView } from "./pages/custom-reports";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;
console.log("SERVER_URL:", SERVER_URL);
const SURVEY_LICENSE = import.meta.env.VITE_SURVEY_LICENSE;

setLicenseKey(SURVEY_LICENSE);

function App() {
  const axiosInstance = axios.create({
    withCredentials: true,
    baseURL: SERVER_URL
  });
  console.log("Axios Base URL:", axiosInstance.defaults.baseURL);
  const dataProvider = NestsxCrudDataProvider(SERVER_URL, axiosInstance);

  return (
    <BrowserRouter basename="/admin">
      <ColorModeContextProvider>
        <AntdApp>
          {/* Overriders the theme and ignores the dark mode */}
          <ConfigProvider
            theme={{
              components: {
                Menu: {
                  radiusItem: 8,
                  colorItemText: "rgba(255, 255, 255, 0.7)",
                  colorItemTextSelected: "#FFFFFF",
                  colorItemTextHover: "#FFFFFF",
                  colorIcon: "rgba(255, 255, 255, 0.7)",
                  itemMarginInline: 5
                },
                Button: {
                  borderRadius: 10,
                  colorTextLightSolid: "#000000"
                },
                Form: {
                  fontWeightStrong: 900
                },
              },
              token: {
                colorPrimary: "#FEBF00",
                fontFamily: "Verdana"
              },
            }}
          >
            <Refine
              dataProvider={dataProvider}
              notificationProvider={notificationProvider}
              routerProvider={routerBindings}
              authProvider={authProvider}
              resources={[
                {
                  name: "Community",
                  options: {
                    label: "Community",
                    route: "community",
                    withPermission: ['TelevedaAdmin', 'CommunityManager']
                  },
                  icon: <CommunitiesIcon />,
                },
                {
                  parentName: "Community",
                  name: "community",
                  list: "/community",
                  create: "/community/create",
                  edit: "/community/edit/:id",
                  options: {
                    label: "Info",
                    route: "community",
                    withPermission: ['TelevedaAdmin', 'CommunityManager']
                  },
                },
                {
                  parentName: "Community",
                  name: "community-resources",
                  list: "/community-resources",
                  edit: "/community-resources/edit/:id",
                  options: {
                    label: "Resources",
                    route: "community-resources",
                    withPermission: ['TelevedaAdmin', 'CommunityManager']
                  },
                },
                {
                  name: "Schedule",
                  options: {
                    label: "Schedule",
                    route: "schedule",
                    withPermission: ['TelevedaAdmin', 'CommunityManager', 'CommunityHost']
                  },
                  icon: <ScheduledClassesIcon />,
                },
                {
                  parentName: "Schedule",
                  name: "live-events",
                  list: "/live-events",
                  options: {
                    route: 'scheduled_classes',
                    label: "Live Events",
                    withPermission: ['TelevedaAdmin', 'CommunityManager', 'CommunityHost']
                  },
                },
                {
                  parentName: "Schedule",
                  name: "on_demand_classes",
                  list: "/on-demand",
                  create: "/on-demand/create",
                  edit: "/on-demand/edit/:id",
                  options: {
                    route: 'on_demand_classes',
                    label: "On-demand",
                    withPermission: ['TelevedaAdmin', 'CommunityManager', 'CommunityHost']
                  },
                },
                {
                  parentName: "All Users",
                  name: "community-associations/members",
                  options: {
                    route: 'community-associations/members',
                    label: "Members",
                    withPermission: ['CommunityManager']
                  },
                  list: "/members",
                  show: "/members/show/:id"
                },
                {
                  name: "All Users",
                  options: {
                    label: "All Users",
                    route: "all-users",
                    withPermission: ['TelevedaAdmin', 'CommunityManager']
                  },
                  icon: <MembersIcon />,
                },
                {
                  parentName: "All Users",
                  name: "community-associations/managers",
                  options: {
                    route: 'community-associations/managers',
                    label: "Managers",
                    withPermission: ['TelevedaAdmin']
                  },
                  list: "/managers",
                },
                {
                  parentName: "All Users",
                  name: "community-associations/hosts",
                  options: {
                    route: 'community-associations/hosts',
                    label: "Instructors",
                    withPermission: ['TelevedaAdmin']
                  },
                  list: "/instructors",
                },
                {
                  parentName: "All Users",
                  name: "_User",
                  options: {
                    route: "_User",
                    label: "All Accounts",
                    withPermission: ['TelevedaAdmin']
                  },
                  list: "/all-accounts",
                  create: "/all-accounts/create",
                  show: "/all-accounts/show/:id",
                },
                {
                  name: "Data Reporting",
                  options: {
                    label: "Data Reporting",
                    withPermission: ['TelevedaAdmin', 'CommunityManager', 'CommunityHost']
                  },
                  icon: <ClassReportsIcon />,
                },
                {
                  parentName: "Data Reporting",
                  name: 'report_classes',
                  list: "/report-classes",
                  show: "/report-classes/show/:id",
                  edit: "/report-classes/edit/:id",
                  options: {
                    route: 'report_classes',
                    label: "Attendance report",
                    withPermission: ['TelevedaAdmin', 'CommunityManager', 'CommunityHost']
                  }
                },
                {
                  parentName: "Data Reporting",
                  name: 'custom_reports/templates',
                  list: "/custom-reports",
                  show: "/custom-reports/show/:id/:name",
                  create: "/custom-reports/create",
                  edit: "/custom-reports/edit/:id/:type",
                  options: {
                    route: 'custom_reports',
                    label: "Custom reports",
                    withPermission: ['TelevedaAdmin', 'CommunityManager', 'CommunityHost']
                  }
                },
                {
                  parentName: "Data Reporting",
                  name: "LogAuth",
                  list: "/audit-history",
                  options: {
                    label: "Audit History",
                    withPermission: ['TelevedaAdmin', 'CommunityManager']
                  },
                },
                {
                  parentName: "Data Reporting",
                  name: 'report_analytics',
                  list: "/general-analytics",
                  options: {
                    label: "General Analytics",
                    route: "analytics",
                    withPermission: ['TelevedaAdmin', 'CommunityManager']
                  }
                },
                {
                  parentName: "Data Reporting",
                  name: 'radar_dashboard',
                  list: "/radar",
                  options: {
                    label: "R.A.D.A.R. Dashboard",
                    route: "radar",
                    withPermission: ['TelevedaAdmin']
                  }
                },

                {
                  name: "General Options",
                  options: {
                    label: "General Options",
                    route: "settings",
                    withPermission: ['TelevedaAdmin']
                  },
                  icon: <GeneralOptionsIcon />,
                },
                {
                  parentName: "General Options",
                  name: "general_options",
                  options: {
                    route: 'general_options',
                    label: "Calendar link",
                    withPermission: ['TelevedaAdmin']
                  },
                  list: "/calendar-link",
                },
                {
                  parentName: "General Options",
                  name: "default-community-resources",
                  list: "/admin-resources",
                  create: "/admin-resources/create",
                  edit: "/admin-resources/edit/:id",
                  options: {
                    label: "Admin Resources",
                    route: "default-community-resources",
                    withPermission: ['TelevedaAdmin', 'CommunityManager']
                  },
                },
                {
                  parentName: "General Options",
                  name: "community-sponsors",
                  list: "/community-sponsors",
                  create: "/community-sponsors/create",
                  edit: "/community-sponsors/edit/:id",
                  options: {
                    route: 'community-sponsors',
                    label: "Sponsors",
                    withPermission: ['TelevedaAdmin']
                  },
                },
                {
                  parentName: "General Options",
                  name: "bingo_game",
                  list: "/bingos",
                  options: {
                    route: 'bingo_game',
                    label: "Bingo",
                    withPermission: ['TelevedaAdmin']
                  },
                },
                {
                  parentName: "General Options",
                  name: "class-categories",
                  list: "/class-categories",
                  options: {
                    route: 'class-categories',
                    label: "Class Categories",
                    withPermission: ['TelevedaAdmin']
                  },
                },
                {
                  name: "Outreach",
                  options: {
                    label: "Outreach",
                    route: "outreach",
                    withPermission: ['TelevedaAdmin', 'CommunityManager']
                  },
                  icon: <OutreachIcon />,
                },
                {
                  parentName: "Outreach",
                  name: "emails/auto",
                  list: "/emails/auto",
                  create: "/emails/auto/create",
                  edit: "/emails/auto/edit/:id",
                  options: {
                    label: "Automatic Emails",
                    withPermission: ['TelevedaAdmin']
                  },
                },
                {
                  parentName: "Outreach",
                  name: "emails/manual",
                  list: "/emails/manual",
                  create: "/emails/manual/create",
                  edit: "/emails/manual/edit/:id",
                  options: {
                    label: "Manual Emails",
                    withPermission: ['TelevedaAdmin', 'CommunityManager']
                  },
                },
                {
                  parentName: "Outreach",
                  name: "notifications/templates",
                  list: "/notifications",
                  create: "/notifications/create",
                  edit: "/notifications/edit/:id",
                  options: {
                    route: 'notifications',
                    label: "Notifications",
                    withPermission: ['TelevedaAdmin', 'CommunityManager']
                  },
                },
                {
                  parentName: "Outreach",
                  name: "surveys",
                  list: "/surveys",
                  create: "/surveys/create",
                  edit: "/surveys/edit/:id",
                  show: '/surveys/show/:id',
                  options: {
                    route: 'surveys',
                    label: "Surveys",
                    withPermission: ['TelevedaAdmin', 'CommunityManager'],
                    surveyPermission: true
                  },
                },
              ]}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                useNewQueryKeys: true,
                projectId: "nice-meme-bruv",
              }}
            >
              <Routes>
                <Route
                  element={
                    <Authenticated
                      key="authenticated-inner"
                      fallback={<CatchAllNavigate to="/login" />}

                    >
                      <Outlet />
                    </Authenticated>
                  }
                >
                  <Route path="/totp-auth">
                    <Route index element={<TwoFactorVerificationPage />} />
                  </Route>
                </Route>
                <Route
                  element={
                    <Authenticated
                      key="authenticated-inner"
                      fallback={<CatchAllNavigate to="/login" />}

                    >
                      <Outlet />
                    </Authenticated>
                  }
                >
                  <Route path="/custom-reports/export/:id/:type">
                    <Route index element={<ReportExportPreview />} />
                  </Route>
                </Route>
                <Route element={
                  <Layout
                    Header={Header}
                    Sider={Sider}
                    OffLayoutArea={OffLayoutArea}
                    Footer={Footer}
                    Title={Title}
                  >
                    <Outlet />
                  </Layout>
                }>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <Outlet />
                      </Authenticated>
                    }
                  >
                    <Route path="/surveys/manual-entry/:id">
                      <Route index element={<SurveySubmissionsManualEntry />} />
                    </Route>
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <Outlet />
                      </Authenticated>
                    }
                  >
                    <Route path="/users/_User/bulk">
                      <Route index element={<UserBulkCreate />} />
                    </Route>
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <Outlet />
                      </Authenticated>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="community" />}
                    />
                    <Route path="/community">
                      <Route index element={<CommunityList />} />
                      <Route path="create" element={<CommunityCreate />} />
                      <Route path="edit/:id" element={<CommunityEdit />} />
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <Outlet />
                      </Authenticated>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="resources" />}
                    />
                    <Route path="/community-resources">
                      <Route index element={<CommunityResourcesList />} />
                      <Route path="edit/:id" element={<CommunityResourcesEdit />} />
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <Outlet />
                      </Authenticated>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="resources" />}
                    />
                    <Route path="/members">
                      <Route index element={<MembersList />} />
                      <Route path="show/:id" element={<MemberShow />} />
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <Outlet />
                      </Authenticated>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="resources" />}
                    />
                    <Route path="/managers">
                      <Route index element={<ManagersList />} />
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <Outlet />
                      </Authenticated>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="resources" />}
                    />
                    <Route path="/instructors">
                      <Route index element={<HostsList />} />
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <Outlet />
                      </Authenticated>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="resources" />}
                    />
                    <Route path="/all-accounts">
                      <Route index element={<UserList />} />
                      <Route path="create" element={<UserCreate />} />
                      <Route path="show/:id" element={<UserShow />} />
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <Outlet />
                      </Authenticated>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="resources" />}
                    />
                    <Route path="/report-classes">
                      <Route index element={<ReportList />} />
                      <Route path="edit/:id" element={<ClassReportAttendanceOverride />} />
                      <Route path="show/:id" element={<ClassReportShow />} />
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <Outlet />
                      </Authenticated>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="resources" />}
                    />
                    <Route path="/custom-reports">
                      <Route index element={<CustomReports />} />
                      <Route path="create" element={<CustomReportCreate />} />
                      <Route path="edit/:id/:type" element={<CustomReportEdit />} />
                      <Route path="show/:id/:name" element={<CustomReportOccurrences />} />
                      <Route path="view/:id/:type" element={<ReportView />} />
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <Outlet />
                      </Authenticated>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="resources" />}
                    />
                    <Route path="/audit-history">
                      <Route index element={<AuthLogList />} />
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <Outlet />
                      </Authenticated>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="general-analytics" />}
                    />
                    <Route path="/general-analytics">
                      <Route index element={<AnalyticsList />} />
                    </Route>
                    <Route path="/radar">
                      <Route index element={<RadarDashboard />} />
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <Outlet />
                      </Authenticated>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="sponsor-analytics" />}
                    />
                    <Route path="/sponsor-analytics">
                      <Route index element={<SponsorAnalyticsList />} />
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <Outlet />
                      </Authenticated>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="resource-analytics" />}
                    />
                    <Route path="/resource-analytics">
                      <Route index element={<ResourceList />} />
                      <Route path="show/:id" element={<ResourceUsersShow />} />
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <Outlet />
                      </Authenticated>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="resources" />}
                    />
                    <Route path="/calendar-link">
                      <Route index element={<GeneralOptions />} />
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <Outlet />
                      </Authenticated>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="resources" />}
                    />
                    <Route path="/admin-resources">
                      <Route index element={<DefaultCommunitySponsorList />} />
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <Outlet />
                      </Authenticated>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="resources" />}
                    />
                    <Route path="/live-events">
                      <Route index element={<ScheduledClassList />} />
                      <Route path="create" element={<ScheduledClassCreate />} />
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <Outlet />
                      </Authenticated>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="resources" />}
                    />
                    <Route path="/on-demand">
                      <Route index element={<OnDemandList />} />
                      <Route path="create" element={<OnDemandClassCreate />} />
                      <Route path="edit/:id" element={<OnDemandClassEdit />} />
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <Outlet />
                      </Authenticated>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="resources" />}
                    />
                    <Route path="/community-sponsors">
                      <Route index element={<CommunitySponsorList />} />
                      <Route path="edit/:id" element={<CommunitySponsorEdit />} />
                      <Route path="create" element={<CommunitySponsorCreate />} />
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <Outlet />
                      </Authenticated>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="resources" />}
                    />
                    <Route path="/bingos">
                      <Route index element={<CardGenerator />} />
                      {/* <Route path="edit/:id" element={<EmailTemplateEdit />} />
                      <Route path="create" element={<EmailTemplateCreate />} /> */}
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <Outlet />
                      </Authenticated>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="resources" />}
                    />
                    <Route path="/class-categories">
                      <Route index element={<ClassCategoryList />} />
                      {/*<Route path="edit/:id" element={<CommunitySponsorEdit/>}/>*/}
                      {/*<Route path="create" element={<ClassCategoryCreate/>}/>*/}
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <Outlet />
                      </Authenticated>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="resources" />}
                    />
                    <Route path="/emails/auto">
                      <Route index element={<EmailTemplateList />} />
                      <Route path="edit/:id" element={<EmailTemplateEdit />} />
                      <Route path="create" element={<EmailTemplateCreate />} />
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <Outlet />
                      </Authenticated>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="resources" />}
                    />
                    <Route path="/emails/manual">
                      <Route index element={<ManualEmailList />} />
                      <Route path="create" element={<ManualEmailCreate />} />
                      <Route path="edit/:id" element={<ManualEmailEdit />} />
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                      >
                        <Outlet />
                      </Authenticated>
                    }
                  >
                    <Route
                      index
                      element={<NavigateToResource resource="resources" />}
                    />
                    <Route path="/notifications">
                      <Route index element={<NotificationsList />} />
                      <Route path="create" element={<NotificationsCreate />} />
                      <Route path="edit/:id" element={<NotificationsEdit />} />
                    </Route>
                    <Route path="*" element={<ErrorComponent />} />
                  </Route>
                  <Route
                    element={
                      <Authenticated
                        key="authenticated-outer"
                        fallback={<Outlet />}
                      >
                        <Outlet />
                      </Authenticated>
                    }
                  >
                    <Route path="/surveys">
                      <Route index element={<SurveysList />} />
                      <Route path="create" element={<SurveysCreate />} />
                      <Route path="edit/:id" element={<SurveysEdit />} />
                      <Route path="show/:id" element={<SurveySubmissions />} />
                    </Route>
                  </Route>

                </Route>
              </Routes>
              <UnsavedChangesNotifier />
              <DocumentTitleHandler handler={() => {
                return "Televeda Dashboard"
              }} />
            </Refine>
          </ConfigProvider>
        </AntdApp>
      </ColorModeContextProvider>
    </BrowserRouter>
  );
}

export default App;
