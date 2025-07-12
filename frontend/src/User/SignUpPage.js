import React, { useState, useMemo } from 'react';
import {
  Box, Container, Typography, TextField, Button, Paper, Switch, Stack,
  useMediaQuery, CssBaseline, IconButton
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Link, useNavigate } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import axios from 'axios';
export default function SignUpPage() {
  const [darkMode, setDarkMode] = useState(true);
  const isMobile = useMediaQuery('(max-width:600px)');
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
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
      typography: { fontFamily: 'Inter, sans-serif' },
    }), [darkMode]
  );

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/register`, {
        username,
        email,
        password,
      });

      console.log('Registration successful:', response.data);
      navigate('/login');
    } catch (err) {
      console.error(err);
      setError('Registration failed. Please try again.');
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
                Sign Up
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center">
                {!isMobile && (
                  <Typography variant="body2" color="text.secondary">☀</Typography>
                )}
                <Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} color="primary" />
                {!isMobile && (
                  <Typography variant="body2" color="text.secondary">🌙</Typography>
                )}
              </Stack>
            </Box>

            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Welcome to <strong>StackIt</strong> – A Minimal Q&A Forum Platform
            </Typography>

            <form onSubmit={handleSignUp}>
              <TextField
                fullWidth
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                margin="normal"
                required
                InputLabelProps={{ style: { color: theme.palette.text.primary } }}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                InputLabelProps={{ style: { color: theme.palette.text.primary } }}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                InputLabelProps={{ style: { color: theme.palette.text.primary } }}
              />
              {error && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  {error}
                </Typography>
              )}
              <Button fullWidth type="submit" variant="contained" sx={{ mt: 2, py: 1.5 }}>
                Create Account
              </Button>
            </form>

            <Box mt={3} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Already have an account?
              </Typography>

              {isMobile ? (
                <IconButton component={Link} to="/login" sx={{ color: theme.palette.text.primary }}>
                  <AccountCircleIcon />
                </IconButton>
              ) : (
                <Button component={Link} to="/login" variant="text" size="small">
                  Login
                </Button>
              )}
            </Box>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
