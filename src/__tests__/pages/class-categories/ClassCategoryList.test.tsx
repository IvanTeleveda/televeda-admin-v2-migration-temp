import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as refinedevAntd from "@refinedev/antd";
import { ClassCategoryList } from "../../../pages/class-categories";

jest.mock("@refinedev/antd", () => {
    const actual = jest.requireActual("@refinedev/antd");
    return {
        ...actual,
        useDrawerForm: jest.fn(),
        useTable: jest.fn(),
        CreateButton: ({ onClick }: any) => <button onClick={onClick}>Create</button>,
        EditButton: ({ onClick }: any) => (
            <button data-testid="edit-button" onClick={onClick}>Edit</button>
        ),
        DeleteButton: ({ onSuccess, recordItemId }: any) => (
            <button onClick={() => onSuccess?.()} data-testid={`delete-${recordItemId}`}>
                Delete
            </button>
        ),
    };
});

jest.mock("../../../components/page-containers/list", () => ({
    TelevedaList: ({
        listProps,
        children,
    }: {
        listProps: { headerProps?: { extra?: React.ReactNode } };
        children: React.ReactNode;
    }) => (
        <div>
            {listProps?.headerProps?.extra}
            {children}
        </div>
    ),
}));

jest.mock("../../../pages/class-categories/ClassCategoryDrawer", () => ({
    ClassCategoryDrawer: () => <div data-testid="class-category-drawer" />,
}));

const mockRecords = [
    {
        id: "1",
        title: "Health",
        parent: { title: "Wellness" },
    },
    {
        id: "2",
        title: "Fitness",
        parent: { title: "Health" },
    },
];

beforeEach(() => {
    const mockUseTable = refinedevAntd.useTable as jest.Mock;
    const mockUseDrawerForm = refinedevAntd.useDrawerForm as jest.Mock;

    mockUseTable.mockReturnValue({
        tableProps: {
            dataSource: mockRecords,
            pagination: {
                current: 1,
                total: 2,
                showTotal: jest.fn(),
            },
        },
        searchFormProps: {},
        filters: [],
        tableQuery: { refetch: jest.fn() },
    });

    mockUseDrawerForm.mockImplementation(({ action }: any) => ({
        drawerProps: {
            open: false,
            onClose: jest.fn(),
        },
        formProps: {},
        saveButtonProps: { onClick: jest.fn() },
        show: jest.fn(),
        formLoading: false,
    }));
});

describe("ClassCategoryList", () => {
    test("renders table headers and actions", () => {
        render(<ClassCategoryList />);

        expect(screen.getByText("Title")).toBeInTheDocument();
        expect(screen.getByText("Parent Category")).toBeInTheDocument();
        expect(screen.getAllByTestId("edit-button").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Delete").length).toBeGreaterThan(0);
    });

    test("triggers create drawer on Create button click", async () => {
        render(<ClassCategoryList />);
        
        const createButton = screen.getByRole("button", { name: /Create/i });
        fireEvent.click(createButton);

        await waitFor(() => {
            const mockUseDrawerForm = refinedevAntd.useDrawerForm as jest.Mock;
            expect(mockUseDrawerForm).toHaveBeenCalledWith(
                expect.objectContaining({ action: "create", redirect: false })
            );
        });
    });

    test("triggers edit drawer on Edit button click", async () => {
        render(<ClassCategoryList />);
        const editButtons = screen.getAllByTestId("edit-button");
        expect(editButtons.length).toBeGreaterThan(0);
        fireEvent.click(editButtons[0]);

        await waitFor(() => {
            const mockUseDrawerForm = refinedevAntd.useDrawerForm as jest.Mock;
            expect(mockUseDrawerForm).toHaveBeenCalledWith(
                expect.objectContaining({ action: "edit", redirect: false })
            );
        });
    });

    test("triggers delete action and refetch", async () => {
        const refetch = jest.fn();
        const mockUseTable = refinedevAntd.useTable as jest.Mock;
        mockUseTable.mockReturnValueOnce({
            tableProps: {
                dataSource: mockRecords,
                pagination: {
                    current: 1,
                    total: 2,
                    showTotal: jest.fn(),
                },
            },
            searchFormProps: {},
            filters: [],
            tableQuery: { refetch },
        });

        render(<ClassCategoryList />);
        
        const deleteButton = screen.getByTestId("delete-1");
        expect(deleteButton).toBeInTheDocument();
        fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(refetch).toHaveBeenCalled();
        });
    });

    test("renders drawer components", () => {
        render(<ClassCategoryList />);
        expect(screen.getAllByTestId("class-category-drawer").length).toBe(2);
    });
});
