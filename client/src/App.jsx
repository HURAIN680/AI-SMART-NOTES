import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Notes from "./pages/Notes";
import Home from "./pages/Home";
import PublicNote from "./pages/PublicNote";

const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Public shared note */}
        <Route path="/note/:id" element={<PublicNote />} />

        {/* Protected */}
        <Route
          path="/notes"
          element={isAuthenticated() ? <Notes /> : <Navigate to="/login" />}
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
