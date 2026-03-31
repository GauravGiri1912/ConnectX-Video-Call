import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import RestoreIcon from '@mui/icons-material/Restore';
import { AuthContext } from '../contexts/AuthContext';
import withAuth from '../utils/withAuth';

function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const history = await getHistoryOfUser();
                setMeetings(history);
                setError("");
            } catch (fetchError) {
                setError(fetchError?.response?.data?.message || "Unable to load meeting history");
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [getHistoryOfUser]);

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    return (
        <div className="dashboardPage">
            <Stack spacing={3}>
                <div className="dashboardHeroCard">
                    <div className="dashboardHeroTop">
                        <div className="dashboardHeroMeta">
                            <div className="dashboardTag">Recent activity overview</div>
                            <Typography component="h1">
                                Meeting history that is actually useful
                            </Typography>
                            <Typography component="p">
                                Track the rooms you joined or created over the last seven days and revisit them without guesswork.
                            </Typography>
                        </div>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                            <Button
                                variant="contained"
                                startIcon={<HomeIcon />}
                                onClick={() => routeTo("/home")}
                                sx={{ borderRadius: 3, backgroundColor: "rgba(255,255,255,0.14)" }}
                            >
                                Home
                            </Button>
                            <Chip
                                icon={<RestoreIcon />}
                                label={`${meetings.length} recent room${meetings.length === 1 ? "" : "s"}`}
                                sx={{ color: "white", backgroundColor: "rgba(255,255,255,0.12)" }}
                            />
                        </Stack>
                    </div>
                </div>

                {error ? <Alert severity="error">{error}</Alert> : null}

                <Card className="dashboardActionCard">
                    <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                        {loading ? (
                            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                                <CircularProgress />
                            </Box>
                        ) : meetings.length === 0 ? (
                            <Stack spacing={2} className="dashboardEmptyState">
                                <Typography variant="h6">No recent meetings found</Typography>
                                <Typography color="text.secondary">
                                    Start or join a meeting from your dashboard and it will appear here.
                                </Typography>
                                <Button variant="contained" onClick={() => routeTo("/home")}>
                                    Go To Home
                                </Button>
                            </Stack>
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>Room ID</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {meetings.map((meeting) => (
                                            <TableRow key={meeting._id}>
                                                <TableCell sx={{ fontWeight: 600 }}>
                                                    {meeting.meetingCode}
                                                </TableCell>
                                                <TableCell>{formatDateTime(meeting.date)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>
            </Stack>
        </div>
    );
}

export default withAuth(History);
