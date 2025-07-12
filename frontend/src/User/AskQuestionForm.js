import React, { useState, useMemo } from 'react';
import {
  Box, Container, Typography, TextField, Button, MenuItem,
  useMediaQuery, CssBaseline, Switch, AppBar, Toolbar,
  IconButton, Grid, OutlinedInput, Select
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import { RichTextEditor } from '@mantine/rte';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import axios from 'axios';

const TAG_OPTIONS = ['React', 'JWT', 'SQL', 'UI', 'API', 'Auth', 'Routing', 'Frontend'];

export default function AskQuestionForm() {
  const [darkMode, setDarkMode] = useState(true);
  const isMobile = useMediaQuery('(max-width:37.5em)');
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    if (!token || !username) {
      alert("You must be logged in to submit a question.");
      return;
    }

    const payload = { title, description, tags };

    try {
      setLoading(true);
      const response = await axios.post(
        'http://localhost:8000/questions',
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const created = response.data;
      alert(`Question posted successfully by @${created.author_username}`);
      navigate(`/questions/${created.id}`);
    } catch (err) {
      console.error("❌ Failed to post question:", err.response?.data || err.message);
      alert("Failed to submit question.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MantineProvider withGlobalStyles withNormalizeCSS theme={{ colorScheme: darkMode ? 'dark' : 'light' }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh' }}>
          {/* App Bar */}
          <AppBar
            position="static"
            color="default"
            elevation={0}
            sx={{ backgroundColor: theme.palette.background.paper }}
          >
            <Toolbar sx={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                Ask a Question
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1,
                  mt: { xs: 1, sm: 0 },
                }}
              >
                <Button
                  component={RouterLink}
                  to="/"
                  sx={{ color: theme.palette.text.primary, textTransform: 'none' }}
                >
                  HOME
                </Button>
                <Switch
                  checked={darkMode}
                  onChange={() => setDarkMode(!darkMode)}
                  color="primary"
                />
                <IconButton>
                  <MenuIcon sx={{ color: theme.palette.text.primary }} />
                </IconButton>
              </Box>
            </Toolbar>
          </AppBar>

          {/* Form */}
          <Container maxWidth="md" sx={{ py: 4 }}>
            <Box component="form" noValidate autoComplete="off">
              <TextField
                label="Title"
                placeholder="Enter a short and descriptive title"
                variant="outlined"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                sx={{ mb: 3 }}
              />

              <Typography sx={{ mb: 1, color: theme.palette.text.primary }}>Description</Typography>
              <Box
                sx={{
                  '& .ProseMirror': { minHeight: '150px', padding: '12px', outline: 'none' },
                  mb: 3,
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  sticky={false}
                  placeholder="Describe your problem in detail"
                />
              </Box>

              <Typography sx={{ mb: 1, color: theme.palette.text.primary }}>Tags</Typography>
              <Select
                multiple
                displayEmpty
                fullWidth
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                input={<OutlinedInput />}
                renderValue={(selected) => selected.length ? selected.join(', ') : 'Select tags'}
                sx={{ mb: 4 }}
              >
                {TAG_OPTIONS.map((tag) => (
                  <MenuItem key={tag} value={tag}>{tag}</MenuItem>
                ))}
              </Select>

              <Grid container justifyContent="flex-end">
                <Button
                  variant="contained"
                  size="large"
                  sx={{ borderRadius: 2, px: 4, py: 1.2 }}
                  onClick={handleSubmit}
                  disabled={loading || !title.trim() || !description.trim()}
                >
                  {loading ? 'Submitting...' : 'Submit Question'}
                </Button>
              </Grid>
            </Box>
          </Container>
        </Box>
      </ThemeProvider>
    </MantineProvider>
  );
}
