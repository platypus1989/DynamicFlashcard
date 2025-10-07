import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Volume2, VolumeX, RotateCcw } from "lucide-react";
import { AudioSettingsStorage, type AudioSettings } from "@/lib/audioSettings";
import { useSpeech } from "@/hooks/use-speech";

interface AudioSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: (settings: AudioSettings) => void;
}

export default function AudioSettingsDialog({
  isOpen,
  onClose,
  onSettingsChange,
}: AudioSettingsDialogProps) {
  const [settings, setSettings] = useState<AudioSettings>(() =>
    AudioSettingsStorage.loadSettings()
  );

  const { speak, isSupported } = useSpeech({
    volume: settings.volume,
    rate: settings.rate,
  });

  // Load settings when dialog opens
  useEffect(() => {
    if (isOpen) {
      const loadedSettings = AudioSettingsStorage.loadSettings();
      setSettings(loadedSettings);
    }
  }, [isOpen]);

  const handleSettingChange = <K extends keyof AudioSettings>(
    key: K,
    value: AudioSettings[K]
  ) => {
    const updatedSettings = AudioSettingsStorage.updateSetting(key, value);
    setSettings(updatedSettings);
    onSettingsChange?.(updatedSettings);
  };

  const handleResetToDefaults = () => {
    const defaultSettings = AudioSettingsStorage.resetToDefaults();
    setSettings(defaultSettings);
    onSettingsChange?.(defaultSettings);
  };

  const handleTestAudio = () => {
    if (isSupported) {
      speak("Hello, this is a test of the pronunciation feature", {
        volume: settings.volume,
        rate: settings.rate,
      });
    }
  };

  if (!isSupported) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Audio Settings</DialogTitle>
            <DialogDescription>
              Text-to-speech is not supported in your browser.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8 text-muted-foreground">
            <VolumeX className="h-16 w-16 mx-auto mb-4" />
            <p>Your browser doesn't support text-to-speech functionality.</p>
            <p className="mt-2 text-sm">
              Please try using a modern browser like Chrome, Firefox, Safari, or Edge.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Audio Settings</DialogTitle>
          <DialogDescription>
            Configure text-to-speech settings for Learning and Test modes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Auto-play Toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-play" className="text-sm font-medium">
                Auto-play pronunciation
              </Label>
              <Switch
                id="auto-play"
                checked={settings.autoPlay}
                onCheckedChange={(checked) =>
                  handleSettingChange("autoPlay", checked)
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Automatically play word pronunciation when displayed
            </p>
          </div>

          <Separator />

          {/* Volume Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Volume</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(settings.volume * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <VolumeX className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Slider
                value={[settings.volume]}
                onValueChange={([value]) => handleSettingChange("volume", value)}
                min={0}
                max={1}
                step={0.1}
                className="flex-1"
              />
              <Volume2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </div>
          </div>

          <Separator />

          {/* Playback Speed Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Playback speed</Label>
              <span className="text-sm text-muted-foreground">
                {settings.rate.toFixed(1)}x
              </span>
            </div>
            <Slider
              value={[settings.rate]}
              onValueChange={([value]) => handleSettingChange("rate", value)}
              min={0.5}
              max={2.0}
              step={0.1}
              className="flex-1"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.5x (Slow)</span>
              <span>1.0x (Normal)</span>
              <span>2.0x (Fast)</span>
            </div>
          </div>

          <Separator />

          {/* Test Button */}
          <div className="space-y-2">
            <Button
              onClick={handleTestAudio}
              variant="outline"
              className="w-full"
            >
              <Volume2 className="mr-2 h-4 w-4" />
              Test Audio
            </Button>
          </div>
        </div>

        <div className="flex justify-between gap-3">
          <Button
            onClick={handleResetToDefaults}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <RotateCcw className="mr-2 h-3 w-3" />
            Reset to Defaults
          </Button>
          <Button onClick={onClose} className="flex-1">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

