import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ImageCrop } from '../../components/image-crop';

jest.mock('../../components/image-crop/canvasPreview', () => ({
  canvasPreview: jest.fn(),
}));

const mockImageCropHandlers = {
  setCroppedImage: jest.fn(),
  setThumbnailImageFormValue: jest.fn(),
};

describe('ImageCrop Component', () => {
  let setImgSrc: jest.Mock;

  beforeEach(() => {
    setImgSrc = jest.fn();
  });

  it('renders without crashing', () => {
    render(
      <ImageCrop
        imgSrc=""
        imageCropHandlers={mockImageCropHandlers}
        setImgSrc={setImgSrc}
        isFilePdfOrTextPlain={false}
      />
    );
    
    expect(screen.getByText('Choose File')).toBeInTheDocument();
  });

  it('displays the image preview after file is selected', async () => {
    render(
      <ImageCrop
        imgSrc="data:image/png;base64,dummydata"
        imageCropHandlers={mockImageCropHandlers}
        setImgSrc={setImgSrc}
        isFilePdfOrTextPlain={false}
      />
    );

    const image = await screen.findByAltText('Crop me');
    expect(image).toBeInTheDocument();
  });

  it('sets crop state on image load', () => {
    render(
      <ImageCrop
        imgSrc="data:image/png;base64,dummydata"
        imageCropHandlers={mockImageCropHandlers}
        setImgSrc={setImgSrc}
        isFilePdfOrTextPlain={false}
      />
    );

    const image = screen.getByAltText('Crop me');
    fireEvent.load(image);

    expect(mockImageCropHandlers.setCroppedImage).not.toHaveBeenCalled();
  });
});
