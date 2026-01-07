import React, { useState, useRef, useEffect, Dispatch, SetStateAction } from 'react'
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop
} from 'react-image-crop';
import { Button } from "@pankod/refine-antd";
import 'react-image-crop/dist/ReactCrop.css';
import { canvasPreview } from './canvasPreview';

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      233/100,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

interface CustomFileInputProps {
  onSelectFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

interface ImageCropHandlers {
  setCroppedImage: (value: string) => void;
  setThumbnailImageFormValue: (value: string) => void;
}

export const ImageCrop: React.FC<{
  imgSrc: string;
  imageCropHandlers: ImageCropHandlers;
  setImgSrc: Dispatch<SetStateAction<string>>;
  isFilePdfOrTextPlain: boolean;
}> = ({ imgSrc, imageCropHandlers, setImgSrc, isFilePdfOrTextPlain }) => {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const hiddenAnchorRef = useRef<HTMLAnchorElement>(null)
  const blobUrlRef = useRef('')
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      setCompletedCrop(undefined);
      imageCropHandlers.setCroppedImage('');
      imageCropHandlers.setThumbnailImageFormValue('');
      const reader = new FileReader()
      reader.addEventListener('load', () =>
        setImgSrc(reader.result?.toString() || ''),
      )
      reader.readAsDataURL(e.target.files[0])
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
      const { width, height } = e.currentTarget
      setCrop(centerAspectCrop(width, height))
  }

  const CustomFileInput: React.FC<CustomFileInputProps> = ({ onSelectFile }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    };

    return (
      <>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={onSelectFile}
          style={{ display: 'none' }}
        />
        <Button style={{width: 167}} onClick={handleClick}>Choose File</Button>
      </>
    );
  };

  async function onSaveCropClick(e: any) {
    e.preventDefault();
    const image = imgRef.current
    const previewCanvas = previewCanvasRef.current
    if (!image || !previewCanvas || !completedCrop) {
      throw new Error('Crop canvas does not exist')
    }

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    const offscreen = new OffscreenCanvas(
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
    )
    const ctx = offscreen.getContext('2d')
    if (!ctx) {
      throw new Error('No 2d context')
    }

    // @ts-ignore
    ctx.drawImage(
      previewCanvas,
      0,
      0,
      previewCanvas.width,
      previewCanvas.height,
      0,
      0,
      offscreen.width,
      offscreen.height,
    )

    // @ts-ignore
    const blob = await offscreen.convertToBlob({
      type: 'image/png',
    })

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
    }

    blobUrlRef.current = URL.createObjectURL(blob)

    if (hiddenAnchorRef.current) {
      hiddenAnchorRef.current.href = blobUrlRef.current
      hiddenAnchorRef.current.click()
    }
    setCrop(undefined);
    setCompletedCrop(undefined);
    if(isFilePdfOrTextPlain) {
      setImgSrc('');
    }
  }

  useEffect(() => {
      if (
        completedCrop?.width &&
        completedCrop?.height &&
        imgRef.current &&
        previewCanvasRef.current
      ) {
        canvasPreview(
          imgRef.current,
          previewCanvasRef.current,
          completedCrop
        )
      }
    }, [completedCrop]);

  return (
    <div className="App">
      <div className="Crop-Controls">
        <CustomFileInput onSelectFile={onSelectFile} />
      </div>
      {!!imgSrc && (
        <div style={{ marginTop: '10px', marginBottom: '10px'}}>
          <div style={{ marginBottom: '10px' }}>
            <span style={{fontSize: 14}}>Image </span>
          </div>
          <div>
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => {
                setCompletedCrop(c)
              }}
              aspect={233 / 100}
              minHeight={100}
            >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imgSrc}
                  onLoad={onImageLoad}
                />
            </ReactCrop>
          </div>
        </div>
      )}
      {!!completedCrop && (
        <>
          <div>
            <canvas
                ref={previewCanvasRef}
                style={{
                  display: 'none',
                  border: '1px solid black',
                  objectFit: 'contain',
                  width: completedCrop.width,
                  height: completedCrop.height,
                }}
            />
          </div>
          <div>
            <Button style={{width: 167}} onClick={onSaveCropClick}>Crop File</Button>
            <a
              href="#hidden"
              ref={hiddenAnchorRef}
              onClick={(e: any) => {
                e.preventDefault();
                const fullHref = `blob:${e.target.getAttribute('href')}`;
                imageCropHandlers.setCroppedImage(e.target.href);
                imageCropHandlers.setThumbnailImageFormValue(e.target.href);
              }}
              style={{
                position: 'absolute',
                top: '-200vh',
              }}
            >
              Hidden download
            </a>
          </div>
        </>
      )}
    </div>
  )
}
