import { CSSProperties } from "react";

export const layoutStyles: CSSProperties = {
    background: `radial-gradient(50% 50% at 50% 50%, #63386A 0%, #310438 100%)`,
    backgroundSize: "cover",
    height: '100vh'
};

export const titleStyles: CSSProperties = {
    textAlign: "center",
    color: "#626262",
    fontSize: "30px",
    letterSpacing: "-0.04em"
};

export const textStyles: CSSProperties = {
    color: "#626262",
    fontSize: "17px",
    letterSpacing: "-0.04em"
}

export const viewSecretCodeCss: CSSProperties = {
    color: "#626262",
    fontSize: "18px",
    letterSpacing: "-0.04em",
    cursor: 'pointer',
    textDecoration: 'underline'
}

export const secretCodeCss: CSSProperties = {
    color: "#626262",
    fontSize: "18px",
    letterSpacing: "-0.04em",
    wordBreak: 'break-all'
}

export const imageContainer: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "28px"
};

export const verificationBtnsWrapper: CSSProperties = {
    display: 'flex', 
    justifyContent: 'center',
    gap: 20
}
