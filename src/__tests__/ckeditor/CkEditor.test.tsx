import { render, screen, waitFor } from "@testing-library/react";
import App from "../../components/ckeditor";

jest.mock("@ckeditor/ckeditor5-react", () => ({
  CKEditor: (props: any) => {
    return <div data-testid="ck-editor">Mock CKEditor</div>;
  },
}));

describe("App Component", () => {
  it("renders the main container", () => {
    const { container } = render(<App />);
    expect(container.querySelector(".main-container")).toBeInTheDocument();
  });

  it("renders the CKEditor when layout is ready", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId("ck-editor")).toBeInTheDocument();
    });
  });
});
