import { SetStateAction } from "react";
import { ImagesResponse, ImageDataInterface } from "./interface";

export const fetchImages = async (
    setImages: React.Dispatch<SetStateAction<ImageDataInterface[]>>,
    setIsLoading: React.Dispatch<SetStateAction<boolean>>,
  ) => {
    try {
        const response = await fetch('/py/images');
        if (!response.ok) {
            throw new Error('Failed to fetch images');
        }
        const data: ImagesResponse = await response.json();
        const images: ImageDataInterface[] = data.images
        setIsLoading(false)
        setImages(images);
    } catch (err) {
       console.log('something happened', err)
    } finally {
       
    }
  };