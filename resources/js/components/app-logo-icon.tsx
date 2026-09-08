import type { ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export default function AppLogoIcon({
    alt = '',
    className,
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            {...props}
            src="/wonderbok.webp"
            alt={alt}
            className={cn('object-cover object-top', className)}
        />
    );
}
