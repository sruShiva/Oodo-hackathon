import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  AppBar, Toolbar, IconButton, Typography, Button, TextField, Card,
  CardContent, Chip, Container, Box, Grid, useMediaQuery,
  Pagination, Switch, CssBaseline, Popover, List, ListItem, ListItemText
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';

export default function SearchAndAskQuestion() {
  const [darkMode, setDarkMode] = useState(true);
  const [showUnanswered, setShowUnanswered] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [allQuestions, setAllQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [aiResponses, setAiResponses] = useState({});
  const [loadingAI, setLoadingAI] = useState({});

  const isMobile = useMediaQuery('(max-width:37.5em)');
  const navigate = useNavigate();
  const debounceTimer = useRef(null);

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

  const limit = 10;

  const fetchAllQuestions = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/get-questions`);
      setAllQuestions(res.data.questions || []);
    } catch (err) {
      console.error('Failed to fetch questions', err);
    }
  };

  const fetchNotifications = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    const res = await axios.get(`${process.env.REACT_APP_API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    setNotifications(res.data.notifications || []);
  } catch (err) {
    console.error('Failed to fetch notifications', err);
  }
};

  const handleAIResponse = async (question) => {
    const { id, title, description } = question;
    setLoadingAI(prev => ({ ...prev, [id]: true }));

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/ai/generate-response`,
        {
          title,
          description,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAiResponses(prev => ({
        ...prev,
        [id]: res.data.response || 'No response generated.',
      }));
    } catch (err) {
      console.error('Error generating AI response:', err);
      setAiResponses(prev => ({
        ...prev,
        [id]: 'Failed to generate AI response.',
      }));
    } finally {
      setLoadingAI(prev => ({ ...prev, [id]: false }));
    }
  };

  useEffect(() => {
    fetchAllQuestions();
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      const search = searchText.trim().toLowerCase();
      let filtered = allQuestions;

      if (showUnanswered) {
        filtered = filtered.filter(q => q.answer_count === 0);
      }

      if (search) {
        filtered = filtered.filter(q =>
          q.title.toLowerCase().includes(search) ||
          q.description.toLowerCase().includes(search) ||
          q.author_username?.toLowerCase().includes(search) ||
          q.tags.some(tag => tag.toLowerCase().includes(search))
        );
      }

      setFilteredQuestions(filtered);
      setPage(1);
    }, 400);

    return () => clearTimeout(debounceTimer.current);
  }, [searchText, showUnanswered, allQuestions]);

  const paginatedQuestions = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredQuestions.slice(start, start + limit);
  }, [filteredQuestions, page]);

  const handleNotifClick = (e) => {
    setNotifAnchorEl(e.currentTarget);
  };

  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  const isNotifOpen = Boolean(notifAnchorEl);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh' }}>
        <AppBar position="static" color="default" sx={{ backgroundColor: theme.palette.background.paper }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
              StackIt
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1 : 2 }}>
              <IconButton onClick={handleNotifClick}>
                <NotificationsIcon sx={{ color: theme.palette.text.primary }} />
              </IconButton>

              {isMobile ? (
                <IconButton component={RouterLink} to="/login">
                  <AccountCircleIcon sx={{ color: theme.palette.text.primary }} />
                </IconButton>
              ) : (
                <Button component={RouterLink} to="/login" sx={{ color: theme.palette.text.primary }}>
                  Login
                </Button>
              )}

              <Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} color="primary" />

              <IconButton>
                <MenuIcon sx={{ color: theme.palette.text.primary }} />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {/* 🔔 Notification Popover */}
        <Popover
          open={isNotifOpen}
          anchorEl={notifAnchorEl}
          onClose={handleNotifClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Box sx={{ p: 2, minWidth: 250 }}>
            <Typography variant="subtitle1" gutterBottom>Notifications</Typography>
            {notifications.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No new notifications</Typography>
            ) : (
              <List dense>
                {notifications.map((notif, i) => (
                  <ListItem key={i} sx={{ px: 0 }}>
                    <ListItemText
                      primary={notif.title || notif.message || 'New notification'}
                      secondary={notif.timestamp || ''}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Popover>

        <Container maxWidth="md" sx={{ py: 4 }}>
          <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Grid item>
              <Button variant="outlined" onClick={() => navigate('/ask-question')}>
                Ask New Question
              </Button>
            </Grid>
            <Grid item>
              <Button variant="outlined" onClick={() => { setShowUnanswered(false); setPage(1); }}
                color={!showUnanswered ? 'primary' : 'inherit'}>
                All
              </Button>
            </Grid>
            <Grid item>
              <Button variant="outlined" onClick={() => { setShowUnanswered(true); setPage(1); }}
                color={showUnanswered ? 'primary' : 'inherit'}>
                Unanswered
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                placeholder="Search questions, tags, or author..."
                variant="outlined"
                size="small"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Grid>
          </Grid>

          {/* Question List */}
          {paginatedQuestions.map((q) => (
            <Card key={q.id} sx={{ backgroundColor: theme.palette.background.paper, mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography
                    fontWeight={600}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/questions/${q.id}`)}
                  >
                    {q.title}
                  </Typography>
                  <Chip label={`${q.answer_count} ans`} size="small" sx={{ backgroundColor: '#2E2E2E', color: '#fff' }} />
                </Box>

                <Box sx={{ display: 'flex', gap: 1, my: 1, flexWrap: 'wrap' }}>
                  {q.tags.map((tag, i) => (
                    <Chip key={i} label={tag} size="small" sx={{ backgroundColor: '#2E2E2E', color: '#fff' }} />
                  ))}
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  dangerouslySetInnerHTML={{ __html: q.description }}
                />

                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ color: theme.palette.primary.main }}>
                    {q.author_username}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="text" onClick={() => navigate(`/questions/${q.id}`)}>
                      Answer Now
                    </Button>
                    <Button size="small" variant="outlined" onClick={() => handleAIResponse(q)}>
                      Check AI Response
                    </Button>
                  </Box>
                </Box>

                {aiResponses[q.id] && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      backgroundColor: darkMode ? '#2A2A2A' : '#f0f0f0',
                      borderRadius: 1,
                      borderLeft: '4px solid #A259FF',
                    }}
                  >
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      AI Response:
                    </Typography>
                    <Typography
                      variant="body2"
                      dangerouslySetInnerHTML={{ __html: aiResponses[q.id] }}
                    />
                  </Box>
                )}

                {loadingAI[q.id] && (
                  <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    Generating AI response...
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={Math.ceil(filteredQuestions.length / limit)}
              page={page}
              onChange={(e, v) => setPage(v)}
              variant="outlined"
              shape="rounded"
            />
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
