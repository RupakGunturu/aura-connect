import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/contexts/AuthContext";
import { playCallRingtone, showNotification } from "@/lib/notifications";

const CallContext = createContext(null);

export function CallProvider({ children }) {
  const { user, token } = useAuth();
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [iceServers, setIceServers] = useState([{ urls: "stun:stun.l.google.com:19302" }]);

  const activeCallRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const iceServersRef = useRef(iceServers);

  function setActive(v) {
    activeCallRef.current = v;
    setActiveCall(v);
  }

  const cleanupCall = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    remoteStreamRef.current = null;
    activeCallRef.current = null;
  }, []);

  useEffect(() => {
    if (!token) return;
    api("/ice-servers", { token }).then((data) => {
      if (data?.iceServers?.length) setIceServers(data.iceServers);
    }).catch(() => {});
  }, [token]);

  useEffect(() => {
    iceServersRef.current = iceServers;
  }, [iceServers]);

  useEffect(() => {
    if (!token) return;
    const s = getSocket(token);

    function onIncoming(payload) {
      setIncomingCall(payload);
      playCallRingtone();
      showNotification("Incoming Call", {
        body: `${payload.callerName || "Someone"} is calling (${payload.type})`,
        onClick: () => window.focus(),
      });
    }

    function onAccepted(payload) {
      const current = activeCallRef.current;
      if (current?.callId === payload.callId && payload.accepterId) {
        setActive({ ...current, status: "connecting" });
        startWebRTC(payload.accepterId, payload.callId);
      }
    }

    function onRejected(payload) {
      if (activeCallRef.current?.callId === payload.callId) {
        cleanupCall();
        setActive(null);
      }
    }

    function onEnded(payload) {
      if (
        activeCallRef.current?.callId === payload.callId ||
        incomingCall?.callId === payload.callId
      ) {
        cleanupCall();
        setActive(null);
        setIncomingCall(null);
      }
    }

    function onWebrtcOffer(payload) {
      handleWebrtcOffer(payload);
    }

    function onWebrtcAnswer(payload) {
      handleWebrtcAnswer(payload);
    }

    function onWebrtcIce(payload) {
      handleWebrtcIce(payload);
    }

    s.on("incomingCall", onIncoming);
    s.on("callAccepted", onAccepted);
    s.on("callRejected", onRejected);
    s.on("callEnded", onEnded);
    s.on("webrtcOffer", onWebrtcOffer);
    s.on("webrtcAnswer", onWebrtcAnswer);
    s.on("webrtcIceCandidate", onWebrtcIce);

    return () => {
      s.off("incomingCall", onIncoming);
      s.off("callAccepted", onAccepted);
      s.off("callRejected", onRejected);
      s.off("callEnded", onEnded);
      s.off("webrtcOffer", onWebrtcOffer);
      s.off("webrtcAnswer", onWebrtcAnswer);
      s.off("webrtcIceCandidate", onWebrtcIce);
    };
  }, [token]);

  const startCall = useCallback(
    async (targetId, type, targetName) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(
          type === "video" ? { video: true, audio: true } : { audio: true },
        );
        localStreamRef.current = stream;

        const res = await api("/calls", {
          method: "POST",
          body: JSON.stringify({
            participants: [user.id, targetId],
            metadata: { type, callerName: user.profile.name, callerAvatar: user.profile.avatarUrl },
          }),
          token,
        });

        const callId = res.session._id;
        setActive({
          callId,
          peerId: targetId,
          peerName: targetName,
          type,
          status: "calling",
          startTime: Date.now(),
        });

        getSocket(token).emit("callInvite", {
          targetId,
          callId,
          type,
          callerName: user.profile.name,
          callerAvatar: user.profile.avatarUrl,
        });
      } catch {
        cleanupCall();
      }
    },
    [user, token, cleanupCall],
  );

  const getRTCConfig = () => ({ iceServers: iceServersRef.current });

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    const { callId, callerId, callerName, type } = incomingCall;
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        type === "video" ? { video: true, audio: true } : { audio: true },
      );
      localStreamRef.current = stream;

      await api(`/calls/${callId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "active" }),
        token,
      });
      setActive({
        callId,
        peerId: callerId,
        peerName: callerName,
        type,
        status: "connecting",
        startTime: Date.now(),
      });
      setIncomingCall(null);

      getSocket(token).emit("callAccept", { targetId: callerId, callId });
    } catch {
      cleanupCall();
    }
  }, [incomingCall, token, cleanupCall]);

  const rejectCall = useCallback(async () => {
    if (!incomingCall) return;
    const { callId, callerId } = incomingCall;
    await api(`/calls/${callId}/end`, { method: "PATCH", token }).catch(() => {});
    getSocket(token).emit("callReject", { targetId: callerId, callId });
    setIncomingCall(null);
  }, [incomingCall, token]);

  const endCall = useCallback(async () => {
    const current = activeCallRef.current;
    if (!current) return;
    const { callId, peerId } = current;
    await api(`/calls/${callId}/end`, { method: "PATCH", token }).catch(() => {});
    getSocket(token).emit("callEnd", { targetId: peerId, callId });
    cleanupCall();
    setActive(null);
  }, [token, cleanupCall]);

  async function startWebRTC(targetId, callId) {
    try {
      if (pcRef.current) return;
      const pc = new RTCPeerConnection(getRTCConfig());
      pcRef.current = pc;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current));
      }

      pc.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
        const cur = activeCallRef.current;
        if (cur?.callId === callId) setActive({ ...cur, status: "connected" });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          getSocket(token).emit("webrtcIceCandidate", {
            targetId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      getSocket(token).emit("webrtcOffer", { targetId, sdp: offer });
    } catch {
      cleanupCall();
      setActive(null);
    }
  }

  async function handleWebrtcOffer(payload) {
    const current = activeCallRef.current;
    if (!current || current.status === "calling" || pcRef.current) return;
    try {
      const pc = new RTCPeerConnection(getRTCConfig());
      pcRef.current = pc;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current));
      }

      pc.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
        const cur = activeCallRef.current;
        if (cur) setActive({ ...cur, status: "connected" });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          getSocket(token).emit("webrtcIceCandidate", {
            targetId: payload.senderId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      getSocket(token).emit("webrtcAnswer", { targetId: payload.senderId, sdp: answer });
    } catch {
      cleanupCall();
      setActive(null);
    }
  }

  async function handleWebrtcAnswer(payload) {
    if (!pcRef.current) return;
    try {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    } catch {
      // ignore
    }
  }

  async function handleWebrtcIce(payload) {
    if (!pcRef.current) return;
    try {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
    } catch {
      // ignore
    }
  }

  const value = {
    incomingCall,
    activeCall,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    localStream: localStreamRef,
    remoteStream: remoteStreamRef,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used inside CallProvider");
  return ctx;
}
