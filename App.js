import React, { useState, useRef, useEffect } from "react";
import io from "socket.io-client";
import "./App.css";

const room = "myRoom"; // Example room name

function App() {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [isCallStarted, setIsCallStarted] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize Socket.io connection to signaling server
    socketRef.current = io.connect("http://localhost:4001");

    // Join the room
    socketRef.current.emit("joinRoom", room);

    socketRef.current.on("offer", async (offer) => {
      const pc = createPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current.emit("answer", { answer, room });
    });

    socketRef.current.on("answer", async (answer) => {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    });

    socketRef.current.on("ice-candidate", async (candidate) => {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("Error adding received ice candidate", error);
      }
    });
  }, [peerConnection]);

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection();

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("ice-candidate", {
          candidate: event.candidate,
          room,
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    return pc;
  };

  const startCall = async () => {
    try {
      setIsCallStarted(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      localVideoRef.current.srcObject = stream;

      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit("offer", { offer, room });

      setPeerConnection(pc);
    } catch (error) {
      console.error("Error starting the call:", error);
      alert(
        "An error occurred while trying to start the call. Please ensure your camera and microphone are accessible."
      );
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      localVideoRef.current.srcObject = null;
      setLocalStream(null);
    }

    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
      remoteVideoRef.current.srcObject = null;
      setRemoteStream(null);
    }

    setIsCallStarted(false);
  };

  return (
    <div className="app-container">
      <h1>Video Chat</h1>
      <div className="videos">
        <div>
          <h3>Local Video</h3>
          <video ref={localVideoRef} autoPlay playsInline muted></video>
        </div>
        <div>
          <h3>Remote Video</h3>
          <video ref={remoteVideoRef} autoPlay playsInline></video>
        </div>
      </div>
      <div className="buttons">
        {!isCallStarted ? (
          <button className="start-button" onClick={startCall}>
            Start Call
          </button>
        ) : (
          <button className="end-button" onClick={endCall}>
            Hang Up
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
