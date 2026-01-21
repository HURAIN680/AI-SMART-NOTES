import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Notes from "./pages/Notes";
import Home from "./pages/Home";
import SharedNote from "./pages/SharedNote";

 const isAuthenticated = () => {
   return !!localStorage.getItem("token");
 };

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/notes" element={<Notes />} />

        { <Route
          path="/notes"
          element={isAuthenticated() ? <Notes /> : <Navigate to="/login" />}
        /> }
        <Route path="/share/:id" element={<SharedNote />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}


export default App;

