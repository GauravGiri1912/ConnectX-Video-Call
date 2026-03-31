import React, { useEffect, useRef, useState } from 'react';
import io from "socket.io-client";
import { Badge, Button, Chip, IconButton, Stack, TextField } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import BackHandIcon from '@mui/icons-material/BackHand';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DownloadIcon from '@mui/icons-material/Download';
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import server from '../environment';

const server_url = server;

let connections = {};

const peerConfigConnections = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
    ]
};

export default function VideoMeetComponent() {
    const socketRef = useRef();
    const socketIdRef = useRef();
    const localVideoref = useRef();
    const videoRef = useRef([]);
    const fileInputRef = useRef();
    const audioAnalyserRefs = useRef({});
    const audioLevelRefs = useRef({});
    const audioMonitorIntervalRef = useRef(null);

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [video, setVideo] = useState(false);
    const [audio, setAudio] = useState(false);
    const [screen, setScreen] = useState(false);
    const [showModal, setModal] = useState(true);
    const [screenAvailable, setScreenAvailable] = useState(false);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [newMessages, setNewMessages] = useState(0);
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");
    const [videos, setVideos] = useState([]);
    const [participants, setParticipants] = useState([]);
    const [hostId, setHostId] = useState(null);
    const [handRaised, setHandRaised] = useState(false);
    const [meetingNotice, setMeetingNotice] = useState("");
    const [activeSpeakerId, setActiveSpeakerId] = useState(null);

    const isHost = hostId === socketIdRef.current;

    useEffect(() => {
        getPermissions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        audioMonitorIntervalRef.current = window.setInterval(() => {
            const entries = Object.entries(audioAnalyserRefs.current);
            if (!entries.length) {
                setActiveSpeakerId(null);
                return;
            }

            let loudestSpeakerId = null;
            let loudestLevel = 0;

            entries.forEach(([speakerId, monitor]) => {
                const sampleBuffer = audioLevelRefs.current[speakerId];
                const analyser = monitor?.analyser;

                if (!sampleBuffer || !analyser) {
                    return;
                }

                analyser.getByteFrequencyData(sampleBuffer);
                const averageLevel = sampleBuffer.reduce((sum, value) => sum + value, 0) / sampleBuffer.length;
                if (averageLevel > loudestLevel) {
                    loudestLevel = averageLevel;
                    loudestSpeakerId = speakerId;
                }
            });

            setActiveSpeakerId(loudestLevel > 18 ? loudestSpeakerId : null);
        }, 250);

        return () => {
            if (audioMonitorIntervalRef.current) {
                window.clearInterval(audioMonitorIntervalRef.current);
            }
        };
    }, []);

    const getDisplayMedia = () => {
        if (screen && navigator.mediaDevices.getDisplayMedia) {
            navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                .then(getDisplayMediaSuccess)
                .catch((error) => console.log(error));
        }
    };

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            setVideoAvailable(!!videoPermission);

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            setAudioAvailable(!!audioPermission);

            setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

            if (videoPermission || audioPermission) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({
                    video: !!videoPermission,
                    audio: !!audioPermission
                });

                window.localStream = userMediaStream;
                if (localVideoref.current) {
                    localVideoref.current.srcObject = userMediaStream;
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [video, audio]);

    const getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    };

    const stopAudioMonitoring = (speakerId) => {
        const existingMonitor = audioAnalyserRefs.current[speakerId];
        if (existingMonitor?.source) {
            existingMonitor.source.disconnect();
        }
        if (existingMonitor?.context) {
            existingMonitor.context.close().catch(() => null);
        }

        delete audioAnalyserRefs.current[speakerId];
        delete audioLevelRefs.current[speakerId];
    };

    const startAudioMonitoring = (speakerId, stream) => {
        stopAudioMonitoring(speakerId);

        if (!stream?.getAudioTracks()?.length) {
            return;
        }

        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = context.createAnalyser();
            analyser.fftSize = 256;
            const source = context.createMediaStreamSource(stream);
            source.connect(analyser);

            audioAnalyserRefs.current[speakerId] = { analyser, source, context };
            audioLevelRefs.current[speakerId] = new Uint8Array(analyser.frequencyBinCount);
        } catch (error) {
            console.log(error);
        }
    };

    const getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach((track) => track.stop());
        } catch (error) {
            console.log(error);
        }

        window.localStream = stream;
        localVideoref.current.srcObject = stream;
        startAudioMonitoring(socketIdRef.current || "local-user", stream);

        for (const id in connections) {
            if (id === socketIdRef.current) continue;

            connections[id].addStream(window.localStream);

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ sdp: connections[id].localDescription }));
                    })
                    .catch((error) => console.log(error));
            });
        }

        stream.getTracks().forEach((track) => {
            track.onended = () => {
                setVideo(false);
                setAudio(false);

                try {
                    localVideoref.current.srcObject.getTracks().forEach((streamTrack) => streamTrack.stop());
                } catch (error) {
                    console.log(error);
                }

                const blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                window.localStream = blackSilence();
                localVideoref.current.srcObject = window.localStream;

                for (const id in connections) {
                    connections[id].addStream(window.localStream);

                    connections[id].createOffer().then((description) => {
                        connections[id].setLocalDescription(description)
                            .then(() => {
                                socketRef.current.emit('signal', id, JSON.stringify({ sdp: connections[id].localDescription }));
                            })
                            .catch((error) => console.log(error));
                    });
                }
            };
        });
    };

    const getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video, audio })
                .then(getUserMediaSuccess)
                .catch((error) => console.log(error));
        } else {
            try {
                localVideoref.current.srcObject.getTracks().forEach((track) => track.stop());
            } catch (error) {
                console.log(error);
            }
        }
    };

    const getDisplayMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach((track) => track.stop());
        } catch (error) {
            console.log(error);
        }

        window.localStream = stream;
        localVideoref.current.srcObject = stream;
        startAudioMonitoring(socketIdRef.current || "local-user", stream);

        for (const id in connections) {
            if (id === socketIdRef.current) continue;

            connections[id].addStream(window.localStream);

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ sdp: connections[id].localDescription }));
                    })
                    .catch((error) => console.log(error));
            });
        }

        stream.getTracks().forEach((track) => {
            track.onended = () => {
                setScreen(false);

                try {
                    localVideoref.current.srcObject.getTracks().forEach((streamTrack) => streamTrack.stop());
                } catch (error) {
                    console.log(error);
                }

                const blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                window.localStream = blackSilence();
                localVideoref.current.srcObject = window.localStream;
                getUserMedia();
            };
        });
    };

    const gotMessageFromServer = (fromId, incomingMessage) => {
        const signal = JSON.parse(incomingMessage);

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ sdp: connections[fromId].localDescription }));
                            }).catch((error) => console.log(error));
                        }).catch((error) => console.log(error));
                    }
                }).catch((error) => console.log(error));
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch((error) => console.log(error));
            }
        }
    };

    const applyRoomState = ({ hostId: nextHostId, participants: nextParticipants }) => {
        setHostId(nextHostId);
        setParticipants(nextParticipants || []);
        const currentParticipant = (nextParticipants || []).find((participant) => participant.socketId === socketIdRef.current);
        setHandRaised(!!currentParticipant?.handRaised);
    };

    const connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false });

        socketRef.current.on('signal', gotMessageFromServer);
        socketRef.current.on('chat-message', addMessage);
        socketRef.current.on('room-state', applyRoomState);
        socketRef.current.on('hand-raise-updated', ({ username: participantName, raised }) => {
            setMeetingNotice(raised ? `${participantName} raised their hand` : `${participantName} lowered their hand`);
            setTimeout(() => setMeetingNotice(""), 2500);
        });
        socketRef.current.on('mute-all', () => {
            setAudio(false);
            try {
                window.localStream?.getAudioTracks().forEach((track) => {
                    track.enabled = false;
                });
            } catch (error) {
                console.log(error);
            }
            setMeetingNotice("Host muted everyone in the room");
            setTimeout(() => setMeetingNotice(""), 2500);
        });
        socketRef.current.on('kicked', () => {
            alert("The host removed you from this meeting.");
            window.location.href = "/home";
        });

        socketRef.current.on('connect', () => {
            socketIdRef.current = socketRef.current.id;
            socketRef.current.emit('join-call', window.location.href, username || "Guest");

            socketRef.current.on('user-left', (id) => {
                setVideos((currentVideos) => currentVideos.filter((participantVideo) => participantVideo.socketId !== id));
                stopAudioMonitoring(id);
                delete connections[id];
            });

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach((socketListId) => {
                    if (connections[socketListId]) {
                        return;
                    }

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections);
                    connections[socketListId].onicecandidate = (event) => {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ ice: event.candidate }));
                        }
                    };

                    connections[socketListId].onaddstream = (event) => {
                        const newVideo = {
                            socketId: socketListId,
                            stream: event.stream,
                            autoplay: true,
                            playsinline: true
                        };
                        startAudioMonitoring(socketListId, event.stream);

                        setVideos((currentVideos) => {
                            const existingVideo = currentVideos.find((participantVideo) => participantVideo.socketId === socketListId);
                            const updatedVideos = existingVideo
                                ? currentVideos.map((participantVideo) =>
                                    participantVideo.socketId === socketListId ? { ...participantVideo, stream: event.stream } : participantVideo
                                )
                                : [...currentVideos, newVideo];

                            videoRef.current = updatedVideos;
                            return updatedVideos;
                        });
                    };

                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream);
                    } else {
                        const blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                        window.localStream = blackSilence();
                        connections[socketListId].addStream(window.localStream);
                    }
                });

                if (id === socketIdRef.current) {
                    for (const id2 in connections) {
                        if (id2 === socketIdRef.current) continue;

                        try {
                            connections[id2].addStream(window.localStream);
                        } catch (error) {
                            console.log(error);
                        }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ sdp: connections[id2].localDescription }));
                                })
                                .catch((error) => console.log(error));
                        });
                    }
                }
            });
        });
    };

    const silence = () => {
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const destination = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        ctx.resume();
        return Object.assign(destination.stream.getAudioTracks()[0], { enabled: false });
    };

    const black = ({ width = 640, height = 480 } = {}) => {
        const canvas = Object.assign(document.createElement("canvas"), { width, height });
        canvas.getContext('2d').fillRect(0, 0, width, height);
        const stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false });
    };

    const handleVideo = () => {
        setVideo(!video);
    };

    const handleAudio = () => {
        setAudio(!audio);
    };

    useEffect(() => {
        if (screen !== undefined) {
            getDisplayMedia();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screen]);

    useEffect(() => () => {
        Object.keys(audioAnalyserRefs.current).forEach((speakerId) => {
            stopAudioMonitoring(speakerId);
        });
    }, []);

    const handleScreen = () => {
        setScreen(!screen);
    };

    const handleEndCall = () => {
        try {
            localVideoref.current.srcObject.getTracks().forEach((track) => track.stop());
        } catch (error) {
            console.log(error);
        }
        window.location.href = "/";
    };

    const addMessage = (chatPayload) => {
        setMessages((prevMessages) => [...prevMessages, chatPayload]);

        if (chatPayload.socketId !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };

    const sendMessage = () => {
        if (!message.trim()) {
            return;
        }

        socketRef.current.emit('chat-message', {
            type: "text",
            text: message.trim()
        }, username || "Guest");
        setMessage("");
    };

    const handleFileSelection = (event) => {
        const selectedFile = event.target.files?.[0];
        if (!selectedFile) {
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            socketRef.current.emit('chat-message', {
                type: "file",
                text: `${selectedFile.name} shared`,
                fileName: selectedFile.name,
                fileType: selectedFile.type,
                fileData: reader.result
            }, username || "Guest");
        };
        reader.readAsDataURL(selectedFile);
        event.target.value = "";
    };

    const handleRaiseHand = () => {
        const nextRaisedState = !handRaised;
        setHandRaised(nextRaisedState);
        socketRef.current.emit('toggle-hand-raise', {
            raised: nextRaisedState,
            username: username || "Guest"
        });
    };

    const handleMuteAll = () => {
        socketRef.current.emit('mute-all');
    };

    const handleKickUser = (targetSocketId) => {
        socketRef.current.emit('kick-user', { targetSocketId });
    };

    const connect = () => {
        if (!username.trim()) {
            return;
        }

        setAskForUsername(false);
        getMedia();
    };

    const renderChatBubble = (item, index) => {
        const isFile = item.type === "file" && item.fileData;

        return (
            <div className={styles.chatBubble} key={`${item.sender}-${item.sentAt || index}-${index}`}>
                <p className={styles.chatSender}>{item.sender}</p>
                {isFile ? (
                    <div className={styles.fileBubble}>
                        <p className={styles.fileName}>{item.fileName}</p>
                        <a
                            className={styles.fileDownload}
                            href={item.fileData}
                            download={item.fileName}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <DownloadIcon fontSize="small" />
                            Download
                        </a>
                    </div>
                ) : (
                    <p className={styles.chatText}>{item.text}</p>
                )}
            </div>
        );
    };

    const localParticipant = participants.find((participant) => participant.socketId === socketIdRef.current);
    const roomCode = window.location.pathname.replace("/", "") || "meeting-room";
    const allVideoTiles = [
        {
            socketId: socketIdRef.current || "local-user",
            stream: window.localStream,
            username: localParticipant?.username || username || "You",
            isLocal: true
        },
        ...videos.map((participantVideo) => {
            const participantMeta = participants.find((participant) => participant.socketId === participantVideo.socketId);
            return {
                ...participantVideo,
                username: participantMeta?.username || "Participant",
                isLocal: false
            };
        })
    ].filter((tile) => tile.stream);

    return (
        <div>
            {askForUsername ? (
                <div className={styles.lobbyPage}>
                    <div className={styles.lobbyShell}>
                        <div className={styles.lobbyContent}>
                            <div className={styles.lobbyCopy}>
                                <p className={styles.lobbyEyebrow}>Ready to join</p>
                                <h1 className={styles.lobbyTitle}>Step into your meeting with confidence</h1>
                                <p className={styles.lobbyText}>
                                    Preview your camera, confirm your name, and join the room with a cleaner,
                                    more polished setup experience.
                                </p>

                                <div className={styles.lobbyChecklist}>
                                    <div className={styles.lobbyCheckItem}>
                                        <strong>Camera preview</strong>
                                        <span>See exactly how you appear before entering.</span>
                                    </div>
                                    <div className={styles.lobbyCheckItem}>
                                        <strong>Quick join</strong>
                                        <span>Use your name and enter the room in one step.</span>
                                    </div>
                                    <div className={styles.lobbyCheckItem}>
                                        <strong>Modern meeting flow</strong>
                                        <span>Clean transition from lobby to the live call space.</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.lobbyCard}>
                                <div className={styles.lobbyPreviewWrap}>
                                    <video className={styles.lobbyPreview} ref={localVideoref} autoPlay muted></video>
                                    <div className={styles.lobbyPreviewBadge}>Camera Preview</div>
                                </div>

                                <div className={styles.lobbyForm}>
                                    <div>
                                        <p className={styles.lobbyFormLabel}>Display name</p>
                                        <TextField
                                            fullWidth
                                            label="Username"
                                            value={username}
                                            onChange={(event) => setUsername(event.target.value)}
                                            variant="outlined"
                                        />
                                    </div>

                                    <div className={styles.lobbyActions}>
                                        <Button
                                            variant="contained"
                                            size="large"
                                            onClick={connect}
                                            disabled={!username.trim()}
                                            sx={{ borderRadius: 3, py: 1.3 }}
                                        >
                                            Join Meeting
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={styles.meetVideoContainer}>
                    <div className={styles.meetingTopBar}>
                        <div>
                            <p className={styles.topBarLabel}>Live meeting</p>
                            <h2 className={styles.topBarTitle}>Room: {roomCode}</h2>
                        </div>
                        <div className={styles.topBarMeta}>
                            <Chip
                                size="small"
                                label={`${participants.length || 1} participant${(participants.length || 1) === 1 ? "" : "s"}`}
                                sx={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'white' }}
                            />
                            {meetingNotice ? <span className={styles.noticePill}>{meetingNotice}</span> : null}
                        </div>
                    </div>

                    {showModal ? (
                        <div className={styles.chatRoom}>
                            <div className={styles.chatContainer}>
                                <div className={styles.panelHeader}>
                                    <div>
                                        <p className={styles.panelEyebrow}>Collaboration</p>
                                        <h1>Chat</h1>
                                    </div>
                                    <span className={styles.panelCount}>{messages.length}</span>
                                </div>

                                <div className={styles.chattingDisplay}>
                                    {messages.length !== 0 ? messages.map(renderChatBubble) : <p>No Messages Yet</p>}
                                </div>

                                <div className={styles.chattingArea}>
                                    <TextField
                                        value={message}
                                        onChange={(event) => setMessage(event.target.value)}
                                        id="outlined-basic"
                                        label="Enter your chat"
                                        variant="outlined"
                                        size="small"
                                    />
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        hidden
                                        onChange={handleFileSelection}
                                    />
                                    <IconButton onClick={() => fileInputRef.current?.click()}>
                                        <AttachFileIcon />
                                    </IconButton>
                                    <Button variant='contained' onClick={sendMessage}>Send</Button>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <aside className={styles.participantsSidebar}>
                        <div className={styles.sidebarHeader}>
                            <div>
                                <p className={styles.panelEyebrow}>Session</p>
                                <h2>Participants</h2>
                            </div>
                            {isHost ? <Chip size="small" color="primary" label="Host" /> : null}
                        </div>

                        <Stack spacing={1.5}>
                            {participants.map((participant) => (
                                <div className={styles.participantCard} key={participant.socketId}>
                                    <div>
                                        <p className={styles.participantName}>
                                            {participant.username}
                                            {participant.socketId === hostId ? " (Host)" : ""}
                                        </p>
                                        {participant.handRaised ? (
                                            <Chip size="small" color="warning" label="Hand Raised" />
                                        ) : null}
                                    </div>

                                    {isHost && participant.socketId !== socketIdRef.current ? (
                                        <div className={styles.participantActions}>
                                            <IconButton onClick={handleMuteAll} size="small" color="warning">
                                                <VolumeOffIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton onClick={() => handleKickUser(participant.socketId)} size="small" color="error">
                                                <PersonRemoveIcon fontSize="small" />
                                            </IconButton>
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                        </Stack>
                    </aside>

                    <div className={styles.buttonContainers}>
                        <IconButton onClick={handleVideo} style={{ color: "white" }}>
                            {video ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                        <IconButton onClick={handleEndCall} style={{ color: "red" }}>
                            <CallEndIcon />
                        </IconButton>
                        <IconButton onClick={handleAudio} style={{ color: "white" }}>
                            {audio ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>
                        <IconButton onClick={handleRaiseHand} style={{ color: handRaised ? "#f5b942" : "white" }}>
                            <BackHandIcon />
                        </IconButton>

                        {screenAvailable ? (
                            <IconButton onClick={handleScreen} style={{ color: "white" }}>
                                {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                            </IconButton>
                        ) : null}

                        <Badge badgeContent={newMessages} max={999} color='secondary'>
                            <IconButton
                                onClick={() => {
                                    setModal(!showModal);
                                    setNewMessages(0);
                                }}
                                style={{ color: "white" }}
                            >
                                <ChatIcon />
                            </IconButton>
                        </Badge>
                    </div>

                    <div className={styles.conferenceView}>
                        {allVideoTiles.map((participantVideo) => (
                            <div
                                key={participantVideo.socketId}
                                className={`${styles.videoTile} ${activeSpeakerId === participantVideo.socketId ? styles.videoTileActive : ""}`}
                            >
                                <div className={styles.videoTileHeader}>
                                    <span>{participantVideo.isLocal ? `${participantVideo.username} (You)` : participantVideo.username}</span>
                                    {activeSpeakerId === participantVideo.socketId ? (
                                        <span className={styles.activeSpeakerBadge}>Speaking</span>
                                    ) : null}
                                </div>
                                <video
                                    data-socket={participantVideo.socketId}
                                    ref={(ref) => {
                                        if (participantVideo.isLocal) {
                                            localVideoref.current = ref;
                                        }

                                        if (ref && participantVideo.stream) {
                                            ref.srcObject = participantVideo.stream;
                                        }
                                    }}
                                    autoPlay
                                    muted={participantVideo.isLocal}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
