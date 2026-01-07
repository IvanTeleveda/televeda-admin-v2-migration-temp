import { TitleProps, useLink } from "@refinedev/core";
import React from "react";

export const Title: React.FC<TitleProps> = ({ collapsed }) => {

  const Link = useLink();
  const titleWidth = collapsed ? "65px" : "116px";
  const titleMargin = collapsed ? "20px 5px 0px 7px" : "20px 16px 0px 24px";

  return (
    <Link to={"/"}>
      <img
        src={"/televeda/img/televeda-logo-lobby.svg"}
        alt="Televeda"
        style={{
          width: titleWidth,
          margin: titleMargin,
          transition: "width 0.3s, margin 0.3s"
        }}
      />
    </Link>
  );
};
