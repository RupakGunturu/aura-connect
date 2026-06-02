import { useState, useCallback, useRef, useEffect } from "react";
import { PhoneOff, Mic, MicOff, Video, VideoOff, ExternalLink } from "lucide-react";
import { useCall } from "@/contexts/CallContext";

export default function ActiveCallOverlay() {
  const { activeCall, endCall, localStream, remoteStream } = useCall();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [pip, setPip] = useState(false);
  const pipSupportedRef = useRef(typeof document !== "undefined" && "pictureInPictureEnabled" in document);
  const [elapsed, setElapsed] = useState("00:00");

  useEffect(() => {
    if (localVideoRef.current && localStream.current) {
      localVideoRef.current.srcObject = localStream.current;
    }
  }, [!!localStream.current]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream.current) {
      remoteVideoRef.current.srcObject = remoteStream.current;
    }
  }, [!!remoteStream.current]);

  useEffect(() => {
    if (!activeCall?.startTime) return;
    const id = setInterval(() => {
      const sec = Math.floor((Date.now() - activeCall.startTime) / 1000);
      setElapsed(
        `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`,
      );
    }, 1000);
    return () => clearInterval(id);
  }, [activeCall?.startTime]);

  const toggleMute = useCallback(() => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach((t) => {
        t.enabled = muted;
      });
      setMuted((v) => !v);
    }
  }, [muted]);

  const toggleCam = useCallback(() => {
    if (localStream.current) {
      localStream.current.getVideoTracks().forEach((t) => {
        t.enabled = camOff;
      });
      setCamOff((v) => !v);
    }
  }, [camOff]);

  if (!activeCall) return null;

  const isConnected = activeCall.status === "connected";
  const isVideo = activeCall.type === "video";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Remote video (full background for video calls) */}
      {isVideo && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`absolute inset-0 size-full object-cover ${isConnected ? "opacity-100" : "opacity-0"}`}
        />
      )}

      {/* Non-video background */}
      {(!isVideo || !isConnected) && (
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="mx-auto mb-4 size-24 overflow-hidden rounded-full ring-2 ring-white/20">
            {activeCall.peerAvatar ? (
              <img src={activeCall.peerAvatar} alt="" className="size-full object-cover" />
            ) : (
              <div className="grid size-full place-items-center bg-card/20 text-4xl font-semibold uppercase text-white">
                {activeCall.peerName?.slice(0, 2) ?? "?"}
              </div>
            )}
          </div>
          <p className="text-xl font-semibold text-white">{activeCall.peerName}</p>
          <p className="mt-1 text-sm text-white/60">
            {isConnected
              ? elapsed
              : activeCall.status === "calling"
                ? "Calling..."
                : "Connecting..."}
          </p>
        </div>
      )}

      {/* Local video (PiP) */}
      {isVideo && (
        <div
          className={`absolute ${pip ? "inset-0" : "right-4 top-4"} z-10 overflow-hidden rounded-2xl ring-2 ring-white/20 transition-all ${pip ? "" : "size-32"}`}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="size-full object-cover"
          />
        </div>
      )}

      {/* Controls */}
      <div className="relative z-20 flex items-center justify-center gap-6 px-4 py-8">
        <button
          onClick={toggleMute}
          className={`grid size-12 place-items-center rounded-full transition-all ${
            muted ? "bg-red-600 text-white" : "bg-white/20 text-white hover:bg-white/30"
          }`}
        >
          {muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
        </button>

        {isVideo && (
          <button
            onClick={toggleCam}
            className={`grid size-12 place-items-center rounded-full transition-all ${
              camOff ? "bg-red-600 text-white" : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            {camOff ? <VideoOff className="size-5" /> : <Video className="size-5" />}
          </button>
        )}

        {isVideo && pipSupportedRef.current && (
          <button
            onClick={async () => {
              try {
                if (document.pictureInPictureElement) {
                  await document.exitPictureInPicture();
                } else if (remoteVideoRef.current) {
                  await remoteVideoRef.current.requestPictureInPicture();
                }
              } catch {}
            }}
            className="grid size-12 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30"
            title="Pop out video"
          >
            <ExternalLink className="size-5" />
          </button>
        )}

        <button
          onClick={endCall}
          className="grid size-14 place-items-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/30 transition-transform hover:scale-105"
        >
          <PhoneOff className="size-6" />
        </button>
      </div>
    </div>
  );
}
