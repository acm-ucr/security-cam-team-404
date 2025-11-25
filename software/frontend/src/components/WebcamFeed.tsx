import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, CameraOff, Video, Download, Clock, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Screenshot {
  id: string;
  timestamp: string;
  location: string;
}

const WebcamFeed = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [nightVision, setNightVision] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadDevices();
    return () => {
      stopStream();
    };
  }, []);

  //probably checking if there are devices
  const loadDevices = async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceList.filter(device => device.kind === "videoinput");
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error("Error loading devices:", error);
      toast.error("Failed to load camera devices");
    }
  };

  //ChANGE CAMERA HEREEEE
  const startStream = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: selectedDevice ? { deviceId: { exact: selectedDevice } } : true,
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
        toast.success("Camera started successfully");
      }
    } catch (error) {
      console.error("Error accessing webcam:", error);
      toast.error("Failed to access camera. Please check permissions.");
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    toast.info("Camera stopped");
  };

  const takeScreenshot = () => {
    if (!videoRef.current || !isStreaming) {
      toast.error("Camera must be running to take a screenshot");
      return;
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const timestamp = new Date();
          const filename = `acm-forge-cam-${format(timestamp, 'yyyy-MM-dd-HHmmss')}.png`;
          const url = URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
          
          toast.success("Screenshot saved!");
        }
      }, 'image/png');
    }
  };


  //LOG THE SS HEREE
  const logScreenshot = () => {
    if (!isStreaming) {
      toast.error("Camera must be running to log a screenshot");
      return;
    }

    const timestamp = new Date();

    let ssFileNameCount = 1;
    const screenshotHistory = []

    function screenshotFileName(){
      let filename = `acm-forge-cam-${format(timestamp, 'yyyy-MM-dd-HHmmss')}.png`;
      ssFileNameCount++;
      return filename;
    }
    
    const newScreenshot: Screenshot = {
      id: crypto.randomUUID(),
      timestamp: format(timestamp, 'PPpp'),
      location: `Downloads/${screenshotFileName()}`,
    };

    setScreenshots(prev => [newScreenshot, ...prev]);
    toast.success("Screenshot logged!");
  };


  const toggleNightVision = () => {
    setNightVision(!nightVision);
    toast.info(nightVision ? "Night vision disabled" : "Night vision enabled");
  };

  const handleDeviceChange = async (deviceId: string) => {
    setSelectedDevice(deviceId);
    if (isStreaming) {
      stopStream();
      setTimeout(() => {
        setSelectedDevice(deviceId);
        startStream();
      }, 100);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="relative aspect-video bg-card rounded-lg overflow-hidden border-2 border-border shadow-2xl">
        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center space-y-4">
              <Video className="w-16 h-16 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Camera Unavailable</p>
            </div>
          </div>
        )}
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${!isStreaming ? "hidden" : ""}`}
          style={nightVision ? { 
            filter: 'brightness(1.5) contrast(1.2)',
          } : undefined}
          autoPlay
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Select value={selectedDevice} onValueChange={handleDeviceChange}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Select camera" />
            </SelectTrigger>
            <SelectContent>
              {devices
                .filter(device => device.deviceId && device.deviceId.trim() !== "")
                .map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${devices.indexOf(device) + 1}`}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {!isStreaming ? (
            <Button onClick={startStream} size="lg" className="w-full sm:w-auto">
              <Camera className="mr-2 h-5 w-5" />
              Start Camera
            </Button>
          ) : (
            <Button onClick={stopStream} variant="destructive" size="lg" className="w-full sm:w-auto">
              <CameraOff className="mr-2 h-5 w-5" />
              Stop Camera
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Button 
            onClick={takeScreenshot} 
            disabled={!isStreaming}
            size="lg" 
            variant="secondary"
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-5 w-5" />
            Take Screenshot
          </Button>

          <Button 
            onClick={logScreenshot} 
            disabled={!isStreaming}
            size="lg" 
            variant="secondary"
            className="w-full sm:w-auto"
          >
            <Clock className="mr-2 h-5 w-5" />
            Log Screenshot
          </Button>

          <Button 
            onClick={toggleNightVision}
            size="lg" 
            variant={nightVision ? "default" : "outline"}
            className="w-full sm:w-auto"
          >
            {nightVision ? <Moon className="mr-2 h-5 w-5" /> : <Sun className="mr-2 h-5 w-5" />}
            Night Vision {nightVision ? "On" : "Off"}
          </Button>
        </div>
      </div>

      {screenshots.length > 0 && (
        <div className="mt-8 space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">Screenshot Log</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {screenshots.map((screenshot) => (
              <div 
                key={screenshot.id} 
                className="bg-card border border-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div className="flex items-center gap-3">
                  <Camera className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{screenshot.timestamp}</p>
                    <p className="text-xs text-muted-foreground">{screenshot.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebcamFeed;
