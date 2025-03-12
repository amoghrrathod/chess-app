import React from "react";
import "./about_us.css";
import AniruddhaPic from "./images/aniruddha.jpg";
import AdityaPic from "./images/aditya.jpg";
import AmoghPic from "./images/amogh.jpg";

const AboutUs = () => {
  return (
    <div className="about-us">
      <h1 className="title">About Us</h1>
      <p className="intro">
        Welcome to our Game Hub! Meet the dedicated team behind this project:
      </p>

      <div className="team-member">
        <img src={AniruddhaPic} alt="Aniruddha Joshi" className="profile-pic" />
        <h2>Aniruddha Joshi</h2>
        <p>
          <strong>Email:</strong>{" "}
          <a href="mailto:joshianiruddha100@gmail.com">
            joshianiruddha100@gmail.com
          </a>
        </p>
        <p>
          <strong>GitHub:</strong>{" "}
          <a
            href="https://github.com/aniruddhajoshi100"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/aniruddhajoshi100
          </a>
        </p>
      </div>

      <div className="team-member">
        <img src={AdityaPic} alt="Aditya R" className="profile-pic" />
        <h2>Aditya R</h2>
        <p>
          <strong>Email:</strong>{" "}
          <a href="mailto:pro.aditya.r@gmail.com">pro.aditya.r@gmail.com</a>
        </p>
        <p>
          <strong>GitHub:</strong>{" "}
          <a
            href="https://github.com/adityatr64"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/adityatr64
          </a>
        </p>
      </div>

      <div className="team-member">
        <img src={AmoghPic} alt="Amogh Rathod" className="profile-pic" />
        <h2>Amogh Rathod</h2>
        <p>
          <strong>Email:</strong>{" "}
          <a href="mailto:amoghrrathod@gmail.com">amoghrrathod@gmail.com</a>
        </p>
        <p>
          <strong>GitHub:</strong>{" "}
          <a
            href="https://github.com/amoghrrathod"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/amoghrrathod
          </a>
        </p>
      </div>
    </div>
  );
};

export default AboutUs;
