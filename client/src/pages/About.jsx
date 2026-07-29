import React from "react";
import "../style/About.css";
import Navbar from "../components/navbar/Navbar";
import Footer from "../components/navbar/Footer";

import missionImg from "../assets/mission.png";
import serviceImg from "../assets/service.png";
import communityImg from "../assets/community.png";

const AboutUs = () => {
  return (
    <div>
      <Navbar />

      <section className="about-section">
        <div className="about-content">
          <h1 className="about-title">About HopeGivers</h1>
          <p className="about-intro">
            HopeGivers is not just a digital platform—it's a compassionate
            movement dedicated to saving lives through efficient, transparent,
            and community-focused blood donation. Founded on the belief that no
            one should suffer or die due to the unavailability of blood,
            HopeGivers empowers individuals, hospitals, and organizations to
            seamlessly connect in times of critical medical need. The core of
            our mission lies in creating a system where technology meets
            humanity, making the blood donation process faster, more reliable,
            and more accessible to everyone.
          </p>

          <div className="about-card">
            <div className="about-text">
              <h2>Our Vision</h2>
              <p>
                At HopeGivers, our vision is grounded in the fundamental belief
                that human life is precious and irreplaceable. We strive to
                eliminate preventable deaths caused by a lack of timely access
                to blood. In many parts of the world, and even in modern
                healthcare systems, there remains a significant gap between
                blood supply and demand. Emergencies don’t wait, and neither
                should help. Our vision is to create a seamless, real-time blood
                donation network that connects people instantly, regardless of
                geography. Through innovation and dedication, we aim to make
                life-saving blood available when and where it's needed most.
                HopeGivers envisions a world where technology enables
                empathy—where a request for blood can be fulfilled within
                minutes, thanks to a well-connected network of verified donors
                and volunteers. We focus on accessibility and reliability so
                that people from urban centers to remote villages can receive
                timely assistance. Our vision also includes raising awareness
                about blood donation as a regular and essential civic duty. We
                want people to feel a sense of pride, unity, and humanity when
                they donate. Through campaigns, education, and technological
                infrastructure, HopeGivers will make this vision a global
                reality—one community at a time, one drop at a time.
              </p>
            </div>
            <img src={missionImg} alt="Our Vision" className="about-image" />
          </div>

          <div className="about-card reverse">
            <img src={serviceImg} alt="Our Services" className="about-image" />
            <div className="about-text">
              <h2>What We Offer</h2>
              <p>
                HopeGivers is a comprehensive blood management solution,
                offering an array of features designed to make the donation and
                request process seamless, secure, and efficient. At the heart of
                our platform is an intelligent matching system that connects
                donors and recipients based on blood type, location, and
                urgency. We enable instant communication through real-time
                notifications, ensuring donors are informed of emergency needs
                in their vicinity. To build trust, every user goes through a
                verification process, and our platform maintains a detailed
                record of all donation activities for transparency. Our services
                extend beyond logistics—we provide access to educational
                resources for both donors and recipients. These tools help users
                understand eligibility, donation safety, and aftercare. For
                hospitals and NGOs, we offer dashboards that provide insights
                into donor behavior and inventory trends. HopeGivers also hosts
                regular donation drives and community-building events, helping
                individuals stay engaged and proactive. In addition, our
                mobile-friendly interface ensures that life-saving actions can
                be taken from any device, anywhere. By offering support every
                step of the way—from awareness to aftercare—HopeGivers positions
                itself not just as a tool, but as a complete ecosystem of
                support, empowerment, and change.
              </p>
            </div>
          </div>

          <div className="about-card">
            <div className="about-text">
              <h2>Our Community</h2>
              <p>
                The heartbeat of HopeGivers is its thriving community of
                compassionate individuals who believe in the power of collective
                action. Our community is a diverse mix of volunteers, donors,
                recipients, healthcare professionals, and change-makers. Each
                person plays a vital role in advancing our mission of saving
                lives. We believe that a connected community is a resilient one.
                That’s why we foster communication, collaboration, and support
                through our platform. Donors can share their experiences,
                recipients can express their gratitude, and both can inspire
                others to join the cause. Our social engagement features allow
                users to form local groups, schedule group donations, and even
                organize awareness events. We celebrate milestones, acknowledge
                heroes, and encourage continuous learning and involvement.
                Beyond just technical functionality, HopeGivers provides a sense
                of belonging. Being part of this community means you are never
                alone in your efforts. Whether you're responding to a call for
                help or simply sharing encouragement, every action contributes
                to a culture of giving and humanity. HopeGivers is proud to
                build bridges between people from different walks of life,
                united by a shared goal—to give hope through blood. With each
                new member, our community grows stronger, and our collective
                impact multiplies.
              </p>
            </div>
            <img
              src={communityImg}
              alt="Our Community"
              className="about-image"
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutUs;
