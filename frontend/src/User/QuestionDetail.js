import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Container, Typography, Button, Chip, Avatar, IconButton,
  Stack, CssBaseline, Switch, AppBar, Toolbar, useMediaQuery, Breadcrumbs, Link
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
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const currentUser = localStorage.getItem('username') || '';

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

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
    return () => document.body.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    async function load() {
      try {
        const q = await axios.get(`http://localhost:8000/get-specific-questions/${questionId}`);
        setQuestion(q.data);

        const a = await axios.get(`http://localhost:8000/get-questions/${questionId}/answers`);
        setAnswers(a.data.answers || []);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [questionId]);

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    if (!token || !newAnswer.trim()) return;

    try {
      const res = await axios.post(
        `http://localhost:8000/questions/${questionId}/answers`,
        { content: newAnswer },
      );
      setAnswers([res.data, ...answers]);
      setNewAnswer('');
    } catch (err) {
      console.error(err);
      alert('Failed to post answer');
    }
  };

  const handleEdit = (ans) => {
    setEditingId(ans.id);
    setEditContent(ans.content);
  };

  const handleUpdate = async () => {
    const token = localStorage.getItem('token');
    if (!token || !editContent.trim()) return;

    try {
      const res = await axios.put(
        `http://localhost:8000/update-answers/${editingId}`,
        { content: editContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnswers(answers.map(a => a.id === editingId ? res.data : a));
      setEditingId(null);
      setEditContent('');
    } catch (err) {
      console.error(err);
      alert('Failed to update answer');
    }
  };

  const handleAccept = async (ansId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.post(
        `http://localhost:8000/answers/${ansId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnswers(answers.map(a => a.id === ansId ? res.data : { ...a, accepted: false }));
    } catch (err) {
      console.error(err);
      alert('Failed to accept answer');
    }
  };

  if (!question) return <Typography sx={{ mt: 10, textAlign: 'center' }}>Loading...</Typography>;

  return (
    <MantineProvider withGlobalStyles withNormalizeCSS theme={{ colorScheme: darkMode ? 'dark' : 'light' }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppBar position="static" color="default" sx={{ backgroundColor: theme.palette.background.paper }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>StackIt</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {!isMobile && <Button component={RouterLink} to="/" sx={{ color: theme.palette.text.primary }}>Home</Button>}
              <Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} color="primary" />
              <IconButton><MenuIcon sx={{ color: theme.palette.text.primary }} /></IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ py: 4 }}>
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link component={RouterLink} to="/questions">Questions</Link>
            <Typography>{question.title}</Typography>
          </Breadcrumbs>

          <Box sx={{ backgroundColor: theme.palette.background.paper, p: 3, mb: 4, borderRadius: 2 }}>
            <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={600}>{question.title}</Typography>
            <Stack direction="row" spacing={1} sx={{ my: 1 }}>
              {question.tags.map((t,i) => <Chip key={i} label={t} />)}
            </Stack>
            <Box dangerouslySetInnerHTML={{ __html: question.description }} sx={{ mb: 1 }} />
            <Typography variant="caption">Posted by @{question.author_username}</Typography>
          </Box>

          <Typography variant="h6" sx={{ mb: 2 }}>Answers ({answers.length})</Typography>
          <Stack spacing={2}>
            {answers.map(ans => (
              <Box key={ans.id} sx={{ background: theme.palette.background.paper, p: 2, borderRadius: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                  <Avatar>{ans.author_username?.charAt(0)}</Avatar>
                  <Typography>{ans.author_username}</Typography>
                  {ans.accepted && <CheckCircle color="success" fontSize="small" />}
                  {currentUser === question.author_username && !ans.accepted && (
                    <Button size="small" onClick={() => handleAccept(ans.id)}>Accept</Button>
                  )}
                </Stack>
                {editingId === ans.id ? (
                  <>
                    <RichTextEditor
                      value={editContent}
                      onChange={setEditContent}
                      sticky={false}
                      sx={{ mb: 1, '& .ProseMirror': { minHeight: '120px' } }}
                    />
                    <Button variant="outlined" onClick={handleUpdate}>Update</Button>
                  </>
                ) : (
                  <>
                    <Box dangerouslySetInnerHTML={{ __html: ans.content }} sx={{ mb: 1 }} />
                    <Stack direction="row" spacing={1} alignItems="center">
                      {currentUser === ans.author_username && <Button size="small" onClick={() => handleEdit(ans)}>Edit</Button>}
                      <IconButton><ThumbUp /></IconButton>
                      <Typography>{ans.votes}</Typography>
                      <IconButton><ThumbDown /></IconButton>
                    </Stack>
                  </>
                )}
              </Box>
            ))}
          </Stack>

          <Box sx={{ mt: 4 }}>
            <Typography>Your Answer</Typography>
            <RichTextEditor
              value={newAnswer}
              onChange={setNewAnswer}
              sticky={false}
              placeholder="Write your answer..."
              sx={{ '& .ProseMirror': { minHeight: '150px' } }}
            />
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" onClick={handleSubmit} disabled={!newAnswer.trim()}>
                Submit Answer
              </Button>
            </Box>
          </Box>
        </Container>
      </ThemeProvider>
    </MantineProvider>
  );
}
