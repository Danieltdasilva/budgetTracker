# Budget Tracker App

A simple, lightweight **budget tracking web app** built with **JavaScript, HTML, and CSS**.  
It allows users to add **income** and **expenses**, keeps a running **balance total**, and saves data in **MongoDB** so it persists after refreshing the page.

---

## Features
- Add **income** or **expense** transactions with:
  - Date
  - Description
  - Type (Income or Expense)
  - Amount
- Transactions display as a **list** with a delete button.
- **Total balance** automatically updates.
- Entries are styled with:
  - Green accent for income
  - Red accent for expenses
- **Persistent storage** using `MongoDB and Mongoose`.
- Clean, responsive UI.

---

## Technologies Used
- **HTML5**
- **SCSS**
- **CSS Grid & Flexbox**
- **JavaScript**
- **Chart.js**
- **MongoDB Atlas**
- **Mongoose**
- **JWT Authentication**

## Architecture

The application follows a simple full-stack architecture:

Client (Vanilla JS)<br>
    ↓<br>
Express REST API<br>
    ↓<br>
MongoDB Atlas<br>

Authentication Flow:
1. User logs in
2. Server issues JWT
3. Token stored in localStorage
4. Protected routes validate token via middleware

## Local Setup

1. Clone the repository
2. Install dependencies:

npm install

3. Create a `.env` file in the `/server` directory:

MONGO_URI=your_connection_string
JWT_SECRET=your_secret

4. Start the server:

npm start

5. Open the frontend in your browser

## Future Improvements

- Category-based analytics
- Monthly reporting dashboard
- Role-based access control
- CI/CD integration
- Test automation suite

## Testing Considerations

The project is structured to support API-level test automation, including:

- Predictable REST endpoints
- Token-based authentication validation
- Clear separation of concerns
- State-driven UI rendering

Future work includes integrating automated API tests into CI/CD pipelines.