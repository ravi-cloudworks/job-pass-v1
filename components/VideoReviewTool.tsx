'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useGoogleLogin } from '@react-oauth/google';
import { useToast } from '@/hooks/use-toast';
import {
    Youtube,
    Info,
    ExternalLink,
    X,
    Copy,
    CheckCircle,
    Clock,
    Play,
    Pause,
    Video,
    AlertTriangle,
    ArrowRight,
    Camera
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

// Video configuration constants
const VIDEO_CONFIG = {
    WIDTH: 1280,
    HEIGHT: 720,
    FPS: 30,
    BITRATE: 2500000,
};

interface Segment {
    id: number;
    startTime: number;
    endTime: number;
    note: string;
    feedbackBlob?: Blob;
}

interface VideoReviewToolProps {
    videoId?: string;
}

const VideoReviewTool: React.FC<VideoReviewToolProps> = ({ videoId: initialVideoId }) => {
    const { toast } = useToast();

    // YouTube Video States
    const [videoUrl, setVideoUrl] = useState<string>('');
    const [videoId, setVideoId] = useState<string>(initialVideoId || '');
    const [playerReady, setPlayerReady] = useState<boolean>(false);

    // Segments States
    const [segments, setSegments] = useState<Segment[]>([]);
    const [currentSegment, setCurrentSegment] = useState<Segment | null>(null);
    const [isAddingSegment, setIsAddingSegment] = useState<boolean>(false);
    const [startTime, setStartTime] = useState<number>(0);
    const [endTime, setEndTime] = useState<number>(0);
    const [segmentNote, setSegmentNote] = useState<string>('');

    // Recording States
    const [isRecordingFeedback, setIsRecordingFeedback] = useState<boolean>(false);
    const [isPlayingSegment, setIsPlayingSegment] = useState<boolean>(false);
    const [isCameraReady, setIsCameraReady] = useState<boolean>(false);

    // Upload States
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showInstructions, setShowInstructions] = useState(false);
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [progressStage, setProgressStage] = useState<0 | 1 | 2 | 3>(0); // 0=idle, 1=instructions, 2=auth, 3=upload
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [finalVideoId, setFinalVideoId] = useState<string | null>(null);

    // Refs
    const playerRef = useRef<any>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const segmentBlobsRef = useRef<Blob[]>([]);

    // Add new state variables
    const [feedbackTimeLeft, setFeedbackTimeLeft] = useState(60); // 1 minute in seconds
    const [feedbackTimerActive, setFeedbackTimerActive] = useState(false);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const composedStreamRef = useRef<MediaStream | null>(null);
    const [isPlaybackModalOpen, setIsPlaybackModalOpen] = useState(false);
    const [currentPlaybackURL, setCurrentPlaybackURL] = useState<string | undefined>(undefined);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (feedbackTimerActive && feedbackTimeLeft > 0) {
            timer = setInterval(() => {
                setFeedbackTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (feedbackTimeLeft === 0 && feedbackTimerActive) {
            stopFeedbackRecording();
        }

        return () => clearInterval(timer);
    }, [feedbackTimerActive, feedbackTimeLeft]);

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Modify the player ready effect to be more specific
    useEffect(() => {
        if (initialVideoId) {
            initializePlayer(initialVideoId);
        }
    }, []); // Only run once on mount if initialVideoId exists

    // Modify onPlayerReady to be more controlled
    const onPlayerReady = () => {
        if (playerRef.current) {
            // Ensure player is ready to accept commands
            playerRef.current.playVideo();
            playerRef.current.pauseVideo();
            setPlayerReady(true);
            console.log("YouTube player ready"); // Debug log
        }
    };

    // Modify the effect that watches videoId and playerReady
    useEffect(() => {
        if (videoId && playerReady) {
            // Add a small delay to ensure DOM is ready
            const timeoutId = setTimeout(() => {
                initializeCamera();
            }, 1000);

            return () => clearTimeout(timeoutId);
        }
    }, [videoId, playerReady]);

    // Modify handleUrlSubmit to be more explicit
    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const extractedId = extractVideoId(videoUrl);
        if (extractedId) {
            setVideoId(extractedId);
            // Initialize player will trigger the chain of events
            initializePlayer(extractedId);
        } else {
            toast({
                title: "Invalid YouTube URL",
                description: "Please enter a valid YouTube URL",
                variant: "destructive"
            });
        }
    };

    // Extract video ID from YouTube URL
    const extractVideoId = (url: string): string => {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : '';
    };

    // Initialize YouTube Player
    const initializePlayer = (videoId: string) => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            if (firstScriptTag.parentNode) {
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            }

            window.onYouTubeIframeAPIReady = () => {
                createYouTubePlayer(videoId);
            };
        } else {
            createYouTubePlayer(videoId);
        }
    };

    const createYouTubePlayer = (videoId: string) => {
        if (playerRef.current) {
            playerRef.current.loadVideoById(videoId);
            return;
        }

        playerRef.current = new window.YT.Player('youtube-player', {
            height: '390',
            width: '640',
            videoId: videoId,
            playerVars: {
                'playsinline': 1,
                'controls': 1,
            },
            events: {
                'onReady': onPlayerReady,
            }
        });
    };

    // Initialize webcam with ref checking
    const initializeCamera = async () => {
        try {
            console.log("Initializing camera...");

            if (!videoRef.current) {
                throw new Error("Video element not available");
            }

            // Stop any existing tracks
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: VIDEO_CONFIG.WIDTH },
                    height: { ideal: VIDEO_CONFIG.HEIGHT }
                },
                audio: true
            });

            // Set both video elements with the stream
            videoRef.current.srcObject = stream;

            const displayVideo = document.getElementById('display-video') as HTMLVideoElement;
            if (displayVideo) {
                displayVideo.srcObject = stream;
            }

            // Handle metadata loading
            videoRef.current.onloadedmetadata = () => {
                if (videoRef.current) {
                    videoRef.current.play().catch(e => console.error("Error playing video:", e));
                }
            };

            streamRef.current = stream;
            setIsCameraReady(true);

            console.log("Camera initialized successfully");
        } catch (err) {
            console.error("Camera initialization error:", err);
            setIsCameraReady(false);
            toast({
                title: "Camera Error",
                description: "Unable to access camera. Please check permissions or try again.",
                variant: "destructive"
            });
        }
    };

    // Cleanup webcam
    const stopWebcam = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraReady(false);
    };

    // Add unmount cleanup in a separate effect
    useEffect(() => {
        return () => {
            stopWebcam();
        };
    }, []);

    // Handle adding a new segment
    const handleAddSegment = () => {
        if (!playerRef.current) return;

        // Check for segment limit
        if (!isAddingSegment && segments.length >= 3) {
            toast({
                title: "Segment Limit Reached",
                description: "Maximum 3 segments allowed",
                variant: "destructive"
            });
            return;
        }

        // Get the exact current time from the player
        const exactTime = playerRef.current.getCurrentTime();
        const videoDuration = playerRef.current.getDuration();

        console.log('Exact Time from player:', exactTime); // Debug log
        console.log('Video Duration:', videoDuration); // Debug log

        if (!isAddingSegment) {
            // Make sure we're not at the end of the video
            if (exactTime >= videoDuration) {
                toast({
                    title: "Invalid Start Time",
                    description: "Cannot start segment at the end of video",
                    variant: "destructive"
                });
                return;
            }

            // Pause the video to help with accurate time selection
            playerRef.current.pauseVideo();
            
            // Set the start time to the exact player position
            setStartTime(exactTime);
            setIsAddingSegment(true);

            toast({
                title: "Start Time Set",
                description: `Starting at ${exactTime.toFixed(2)}s`,
            });
        } else {
            // Make sure end time is after start time
            if (exactTime <= startTime) {
                toast({
                    title: "Invalid End Time",
                    description: "End time must be after start time",
                    variant: "destructive"
                });
                return;
            }

            // Pause the video
            playerRef.current.pauseVideo();

            const newSegment: Segment = {
                id: Date.now(),
                startTime: startTime,
                endTime: exactTime,
                note: segmentNote || `Segment ${segments.length + 1}`
            };

            console.log('New Segment:', {
                start: startTime.toFixed(2),
                end: exactTime.toFixed(2),
                duration: (exactTime - startTime).toFixed(2)
            }); // Debug log

            setSegments(prev => [...prev, newSegment]);
            setIsAddingSegment(false);
            setSegmentNote('');

            toast({
                title: "Segment Added",
                description: `Segment from ${startTime.toFixed(2)}s to ${exactTime.toFixed(2)}s`,
            });
        }
    };

    // Play a specific segment
    const playSegment = (segment: Segment) => {
        if (!playerRef.current) {
            console.error("YouTube player not initialized");
            return;
        }

        try {
            setCurrentSegment(segment);
            setIsPlayingSegment(true);

            // Make sure the player is ready and in the right state
            const playerState = playerRef.current.getPlayerState();
            console.log("Player state before seek:", playerState);

            // Seek to start time
            playerRef.current.seekTo(segment.startTime, true);
            
            // Force play the video
            playerRef.current.playVideo();

            console.log(`Playing segment from ${segment.startTime}s to ${segment.endTime}s`);

            // Set up an interval to check the current time
            const checkInterval = setInterval(() => {
                if (playerRef.current) {
                    const currentTime = playerRef.current.getCurrentTime();
                    if (currentTime >= segment.endTime) {
                        playerRef.current.pauseVideo();
                        setIsPlayingSegment(false);
                        clearInterval(checkInterval);
                        console.log("Segment playback completed");
                    }
                }
            }, 100); // Check every 100ms

            // Cleanup interval after segment duration + buffer
            const duration = (segment.endTime - segment.startTime) * 1000;
            setTimeout(() => {
                clearInterval(checkInterval);
            }, duration + 1000); // Add 1 second buffer

        } catch (error) {
            console.error("Error playing segment:", error);
            toast({
                title: "Playback Error",
                description: "Failed to play the segment",
                variant: "destructive"
            });
        }
    };

    // Start recording feedback for a segment
    const startFeedbackRecording = async (segment: Segment) => {
        try {
            setCurrentSegment(segment);

            // First, get screen sharing permission
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    displaySurface: 'browser',
                },
                audio: true
            });

            const videoTrack = screenStream.getVideoTracks()[0];
            videoTrack.applyConstraints({
                width: { ideal: VIDEO_CONFIG.WIDTH },
                height: { ideal: VIDEO_CONFIG.HEIGHT },
                frameRate: { ideal: VIDEO_CONFIG.FPS }
            });

            // Store screen stream reference
            screenStreamRef.current = screenStream;

            // Get microphone stream
            const micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });

            // Create a new composed stream
            const composedStream = new MediaStream();

            // Add the screen video track
            screenStream.getVideoTracks().forEach((videoTrack) => {
                composedStream.addTrack(videoTrack);
            });

            // Create audio context to mix audio streams
            const audioContext = new AudioContext();
            const destination = audioContext.createMediaStreamDestination();

            // Add screen audio if available
            if (screenStream.getAudioTracks().length > 0) {
                const screenSource = audioContext.createMediaStreamSource(screenStream);
                const screenGain = audioContext.createGain();
                screenGain.gain.value = 1.0;
                screenSource.connect(screenGain).connect(destination);
            }

            // Add microphone audio
            const micSource = audioContext.createMediaStreamSource(micStream);
            const micGain = audioContext.createGain();
            micGain.gain.value = 1.0;
            micSource.connect(micGain).connect(destination);

            // Add the combined audio to the composed stream
            destination.stream.getAudioTracks().forEach((audioTrack) => {
                composedStream.addTrack(audioTrack);
            });

            // Store the composed stream reference
            composedStreamRef.current = composedStream;

            // Setup MediaRecorder
            const mediaRecorder = new MediaRecorder(composedStream, {
                mimeType: 'video/webm;codecs=vp9,opus',
                videoBitsPerSecond: VIDEO_CONFIG.BITRATE
            });

            const chunks: BlobPart[] = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });

                // Add feedback blob to segment
                setSegments(prev => prev.map(s =>
                    s.id === segment.id ? { ...s, feedbackBlob: blob } : s
                ));

                setIsRecordingFeedback(false);
                setFeedbackTimerActive(false);
                setFeedbackTimeLeft(60); // Reset timer

                // Stop and cleanup streams
                if (screenStreamRef.current) {
                    screenStreamRef.current.getTracks().forEach(track => track.stop());
                    screenStreamRef.current = null;
                }

                if (composedStreamRef.current) {
                    composedStreamRef.current.getTracks().forEach(track => track.stop());
                    composedStreamRef.current = null;
                }

                toast({
                    title: "Feedback Recorded",
                    description: `Feedback for segment "${segment.note}" has been recorded`,
                });
            };

            mediaRecorderRef.current = mediaRecorder;
            
            // Start recording first
            mediaRecorder.start();
            setIsRecordingFeedback(true);

            // Then play the segment
            playSegment(segment);

            // Calculate segment duration
            const segmentDuration = (segment.endTime - segment.startTime) * 1000;

            // Wait for segment to finish playing
            await new Promise(resolve => setTimeout(resolve, segmentDuration + 500));

            // After segment ends, start the feedback timer
            setFeedbackTimeLeft(60);
            setFeedbackTimerActive(true);

            toast({
                title: "Segment Finished",
                description: "Now recording your feedback. You have 1 minute.",
            });

            // Setup cleanup when screen share stops
            screenStream.getVideoTracks()[0].onended = () => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                    mediaRecorderRef.current.stop();
                }
            };

        } catch (err) {
            console.error("Screen capture error:", err);
            setIsRecordingFeedback(false);
            setCurrentSegment(null);
            setFeedbackTimeLeft(60);

            // Cleanup streams
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(track => track.stop());
                screenStreamRef.current = null;
            }

            if (composedStreamRef.current) {
                composedStreamRef.current.getTracks().forEach(track => track.stop());
                composedStreamRef.current = null;
            }

            toast({
                title: "Recording Error",
                description: "Failed to start screen recording. Please check permissions.",
                variant: "destructive"
            });
        }
    };

    // Modified stopFeedbackRecording function
    const stopFeedbackRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }

        setIsRecordingFeedback(false);
        setCurrentSegment(null);
        setFeedbackTimeLeft(60);

        // Cleanup streams
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
        }

        if (composedStreamRef.current) {
            composedStreamRef.current.getTracks().forEach(track => track.stop());
            composedStreamRef.current = null;
        }
    };

    // Start the YouTube save process
    const handleSaveToYouTube = () => {
        // Check if any segments have feedback
        const hasSegmentsWithFeedback = segments.some(s => s.feedbackBlob);

        if (!hasSegmentsWithFeedback) {
            toast({
                title: "No Feedback Recorded",
                description: "Please record feedback for at least one segment before uploading",
                variant: "destructive"
            });
            return;
        }

        setIsProcessing(true);
        setProgressStage(1);
        setShowInstructions(true);
    };

    // User understood instructions
    const handleInstructionsUnderstood = () => {
        setShowInstructions(false);
        setProgressStage(2);
        login();
    };

    // Google Login handler
    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setAccessToken(tokenResponse.access_token);
            setProgressStage(3);

            toast({
                title: "Step 1 Complete",
                description: "Successfully logged in, now uploading video...",
                duration: 3000,
            });

            // Automatically upload after login
            setTimeout(() => {
                if (tokenResponse.access_token) {
                    uploadToYouTube(tokenResponse.access_token);
                }
            }, 1000);
        },
        onError: (error) => {
            console.error('Login Failed:', error);
            setErrorMessage("Google login failed. Please try again.");
            setIsProcessing(false);
            setProgressStage(0);
            toast({
                title: "Login Failed",
                description: "Could not login to Google",
                variant: "destructive",
                duration: 5000,
            });
        },
        flow: "implicit",
        prompt: "consent",
        scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.force-ssl'
    });

    // Combine all segment blobs into one video
    // Modified combineSegments function that handles WebM files properly
    const combineSegments = async () => {
        // Get all recorded feedback blobs
        const feedbackBlobs = segments
            .filter(segment => segment.feedbackBlob)
            .map(segment => segment.feedbackBlob as Blob);

        if (feedbackBlobs.length === 0) {
            throw new Error("No feedback recordings found");
        }

        // If we only have one blob, simply return it
        if (feedbackBlobs.length === 1) {
            return feedbackBlobs[0];
        }

        // For multiple blobs, we need to record them into a single continuous recording

        // Step 1: Create a video element for each blob and load it
        const videoPromises = feedbackBlobs.map(blob => {
            return new Promise<HTMLVideoElement>((resolve) => {
                const video = document.createElement('video');
                video.src = URL.createObjectURL(blob);
                video.muted = true;
                video.preload = 'auto';

                video.onloadedmetadata = () => {
                    resolve(video);
                };
            });
        });

        // Step 2: Wait for all videos to load
        const videoElements = await Promise.all(videoPromises);

        // Step 3: Create a canvas that will be used to capture all videos
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error("Failed to get canvas context");
        }

        // Set canvas size based on the first video
        canvas.width = videoElements[0].videoWidth || 640;
        canvas.height = videoElements[0].videoHeight || 480;

        // Step 4: Create a MediaStream from the canvas
        const canvasStream = canvas.captureStream(30); // 30 FPS

        // Step 5: Create a new MediaRecorder for the final combined video
        const mediaRecorder = new MediaRecorder(canvasStream, {
            mimeType: 'video/webm;codecs=vp9,opus',
            videoBitsPerSecond: 2500000
        });

        const combinedChunks: BlobPart[] = [];

        // Handle the recorder data
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                combinedChunks.push(e.data);
            }
        };

        // Create a promise for the recording completion
        const recordingPromise = new Promise<Blob>((resolve) => {
            mediaRecorder.onstop = () => {
                const combinedBlob = new Blob(combinedChunks, { type: 'video/webm' });
                resolve(combinedBlob);
            };
        });

        // Start recording
        mediaRecorder.start();

        // Step 6: Play each video and draw it to the canvas
        for (const video of videoElements) {
            // Create a promise that resolves when the video is done playing
            const playPromise = new Promise<void>((resolve) => {
                video.onended = () => resolve();

                // Draw video frames to canvas while playing
                const drawFrame = () => {
                    if (!video.paused && !video.ended) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        requestAnimationFrame(drawFrame);
                    }
                };

                // Start playing and drawing
                video.play().then(() => {
                    drawFrame();
                });
            });

            // Wait for this video to finish before continuing to the next
            await playPromise;
        }

        // Step 7: Stop recording after all videos have played
        mediaRecorder.stop();

        // Step 8: Return the combined blob
        return recordingPromise;
    };

    // Upload to YouTube
    // Modified uploadToYouTube function that handles the improved blob combining
    const uploadToYouTube = async (token?: string) => {
        const activeToken = token || accessToken;

        if (!activeToken) {
            setErrorMessage("Authentication error. Please try again.");
            setIsProcessing(false);
            setProgressStage(0);
            return;
        }

        try {
            setIsUploading(true);
            setProgressStage(3);
            setUploadProgress(10);

            // Simulate progress updates
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 80) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + Math.floor(Math.random() * 5);
                });
            }, 1000);

            // Combine all segments into one video using our improved method
            setUploadProgress(20);

            try {
                const finalBlob = await combineSegments();
                setUploadProgress(60);

                // Create a File object from the combined blob
                const file = new File([finalBlob], 'video-review.webm', { type: 'video/webm' });

                // Create the metadata part
                const metadata = {
                    snippet: {
                        title: `Video Review Feedback - ${new Date().toLocaleDateString()}`,
                        description: `Video review feedback for YouTube video ID: ${videoId}.\nRecorded on: ${new Date().toLocaleDateString()}`,
                        tags: ['video review', 'feedback'],
                        categoryId: '22' // People & Blogs category
                    },
                    status: {
                        privacyStatus: 'unlisted'
                    }
                };

                // Show more accurate progress
                setUploadProgress(70);

                // Create the multipart body
                const boundary = 'foo_bar_baz';
                const delimiter = "\r\n--" + boundary + "\r\n";
                const close_delim = "\r\n--" + boundary + "--";

                const multipartRequestBody =
                    delimiter +
                    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
                    JSON.stringify(metadata) +
                    delimiter +
                    'Content-Type: video/webm\r\n' +
                    'Content-Transfer-Encoding: binary\r\n\r\n';

                const blob1 = new Blob([multipartRequestBody], { type: 'text/plain' });
                const blob2 = new Blob([file], { type: 'video/webm' });
                const blob3 = new Blob([close_delim], { type: 'text/plain' });

                const finalUploadBlob = new Blob([blob1, blob2, blob3], { type: `multipart/mixed; boundary=${boundary}` });

                setUploadProgress(80);

                // Make the upload request
                const uploadResponse = await fetch(
                    `https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=multipart`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${activeToken}`,
                            'Content-Type': `multipart/mixed; boundary=${boundary}`,
                            'X-Upload-Content-Length': finalUploadBlob.size.toString(),
                        },
                        body: finalUploadBlob
                    }
                );

                clearInterval(progressInterval);
                setUploadProgress(100);

                if (!uploadResponse.ok) {
                    const errorText = await uploadResponse.text();
                    console.error('Upload response:', uploadResponse.status, errorText);

                    // Check for common YouTube channel errors
                    if (errorText.includes('youtubeSignupRequired') ||
                        errorText.includes('channelNotFound') ||
                        errorText.toLowerCase().includes('channel') ||
                        uploadResponse.status === 401) {
                        setErrorMessage("You need to create a YouTube channel before uploading");
                        toast({
                            title: "YouTube Channel Required",
                            description: "You need to create a YouTube channel first before uploading videos.",
                            variant: "destructive",
                            duration: 10000,
                        });
                        setProgressStage(0);
                        setIsProcessing(false);
                        return;
                    }

                    throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
                }

                const result = await uploadResponse.json();

                if (result.id) {
                    setFinalVideoId(result.id);

                    // Show success modal with confetti
                    setSuccessModalOpen(true);

                    toast({
                        title: "Upload Successful",
                        description: "Your video has been uploaded to YouTube",
                        duration: 5000,
                    });
                } else {
                    throw new Error(result.error?.message || "Upload failed");
                }
            } catch (combineError) {
                console.error('Error combining segments:', combineError);
                throw new Error(`Failed to combine video segments: ${(combineError as Error)?.message}`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            setErrorMessage(`${(error as Error)?.message || "Could not upload to YouTube"}`);
            toast({
                title: "Upload Failed",
                description: `${(error as Error)?.message || "Could not upload to YouTube"}`,
                variant: "destructive",
                duration: 5000,
            });
        } finally {
            setIsProcessing(false);
            setProgressStage(0);
            setUploadProgress(0);
            setIsUploading(false);
        }
    };

    // Trigger confetti effect when upload is successful
    useEffect(() => {
        if (finalVideoId && successModalOpen) {
            setTimeout(() => {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }, 300);
        }
    }, [finalVideoId, successModalOpen]);

    // Calculate progress based on stage
    const getStageProgress = () => {
        if (progressStage === 0) return 0;
        if (progressStage === 1) return 33;
        if (progressStage === 2) return 66;

        // Stage 3 (upload) uses uploadProgress
        const baseProgress = 66;
        const remainingProgressPercent = (uploadProgress / 100) * 34;
        return baseProgress + remainingProgressPercent;
    };

    const playRecordedFeedback = (segment: Segment) => {
        if (segment.feedbackBlob) {
            const url = URL.createObjectURL(segment.feedbackBlob);
            setCurrentPlaybackURL(url);
            setIsPlaybackModalOpen(true);
        }
    };

    return (
        <div className="video-review-container">
            {/* <h2 className="text-xl font-bold mb-4">Video Review Tool</h2> */}

            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: '1px', height: '1px' }}
            />

            {/* YouTube URL Input */}
            {!videoId && (
                <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2">Enter YouTube Video URL</h3>
                    <form onSubmit={handleUrlSubmit} className="flex gap-2">
                        <Input
                            type="text"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="flex-grow"
                        />
                        <Button type="submit">Load Video</Button>
                    </form>
                </div>
            )}

            {/* Main Content */}
            {videoId && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Side - YouTube Video */}
                    <div className="space-y-4">
                        <div className="border rounded-lg overflow-hidden">
                            <div id="youtube-player" className="aspect-video w-full"></div>
                        </div>

                        {/* Segment Controls */}
                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleAddSegment}
                                    variant={isAddingSegment ? "destructive" : "default"}
                                >
                                    {isAddingSegment ? "Set End Time" : "Set Start Time"}
                                </Button>

                                {isAddingSegment && (
                                    <Input
                                        value={segmentNote}
                                        onChange={(e) => setSegmentNote(e.target.value)}
                                        placeholder="Add a note for this segment"
                                        className="flex-grow"
                                    />
                                )}
                            </div>

                            <div className="text-sm">
                                {isAddingSegment && (
                                    <span>Start time: {startTime.toFixed(2)}s</span>
                                )}
                            </div>
                        </div>

                        {/* Segments List */}
                        <div className="space-y-2">
                            <h3 className="font-medium">Segments ({segments.length})</h3>
                            {segments.length === 0 ? (
                                <div className="text-sm text-gray-500">
                                    No segments added yet. Use the controls above to add segments.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {segments.map((segment) => {
                                        console.log('Rendering segment:', {
                                            segmentId: segment.id,
                                            currentSegmentId: currentSegment?.id,
                                            isRecording: isRecordingFeedback
                                        });
                                        
                                        return (
                                            <div
                                                key={segment.id}
                                                className={`border rounded-lg p-3 ${segment.feedbackBlob ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="font-medium">{segment.note}</div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-sm text-gray-500">
                                                            {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                                                        </div>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-6 w-6 rounded-full hover:bg-gray-200"
                                                            onClick={() => {
                                                                setSegments(prev => prev.filter(s => s.id !== segment.id));
                                                                if (segment.feedbackBlob) {
                                                                    URL.revokeObjectURL(URL.createObjectURL(segment.feedbackBlob));
                                                                }
                                                                toast({
                                                                    title: "Segment Deleted",
                                                                    description: `Segment "${segment.note}" has been removed`,
                                                                });
                                                            }}
                                                            disabled={isPlayingSegment || isRecordingFeedback}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 mt-2">
                                                    {isRecordingFeedback && currentSegment?.id === segment.id ? (
                                                        <Button
                                                            size="sm"
                                                            onClick={stopFeedbackRecording}
                                                            variant="destructive"
                                                        >
                                                            <Clock className="h-4 w-4 mr-1" />
                                                            Stop Recording ({formatTime(feedbackTimeLeft)})
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => startFeedbackRecording(segment)}
                                                            disabled={isPlayingSegment || isRecordingFeedback}
                                                            variant={segment.feedbackBlob ? "outline" : "default"}
                                                        >
                                                            <Camera className="h-4 w-4 mr-1" />
                                                            {segment.feedbackBlob ? "Re-record Feedback" : "Record Feedback"}
                                                        </Button>
                                                    )}

                                                    {segment.feedbackBlob && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => playRecordedFeedback(segment)}
                                                            disabled={isPlayingSegment || isRecordingFeedback}
                                                            variant="outline"
                                                        >
                                                            <Play className="h-4 w-4 mr-1" />
                                                            Playback
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side - Webcam & Controls */}
                    <div className="space-y-4">
                        {/* Webcam Preview */}
                        <div className="border rounded-lg overflow-hidden bg-gray-100 aspect-video relative">
                            <video
                                id="display-video"
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                                style={{ transform: 'scaleX(-1)' }}
                            />

                            {!videoId ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 bg-opacity-80">
                                    <Video className="h-12 w-12 text-gray-400 mb-2" />
                                    <p className="text-gray-500">Load a YouTube video to start</p>
                                </div>
                            ) : !isCameraReady && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 bg-opacity-80">
                                    <Camera className="h-12 w-12 text-gray-400 mb-2" />
                                    <p className="text-gray-500">Initializing camera...</p>
                                </div>
                            )}

                            {/* Recording Indicator with Timer */}
                            {isRecordingFeedback && (
                                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center">
                                    <div className="h-2 w-2 bg-white rounded-full mr-2 animate-pulse"></div>
                                    Recording ({formatTime(feedbackTimeLeft)})
                                </div>
                            )}
                        </div>

                        {/* Upload Controls */}
                        <div className="border rounded-lg p-4">
                            <h3 className="font-medium mb-2">Upload Review</h3>

                            {/* Progress bar (visible when processing) */}
                            {isProcessing && (
                                <div className="mb-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <div className="flex items-center space-x-2">
                                                {progressStage === 1 && <span className="text-primary font-medium">Step 1: Instructions</span>}
                                                {progressStage === 2 && <span className="text-primary font-medium">Step 2: Google Authentication</span>}
                                                {progressStage === 3 && <span className="text-primary font-medium">Step 3: Uploading to YouTube</span>}
                                            </div>
                                            <span className="text-muted-foreground">{Math.round(getStageProgress())}%</span>
                                        </div>
                                        <Progress value={getStageProgress()} className="h-1.5" />
                                    </div>
                                </div>
                            )}

                            {/* Upload Controls */}
                            {finalVideoId ? (
                                <div className="flex w-full items-center gap-4">
                                    <Alert className="flex-1 bg-green-50 border-green-200 text-green-800">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <AlertTitle className="text-sm font-medium text-green-800">Video available on YouTube</AlertTitle>
                                        <AlertDescription className="text-xs mt-1 text-green-700">
                                            Your recording is published as an unlisted video
                                        </AlertDescription>
                                    </Alert>

                                    <Button
                                        onClick={() => window.open(`https://youtu.be/${finalVideoId}`, '_blank')}
                                        size="sm"
                                        className="text-xs"
                                    >
                                        <Youtube className="mr-1.5 h-4 w-4" />
                                        Open on YouTube
                                    </Button>
                                </div>
                            ) : errorMessage ? (
                                <div className="flex w-full items-center gap-4">
                                    <Alert className="flex-1 bg-red-50 border-red-200 text-red-800">
                                        <AlertTriangle className="h-4 w-4 text-red-600" />
                                        <AlertTitle className="text-sm font-medium text-red-800">Error</AlertTitle>
                                        <AlertDescription className="text-xs mt-1 text-red-700">
                                            {errorMessage}
                                            {errorMessage?.includes('YouTube channel') && (
                                                <div className="mt-2">
                                                    <a
                                                        href="https://www.youtube.com/create_channel"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center text-blue-600 hover:underline font-medium"
                                                    >
                                                        <ExternalLink className="h-3 w-3 mr-1" />
                                                        Click here to create a YouTube channel
                                                    </a>
                                                    <p className="mt-1 text-xs text-red-600">
                                                        After creating your channel, return here and try again
                                                    </p>
                                                </div>
                                            )}
                                        </AlertDescription>
                                    </Alert>

                                    <Button
                                        onClick={() => {
                                            setErrorMessage(null);
                                            handleSaveToYouTube();
                                        }}
                                        disabled={isProcessing}
                                        variant="default"
                                        size="sm"
                                        className="text-xs"
                                    >
                                        <ArrowRight className="mr-1.5 h-4 w-4" />
                                        Try Again
                                    </Button>
                                </div>
                            ) : isProcessing ? (
                                <div className="flex-1">
                                    <Alert className="bg-primary/5 border-primary/20">
                                        <Info className="h-4 w-4 text-primary" />
                                        <AlertTitle className="text-sm font-medium">Processing your recording</AlertTitle>
                                        <AlertDescription className="text-xs mt-1">
                                            Please complete all steps to save your recording
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            ) : (
                                <div className="flex w-full items-center gap-4">
                                    <Alert className="flex-1 bg-primary/5 border-primary/20">
                                        <Info className="h-4 w-4 text-primary" />
                                        <AlertTitle className="text-sm font-medium">Save your feedback</AlertTitle>
                                        <AlertDescription className="text-xs mt-1">
                                            Save your feedback recordings to YouTube as an unlisted video
                                        </AlertDescription>
                                    </Alert>

                                    <Button
                                        onClick={handleSaveToYouTube}
                                        disabled={isProcessing || segments.filter(s => s.feedbackBlob).length === 0}
                                        variant="default"
                                        size="sm"
                                        className="text-xs"
                                    >
                                        <Youtube className="mr-1.5 h-4 w-4" />
                                        Save to YouTube
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Instructions Modal - Stage 1 */}
            <Dialog open={showInstructions} onOpenChange={(open) => {
                if (!open && isProcessing) {
                    // Reset when user closes dialog manually
                    setIsProcessing(false);
                    setProgressStage(0);
                }
                setShowInstructions(open);
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>YouTube Upload Instructions</DialogTitle>
                        <DialogDescription>
                            Please follow these steps to successfully upload your video:
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <h3 className="font-medium">Before you begin:</h3>
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                <li>You must have a YouTube channel associated with your Google account</li>
                                <li>If you don't have a YouTube channel yet, you'll need to create one first</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-medium">Step 1: Login Process (TWO SCREENS)</h3>
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                <li>After clicking "I Understand", you'll see Google's login screens</li>
                                <li><strong>First screen</strong>: Choose your Google account</li>
                                <li><strong>Second screen</strong>: You'll see two options - your email account and YouTube account</li>
                                <li><strong className="text-red-500">IMPORTANT: You MUST select the YouTube option</strong>, not your email</li>
                                <li>Selecting your email account instead of YouTube will cause an authorization error</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-medium">Step 2: Creating a YouTube Channel (if needed)</h3>
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                <li>If you don't see a YouTube option on the second screen, you need to create a channel first</li>
                                <li>
                                    <a
                                        href="https://www.youtube.com/create_channel"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 underline flex items-center"
                                    >
                                        Click here to create a YouTube channel
                                        <ExternalLink className="h-3 w-3 ml-1" />
                                    </a>
                                </li>
                                <li>Sign in with your Google account</li>
                                <li>Follow the prompts to complete channel creation</li>
                                <li>Return to this page and try again - you should now see two options on the second screen</li>
                            </ul>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleInstructionsUnderstood}>I Understand</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Success Modal */}
            <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="text-xl">Upload Successful!</span>
                            </div>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center space-y-6 py-6">
                        <div className="text-center space-y-2">
                            <p className="text-lg">Your video has been uploaded to YouTube</p>
                            <p className="text-sm text-muted-foreground">It's available as an unlisted video on your channel</p>
                        </div>

                        <div className="w-full p-4 bg-muted rounded-md">
                            <p className="font-medium mb-2">Video Link:</p>
                            <a
                                href={`https://youtu.be/${finalVideoId || ''}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700 hover:underline flex items-center justify-center gap-2 p-3 bg-card rounded border border-border transition-colors"
                            >
                                <Youtube className="h-5 w-5" />
                                {`https://youtu.be/${finalVideoId || ''}`}
                            </a>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                onClick={() => {
                                    navigator.clipboard.writeText(`https://youtu.be/${finalVideoId || ''}`);
                                    toast({
                                        title: "Link copied",
                                        description: "YouTube URL copied to clipboard",
                                        duration: 3000,
                                    });
                                }}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                            >
                                <Copy className="mr-1.5 h-4 w-4" />
                                Copy Link
                            </Button>
                            <Button
                                onClick={() => window.open(`https://youtu.be/${finalVideoId || ''}`, '_blank')}
                                size="sm"
                                className="text-xs"
                            >
                                <Youtube className="mr-1.5 h-4 w-4" />
                                Open Video
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Playback Modal */}
            {isPlaybackModalOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
                >
                    <div className="bg-background rounded-lg shadow-md w-[90vw] h-[90vh] flex flex-col border border-border overflow-hidden">
                        <div className="py-3 px-4 border-b flex justify-between items-center">
                            <h2 className="text-lg font-medium">Feedback Playback</h2>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="rounded-full h-8 w-8" 
                                onClick={() => {
                                    setIsPlaybackModalOpen(false);
                                    if (currentPlaybackURL) {
                                        URL.revokeObjectURL(currentPlaybackURL);
                                        setCurrentPlaybackURL(undefined);
                                    }
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        
                        <div className="flex-grow p-4">
                            <video 
                                src={currentPlaybackURL} 
                                controls 
                                autoPlay
                                className="w-full h-full"
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

// Add TypeScript declarations for YouTube API
declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

export default VideoReviewTool;