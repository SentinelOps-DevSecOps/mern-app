import React, { useEffect, useState } from "react";
import HomeImage1 from "../../assets/HomeImage1.png";
import "../../style/auth.css";

const sentences = [
  "Donate Blood, Save Lives.",
  "Be a Hero in Someone's Story.",
  "Be a Hero. Save Lives. Start Today.",
  "Your Blood Can Give Others a Chance to Live.",
  "Connecting Life – One Drop at a Time",
];

const HomePage = () => {
  const [currentSentence, setCurrentSentence] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSentence((prev) => (prev + 1) % sentences.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home_intro_section">
      <div className="blood_banner">
        <img src={HomeImage1} alt="Blood Drop" className="blood_image" />
        <p className="animated_sentence">{sentences[currentSentence]}</p>
        <p className="blood_banner_description">
          Welcome to <b className="description_b">HopeGivers</b>, a life-saving
          initiative that bridges the gap between voluntary blood donors and
          those in urgent need of blood. Whether you're here to donate blood or
          find a donor, our platform makes the process simple, fast, and secure.{" "}
          <br />
          <br />
          With a growing network of committed donors across cities, we aim to
          ensure no life is lost due to a lack of blood. Join our mission to
          make blood accessible to everyone—anytime, anywhere.
        </p>
      </div>
    </div>
  );
};

export default HomePage;
