import { BrowserRouter, Routes, Route } from "react-router-dom";

import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Notes from "./pages/Notes";
import Signup from "./pages/Signup";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
