import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff } from 'lucide-react';

const WebcamComponent = () => {
  const videoRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        setError('');
      }
    } catch (err) {
      setError('Failed to access webcam. Please make sure you have granted camera permissions.');
      console.error('Error accessing webcam:', err);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="relative w-full max-w-2xl rounded-lg overflow-hidden bg-gray-100">
        {error && (
          <div className="absolute top-0 left-0 right-0 bg-red-500 text-white p-2 text-sm">
            {error}
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full aspect-video bg-black"
        />
      </div>
      
      <div className="flex gap-4">
        <button
          onClick={startWebcam}
          disabled={isStreaming}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            isStreaming
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          <Camera size={20} />
          Start Camera
        </button>
        
        <button
          onClick={stopWebcam}
          disabled={!isStreaming}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            !isStreaming
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
        >
          <CameraOff size={20} />
          Stop Camera
        </button>
      </div>
    </div>
  );
};

export default WebcamComponent;