// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Pages
import SearchAndAskQuestion from './User/SearchandAskQuestion';
import AskQuestionForm from './User/AskQuestionForm';
import QuestionDetail from './User/QuestionDetail';
import LoginPage from './User/LoginPage';
import SignUpPage from './User/SignUpPage';

// Auth guard
import PrivateRoute from './User/PrivateRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<SearchAndAskQuestion />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />

        {/* Protected Routes */}
        <Route
          path="/ask-question"
          element={
            <PrivateRoute>
              <AskQuestionForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/questions/:questionId"
          element={
            <PrivateRoute>
              <QuestionDetail />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
