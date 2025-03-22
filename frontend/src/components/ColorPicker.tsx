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
  // Professional camera-like focus peaking colors
  const colors = [
    { name: 'Red (Sony)', value: '#FF3333' },
    { name: 'White (Canon)', value: '#FFFFFF' },
    { name: 'Yellow (Nikon)', value: '#FFFF00' },
    { name: 'Blue (Fuji)', value: '#3333FF' },
    { name: 'Green (Panasonic)', value: '#33FF33' },
    { name: 'Magenta (Pro)', value: '#FF33FF' },
  ];

  return (
    <div className={cn("flex items-center space-x-3 px-2", className)}>
      <span className="text-xs font-medium text-zinc-400">Color:</span>
      <div className="flex items-center space-x-2">
        {colors.map((color) => (
          <button
            key={color.value}
            className={cn(
              "color-chip transform transition-all duration-200",
              selectedColor === color.value && "active"
            )}
            style={{ 
              backgroundColor: color.value,
              boxShadow: selectedColor === color.value ? `0 0 0 2px white, 0 0 0 4px ${color.value}` : 'none',
              width: '24px',
              height: '24px'
            }}
            onClick={() => onChange(color.value)}
            aria-label={`Select ${color.name} focus peaking color`}
            title={color.name}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorPicker;