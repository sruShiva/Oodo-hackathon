import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Container, Typography, Button, Chip, Avatar, IconButton,
  Stack, CssBaseline, Switch, AppBar, Toolbar, useMediaQuery, Breadcrumbs, Link,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ThumbUp, ThumbDown, CheckCircle, Menu as MenuIcon } from '@mui/icons-material';
import { RichTextEditor } from '@mantine/rte';
import { MantineProvider } from '@mantine/core';
import { useParams, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';

export default function QuestionDetail() {
  const { questionId } = useParams();
  const [darkMode, setDarkMode] = useState(true);
  const isMobile = useMediaQuery('(max-width:37.5em)');
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [newAnswer, setNewAnswer] = useState('');
  const currentUser = localStorage.getItem('username') || 'Guest';

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

  // Apply dark mode class to body (for mentions)
  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
    return () => document.body.classList.remove('dark');
  }, [darkMode]);

  // Fetch question and answers
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/get-specific-questions/${questionId}`);
        setQuestion(res.data);
      } catch (err) {
        console.error('Failed to fetch question:', err);
      }
    };

    const fetchAnswers = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/answers/${questionId}`);
        setAnswers(res.data.answers || []);
      } catch (err) {
        console.error('Failed to fetch answers:', err);
      }
    };

    fetchQuestion();
    fetchAnswers();
  }, [questionId]);

  const handleSubmitAnswer = async () => {
    const token = localStorage.getItem('token');
    if (!token || !newAnswer.trim()) return;

    try {
      const res = await axios.post(
        `http://localhost:8000/answers/${questionId}`,
        { content: newAnswer },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setAnswers([res.data, ...answers]);
      setNewAnswer('');
    } catch (err) {
      console.error('Error submitting answer:', err);
      alert("Failed to post your answer.");
    }
  };

  const handleVote = (id, delta) => {
    setAnswers(a =>
      a.map(ans => (ans.id === id ? { ...ans, votes: ans.votes + delta } : ans))
    );
    // Optionally: call backend for vote
  };

  const handleAccept = (id) => {
    setAnswers(a => a.map(ans => ({ ...ans, accepted: ans.id === id })));
    // Optionally: send accept to backend
  };

  if (!question) return <Typography sx={{ mt: 10, textAlign: 'center' }}>Loading question...</Typography>;

  return (
    <MantineProvider withGlobalStyles withNormalizeCSS theme={{ colorScheme: darkMode ? 'dark' : 'light' }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh' }}>
          <AppBar position="static" color="default" sx={{ backgroundColor: theme.palette.background.paper }}>
            <Toolbar sx={{ justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>StackIt</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {!isMobile && (
                  <Button component={RouterLink} to="/" sx={{ color: theme.palette.text.primary }}>
                    Home
                  </Button>
                )}
                <Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} color="primary" />
                <IconButton><MenuIcon sx={{ color: theme.palette.text.primary }} /></IconButton>
              </Box>
            </Toolbar>
          </AppBar>

          <Container maxWidth="md" sx={{ py: 4 }}>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
              <Link component={RouterLink} to="/" underline="hover" color="inherit">Questions</Link>
              <Typography color="text.primary">{question.title}</Typography>
            </Breadcrumbs>

            <Box sx={{ backgroundColor: theme.palette.background.paper, p: 3, borderRadius: 2, mb: 4 }}>
              <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={600} sx={{ mb: 1 }}>
                {question.title}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                {question.tags.map((t, i) => (
                  <Chip key={i} label={t} size="small" sx={{ bgcolor: '#2E2E2E', color: '#fff' }} />
                ))}
              </Stack>
              <Box dangerouslySetInnerHTML={{ __html: question.description }} sx={{ mb: 2 }} />
              <Typography variant="caption" sx={{ color: theme.palette.primary.main }}>
                Posted by @{question.author_username}
              </Typography>
            </Box>

            <Typography variant="h6" sx={{ mb: 2 }}>Answers ({answers.length})</Typography>
            <Stack spacing={2}>
              {answers.map(ans => (
                <Box key={ans.id} sx={{ backgroundColor: theme.palette.background.paper, p: 2, borderRadius: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                    <Avatar sx={{ width: 32, height: 32 }}>{ans.author_username?.charAt(0) || 'U'}</Avatar>
                    <Typography sx={{ color: theme.palette.text.primary }}>{ans.author_username}</Typography>
                    {ans.accepted && <CheckCircle color="success" fontSize="small" />}
                  </Stack>
                  <Box dangerouslySetInnerHTML={{ __html: ans.content }} sx={{ mb: 1 }} />
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton size="small" onClick={() => handleVote(ans.id, +1)}><ThumbUp fontSize="small" /></IconButton>
                    <Typography variant="body2">{ans.votes}</Typography>
                    <IconButton size="small" onClick={() => handleVote(ans.id, -1)}><ThumbDown fontSize="small" /></IconButton>
                    {currentUser === question.author_username && !ans.accepted && (
                      <Button size="small" onClick={() => handleAccept(ans.id)}>Accept</Button>
                    )}
                  </Stack>
                </Box>
              ))}
            </Stack>

            <Box sx={{ mt: 4 }}>
              <Typography sx={{ mb: 1 }}>Your Answer</Typography>
              <RichTextEditor
                value={newAnswer}
                onChange={setNewAnswer}
                sticky={false}
                placeholder="Type your answer here..."
                sx={{
                  '& .ProseMirror': {
                    minHeight: '150px',
                    padding: '12px',
                    outline: 'none',
                    '& .mention': {
                      backgroundColor: darkMode ? '#2d3748' : '#eef6ff',
                      color: darkMode ? '#90cdf4' : '#1a73e8',
                    }
                  }
                }}
              />
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" disabled={!newAnswer.trim()} onClick={handleSubmitAnswer}>
                  Submit Answer
                </Button>
              </Box>
            </Box>
          </Container>
        </Box>
      </ThemeProvider>
    </MantineProvider>
  );
}
