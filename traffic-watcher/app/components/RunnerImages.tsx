"use client";

import { useEffect, useState } from 'react';
import { fetchImages } from './helpers';
import { ImageDataInterface } from './interface';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent } from '@/components/ui/card';
import Spinner from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"


const RunnerImages: React.FC = () => {
  const [images, setImages] = useState<ImageDataInterface[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState<ImageDataInterface | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openModal = (image: any) => {
    setSelectedImage(image);
    setIsOpen(true);
  };

  const closeModal = () => {
    setSelectedImage(null);
    setIsOpen(false);
  };

  useEffect(() => {
    fetchImages(setImages, setIsLoading);
  }, []);

  if (isLoading) {
    return <div className="text-center p-4"> <Spinner variant="orbit" />Loading images...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  if (images.length === 0) {
    return <div className="text-center p-4">No images found</div>;
  }

  return (


    <div className="flex justify-content-center px-10">
      <Carousel className="w-full">
        <CarouselContent className="-ml-1">
          {images &&
            images.map((img, index) => (
              <CarouselItem key={index} className="basis-1/3">
                <div className="p-1">
                  <Card className="border-none">
                    <CardContent className="flex items-center justify-center p-6">
                      <img
                        onClick={() => openModal(img)}
                        src={img.data}
                        className="mx-auto rounded-lg shadow-lg cursor-pointer"
                      />
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />

        {/* Centralized Dialog Modal */}
        {images && selectedImage && <Dialog open={isOpen} onOpenChange={closeModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Captured image info</DialogTitle>

            </DialogHeader>
            {selectedImage && (
              <img
                src={selectedImage?.data as string}
                className="mx-auto rounded-lg shadow-lg w-[640px] h-[640px]"
              />
            )}
          </DialogContent>
        </Dialog>}
      </Carousel>
    </div>
  );
};

export default RunnerImages;
