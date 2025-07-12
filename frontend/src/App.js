import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import SearchAndAskQuestion from './User/SearchandAskQuestion.js';
import AskQuestionForm from './User/AskQuestionForm.js';
import QuestionDetail from './User/QuestionDetail.js';
import LoginPage from './User/LoginPage.js';
import SignUpPage from './User/SignUpPage.js';

function App() {
  return (
    <Router>
     
          <Routes>
            <Route path="/" element={<SearchAndAskQuestion />} />
             <Route path="/ask-question" element={<AskQuestionForm/>} />
          <Route path="/questions/:questionId" element={<QuestionDetail />} />
           <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="/login" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default App;
