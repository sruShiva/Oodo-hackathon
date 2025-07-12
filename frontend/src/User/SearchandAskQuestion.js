import React, { useState, useMemo } from 'react';
import {
  AppBar, Toolbar, IconButton, Typography, Button, TextField, Card,
  CardContent, Chip, Container, Box, InputAdornment, Grid, useMediaQuery,
  Pagination, Avatar, Switch, CssBaseline
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useNavigate } from 'react-router-dom';

import { useParams, Link as RouterLink } from 'react-router-dom';
export default function SearchAndAskQuestion() {
  const [darkMode, setDarkMode] = useState(true);
  const [showUnanswered, setShowUnanswered] = useState(false);
  const isMobile = useMediaQuery('(max-width:37.5em)');
  const navigate = useNavigate();

  const categories = ['Movies', 'Party', 'Food', 'Pet', 'Travel', 'Shop', 'Sports', 'Alien', 'Space'];

  const questions = [
    {
      id: 1,
      title: "How to join 2 columns in a data set to make a separate column in SQL",
      tags: ["SQL", "Beginner"],
      description: "I do not know the code for it as I am a beginner...",
      user: "Total Walrus",
      answers: 5
    },
    {
      id: 2,
      title: "How do I configure routing in React?",
      tags: ["React", "Routing"],
      description: "I’m confused about using Routes and BrowserRouter...",
      user: "Advanced Yak",
      answers: 0
    }
  ];

  const filteredQuestions = showUnanswered
    ? questions.filter(q => q.answers === 0)
    : questions;

  const theme = useMemo(() =>
    createTheme({
      palette: {
        mode: darkMode ? 'dark' : 'light',
        background: {
          default: darkMode ? '#121212' : '#f5f5f5',
          paper: darkMode ? '#1E1E1E' : '#fff',
        },
        primary: {
          main: '#A259FF',
        },
        text: {
          primary: darkMode ? '#fff' : '#121212',
          secondary: darkMode ? '#B0B0B0' : '#555',
        }
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
      }
    }), [darkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh' }}>
        {/* App Bar */}
        <AppBar position="static" color="default" elevation={0} sx={{ backgroundColor: theme.palette.background.paper }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
              StackIt
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
           {!isMobile && (
    <Button
      component={RouterLink}
      to="/login"
      sx={{ color: theme.palette.text.primary }}
    >
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

        <Container maxWidth="md" sx={{ py: 4 }}>
          {/* Filters */}
          {!isMobile && (
            <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Grid item>
                <Button variant="outlined" onClick={() => navigate('/ask-question')} sx={{ color: theme.palette.text.primary, borderColor: theme.palette.primary.main }}>
                  Ask New Question
                </Button>
              </Grid>
              <Grid item>
                <Button variant="outlined" onClick={() => setShowUnanswered(false)} color={!showUnanswered ? 'primary' : 'inherit'}>
                  All
                </Button>
              </Grid>
              <Grid item>
                <Button variant="outlined" onClick={() => setShowUnanswered(true)} color={showUnanswered ? 'primary' : 'inherit'}>
                  Unanswered
                </Button>
              </Grid>
              <Grid item>
                <Button startIcon={<FilterListIcon />} variant="outlined">More</Button>
              </Grid>
              <Grid item xs>
                <TextField
                  fullWidth
                  placeholder="Search"
                  variant="outlined"
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          )}

          {/* Question List */}
          {filteredQuestions.map((q) => (
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
                  <Chip label={`${q.answers} ans`} size="small" sx={{ backgroundColor: '#2E2E2E', color: '#fff' }} />
                </Box>
                <Box sx={{ display: 'flex', gap: 1, my: 1 }}>
                  {q.tags.map((tag, i) => (
                    <Chip key={i} label={tag} size="small" sx={{ backgroundColor: '#2E2E2E', color: '#fff' }} />
                  ))}
                </Box>
                <Typography variant="body2" color="text.secondary">{q.description}</Typography>
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: theme.palette.primary.main }}>{q.user}</Typography>
                  <Button size="small" variant="text" onClick={() => navigate(`/questions/${q.id}`)}>Answer Now</Button>
                </Box>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination count={5} variant="outlined" shape="rounded" />
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
