import React, { useState, useEffect, useMemo } from 'react';
import {
  AppBar, Toolbar, IconButton, Typography, Button, TextField, Card,
  CardContent, Chip, Container, Box, Grid, useMediaQuery,
  Pagination, Switch, CssBaseline
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';

export default function SearchAndAskQuestion() {
  const [darkMode, setDarkMode] = useState(true);
  const [showUnanswered, setShowUnanswered] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [questions, setQuestions] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const isMobile = useMediaQuery('(max-width:37.5em)');
  const navigate = useNavigate();

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

  const fetchQuestions = async () => {
    try {
      const params = { page, limit };
      if (searchText.trim()) params.search = searchText.trim();
      const response = await axios.get('http://localhost:8000/get-questions', { params });
      const res = response.data;

      let fetched = res.questions;
      if (showUnanswered) {
        fetched = fetched.filter(q => q.answer_count === 0);
      }

      setQuestions(fetched);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load questions', err);
    }
  };

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, showUnanswered]);

  const handleSearch = () => {
    setPage(1);
    fetchQuestions();
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh' }}>
        <AppBar position="static" color="default" elevation={0} sx={{ backgroundColor: theme.palette.background.paper }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
              StackIt
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {!isMobile && (
                <Button component={RouterLink} to="/login" sx={{ color: theme.palette.text.primary }}>
                  Login
                </Button>
              )}
              <Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} color="primary" />
              <IconButton><MenuIcon sx={{ color: theme.palette.text.primary }} /></IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ py: 4 }}>
          {!isMobile && (
            <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Grid item>
                <Button variant="outlined" onClick={() => navigate('/ask-question')}
                  sx={{ color: theme.palette.text.primary, borderColor: theme.palette.primary.main }}>
                  Ask New Question
                </Button>
              </Grid>
              <Grid item>
                <Button variant="outlined"
                  onClick={() => { setShowUnanswered(false); setPage(1); }}
                  color={!showUnanswered ? 'primary' : 'inherit'}>
                  All
                </Button>
              </Grid>
              <Grid item>
                <Button variant="outlined"
                  onClick={() => { setShowUnanswered(true); setPage(1); }}
                  color={showUnanswered ? 'primary' : 'inherit'}>
                  Unanswered
                </Button>
              </Grid>

              {/* 🔍 Search Text Field */}
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  placeholder="Search questions..."
                  variant="outlined"
                  size="small"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
              </Grid>

              {/* 🔍 Search Button */}
              <Grid item xs="auto">
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  startIcon={<SearchIcon />}
                  sx={{ height: '40px', px: 3 }}
                >
                  Search
                </Button>
              </Grid>
            </Grid>
          )}

          {/* 🧾 List of Questions */}
          {questions.map((q) => (
            <Card key={q.id} sx={{ backgroundColor: theme.palette.background.paper, mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography fontWeight={600} sx={{ cursor: 'pointer' }} onClick={() => navigate(`/questions/${q.id}`)}>
                    {q.title}
                  </Typography>
                  <Chip label={`${q.answer_count} ans`} size="small" sx={{ backgroundColor: '#2E2E2E', color: '#fff' }} />
                </Box>
                <Box sx={{ display: 'flex', gap: 1, my: 1 }}>
                  {q.tags.map((tag, i) => (
                    <Chip key={i} label={tag} size="small" sx={{ backgroundColor: '#2E2E2E', color: '#fff' }} />
                  ))}
                </Box>
                <Typography variant="body2" color="text.secondary" dangerouslySetInnerHTML={{ __html: q.description }} />
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: theme.palette.primary.main }}>
                    {q.author_username}
                  </Typography>
                  <Button size="small" variant="text" onClick={() => navigate(`/questions/${q.id}`)}>
                    Answer Now
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={Math.ceil(total / limit)}
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
