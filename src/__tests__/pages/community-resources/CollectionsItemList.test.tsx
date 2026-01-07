import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useTable } from "@refinedev/antd";
import { CollectionsItemList } from "../../../pages/community-resources/collections/collectionsItemList";
import { ICommunityCollectionItem } from "../../../interfaces";

jest.mock("@refinedev/antd", () => {
    const actual = jest.requireActual("@pankod/refine-antd");
    return {
        ...actual,
        useTable: jest.fn(),
    };
});

const mockRecords: ICommunityCollectionItem[] = [
    {
        id: "1",
        collectionId: "coll-1",
        title: "Item One",
        description: "First item description",
        resourceType: "file",
        fileName: "file1.pdf",
        fileSize: 2048,
        downloadUrl: "https://example.com/file1.pdf",
        linkImageDownloadUrl: "https://example.com/link1.png",
        linkImageCropDownloadUrl: "https://example.com/thumb1.png",
    },
    {
        id: "2",
        collectionId: "coll-1",
        title: "Item Two",
        description: "Second item description",
        resourceType: "link",
        fileName: "",
        fileSize: 0,
        downloadUrl: "https://example.com/link2",
        linkImageDownloadUrl: "",
        linkImageCropDownloadUrl: "",
    },
];

describe("CollectionsItemList", () => {
    const onDeleteMock = jest.fn();
    const openItemDrawerMock = jest.fn();
    const itemFormMock = { setFieldsValue: jest.fn() } as unknown as any;

    const baseUseTableReturn = {
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
        tableQuery: { refetch: jest.fn(), isLoading: false },
    };

    beforeEach(() => {
        onDeleteMock.mockReset();
        openItemDrawerMock.mockReset();
        itemFormMock.setFieldsValue = jest.fn();

        (useTable as jest.Mock).mockReturnValue(baseUseTableReturn);
    });

    test("renders loading state when tableQuery.isLoading is true", () => {
        (useTable as jest.Mock).mockReturnValue({
            tableProps: {},
            tableQuery: { isLoading: true, refetch: jest.fn() },
            searchFormProps: {},
            filters: [],
        });
        render(
            <CollectionsItemList
                collectionId="coll-1"
                onDelete={onDeleteMock}
                itemForm={itemFormMock}
                openItemDrawer={openItemDrawerMock}
            />
        );
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    test("clicking Edit button calls openItemDrawer and sets form values", async () => {
        render(
            <CollectionsItemList
                collectionId="coll-1"
                onDelete={onDeleteMock}
                itemForm={itemFormMock}
                openItemDrawer={openItemDrawerMock}
            />
        );

        const editButtons = screen.getAllByText("Edit");
        expect(editButtons.length).toBeGreaterThan(0);
        fireEvent.click(editButtons[0]);

        await waitFor(() => {
            expect(openItemDrawerMock).toHaveBeenCalled();
            expect(itemFormMock.setFieldsValue).toHaveBeenCalledWith({
                id: "1",
                collectionId: "coll-1",
                title: "Item One",
                description: "First item description",
                downloadUrl: "https://example.com/file1.pdf",
                resourceType: "file",
            });
        });
    });

    test("clicking Delete button triggers onDelete callback", async () => {
        render(
            <CollectionsItemList
                collectionId="coll-1"
                onDelete={onDeleteMock}
                itemForm={itemFormMock}
                openItemDrawer={openItemDrawerMock}
            />
        );

        const deleteButtons = screen.getAllByText("Delete");
        expect(deleteButtons.length).toBeGreaterThan(0);
        
        fireEvent.click(deleteButtons[0]);

        const confirmButton = await screen.findByText("Yes");
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(onDeleteMock).toHaveBeenCalledWith(mockRecords[0]);
        });
    });

    test("listens for 'itemUpdated' event to trigger refetch", () => {
        const refetch = jest.fn();
        (useTable as jest.Mock).mockReturnValueOnce({
            tableProps: {
                dataSource: mockRecords,
                pagination: { current: 1, total: 2, showTotal: jest.fn() },
            },
            searchFormProps: {},
            filters: [],
            tableQuery: { isLoading: false, refetch },
        });

        render(
            <CollectionsItemList
                collectionId="coll-1"
                onDelete={onDeleteMock}
                itemForm={itemFormMock}
                openItemDrawer={openItemDrawerMock}
            />
        );

        const event = new Event("itemUpdated");
        document.dispatchEvent(event);

        expect(refetch).toHaveBeenCalled();
    });
});
