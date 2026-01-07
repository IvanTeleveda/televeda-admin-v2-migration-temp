import { useApiUrl, useCustom } from "@refinedev/core";
import { useCallback } from "react";

export const enum CheckWebexAuthState {
    LOADING = 1,
    LOGGED_OUT = 2,
    LOGGED_IN = 3
}

export function useWebexRedirect(redirectUri: string){
    const apiUrl = useApiUrl();

    const { data, isLoading } = useCustom({
        url: `${apiUrl}/webex-auth/auth?returnTo=${encodeURIComponent(redirectUri)}`,
        method: "get",
    });

    const { data: tokenRes, isLoading: isLoadingTokenReq } = useCustom({
        url: `${apiUrl}/webex-auth/token`,
        method: "get",
    });

    const executeWebexAuthRedirect = useCallback(()=>{
        if(isLoading){
            return false;
        }
        if(data?.data.webexRedirect){            
            window.location.replace(data.data.webexRedirect);
            return false;
        }else{
            return true;
        }
    },[data, isLoading]);

    const checkWebexAuth = useCallback(()=>{
        if(isLoadingTokenReq){
            return CheckWebexAuthState.LOADING;
        }
        if(tokenRes?.data.webexToken){            
            return CheckWebexAuthState.LOGGED_IN;
        }else{
            return CheckWebexAuthState.LOGGED_OUT;
        }
    },[tokenRes, isLoadingTokenReq]);

    return {
        checkWebexAuth,
        executeWebexAuthRedirect,
        isLoading
    }
}