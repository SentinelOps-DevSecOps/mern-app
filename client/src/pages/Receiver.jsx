import React, { useState, useEffect } from "react";
import "../style/Receiver.css";
import apis from '../utils/apis';
import locationData from "../init/data";
import Navbar from "../components/navbar/Navbar";
import Footer from "../components/navbar/Footer";
import toast from "react-hot-toast";


const Receiver = () => {
  const [formData, setFormData] = useState({
    bloodGroup: "",
    country: "",
    state: "",
    district: "",
    city: "",
  });

  const [results, setResults] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);

  // Handle input changes and reset child selections
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "country") {
        updated.state = "";
        updated.district = "";
        updated.city = "";
      } else if (name === "state") {
        updated.district = "";
        updated.city = "";
      } else if (name === "district") {
        updated.city = "";
      }

      return updated;
    });
  };

  // Update states when country changes
  // Update states when country changes
  useEffect(() => {
    const selectedStates = formData.country
      ? Object.keys(locationData[formData.country] || {})
      : [];
    setStates(selectedStates);
    setDistricts([]);
    setCities([]);
  }, [formData.country]);

  // Update districts when state changes
  useEffect(() => {
    const selectedDistricts = formData.state && formData.country
      ? Object.keys(locationData[formData.country]?.[formData.state] || {})
      : [];
    setDistricts(selectedDistricts);
    setCities([]);
  }, [formData.state, formData.country]); // ✅ Added formData.country

  // Update cities when district changes
  useEffect(() => {
    const selectedCities = formData.district && formData.state && formData.country
      ? locationData[formData.country]?.[formData.state]?.[formData.district] || []
      : [];
    setCities(selectedCities);
  }, [formData.district, formData.state, formData.country]); // ✅ Added all dependencies

  // Handle form submission and fetch donors
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(apis().list1.receiverRegister, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.length > 0) {
        toast.success(data?.message || "Search successful: Donor(s) found!");
      } else {
        toast.error(data?.message || "No donors found matching the search criteria.");
      }

      setResults(data);
    } catch (error) {
      console.error("Search failed:", error);
      toast.error(error.message || "An error occurred while searching.");
    }
  };

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 500, margin: "auto", fontFamily: "Arial" }}>

        <h2 style={{textAlign:"center", marginTop:"10px"}}>Search Blood Donors</h2>
        <form onSubmit={handleSubmit} className="search-form">
          <label className="search-label">Blood Group</label>
          <select
            name="bloodGroup"
            value={formData.bloodGroup}
            onChange={handleChange}
            required
            className="search-select"
          >
            <option value="">--Select--</option>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </select>

          <label className="search-label">Country</label>
          <select
            name="country"
            value={formData.country}
            onChange={handleChange}
            required
            className="search-select"
          >
            <option value="">--Select--</option>
            {Object.keys(locationData).map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>

          <label className="search-label">State</label>
          <select
            name="state"
            value={formData.state}
            onChange={handleChange}
            required
            className="search-select"
          >
            <option value="">--Select--</option>
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>

          <label className="search-label">District</label>
          <select
            name="district"
            value={formData.district}
            onChange={handleChange}
            required
            className="search-select"
          >
            <option value="">--Select--</option>
            {districts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>

          <label className="search-label">City</label>
          <select
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            className="search-select"
          >
            <option value="">--Select--</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          <button type="submit" className="search-button">
            Search
          </button>
        </form>

        {/* Render Results */}
        {results.length > 0 && (
          <div className="search-results">
            <h3>Available Donors:</h3>
            <div className="table-container">
              <table className="donor-table">
                <thead>
                  <tr>
                    <th>Sr.</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Contact</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((donor, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{donor.fullName}</td>
                      <td>{donor.email}</td>
                      <td>{donor.mobileNumber}</td>
                      <td>
                        <button
                          className="report-button"
                          onClick={() => alert(`Report sent for ${donor.fullName}`)}
                        >
                          Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}


      </div>
      <Footer />
    </div>
  );
};

export default Receiver;
