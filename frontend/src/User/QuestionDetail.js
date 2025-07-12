import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Container, Typography, Button, Chip, Avatar, IconButton,
  Stack, CssBaseline, Switch, AppBar, Toolbar, useMediaQuery, Breadcrumbs, Link
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ThumbUp, ThumbDown, CheckCircle, Menu as MenuIcon, Home as HomeIcon } from '@mui/icons-material';
import { RichTextEditor } from '@mantine/rte';
import { MantineProvider } from '@mantine/core';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function QuestionDetail() {
  const { questionId } = useParams();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(true);
  const isMobile = useMediaQuery('(max-width:37.5em)');
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [newAnswer, setNewAnswer] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const currentUser = localStorage.getItem('username') || '';
  const currentUserRole = localStorage.getItem('role') || '';

  const theme = useMemo(() =>
    createTheme({
      palette: {
        mode: darkMode ? 'dark' : 'light',
        background: {
          default: darkMode ? '#121212' : '#f5f5f5',
          paper: darkMode ? '#1E1E1E' : '#fff',
        },
        primary: { main: '#A259FF' },
        error: { main: '#f44336' },
        text: {
          primary: darkMode ? '#fff' : '#121212',
          secondary: darkMode ? '#B0B0B0' : '#555',
        },
      },
      typography: { fontFamily: 'Inter, sans-serif' },
    }), [darkMode]
  );

  useEffect(() => {
    async function load() {
      try {
        const q = await axios.get(`${process.env.REACT_APP_API_URL}/get-specific-questions/${questionId}`);
        setQuestion(q.data);

        const a = await axios.get(`${process.env.REACT_APP_API_URL}/questions/${questionId}/answers`);
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
        `${process.env.REACT_APP_API_URL}/questions/${questionId}/answers`,
        { content: newAnswer },
        { headers: { Authorization: `Bearer ${token}` } }
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
        `${process.env.REACT_APP_API_URL}/answers/${editingId}`,
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
        `${process.env.REACT_APP_API_URL}/answers/${ansId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnswers(answers.map(a => a.id === ansId ? res.data : { ...a, accepted: false }));
      setQuestion(prev => ({ ...prev, accepted_answer_id: ansId }));
    } catch (err) {
      console.error(err);
      alert('Failed to accept answer');
    }
  };

  const handleVote = async (answerId, voteType) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/answers/${answerId}/vote`,
        { vote_type: voteType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnswers(answers.map(a =>
        a.id === answerId ? { ...a, votes: res.data.total_votes, user_vote: voteType } : a
      ));
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  const handleRemoveVote = async (answerId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await axios.delete(
        `${process.env.REACT_APP_API_URL}/answers/${answerId}/vote`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnswers(answers.map(a =>
        a.id === answerId ? { ...a, votes: res.data.total_votes, user_vote: null } : a
      ));
    } catch (err) {
      console.error('Failed to remove vote:', err);
    }
  };

  const handleDelete = async (answerId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!window.confirm('Delete this answer?')) return;

    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/answers/${answerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnswers(answers.filter(a => a.id !== answerId));
    } catch (err) {
      console.error('Failed to delete answer:', err);
    }
  };

  const handleDeleteQuestion = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!window.confirm('Delete this question?')) return;

    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/delete-questions/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/');
    } catch (err) {
      console.error('Failed to delete question:', err);
    }
  };

  if (!question) return <Typography sx={{ mt: 10, textAlign: 'center' }}>Loading...</Typography>;

  const acceptedAnswer = answers.find(a => a.id === question.accepted_answer_id);
  const otherAnswers = answers.filter(a => a.id !== question.accepted_answer_id);

  return (
    <MantineProvider withGlobalStyles withNormalizeCSS theme={{ colorScheme: darkMode ? 'dark' : 'light' }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />

        <AppBar position="static" color="default" sx={{ backgroundColor: theme.palette.background.paper }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>StackIt</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {isMobile ? (
                <IconButton component={RouterLink} to="/" size="small">
                  <HomeIcon sx={{ color: theme.palette.text.primary }} />
                </IconButton>
              ) : (
                <Button component={RouterLink} to="/" sx={{ color: theme.palette.text.primary }}>Home</Button>
              )}
              <Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} color="primary" />
              <IconButton><MenuIcon sx={{ color: theme.palette.text.primary }} /></IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ py: 4 }}>
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link component={RouterLink} to="/">Questions</Link>
            <Typography>{question.title}</Typography>
          </Breadcrumbs>

          <Box sx={{ backgroundColor: theme.palette.background.paper, p: 3, mb: 4, borderRadius: 2 }}>
            <Typography variant={isMobile ? 'h6' : 'h4'} fontWeight={600}>{question.title}</Typography>
            <Stack direction="row" spacing={1} sx={{ my: 1, flexWrap: 'wrap' }}>
              {question.tags.map((t, i) => <Chip key={i} label={t} />)}
            </Stack>
            <Box dangerouslySetInnerHTML={{ __html: question.description }} sx={{ mb: 1 }} />
            <Typography variant="caption">Posted by @{question.author_username}</Typography>

            {(currentUser === question.author_username || currentUserRole === 'admin') && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button variant="outlined" color="error" onClick={handleDeleteQuestion}>
                  Delete Question
                </Button>
              </Box>
            )}
          </Box>

          {acceptedAnswer && (
            <Box sx={{ backgroundColor: '#1E3A2F', borderRadius: 2, p: 2, mb: 4 }}>
              <Stack direction={isMobile ? 'column' : 'row'} spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <Avatar>{acceptedAnswer.author_username.charAt(0)}</Avatar>
                <Typography>{acceptedAnswer.author_username}</Typography>
                <CheckCircle color="success" />
                <Typography variant="body2">Accepted Answer</Typography>
              </Stack>
              <Box dangerouslySetInnerHTML={{ __html: acceptedAnswer.content }} />
            </Box>
          )}

          <Typography variant={isMobile ? 'body1' : 'h6'} sx={{ mb: 2 }}>
            Answers ({answers.length})
          </Typography>

          <Stack spacing={2}>
            {otherAnswers.map(ans => (
              <Box key={ans.id} sx={{ background: theme.palette.background.paper, p: 2, borderRadius: 2 }}>
                <Stack direction={isMobile ? 'column' : 'row'} spacing={2} alignItems={isMobile ? 'flex-start' : 'center'} sx={{ mb: 1 }}>
                  <Avatar>{ans.author_username?.charAt(0)}</Avatar>
                  <Typography>{ans.author_username}</Typography>
                  {currentUser === question.author_username && (
                    <Button size="small" onClick={() => handleAccept(ans.id)}>Accept</Button>
                  )}
                </Stack>

                {editingId === ans.id ? (
                  <>
                    <RichTextEditor
                      value={editContent}
                      onChange={setEditContent}
                      sticky={false}
                      sx={{ mb: 1, '& .ProseMirror': { minHeight: '120px', fontSize: isMobile ? '0.9rem' : '1rem' } }}
                    />
                    <Button variant="outlined" onClick={handleUpdate}>Update</Button>
                  </>
                ) : (
                  <>
                    <Box dangerouslySetInnerHTML={{ __html: ans.content }} sx={{ mb: 1 }} />
                    <Stack direction={isMobile ? 'column' : 'row'} spacing={1} alignItems="flex-start" mt={1}>
                      {currentUser === ans.author_username && (
                        <Button size="small" onClick={() => handleEdit(ans)}>Edit</Button>
                      )}
                      {currentUserRole === 'admin' && (
                        <Button size="small" color="error" onClick={() => handleDelete(ans.id)}>Delete</Button>
                      )}
                      <IconButton onClick={() => handleVote(ans.id, 'upvote')} sx={{ color: ans.user_vote === 'upvote' ? theme.palette.primary.main : theme.palette.text.primary }}>
                        <ThumbUp />
                      </IconButton>
                      <IconButton onClick={() => handleVote(ans.id, 'downvote')} sx={{ color: ans.user_vote === 'downvote' ? theme.palette.error.main : theme.palette.text.primary }}>
                        <ThumbDown />
                      </IconButton>
                      <Typography>{ans.votes}</Typography>
                      <Button size="small" onClick={() => handleRemoveVote(ans.id)}>Remove Vote</Button>
                    </Stack>
                  </>
                )}
              </Box>
            ))}
          </Stack>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6">Your Answer</Typography>
            <RichTextEditor
              value={newAnswer}
              onChange={setNewAnswer}
              sticky={false}
              placeholder="Write your answer..."
              sx={{ '& .ProseMirror': { minHeight: isMobile ? '180px' : '150px', fontSize: isMobile ? '0.9rem' : '1rem' } }}
            />
            <Box sx={{ mt: 2, display: 'flex', justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!newAnswer.trim()}
                fullWidth={isMobile}
              >
                Submit Answer
              </Button>
            </Box>
          </Box>
        </Container>
      </ThemeProvider>
    </MantineProvider>
  );
}
