import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./greeting.css";

const Greeting = () => {
  const [userName, setUserName] = useState("Guest");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [rewardPoints, setRewardPoints] = useState(0);
  const navigate = useNavigate();

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good Morning"
      : currentHour < 18
      ? "Good Afternoon"
      : "Good Evening";

  const redeemRewards = async () => {
    const token = sessionStorage.getItem("authToken");

    if (!token) {
      alert("You must be logged in to redeem rewards.");
      return;
    }

    if (rewardPoints < 10) {
      alert("You need at least 10 points to redeem!");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/rewards/redeem",
        { points_to_redeem: 10 },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setRewardPoints((prev) => prev - 10);
        alert("🎉 10 Reward Points Redeemed for Discount!");
      }
    } catch (error) {
      console.error("Error redeeming points:", error);
      alert("❌ Failed to redeem points.");
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem("authToken");

    if (!token) {
      setIsLoggedIn(false);
      return;
    }

    const storedName = sessionStorage.getItem("userName");
    if (storedName) {
      setUserName(storedName.split(" ")[0]);
    }

    setIsLoggedIn(true);

    const fetchRewardPoints = async () => {
      try {
        const rewardResponse = await axios.get("http://localhost:5000/api/rewards/redeem-points", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (rewardResponse.data.success) {
          setRewardPoints(rewardResponse.data.data.redeemable_points || 0);
        }
      } catch (error) {
        console.error("Error fetching reward points:", error);
        setIsLoggedIn(false);
        navigate("/login");
      }
    };

    fetchRewardPoints();
  }, [navigate]);

  return (
    <div className="greeting-section">
      <h2 className="user-name">
        {`${greeting}, `} <span>{`${userName}!`}</span>
      </h2>
      <p>Discover delicious meals handpicked just for you.</p>

      {isLoggedIn && (
        <div className="reward-section bg-yellow-200 p-4 rounded-lg mt-6 inline-block">
          <p className="text-xl font-semibold text-gray-800">
            🎉 Reward Points:{""}
            <span className="text-green-600">{rewardPoints}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default Greeting;
