
import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Eye, EyeOff, Settings } from 'lucide-react';
import ColorPicker from './ColorPicker';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ControlPanelProps {
  enabled: boolean;
  onToggle: () => void;
  color: string;
  onColorChange: (color: string) => void;
  threshold: number;
  onThresholdChange: (value: number) => void;
  className?: string;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  enabled,
  onToggle,
  color,
  onColorChange,
  threshold,
  onThresholdChange,
  className,
}) => {
  return (
    <div className={cn("control-panel flex items-center space-x-4", className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="text-white hover:text-white/80 transition-all duration-300"
        aria-label={enabled ? "Disable focus peaking" : "Enable focus peaking"}
      >
        {enabled ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
      </Button>
      
      <div className="flex items-center space-x-2 text-white">
        <span className="text-xs font-medium">Focus Peaking</span>
        <Switch 
          checked={enabled}
          onCheckedChange={onToggle}
        />
      </div>
      
      <ColorPicker
        selectedColor={color}
        onChange={onColorChange}
      />
      
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:text-white/80 transition-all duration-300"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 glassmorphism bg-black/40 border-none text-white">
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Sensitivity</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-white/70">Threshold: {threshold}</span>
                <span className="text-xs text-white/70">
                  {threshold < 15 ? "High" : threshold < 30 ? "Medium" : "Low"}
                </span>
              </div>
              <Slider
                value={[threshold]}
                min={5}
                max={50}
                step={1}
                onValueChange={(values) => onThresholdChange(values[0])}
              />
              <p className="text-xs text-white/60 mt-2">
                Lower threshold values detect more edges but may introduce noise.
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ControlPanel;
