import React from "react";
import "../../style/auth.css";
import Input from "../ui/Input";
import { BiDonateBlood } from "react-icons/bi";
import Button from "../ui/Button";
import BackToLogin from "../ui/BackToLogin";
import LoadingButton from "../ui/LoadingButton";
import apis from "../../utils/apis";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Navbar from "../navbar/Navbar";
import Footer from "../navbar/Footer";
import HomePage from "./HomePage";

const Register = () => {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();

  const nameChange = (e) => setName(e.target.value);
  const emailChange = (e) => setEmail(e.target.value);
  const passwordChange = (e) => setPassword(e.target.value);

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch(apis().list.registerUser, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const result = await response.json();
      setLoading(false);
      if (!response.ok) throw new Error(result?.message);

      if (result?.status) {
        toast.success(result?.message);
        localStorage.setItem("token", result.token);
        localStorage.setItem("profile", JSON.stringify(result));
        navigate("/home");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

    return (
      <div>
            <Navbar />


            <div className="auth_main">
                <div className="auth_left">
                    <HomePage/>
                </div>
          <div className="auth_right">
            <div className="auth_card">
              <form onSubmit={submitHandler}>
                <div className="auth_container">
                  <div className="auth_header">
                    <BiDonateBlood />
                    <p className="auth_heading">Welcome</p>
                    <p className="auth_title">Create your account</p>
                  </div>

                  <div className="auth_item">
                    <label>Name *</label>
                    <Input
                      onChange={nameChange}
                      type="text"
                      required
                      placeholder="enter your name"
                    />
                  </div>

                  <div className="auth_item">
                    <label>Email *</label>
                    <Input
                      onChange={emailChange}
                      type="email"
                      required
                      placeholder="enter your email"
                    />
                  </div>

                  <div className="auth_item">
                    <label>Password *</label>
                    <Input
                      onChange={passwordChange}
                      type="password"
                      required
                      placeholder="enter your password"
                    />
                  </div>

                  <div className="auth_action">
                    <Button>
                      <LoadingButton loading={loading} title="Register" />
                    </Button>
                  </div>

                  <div className="auth_options">
                    <BackToLogin />
                  </div>
                </div>
              </form>
            </div>
          </div>
            </div>
            <Footer/>
      </div>
    );
};

export default Register;
