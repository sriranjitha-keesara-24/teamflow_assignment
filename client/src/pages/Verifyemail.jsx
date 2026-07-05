import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { verifyEmail } from "../services/authService";
import "../styles/auth.css";

const VerifyEmail = () => {
    const { token } = useParams();
    const [status, setStatus] = useState("verifying"); // verifying | success | error
    const [message, setMessage] = useState("");

    useEffect(() => {
        const run = async () => {
            try {
                const data = await verifyEmail(token);
                setStatus("success");
                setMessage(data.message);
            } catch (err) {
                setStatus("error");
                setMessage(
                    err.response?.data?.message || "Verification link is invalid or has expired."
                );
            }
        };
        run();
    }, [token]);

    return (
        <div className="auth-page">
            <div className="auth-brand-panel">
                <div className="auth-brand-logo">TeamFlow</div>
                <div className="auth-brand-content">
                    <h1>Almost there</h1>
                    <p>Verifying your email address to activate your account.</p>
                </div>
                <div className="auth-brand-footer">© {new Date().getFullYear()} TeamFlow</div>
            </div>

            <div className="auth-form-panel">
                <div className="auth-card" style={{ textAlign: "center" }}>
                    {status === "verifying" && (
                        <>
                            <div
                                className="spinner"
                                style={{ borderTopColor: "#4f46e5", margin: "0 auto 20px" }}
                            />
                            <h2>Verifying your email...</h2>
                        </>
                    )}

                    {status === "success" && (
                        <>
                            <h2>Email verified 🎉</h2>
                            <p className="auth-subtitle">{message}</p>
                            <Link to="/login" className="btn-primary" style={{ display: "flex" }}>
                                Go to sign in
                            </Link>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <h2>Verification failed</h2>
                            <p className="auth-subtitle">{message}</p>
                            <Link to="/login" className="btn-primary" style={{ display: "flex" }}>
                                Back to sign in
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;