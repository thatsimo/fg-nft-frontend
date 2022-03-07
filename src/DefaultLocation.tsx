import React, {useEffect} from "react";

export const DefaultLocation = () => {
    const defaultLocation = "https://folksyguys.io";

    useEffect(() => {
        window.location.href = defaultLocation;
    })

    return (
        <div>
            <h3 style={{color: "white", margin: "15px"}}>Redirecting to {defaultLocation}</h3>
        </div>
    )
}