import React from "react";
import "./style/Home.css";
import Navbar from "./components/navbar/Navbar";
import Footer from "./components/navbar/Footer";
import bloodDonationImg from "./assets/blood-donation.png";
import bloodImage from "./assets/BloodImage.png";
import { FaSearch, FaPhoneAlt, FaRegListAlt, FaArrowRight } from "react-icons/fa";
import { FiCheckCircle } from "react-icons/fi";
import HowItWorkImg from "./assets/HowItWork.png";
import { Link } from "react-router-dom";

const bloodData = [
  { type: "A+", bags: 0 },
  { type: "A-", bags: 10 },
  { type: "O+", bags: 30 },
  { type: "O-", bags: 50 },
  { type: "AB+", bags: 80 },
  { type: "AB-", bags: 100 },
];

const BloodDrop = ({ type, bags }) => {
  const fillPercentage = Math.min(bags, 100); // cap at 100 for visual
  return (
    <div className="blood-type">
      <div className="blood-drop">
        <div
          className="blood-fill"
          style={{ height: `${fillPercentage}%` }} // ✅ React-friendly object style
        ></div>
      </div>
      <div className="blood-label">{type}</div>
      <div className="blood-bags">{bags} Bags Available</div>
    </div>
  );
};
export default function Home() {
  return (
    <div>
      <Navbar />
      {/* ---------------------Blood Donation Content----------------------*/}
      <section className="blood-donation">
        <div className="blood-content">
          <h1>HopeGivers</h1>
          <p>
            At <strong>HopeGivers</strong>, we believe that every drop of blood
            donated has the power to rewrite someone’s story. Blood donation is
            a noble act where individuals voluntarily contribute to saving
            lives—whether for emergency trauma cases, surgeries, or patients
            battling life-threatening conditions. Our platform simplifies this
            process by connecting willing donors with those in need through a
            transparent and real-time system. We handle everything—from smart
            donor-recipient matching and secure data handling to educating our
            community on the importance of donation. By donating blood through
            HopeGivers, you're not just giving blood—you're giving hope,
            strength, and a second chance at life.
          </p>
          <Link to="/donor/register">
            <button className="know-more-btn">Register as a Donor</button>
          </Link>
        </div>

        <div className="blood-image">
          <img src={bloodDonationImg} alt="Blood donation illustration" />
          <div className="search-bar">
            <input type="text" placeholder="Search for cities and drives" />
            <Link to="/contactus">
              <button>
                <FaSearch />
              </button>
            </Link>
          </div>
        </div>

        <Link to="/contactus">
          <div className="floating-call-btn" title="Call Us Now">
            <FaPhoneAlt />
          </div>
        </Link>
      </section>

      {/* ---------------------Donate and find Blood----------------------*/}
      <div className="container">
        <h1 className="title">Real-Time Blood Availability</h1>
        <p className="subtitle">
          Check The Latest Blood Supply Levels And Find The Nearest Donation
          Center.
        </p>
        <div className="blood-list">
          {bloodData.map((b) => (
            <BloodDrop key={b.type} type={b.type} bags={b.bags} />
          ))}
        </div>
        <div className="buttons">
          <Link to="/donor/register">
            <button className="donate"> <FaArrowRight style={{ marginRight: "5px",marginTop:"3px" }} /> Donate Blood </button>
          </Link>
          <Link to="/donor/search-donors">
            <button className="request" > <FaArrowRight style={{ marginRight: "5px",marginTop:"3px" }} /> Request Blood </button>
          </Link>
        </div>
      </div>
      {/* ---------------------Features----------------------*/}
      <section className="features-section">
        <div className="features-content">
          <h2 className="features-title">Our Features</h2>
          <p className="features-subtitle">
            Discover the core functionalities that make our Blood Management
            System effective and efficient.
          </p>

          <div className="feature-card blue">
            <div className="icon">
              <FaRegListAlt />
            </div>
            <div>
              <h3>Donor-Recipient Matching</h3>
              <p>
                Our intelligent matching system bridges the gap between donors
                and recipients by using real-time algorithms that factor in
                blood type, geographic location, and urgency level. This ensures
                that patients receive the help they need when they need it most.
                By prioritizing nearby donors with compatible types, our system
                not only saves time but also improves the chances of successful
                transfusions. This feature helps hospitals, clinics, and
                individuals act quickly during emergencies.
              </p>
            </div>
          </div>

          <div className="feature-card green">
            <div className="icon">
              <FaRegListAlt />
            </div>
            <div>
              <h3>Urgent Notifications</h3>
              <p>
                Our platform sends instant alerts to verified donors when a
                critical need arises. These notifications are triggered by
                emergency requests, allowing donors to respond without delay.
                Timely communication ensures that life-saving blood reaches
                those in desperate need. We use geolocation to target the
                nearest available donors, reducing the time between request and
                donation. Whether it’s a road accident or surgery, our system
                acts fast to inform and mobilize help.
              </p>
            </div>
          </div>

          <div className="feature-card orange">
            <div className="icon">
              <FaRegListAlt />
            </div>
            <div>
              <h3>Track Records</h3>
              <p>
                Keeping a detailed history of blood donations and transfusions
                is vital for medical accountability and safety. Our tracking
                system logs every transaction, making it easier for users and
                healthcare providers to access past records. This transparency
                helps monitor donation frequency, detect irregularities, and
                comply with medical regulations. It also builds trust by
                maintaining a record of donor activity, supporting long-term
                engagement and ensuring that recipients get safe,
                well-documented blood units.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------Mission and vision----------------------*/}
      <div className="mission-container">
        <div className="image-section">
          <img src={bloodImage} alt="Blood Donation" />
        </div>
        <div className="text-section">
          <h2>Our Mission & Vision</h2>
          <p>
            We are making blood donation and requests seamless with real-time
            tracking and smart hospital integration. Our system ensures that
            donors can give easily and recipients get the blood they need
            without delays. With a user-friendly interface and reliable
            notifications, we eliminate uncertainty and bridge the gap between
            donors and medical facilities.
          </p>
          <p>
            Driven by innovation, our mission is to create a fast, transparent,
            and accessible blood supply network that saves lives every day. We
            aim to empower communities through education, technology, and
            collaboration, encouraging a culture of regular donation. Every
            feature is designed with care to ensure the safety, trust, and
            efficiency of every blood exchange.
          </p>
          <a href="#HowItWork">
            <button className="learn-button">Learn How It Works →</button>
          </a>
        </div>
      </div>

      {/* ---------------------How it work----------------------*/}
      <section className="how-it-works" id="HowItWork">
        <h2 className="how-title">How it Works</h2>
        <p className="how-subtitle">
          Our platform is designed to be simple and accessible. Use it directly
          through your browser—no downloads needed.
        </p>
        <div className="how-content">
          <div className="how-images">
            <img src={HowItWorkImg} alt="App Screen 1" />
          </div>
          <div className="how-text">
            <p>
              HopeGivers connects blood donors and recipients instantly. You
              register with your blood type and location. When someone nearby
              needs blood, our system alerts matching donors. You get notified,
              respond if available, and help save a life—fast, secure, and
              reliable.
            </p>
            <ul className="how-list">
              <li>
                <FiCheckCircle color="red" /> Register
              </li>
              <li>
                <FiCheckCircle color="red" /> Fill your Profile
              </li>
              <li>
                <FiCheckCircle color="red" /> Find Blood
              </li>
              <li>
                <FiCheckCircle color="red" /> View pending Requests
              </li>
              <li>
                <FiCheckCircle color="red" /> Make blood Requests
              </li>
              <li>
                <FiCheckCircle color="red" /> Share and HopeGivests
              </li>
            </ul>
            <button className="read-more-btn">Successful</button>
          </div>
        </div>
      </section>
      {/* ---------------------join cause----------------------*/}
      <section className="join-cause">
        <h2 className="join-title">Join the Cause</h2>
        <p className="join-subtitle">
          Join our cause and help us save more lives. Everyone should have the
          right to get a blood transfusion.
        </p>

        <div className="join-grid">
          <div className="join-card">
            <h3>Find Donors in your Area</h3>
            <p>
              Get connected in a matter of minutes at zero cost. Our App ships
              with a smart system that finds the closest blood donors. Our
              automated blood donation system works efficiently whenever someone
              needs a blood transfusion.
            </p>
          </div>

          <div className="join-card">
            <h3>Answer to Emergencies</h3>
            <p>
              As soon as a new blood request is raised, it is routed among our
              local volunteer blood donors. We know time matters! So we keep you
              updated with real-time notifications sent directly to you via SMS
              or the mobile app.
            </p>
          </div>

          <div className="join-card">
            <h3>Made for Everyone</h3>
            <p>
              All you need to do is send a text message to 8655, “blood need
              (blood-group) in (your-city)” in any language you want. Our system
              is smart enough to understand anything you write and helps you
              find a donor within minutes if not seconds.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
