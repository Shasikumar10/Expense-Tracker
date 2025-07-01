// frontend/src/components/Navbar.js
import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { logoutUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <nav style={{ padding: 10, backgroundColor: "#222", color: "white" }}>
      <span>Smart Expense Tracker</span>
      <button
        onClick={handleLogout}
        style={{
          float: "right",
          backgroundColor: "#ff4d4d",
          border: "none",
          color: "white",
          padding: "5px 10px",
          cursor: "pointer",
          borderRadius: 4,
        }}
      >
        Logout
      </button>
    </nav>
  );
};

export default Navbar;
