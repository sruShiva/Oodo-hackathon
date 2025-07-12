# ⚛️ StackIt Q&A Platform - Frontend

This is the frontend for the StackIt Q&A platform, built using React and Create React App.

---

## 🌟 Overview

- Clean, component-based UI using **React**
- Built with **Create React App** boilerplate
- Supports dynamic routing, component testing, and fast refresh during development
- Prepares for production-grade builds with code splitting, optimization, and service worker config

---

## 📁 Project Structure

```
frontend/
├── public/
│   ├── favicon.ico
│   ├── index.html
│   ├── logo192.png
│   ├── logo512.png
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── User/
│   │   ├── AskQuestionForm.js
│   │   ├── AuthThemeProvider.js
│   │   ├── LoginPage.js
│   │   ├── mentionExtension.js
│   │   ├── PrivateRoute.js
│   │   ├── QuestionDetail.js
│   │   ├── SearchAndAskQuestion.js
│   │   └── SignUpPage.js
│   ├── App.css
│   ├── App.js
│   ├── App.test.js
│   ├── index.css
│   ├── index.js
│   ├── logo.svg
│   ├── reportWebVitals.js
│   └── setupTests.js
├── .env
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

---

## 🚀 Getting Started

Make sure you have **Node.js** and **npm** installed.

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Start the development server

```bash
npm start
```

- Opens at: [http://localhost:3000](http://localhost:3000)
- Auto-reloads on file changes

---

## 📦 Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in development mode.  
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm test`

Launches the test runner in interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.  
It correctly bundles React in production mode and optimizes the build.

### `npm run eject`

**Note: this is a one-way operation.**  
Removes the single build dependency and copies all configs and dependencies into the project.

---

## 📚 Learn More

- [Create React App Docs](https://create-react-app.dev/docs/getting-started/)
- [React Documentation](https://reactjs.org/)
