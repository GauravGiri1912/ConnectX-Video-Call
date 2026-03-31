import * as React from 'react';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    CssBaseline,
    Snackbar,
    Stack,
    TextField,
    Typography
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';

const defaultTheme = createTheme({
    palette: {
        primary: {
            main: '#2d5bff'
        },
        secondary: {
            main: '#ff7a18'
        },
        background: {
            default: '#f4f7fb'
        }
    },
    shape: {
        borderRadius: 18
    },
    typography: {
        fontFamily: '"Segoe UI", "Inter", sans-serif'
    }
});

export default function Authentication() {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [name, setName] = React.useState("");
    const [error, setError] = React.useState("");
    const [message, setMessage] = React.useState("");
    const [formState, setFormState] = React.useState(0);
    const [open, setOpen] = React.useState(false);

    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    const handleAuth = async () => {
        try {
            if (formState === 0) {
                await handleLogin(username, password);
            }

            if (formState === 1) {
                const result = await handleRegister(name, username, password);
                setUsername("");
                setMessage(result);
                setOpen(true);
                setError("");
                setFormState(0);
                setPassword("");
                setName("");
            }
        } catch (err) {
            setError(err?.response?.data?.message || "Something went wrong");
        }
    };

    return (
        <ThemeProvider theme={defaultTheme}>
            <CssBaseline />
            <Box
                sx={{
                    minHeight: '100vh',
                    py: { xs: 3, md: 5 },
                    background:
                        'radial-gradient(circle at top left, rgba(45,91,255,0.12), transparent 25%), radial-gradient(circle at right, rgba(255,122,24,0.14), transparent 22%), linear-gradient(180deg, #f8fbff 0%, #eef3f9 100%)'
                }}
            >
                <Container maxWidth="lg">
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' },
                            gap: 3,
                            alignItems: 'stretch'
                        }}
                    >
                        <Card
                            sx={{
                                minHeight: { md: '82vh' },
                                overflow: 'hidden',
                                color: 'white',
                                background:
                                    'radial-gradient(circle at top right, rgba(255,255,255,0.12), transparent 22%), linear-gradient(145deg, #101937 0%, #2441a6 55%, #ff7a18 135%)',
                                boxShadow: '0 28px 65px rgba(27, 41, 90, 0.25)'
                            }}
                        >
                            <CardContent sx={{ p: { xs: 3, md: 5 }, height: '100%' }}>
                                <Stack spacing={3} justifyContent="space-between" sx={{ height: '100%' }}>
                                    <div>
                                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: 'white' }}>
                                                <AutoAwesomeIcon />
                                            </Avatar>
                                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                Gaurav Web
                                            </Typography>
                                        </Stack>

                                        <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1, mb: 2 }}>
                                            Meetings, chat, and collaboration in one polished workspace.
                                        </Typography>
                                        <Typography sx={{ color: 'rgba(255,255,255,0.78)', lineHeight: 1.8, maxWidth: 500 }}>
                                            Sign in to launch instant rooms, review activity, share files, and run smoother sessions
                                            with a cleaner interface.
                                        </Typography>
                                    </div>

                                    <Stack spacing={2}>
                                        <Box sx={{ p: 2, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.1)' }}>
                                            <Typography sx={{ fontWeight: 700, mb: 0.6 }}>Instant collaboration</Typography>
                                            <Typography sx={{ color: 'rgba(255,255,255,0.78)' }}>
                                                Create or join rooms with a single step and keep your workflow moving.
                                            </Typography>
                                        </Box>
                                        <Box sx={{ p: 2, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.1)' }}>
                                            <Typography sx={{ fontWeight: 700, mb: 0.6 }}>Smarter meetings</Typography>
                                            <Typography sx={{ color: 'rgba(255,255,255,0.78)' }}>
                                                Host controls, file sharing, history, and modern layouts built in.
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>

                        <Card
                            sx={{
                                minHeight: { md: '82vh' },
                                display: 'flex',
                                alignItems: 'center',
                                boxShadow: '0 24px 60px rgba(18, 31, 65, 0.12)',
                                backgroundColor: 'rgba(255,255,255,0.82)',
                                backdropFilter: 'blur(16px)'
                            }}
                        >
                            <CardContent sx={{ width: '100%', p: { xs: 3, md: 5 } }}>
                                <Stack spacing={3}>
                                    <Stack spacing={1} alignItems="center" textAlign="center">
                                        <Avatar sx={{ bgcolor: 'secondary.main', width: 60, height: 60 }}>
                                            <LockOutlinedIcon />
                                        </Avatar>
                                        <Typography variant="h4" sx={{ fontWeight: 800 }}>
                                            {formState === 0 ? 'Welcome back' : 'Create your account'}
                                        </Typography>
                                        <Typography color="text.secondary">
                                            {formState === 0
                                                ? 'Sign in to continue to your meeting dashboard.'
                                                : 'Set up your Gaurav Web account in a minute.'}
                                        </Typography>
                                    </Stack>

                                    <Stack direction="row" spacing={1}>
                                        <Button
                                            fullWidth
                                            variant={formState === 0 ? "contained" : "outlined"}
                                            onClick={() => setFormState(0)}
                                            sx={{ py: 1.2 }}
                                        >
                                            Sign In
                                        </Button>
                                        <Button
                                            fullWidth
                                            variant={formState === 1 ? "contained" : "outlined"}
                                            onClick={() => setFormState(1)}
                                            sx={{ py: 1.2 }}
                                        >
                                            Sign Up
                                        </Button>
                                    </Stack>

                                    <Box component="form" noValidate>
                                        <Stack spacing={2}>
                                            {formState === 1 ? (
                                                <TextField
                                                    required
                                                    fullWidth
                                                    label="Full Name"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                />
                                            ) : null}

                                            <TextField
                                                required
                                                fullWidth
                                                label="Username"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                            />

                                            <TextField
                                                required
                                                fullWidth
                                                label="Password"
                                                value={password}
                                                type="password"
                                                onChange={(e) => setPassword(e.target.value)}
                                            />

                                            {error ? <Alert severity="error">{error}</Alert> : null}

                                            <Button
                                                type="button"
                                                fullWidth
                                                variant="contained"
                                                size="large"
                                                onClick={handleAuth}
                                                sx={{ py: 1.3, mt: 1 }}
                                            >
                                                {formState === 0 ? "Login" : "Register"}
                                            </Button>
                                        </Stack>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Box>
                </Container>

                <Snackbar
                    open={open}
                    autoHideDuration={4000}
                    onClose={() => setOpen(false)}
                    message={message}
                />
            </Box>
        </ThemeProvider>
    );
}
