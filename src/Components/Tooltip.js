import React from "react";
import "./Tooltip.scss";
import { joinClassNames } from "../Classes/Constants";
import ReactDOM from "react-dom";

export default function Tooltip({ children, direction = "up", className = "", color, style, onClick }) {
    const [visible, setVisible] = React.useState(false);
    const ref = React.useRef();
    
    React.useEffect(() => {
        ref.current.parentElement.classList.add("HasTooltip");
        
        return () => {
            ref.current && ref.current.parentElement.classList.remove("HasTooltip");
        };
    }, [ children, direction ]);
    
    return (
        <div ref={ref} className={joinClassNames("TooltipContainer", direction.toLowerCase(), [visible, "Visible"], className)} style={style} onClick={onClick}>
            <div className="TooltipArrow" style={{ backgroundColor: color }}/>
            <div className="Tooltip" style={{ backgroundColor: color }}>{ children }</div>
        </div>
    );
}

// export function DetachedTooltip({ children, direction = "up", className = "", color, style, onClick }) {
//     const container = React.useMemo(() => document.getElementsByClassName("AppMain")[0], []);
//     const [visible, setVisible] = React.useState(false);
//     const ref = React.useRef();
//    
//     React.useEffect(() => {
//         ref.current.addEventListener("mouseover")
//     }, [ children, direction ]);
//    
//     return ReactDOM.createPortal(
//         <div ref={ref} className={joinClassNames("TooltipContainer Detached", direction.toLowerCase(), [visible, "Visible"], className)} style={style} onClick={onClick}>
//             <div className="TooltipArrow" style={{ backgroundColor: color }}/>
//             <div className="Tooltip" style={{ backgroundColor: color }}>{ children }</div>
//         </div>,
//         container
//     );
// }