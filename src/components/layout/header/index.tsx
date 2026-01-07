
import {
  AntdLayout,
  Space,
  Menu,
  Button,
  Icons,
  Dropdown,
  Avatar,
  Typography,
  Row,
  notification,
  Badge,
  Divider,
  Empty,
  DateField,
  Switch,
  theme,
} from "@pankod/refine-antd";
import { useContext, useEffect, useState } from "react";
import { useGetIdentity, useList, useLogin, useNavigation, useUpdate } from "@refinedev/core";
import { initMessageFunc, useEmailNotification } from "../../../adapters/EmailNotificationHelper";
import { TelevedaBreadcrumb } from "../../breadcrumb";
import { IOnboardingHistory, IRefineUser } from "../../../interfaces";
import { ColorModeContext } from "../../../contexts/color-mode";
import { useLocation } from "react-router-dom";
import { DownOutlined, UpOutlined } from "@ant-design/icons";

const { ContactsOutlined, UserOutlined, LogoutOutlined, BellOutlined } = Icons;
const { Text } = Typography;

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

export const Header: React.FC = () => {
  const { data: user } = useGetIdentity<IRefineUser>();

  const { useToken } = theme;
  const { token } = useToken();
  const { mode, setMode } = useContext(ColorModeContext);

  const { show } = useNavigation();
  const location = useLocation();

  const { handleDelete, handleConfirm } = useEmailNotification();

  const { mutate: communityTransferMutation } = useUpdate();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { data: onboardingHistoryData, isLoading: onboardingHistoryLoading, refetch: refetchOnboardingHistoryList } = useList<IOnboardingHistory>({
    resource: 'onboarding'
  });

  const notificationsData = onboardingHistoryData?.data ?? [];

  const { mutate } = useLogin();

  useEffect(() => {
    mutate({});
  }, []);

  useEffect(() => {
    if (location.pathname !== '/surveys' && location.pathname !== '/emails/manual' && location.pathname !== '/notifications') {
      const es = new EventSource(`${SERVER_URL}/api/sse/events`, { withCredentials: true });
      initMessageFunc(es, notification, { handleConfirm, handleDelete }, undefined);

      window.onbeforeunload = () => {
        es.close();
      }

      return () => {
        console.log('Email connection closed');
        es.close();
      }
    }

  }, [location.pathname !== '/surveys', location.pathname !== '/emails/manual', location.pathname !== '/notifications']);

  const onTransfer = (userId: string, onboardingId: string, confirm: boolean) => {
    communityTransferMutation({
      resource: `community-associations/transfer-confirm/${userId}`,
      id: onboardingId,
      values: {
        confirm
      }
    }, {
      onSuccess: () => {
        refetchOnboardingHistoryList();
      }
    })
  }

  const getUserTag = (roles: Array<"TelevedaAdmin" | "CommunityManager" | "CommunityHost"> | undefined) => {
    if (roles?.includes("TelevedaAdmin")) return "Admin";
    else if (roles?.includes("CommunityManager")) return "Manager";
    else if (roles?.includes("CommunityHost")) return "Instructor";
    else return 'Loading...';
  }

  const getUserInitials = (firstName: string, lastName: string): string => {
    if (firstName || lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }

    return 'U'; // Default fallback
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="1" icon={<UserOutlined style={{ paddingRight: 8 }} />} onClick={() => { user ? show("_User", user.id) : console.log('no_user') }}>
        Profile
      </Menu.Item>

      {(user?.roles?.includes('TelevedaAdmin') || user?.roles?.includes('CommunityHost')) &&
        <Menu.Item key="3" icon={<svg
          stroke="currentColor"
          fill="none"
          stroke-width="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
          height="20px"
          width="20px"
          xmlns="http://www.w3.org/2000/svg">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          >
          </path>
        </svg>} onClick={() => window.location.href = "/host/select-class"}>
          Switch to Host
        </Menu.Item>
      }
      <Menu.Item key="4" icon={<svg
        stroke="currentColor"
        fill="none"
        stroke-width="2"
        viewBox="0 0 24 24"
        aria-hidden="true"
        height="20px"
        width="20px"
        xmlns="http://www.w3.org/2000/svg">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
        >
        </path>
      </svg>} onClick={() => window.location.href = "/class-schedule"}>
        Switch to Lobby
      </Menu.Item>
      <hr />
      <Menu.Item key="2" icon={<LogoutOutlined style={{ color: "red", paddingRight: 8 }} />}
        onClick={() => window.location.href = "/logout"}
        style={{ color: "red" }}
      >
        Logout
      </Menu.Item>
    </Menu>
  );

  const notificationsMenu = (
    notificationsData.length > 0 ?
      <Space direction="vertical" style={{
        minHeight: 400,
        maxHeight: 800,
        padding: 30,
        backgroundColor: token.colorBgElevated,
        overflow: 'auto', borderRadius: 8
      }}>
        {notificationsData.map((data) => {
          let msgHeader = 'registered';

          if (data.withReferral) {
            msgHeader = 'registered with referral to:';
          }
          else if (data.request) {
            msgHeader = 'requested transfer to:';
          }
          else {
            msgHeader = 'transferred to:';
          }

          return (
            <div key={data.id}>
              <b><DateField value={data.createdAt} format="LLL" /></b>
              <br />
              <br />
              <Typography.Text style={{ fontSize: 16 }}>
                User <b>{data.user?.email}</b> {msgHeader} <b>{data.community?.name}</b>
              </Typography.Text>
              <br />
              <Space style={{ width: '100%', justifyContent: 'end', marginTop: 20 }}>
                <Button onClick={() => onTransfer(data.user.id, data.id, true)} style={{ width: 120 }} type="primary">
                  {data.withReferral || !data.request ? "Confirm" : "Accept"}
                </Button>
                <Button onClick={() => onTransfer(data.user.id, data.id, false)} style={{ minWidth: 120, color: 'red' }}>
                  {data.withReferral || !data.request ? "Remove from Community" : "Reject"}
                </Button>
              </Space>
              <Divider />
            </div>
          )
        })}
      </Space>
      :
      <Space style={{ height: 300, padding: 30, width: '100%', justifyContent: 'center' }}>
        <Empty description={
          <Typography.Text strong style={{ fontSize: 20 }}>
            No new notifications!
          </Typography.Text>
        } />
      </Space>
  )

  return (
    <AntdLayout.Header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: 'end',
        height: "68px",
        paddingTop: '5px',
        paddingInline: '24px',
        backgroundColor: token.colorBgLayout
      }}
    >

      <TelevedaBreadcrumb hideIcons showHome />
      <Row>
        <div style={{ display: 'flex', alignItems: 'center', marginRight: 48 }}>
          <Switch
            checkedChildren="🌛"
            unCheckedChildren="🔆"
            onChange={() => setMode(mode === "light" ? "dark" : "light")}
            defaultChecked={mode === "dark"}
          />
        </div>
        <Dropdown
          overlayStyle={{
            borderRadius: 10,
            backgroundColor: 'white',
            overflowY: 'auto',
            width: 450,
            boxShadow: 'rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px'
          }}
          overlay={notificationsMenu}
          trigger={['click']}
          placement="bottomRight"
        >
          <div style={{ display: 'flex', alignItems: 'center', marginRight: 24 }}>
            <Badge count={onboardingHistoryData?.total || 0} overflowCount={10} size="small">
              <BellOutlined style={{ fontSize: 26 }} />
            </Badge>
          </div>
        </Dropdown>
        <Avatar shape="circle" size={54} src={user?.icon ? SERVER_URL + user.icon.slice(2) : null} style={{ marginRight: 10 }}>
          {!user?.icon && getUserInitials(user?.firstName || '', user?.lastName || '')}
        </Avatar>
        <Space style={{ display: "block", lineHeight: "15px", textAlign: "left" }}>
          <Dropdown overlayStyle={{ paddingTop: 12 }} overlay={userMenu} trigger={['click']} placement="bottomRight" arrow onOpenChange={(visible) => setIsDropdownOpen(visible)}>
            <Button style={{ padding: '0', color: "#2a132e" }} type="link" onClick={e => e.preventDefault()}>
              <Space>
                {user?.name && (
                  <Text ellipsis strong style={{ fontSize: 20 }}>
                    {user?.name}
                  </Text>
                )}
                {isDropdownOpen ? <UpOutlined style={{ paddingTop: 8 }} /> : <DownOutlined style={{ paddingTop: 8 }} />}
              </Space>
            </Button>
          </Dropdown>
          <Space style={{ fontSize: 14 }}>
            {getUserTag(user?.roles)}
          </Space>
        </Space>
      </Row>

    </AntdLayout.Header>
  );
};
