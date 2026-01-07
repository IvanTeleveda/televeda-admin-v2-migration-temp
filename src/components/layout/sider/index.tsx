import React, { useContext, useEffect } from "react";
import {
  Layout,
  Menu,
  Grid,
  Drawer,
  Button, ConfigProvider,
  Divider
} from "antd";
import {
  DashboardOutlined,
  LogoutOutlined,
  UnorderedListOutlined,
  BarsOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import {
  useTranslate,
  useLogout,
  useTitle,
  CanAccess,
  type ITreeMenu,
  useIsExistAuthentication,
  useRouterContext,
  useMenu,
  useRefineContext,
  useLink,
  useRouterType,
  useActiveAuthProvider,
  pickNotDeprecated,
  useWarnAboutChange,
  useGetIdentity,
} from "@refinedev/core";

import { RefineThemedLayoutV2SiderProps, ThemedTitleV2, useThemedLayoutContext } from "@refinedev/antd";
import { IRefineUser } from "../../../interfaces";
import { ColorModeContext } from "../../../contexts/color-mode";

export const Sider: React.FC<RefineThemedLayoutV2SiderProps> = ({
  Title: TitleFromProps,
  render,
  meta,
  fixed,
}) => {
  const {
    siderCollapsed,
    setSiderCollapsed,
    mobileSiderOpen,
    setMobileSiderOpen,
  } = useThemedLayoutContext();

  const isExistAuthentication = useIsExistAuthentication();
  const direction = useContext(ConfigProvider.ConfigContext)?.direction;
  const routerType = useRouterType();
  const NewLink = useLink();
  const { warnWhen, setWarnWhen } = useWarnAboutChange();
  const { Link: LegacyLink } = useRouterContext();
  const Link = routerType === "legacy" ? LegacyLink : NewLink;
  const TitleFromContext = useTitle();
  const translate = useTranslate();
  const { menuItems, selectedKey, defaultOpenKeys } = useMenu({ meta });
  const breakpoint = Grid.useBreakpoint();
  const { hasDashboard } = useRefineContext();
  const authProvider = useActiveAuthProvider();
  const { mutate: mutateLogout } = useLogout({
    v3LegacyAuthProviderCompatible: Boolean(authProvider?.isLegacy),
  });

  const { mode } = useContext(ColorModeContext);

  const BG_COLOR = mode === "light"  ? '#532D7F' : '#25104d';

  const isMobile =
    typeof breakpoint.lg === "undefined" ? false : !breakpoint.lg;

  const RenderToTitle = TitleFromProps ?? TitleFromContext ?? ThemedTitleV2;

  const { data: userData } = useGetIdentity<IRefineUser>();

  //CK-EDITOR CONFIG
  useEffect(() => {
    const root = document.documentElement;
    if (mode === "dark") {
      root.style.setProperty("--ck-color-base-background", "#141414");
      root.style.setProperty("--ck-color-base-text", "#ffffff");
    } else {
      root.style.setProperty("--ck-color-base-background", "#ffffff");
      root.style.setProperty("--ck-color-base-text", "#000000");
    }
  }, [mode]);

  const renderTreeView = (tree: ITreeMenu[], selectedKey?: string) => {
    return tree.map((item: ITreeMenu) => {
      const {
        icon,
        label,
        route,
        key,
        name,
        children,
        parentName,
        meta,
        options,
      } = item;

      if (options && options.withPermission) {
        const withPermission: Array<"TelevedaAdmin" | "CommunityManager" | "CommunityHost"> = options.withPermission;
        const roleIndex = withPermission.findIndex(role => userData?.roles?.includes(role));
        if (roleIndex < 0) {
          return <div key={label} />
        }
      }

      if (options && options.surveyPermission && options.surveyPermission === true) {
        if (!userData?.surveyPermission.general) {
          return <div key={label} />
        }
      }

      const isSubSelected = selectedKey?.includes(route ?? '  ');

      if (children.length > 0) {
        return (
          <CanAccess
            key={item.key}
            resource={name}
            action="list"
            params={{
              resource: item,
            }}
          >
            <Menu.SubMenu
              key={item.key}
              icon={icon ? <div style={{ filter: isSubSelected ? "brightness(100%)" : "brightness(70%)" }}>{icon ?? <UnorderedListOutlined />}</div> : null}
              style={{
                backgroundColor: BG_COLOR
              }}
              title={label}
              popupClassName="popup-sub-menu-tvd"
            >
              {renderTreeView(children, selectedKey)}
            </Menu.SubMenu>
          </CanAccess>
        );
      }
      const isSelected = key === selectedKey;
      const isRoute = !(
        pickNotDeprecated(meta?.parent, options?.parent, parentName) !==
        undefined && children.length === 0
      );

      return (
        <CanAccess
          key={item.key}
          resource={name}
          action="list"
          params={{
            resource: item,
          }}
        >
          <Menu.Item
            key={route}
            style={{
              fontWeight: isSelected ? "bold" : "normal",
              color: siderCollapsed && !isMobile ? isSelected ? 'white' : mode === 'light' ? 'black' : 'white' : 'white'
            }}
            icon={icon ? <div style={{ filter: isSelected ? "brightness(100%)" : "brightness(70%)" }}>{icon ?? (isRoute && <UnorderedListOutlined />)}</div> : null}
          >
            <Link to={route ?? ""}>{label}</Link>
            {!siderCollapsed && isSelected && (
              <div className="ant-menu-tree-arrow" />
            )}
          </Menu.Item>
        </CanAccess>
      );
    });
  };

  const handleLogout = () => {
    if (warnWhen) {
      const confirm = window.confirm(
        translate(
          "warnWhenUnsavedChanges",
          "Are you sure you want to leave? You have unsaved changes.",
        ),
      );

      if (confirm) {
        setWarnWhen(false);
        mutateLogout();
      }
    } else {
      mutateLogout();
    }
  };

  const logout = isExistAuthentication && (
    // <Menu.Item
    //   key="logout"
    //   onClick={() => handleLogout()}
    //   icon={<LogoutOutlined />}
    // >
    //   {translate("buttons.logout", "Logout")}
    // </Menu.Item>
    <></>
  );

  const dashboard = hasDashboard ? (
    <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
      <Link to="/">{translate("dashboard.title", "Dashboard")}</Link>
      {!siderCollapsed && selectedKey === "/" && (
        <div className="ant-menu-tree-arrow" />
      )}
    </Menu.Item>
  ) : null;

  const items = renderTreeView(menuItems, selectedKey);

  const renderSider = () => {
    if (render) {
      return render({
        dashboard,
        items,
        logout,
        collapsed: siderCollapsed,
      });
    }
    return (
      <>
        {dashboard}
        {items}
        {logout}
      </>
    );
  };

  const renderMenu = () => {
    return (
      <Menu
        selectedKeys={selectedKey ? [selectedKey] : []}
        defaultOpenKeys={defaultOpenKeys}
        mode="inline"
        style={{
          backgroundColor: BG_COLOR,
          paddingTop: "8px",
          border: "none",
          overflow: "auto",
          height: "calc(100% - 72px)",
        }}
        onClick={() => {
          setMobileSiderOpen(false);
        }}
      >
        {renderSider()}
      </Menu>
    );
  };

  const renderDrawerSider = () => {
    return (
      <>
        <Drawer
          open={mobileSiderOpen}
          onClose={() => setMobileSiderOpen(false)}
          placement={direction === "rtl" ? "right" : "left"}
          closable={false}
          width={255}
          bodyStyle={{
            padding: 0,
          }}
          maskClosable={true}
        >
          <Layout>
            <Layout.Sider
              width={255}
              style={{
                height: "100vh",
                backgroundColor: BG_COLOR,
                borderRight: `1px solid ${BG_COLOR}`,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: "255px",
                  padding: "0 16px",
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  height: "64px",
                  backgroundColor: BG_COLOR
                }}
              >
                <RenderToTitle collapsed={false} />
              </div>
              {renderMenu()}
            </Layout.Sider>
          </Layout>
        </Drawer>
        <Button
          style={{
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            position: "fixed",
            top: 5,
            zIndex: 999,
            color: mode === 'light' ? 'black' : 'white'
          }}
          size="large"
          onClick={() => setMobileSiderOpen(true)}
          icon={<BarsOutlined />}
        />
      </>
    );
  };

  if (isMobile) {
    return renderDrawerSider();
  }

  const siderStyles: React.CSSProperties = {
    backgroundColor: BG_COLOR,
    borderRight: `1px solid ${BG_COLOR}`,
  };

  if (fixed) {
    siderStyles.position = "fixed";
    siderStyles.top = 0;
    siderStyles.height = "100vh";
    siderStyles.zIndex = 999;
  }
  const renderClosingIcons = () => {
    const iconProps = { style: { color: 'white' } };
    const OpenIcon = direction === "rtl" ? RightOutlined : LeftOutlined;
    const CollapsedIcon = direction === "rtl" ? LeftOutlined : RightOutlined;
    const IconComponent = siderCollapsed ? CollapsedIcon : OpenIcon;

    return <IconComponent {...iconProps} />;
  };

  return (
    <>
      {fixed && (
        <div
          style={{
            width: siderCollapsed ? "80px" : "255px",
            transition: "all 0.2s",
          }}
        />
      )}
      <Layout.Sider
        width={255}
        style={siderStyles}
        collapsible
        collapsed={siderCollapsed}
        onCollapse={(collapsed, type) => {
          if (type === "clickTrigger") {
            setSiderCollapsed(collapsed);
          }
        }}
        collapsedWidth={80}
        breakpoint="lg"
        trigger={
          <Button
            type="text"
            style={{
              borderRadius: 0,
              height: "100%",
              width: "100%",
              backgroundColor: mode === 'light' ? '#3A1C71' : '#1d0c3b',
            }}
          >
            {renderClosingIcons()}
          </Button>
        }
      >
        <div
          style={{
            width: siderCollapsed ? "80px" : "255px",
            padding: siderCollapsed ? "0" : "0 16px",
            display: "flex",
            justifyContent: siderCollapsed ? "center" : "flex-start",
            alignItems: "center",
            height: "64px",
            backgroundColor: BG_COLOR,
            fontSize: "14px",
          }}
        >
          <RenderToTitle collapsed={siderCollapsed} />
        </div>
        <Divider style={{ borderColor: "rgba(255, 255, 255, 0.6)", marginTop: 12, marginLeft: 24, marginRight: 24, minWidth: 0, width: "auto" }} />
        {renderMenu()}
      </Layout.Sider>
    </>
  );
};
