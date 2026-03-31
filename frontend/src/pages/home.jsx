import React, { useContext, useState } from 'react';
import withAuth from '../utils/withAuth';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, IconButton, Stack, TextField, Typography } from '@mui/material';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import RestoreIcon from '@mui/icons-material/Restore';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import InsightsIcon from '@mui/icons-material/Insights';
import { AuthContext } from '../contexts/AuthContext';
import "../App.css";

function HomeComponent() {
    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const { addToUserHistory } = useContext(AuthContext);

    const handleStartInstantMeeting = async () => {
        const instantMeetingCode = crypto.randomUUID();
        await addToUserHistory(instantMeetingCode);
        navigate(`/${instantMeetingCode}`);
    };

    let handleJoinVideoCall = async () => {
        const trimmedMeetingCode = meetingCode.trim();
        if (!trimmedMeetingCode) {
            return;
        }

        await addToUserHistory(trimmedMeetingCode);
        navigate(`/${trimmedMeetingCode}`);
    };

    return (
        <>
            <div className="navBar">
                <div className="navBarBrand">
                    <div className="brandBadge">GW</div>
                    <h2>Gaurav Web</h2>
                </div>

                <div className="navBarActions">
                    <IconButton onClick={() => {
                        navigate("/history");
                    }}>
                        <RestoreIcon />
                    </IconButton>
                    <p>History</p>

                    <Button onClick={() => {
                        localStorage.removeItem("token");
                        navigate("/auth");
                    }}>
                        Logout
                    </Button>
                </div>
            </div>

            <div className="dashboardPage">
                <Stack spacing={4}>
                    <div className="dashboardHeroCard">
                        <div className="dashboardHeroTop">
                            <div className="dashboardHeroMeta">
                                <div className="dashboardTag">Your collaboration command center</div>
                                <Typography component="h1">
                                    Welcome back to Gaurav Web
                                </Typography>
                                <Typography component="p">
                                    Run instant calls, jump into existing rooms, and keep your recent activity
                                    organized in one polished dashboard.
                                </Typography>
                            </div>

                            <Stack spacing={1.5} sx={{ minWidth: { md: 220 } }}>
                                <div className="dashboardMiniStat">
                                    <strong>1 Click</strong>
                                    <span>to start a new private room</span>
                                </div>
                                <div className="dashboardMiniStat">
                                    <strong>7 Days</strong>
                                    <span>of meeting history on standby</span>
                                </div>
                            </Stack>
                        </div>

                        <div className="dashboardStatGrid">
                            <div className="dashboardMiniStat">
                                <strong>Fast access</strong>
                                <span>Launch rooms without hunting through menus.</span>
                            </div>
                            <div className="dashboardMiniStat">
                                <strong>Flexible rooms</strong>
                                <span>Share codes instantly with guests, teams, or clients.</span>
                            </div>
                            <div className="dashboardMiniStat">
                                <strong>Clean workflow</strong>
                                <span>Move from dashboard to meeting with zero clutter.</span>
                            </div>
                        </div>
                    </div>

                    <Typography variant="h5" className="dashboardSectionTitle" sx={{ fontWeight: 700 }}>
                        Quick actions
                    </Typography>

                    <div className="dashboardActionGrid">
                        <Card className="dashboardActionCard">
                            <CardContent sx={{ p: 4 }}>
                                <Stack spacing={2.5}>
                                    <AutoAwesomeIcon sx={{ fontSize: 42, color: "#ff7a18" }} />
                                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                        Instant Meeting
                                    </Typography>
                                    <Typography color="text.secondary">
                                        Create a fresh private room with a generated ID and start meeting right now.
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={handleStartInstantMeeting}
                                        sx={{ borderRadius: 3, py: 1.2 }}
                                    >
                                        Start Instant Meeting
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>

                        <Card className="dashboardActionCard">
                            <CardContent sx={{ p: 4 }}>
                                <Stack spacing={2.5}>
                                    <MeetingRoomIcon sx={{ fontSize: 42, color: "#2d5bff" }} />
                                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                        Join With Code
                                    </Typography>
                                    <Typography color="text.secondary">
                                        Paste a room code from a teammate, class, or client and join instantly.
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        label="Room ID"
                                        placeholder="Enter meeting code"
                                        value={meetingCode}
                                        onChange={(e) => setMeetingCode(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                handleJoinVideoCall();
                                            }
                                        }}
                                    />
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        onClick={handleJoinVideoCall}
                                        disabled={!meetingCode.trim()}
                                        sx={{ borderRadius: 3, py: 1.2 }}
                                    >
                                        Join Meeting
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>

                        <Card className="dashboardActionCard">
                            <CardContent sx={{ p: 4 }}>
                                <Stack spacing={2.5}>
                                    <RestoreIcon sx={{ fontSize: 42, color: "#111827" }} />
                                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                        Review History
                                    </Typography>
                                    <Typography color="text.secondary">
                                        Check your recent meetings, revisit room IDs, and stay organized.
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        onClick={() => navigate("/history")}
                                        sx={{ borderRadius: 3, py: 1.2 }}
                                    >
                                        Open History
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>

                        <Card className="dashboardActionCard">
                            <CardContent sx={{ p: 4 }}>
                                <Stack spacing={2.5}>
                                    <InsightsIcon sx={{ fontSize: 42, color: "#16a34a" }} />
                                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                        Meet Better
                                    </Typography>
                                    <Typography color="text.secondary">
                                        Use host tools, hand raise, chat attachments, and activity tracking for a smoother session.
                                    </Typography>
                                    <Box sx={{ display: "grid", gap: 1 }}>
                                        <Typography color="text.secondary">Host controls for moderation</Typography>
                                        <Typography color="text.secondary">Shared files inside chat</Typography>
                                        <Typography color="text.secondary">Responsive meeting layouts</Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </div>
                </Stack>
            </div>
        </>
    );
}

export default withAuth(HomeComponent);
