import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScheduledClassCreate } from "../../../pages/scheduled-class/create";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

describe("ScheduledClassCreate", () => {
    beforeEach(() => {
        render(
            <QueryClientProvider client={queryClient}>
                <ScheduledClassCreate />
            </QueryClientProvider>
        );
    });

    it("renders form fields", () => {
        expect(screen.getByLabelText(/Class/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Start date & time/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Duration in minutes/i)).toBeInTheDocument();
    });

    it("shows custom duration field when 'Custom' is selected", async () => {
        const durationSelect = screen.getByLabelText(/Duration in minutes/i);
        fireEvent.mouseDown(durationSelect);
        const customOption = await screen.findByText("Custom");
        fireEvent.click(customOption);

        expect(await screen.findByLabelText(/Custom duration in minutes/i)).toBeInTheDocument();
    });

    it("hides custom duration field when a non-custom option is selected", async () => {
        const durationSelect = screen.getByLabelText(/Duration in minutes/i);
        fireEvent.mouseDown(durationSelect);
        const option60 = await screen.findByText("60 min");
        fireEvent.click(option60);

        await waitFor(() => {
            expect(screen.queryByLabelText(/Custom duration in minutes/i)).not.toBeInTheDocument();
        });
    });
});
