import React, { useState, useMemo } from 'react';
import {
  Box, Container, Typography, TextField, Button, Paper, Switch, Stack,
  useMediaQuery, CssBaseline
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function LoginPage() {
  const [darkMode, setDarkMode] = useState(true);
  const isMobile = useMediaQuery('(max-width:600px)');
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const theme = useMemo(() =>
    createTheme({
      palette: {
        mode: darkMode ? 'dark' : 'light',
        background: {
          default: darkMode ? '#121212' : '#f5f5f5',
          paper: darkMode ? '#1E1E1E' : '#fff',
        },
        primary: { main: '#A259FF' },
        text: {
          primary: darkMode ? '#fff' : '#121212',
          secondary: darkMode ? '#B0B0B0' : '#555',
        },
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
      },
    }), [darkMode]
  );

  const handleLogin = async (e) => {
  e.preventDefault();
  setError('');

    console.log(`${process.env.REACT_APP_API_URL}`);
  try {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, {
      email,
      password,
    });


    const { access_token, user } = response.data;

    if (!user || !user.username) {
      setError('Username is required to log in.');
      return;
    }

    // ✅ Store token and username
    localStorage.setItem('token', access_token);
    localStorage.setItem('username', user.username);
    localStorage.setItem('email', user.email);
    localStorage.setItem('role', 'user');

    // Navigate to homepage or dashboard
    navigate('/');
  } catch (err) {
    console.error(err);
    setError('Invalid email or password.');
  }
};

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Container maxWidth="sm">
          <Paper elevation={3} sx={{
            p: 4,
            borderRadius: 3,
            backgroundColor: theme.palette.background.paper,
          }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" fontWeight={600} color="text.primary">
                Login
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">☀</Typography>
                <Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} color="primary" />
                <Typography variant="body2" color="text.secondary">🌙</Typography>
              </Stack>
            </Box>

            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Welcome to <strong>StackIt</strong> – A Minimal Q&A Forum Platform
            </Typography>

            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
              />
              {error && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  {error}
                </Typography>
              )}
              <Button fullWidth variant="contained" type="submit" sx={{ mt: 2, py: 1.5 }}>
                Login
              </Button>
            </form>

            <Box mt={3} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Don't have an account?
              </Typography>
              <Button component={RouterLink} to="/sign-up" variant="text" size="small">
                Sign Up
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
