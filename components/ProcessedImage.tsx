"use client";

import { useState, useEffect } from 'react';
import { Download, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface ProcessedImageProps {
  processedImage: string | null;
  isProcessing: boolean;
  progress: number;
  background?: string;
}

export default function ProcessedImage({ 
  processedImage, 
  isProcessing, 
  progress, 
  background = "transparent" 
}: ProcessedImageProps) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (processedImage && background !== 'transparent') {
      createImageWithBackground();
    } else {
      setDownloadUrl(processedImage);
    }
  }, [processedImage, background]);

  const createImageWithBackground = async () => {
    if (!processedImage) return;

    const img = new Image();
    img.src = processedImage;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      toast.error('Failed to create image with background');
      return;
    }

    // Draw background
    if (background.startsWith('http')) {
      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      bgImg.src = background;
      await new Promise((resolve) => {
        bgImg.onload = resolve;
      });
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    } else if (background.startsWith('linear-gradient')) {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      // Parse gradient colors
      const colors = background.match(/rgba?\([\d\s,\.]+\)|#[a-f\d]+/gi) || [];
      colors.forEach((color, index) => {
        gradient.addColorStop(index / (colors.length - 1), color);
      });
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw processed image
    ctx.drawImage(img, 0, 0);

    try {
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png');
      });
      setDownloadUrl(URL.createObjectURL(blob));
    } catch (error) {
      toast.error('Failed to create downloadable image');
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'bgremoval-result.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Image downloaded successfully!');
    }
  };

  return (
    <div 
      className="border-2 border-dashed border-gray-200 rounded-xl h-[400px] flex flex-col items-center justify-center relative overflow-hidden"
      style={background !== 'transparent' ? {
        background: background.startsWith('http') 
          ? `url(${background})` 
          : background,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : undefined}
    >
      {isProcessing ? (
        <div className="flex flex-col items-center gap-4 p-4">
          <Progress value={progress} className="w-[60%]" />
          <p className="text-sm text-gray-600">Processing image... {progress}%</p>
        </div>
      ) : processedImage ? (
        <>
          <div className="relative w-full h-full">
            <Image
              src={processedImage}
              alt="Processed"
              fill
              className="object-contain rounded-xl"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <Button 
            className="absolute bottom-4 right-4 shadow-lg"
            onClick={handleDownload}
            disabled={!downloadUrl}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Result
          </Button>
        </>
      ) : (
        <div className="text-center p-4">
          <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            Your processed image will appear here
          </p>
          <Button disabled variant="secondary">
            <Download className="h-4 w-4 mr-2" />
            Download Result
          </Button>
        </div>
      )}
    </div>
  );
}