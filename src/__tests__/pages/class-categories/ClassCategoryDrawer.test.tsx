import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSelect } from "@refinedev/antd";
import { ClassCategoryDrawer } from "../../../pages/class-categories/ClassCategoryDrawer";

jest.mock("@refinedev/antd", () => {
    const original = jest.requireActual("@refinedev/antd");
    return {
        ...original,
        useSelect: jest.fn(),
        SaveButton: jest.fn().mockImplementation(({ onClick }) => (
            <button onClick={onClick}>Save</button>
        )),
    };
});

jest.mock("../../../adapters/DefaultFirebaseUploadAdapter", () => ({
    DefaultFirebaseUploaderAdapter: jest.fn().mockImplementation(() => ({
        upload: jest.fn().mockResolvedValue({ downloadURL: "https://example.com/image.png" }),
    })),
}));

const mockSelectOptions = [
    { id: "1", title: "Art" },
    { id: "2", title: "Music" },
];

beforeEach(() => {
    (useSelect as jest.Mock).mockReturnValue({
        selectProps: {
            options: mockSelectOptions,
        },
    });
});

describe("ClassCategoryDrawer", () => {
    const defaultProps = {
        action: "create",
        drawerProps: {
            open: true,
            onClose: jest.fn(),
        },
        formProps: {},
        formLoading: false,
        saveButtonProps: {
            onClick: jest.fn(),
        },
    };

    test("renders the drawer with correct form elements", () => {
        render(<ClassCategoryDrawer {...defaultProps} />);

        expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Parent Category/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Schedule Image/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Lobby Image/i)).toBeInTheDocument();
        expect(screen.getByText(/Save/i)).toBeInTheDocument();
    });

    test("handles the Save button click", async () => {
        render(<ClassCategoryDrawer {...defaultProps} />);
        userEvent.click(screen.getByText(/Save/i));
        await waitFor(() => {
            expect(defaultProps.saveButtonProps.onClick).toHaveBeenCalled();
        });
    });
});
