// resources/js/Components/ApplicationLogo.jsx
export default function ApplicationLogo({ className = "", width = 32, height = 32, ...props }) {
    return (
        <img
            src="/img/logo/logo_uj.png"
            alt="Logo"
            className={className}
            width={width}
            height={height}
            {...props}
        />
    );
}