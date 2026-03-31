import React from 'react'
import "../App.css"
import { Link, useNavigate } from 'react-router-dom'

export default function LandingPage() {
    const router = useNavigate();

    return (
        <div className='landingPageContainer'>
            <div className="landingShell">
                <nav>
                    <div className='navHeader'>
                        <div className="brandBadge">GW</div>
                        <h2>Gaurav Web</h2>
                    </div>
                    <div className='navlist'>
                        <p className="landingGhostButton" onClick={() => router("/aljk23")}>Join as Guest</p>
                        <p className="landingGhostButton" onClick={() => router("/auth")}>Register</p>
                        <p className="landingGhostButton" onClick={() => router("/auth")}>Login</p>
                    </div>
                </nav>

                <div className="landingMainContainer">
                    <div className="landingCopy">
                        <div className="landingEyebrow">All-in-one meetings for your team, classes, and clients</div>
                        <h1><span style={{ color: "#ffb067" }}>Meet smarter</span>, present clearly, and stay connected.</h1>
                        <p>
                            Gaurav Web gives you instant rooms, meeting history, rich chat, host controls,
                            and a cleaner video experience in one simple workspace.
                        </p>

                        <div className="landingActions">
                            <Link className="landingCtaButton" to={"/auth"}>Get Started</Link>
                            <Link className="landingSecondaryButton" to={"/auth"}>Launch Dashboard</Link>
                        </div>

                        <div className="landingStats">
                            <div className="statCard">
                                <strong>Instant</strong>
                                <span>Create a room in seconds with one click.</span>
                            </div>
                            <div className="statCard">
                                <strong>Secure</strong>
                                <span>Private room IDs and host controls built in.</span>
                            </div>
                            <div className="statCard">
                                <strong>Fluid</strong>
                                <span>Responsive layouts for chat, calls, and files.</span>
                            </div>
                        </div>
                    </div>

                    <div className="landingVisualWrap">
                        <div className="floatingCard floatingCardTop">
                            <strong>Host controls</strong>
                            <p>Manage participants, monitor hands raised, and run the room with clarity.</p>
                        </div>

                        <div className="landingVisualCard">
                            <img src="/mobile.png" alt="Gaurav Web meeting preview" />
                        </div>

                        <div className="floatingCard floatingCardBottom">
                            <strong>Modern collaboration</strong>
                            <p>File sharing, activity history, active speaker cues, and smoother layouts.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
