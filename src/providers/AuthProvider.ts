
import axios from "axios";
import { CredentialResponse } from "../interfaces/google";
import { AuthProvider } from "@refinedev/core";

export const ACCESS_TOKEN_KEY = "refine-access-token";
export const USER_KEY = "refine-user";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const axiosInstance = axios.create({
    withCredentials: true,
    baseURL: SERVER_URL
  });

export const authProvider: AuthProvider = {
    login: async ({ credential }: CredentialResponse) => {
        
        console.log('Login Credentials', credential, window.location.pathname);

        try {
            const response = await axiosInstance.get(`${SERVER_URL}/_User/me`);

            console.log("User me: ", response.data);

            localStorage.setItem(USER_KEY, JSON.stringify(response.data));

            const roles = response.data?.roles;
            let redirectTo = '';

            if(window.location.pathname === '/admin/community' && roles && roles.length === 1 && roles[0] === 'CommunityHost') {
                redirectTo = '/live-events';
            }

            return Promise.resolve({
                success: true,
                redirectTo
            })
        } catch (error) {
            console.log('error login to refine', error);
            return Promise.reject({
                success: false
            })
        }
    },
    logout: async () => {

        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        axiosInstance.defaults.headers.common = {};

        return {
            success: true,
            redirectTo: "/logout",
        };
    },
    onError: async (error) => {
        console.error('Auth provider error: ', error);
        return { error };
    },
    check: async () => {
        return Promise.resolve({
            authenticated: true,
        });
    },
    getPermissions: async () => {
        const userData = localStorage.getItem(USER_KEY);

        if (!userData) return Promise.resolve('Public');

        const getUserTag = (roles: Array<"TelevedaAdmin" | "CommunityManager" | "CommunityHost"> | undefined) => {
            if(roles?.includes("TelevedaAdmin")) return "TelevedaAdmin";
            else if(roles?.includes("CommunityManager")) return "CommunityManager";
            else if(roles?.includes("CommunityHost")) return "CommunityHost";
            return null;
        }

        const roles = JSON.parse(userData).roles;

        console.log('Permissions: ', roles);

        const role = getUserTag(roles);

        return role ? Promise.resolve(role) : Promise.resolve('Public');
    },
    getIdentity: async () => {
        const user = localStorage.getItem(USER_KEY);
        if (user) {
            return JSON.parse(user);
        }

        return null;
    },
};
