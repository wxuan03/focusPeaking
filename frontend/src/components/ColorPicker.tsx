
import React from 'react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  selectedColor: string;
  onChange: (color: string) => void;
  className?: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ 
  selectedColor, 
  onChange,
  className 
}) => {
  const colors = [
    { name: 'Red', value: '#FF4A4A' },
    { name: 'Green', value: '#4AFF4A' },
    { name: 'Blue', value: '#4A4AFF' },
    { name: 'Yellow', value: '#FFFF4A' },
    { name: 'White', value: '#FFFFFF' },
  ];

  return (
    <div className={cn("flex items-center space-x-3 px-2", className)}>
      <span className="text-xs font-medium text-zinc-400">Color:</span>
      <div className="flex items-center space-x-2">
        {colors.map((color) => (
          <button
            key={color.value}
            className={cn(
              "color-chip transform",
              selectedColor === color.value && "active"
            )}
            style={{ backgroundColor: color.value }}
            onClick={() => onChange(color.value)}
            aria-label={`Select ${color.name} focus peaking color`}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorPicker;
