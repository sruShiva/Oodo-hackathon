import React, { useState, useMemo } from 'react';
import {
  Box, Container, Typography, Button, Chip, Avatar, IconButton,
  Stack, CssBaseline, Switch, AppBar, Toolbar, useMediaQuery, Breadcrumbs, Link,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ThumbUp, ThumbDown, CheckCircle, Menu as MenuIcon } from '@mui/icons-material';
import { RichTextEditor } from '@mantine/rte';
import { MantineProvider } from '@mantine/core';
import { useParams, Link as RouterLink } from 'react-router-dom';
import mentionExtension from './mentionExtension'

// Sample dummy data — in a real app you'd fetch this by questionId
const dummyQuestion = {
  title: 'How to join 2 columns in SQL?',
  description: '<p>I have two columns …</p>',
  tags: ['SQL', 'Beginner'],
  user: 'Total Walrus',
};
const dummyAnswers = [
  { id: 1, user: 'Advanced Yak', content: '<p>Use CONCAT()</p>', votes: 3, accepted: false },
  { id: 2, user: 'Smart Owl', content: '<p>Try using || operator</p>', votes: 5, accepted: true },
];

export default function QuestionDetail({ currentUser = 'Total Walrus' }) {
  const { questionId } = useParams();
  const [darkMode, setDarkMode] = useState(true);
  const isMobile = useMediaQuery('(max-width:37.5em)');
  const [answers, setAnswers] = useState(dummyAnswers);
  const [newAnswer, setNewAnswer] = useState('');

  const theme = useMemo(() =>
    createTheme({
      palette: {
        mode: darkMode ? 'dark' : 'light',
        background: { default: darkMode ? '#121212' : '#f5f5f5', paper: darkMode ? '#1E1E1E' : '#fff' },
        primary: { main: '#A259FF' },
        text: {
          primary: darkMode ? '#fff' : '#121212',
          secondary: darkMode ? '#B0B0B0' : '#555',
        },
      },
      typography: { fontFamily: 'Inter, sans-serif' },
    }), [darkMode]
  );

  const handleVote = (id, delta) => {
    setAnswers(a => a.map(ans => ans.id === id ? { ...ans, votes: ans.votes + delta } : ans));
  };

  const handleAccept = (id) => {
    setAnswers(a => a.map(ans => ({ ...ans, accepted: ans.id === id })));
  };

  const handleSubmit = () => {
    if (!newAnswer.trim()) return;
    const newAnsObj = { id: Date.now(), user: currentUser, content: newAnswer, votes: 0, accepted: false };
    setAnswers([newAnsObj, ...answers]);
    setNewAnswer('');
  };

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
                <Button
                    component={RouterLink}
                    to="/"
                    sx={{ color: theme.palette.text.primary }}
                >
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
              <Link component={RouterLink} to="/questions" underline="hover" color="inherit">
                Questions
              </Link>
              <Typography color="text.primary">
                {dummyQuestion.title}
              </Typography>
            </Breadcrumbs>

            {/* Question */}
            <Box sx={{ backgroundColor: theme.palette.background.paper, p: 3, borderRadius: 2, mb: 4 }}>
              <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={600} sx={{ mb: 1 }}>
                {dummyQuestion.title}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                {dummyQuestion.tags.map(t =>
                  <Chip key={t} label={t} size="small" sx={{ bgcolor: '#2E2E2E', color: '#fff' }} />
                )}
              </Stack>
              <Box dangerouslySetInnerHTML={{ __html: dummyQuestion.description }} sx={{ mb: 2 }} />
              <Typography variant="caption" sx={{ color: theme.palette.primary.main }}>
                {dummyQuestion.user}
              </Typography>
            </Box>

            {/* Answers */}
            <Typography variant="h6" sx={{ mb: 2 }}>Answers ({answers.length})</Typography>
            <Stack spacing={2}>
              {answers.map(ans => (
                <Box key={ans.id} sx={{ backgroundColor: theme.palette.background.paper, p: 2, borderRadius: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                    <Avatar sx={{ width: 32, height: 32 }}>{ans.user.charAt(0)}</Avatar>
                    <Typography sx={{ color: theme.palette.text.primary }}>{ans.user}</Typography>
                    {ans.accepted && <CheckCircle color="success" fontSize="small" />}
                  </Stack>
                  <Box dangerouslySetInnerHTML={{ __html: ans.content }} sx={{ mb: 1 }} />
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton size="small" onClick={() => handleVote(ans.id, +1)}><ThumbUp fontSize="small" /></IconButton>
                    <Typography variant="body2">{ans.votes}</Typography>
                    <IconButton size="small" onClick={() => handleVote(ans.id, -1)}><ThumbDown fontSize="small" /></IconButton>
                    {currentUser === dummyQuestion.user && !ans.accepted && (
                      <Button size="small" onClick={() => handleAccept(ans.id)}>Accept</Button>
                    )}
                  </Stack>
                </Box>
              ))}
            </Stack>

            {/* Submit Answer */}
            <Box sx={{ mt: 4 }}>
              <Typography sx={{ mb: 1 }}>Your Answer</Typography>
              <RichTextEditor value={newAnswer} onChange={setNewAnswer} sticky={false}   extensions={[mentionExtension]}/>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" disabled={!newAnswer.trim()} onClick={handleSubmit}>
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
