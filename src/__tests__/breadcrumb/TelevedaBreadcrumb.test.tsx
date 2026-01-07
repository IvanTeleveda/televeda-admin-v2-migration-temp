import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { TelevedaBreadcrumb } from "../../components/breadcrumb";
import { useNavigation, useRefineContext } from "@refinedev/core";

jest.mock("@refinedev/core", () => {
    const actual = jest.requireActual("@refinedev/core");
    return {
        ...actual,
        useBreadcrumb: jest.fn(() => ({
            breadcrumbs: [
                { label: "Dashboard", href: "/" },
                { label: "Users", href: "/users" },
            ],
        })),
        useNavigation: jest.fn(() => ({
            goBack: jest.fn(),
        })),
        useRefineContext: jest.fn(() => ({ hasDashboard: true })),
        useLink: jest.fn(() => ({ to, children }: any) => <a href={to}>{children}</a>),
    };
});


describe("TelevedaBreadcrumb", () => {
    const mockGoBack = jest.fn();

    beforeEach(() => {
        (useNavigation as jest.Mock).mockReturnValue({ goBack: mockGoBack });
        jest.clearAllMocks();
    });

    it("renders breadcrumbs correctly", () => {
        render(
            <BrowserRouter>
                <TelevedaBreadcrumb />
            </BrowserRouter>
        );

        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        expect(screen.getByText("Users")).toBeInTheDocument();
    });

    it("renders home icon if dashboard exists", () => {
        render(
            <BrowserRouter>
                <TelevedaBreadcrumb />
            </BrowserRouter>
        );

        expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    });

    it("calls goBack when back button is clicked", () => {
        render(
            <BrowserRouter>
                <TelevedaBreadcrumb />
            </BrowserRouter>
        );

        const backButton = screen.getByRole("button");
        fireEvent.click(backButton);
        expect(mockGoBack).toHaveBeenCalledTimes(1);
    });

    it("does not render home icon if dashboard does not exist", () => {
        (useRefineContext as jest.Mock).mockReturnValue({ hasDashboard: false });

        render(
            <BrowserRouter>
                <TelevedaBreadcrumb />
            </BrowserRouter>
        );

        expect(screen.queryByRole("link", { name: /home/i })).not.toBeInTheDocument();
    });
});
