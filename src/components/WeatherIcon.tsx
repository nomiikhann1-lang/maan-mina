import type { WeatherCondition } from "@/lib/weather";

export function WeatherIcon({
  condition,
  className,
}: {
  condition: WeatherCondition;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 48 48" className={className}>
      {condition === "clear" && (
        <g>
          <g style={{ transformOrigin: "24px 24px", animation: "spin-slow 16s linear infinite" }}>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
              <line
                key={a}
                x1="24"
                y1="6"
                x2="24"
                y2="11"
                stroke="#E8A13D"
                strokeWidth="2.5"
                strokeLinecap="round"
                transform={`rotate(${a} 24 24)`}
              />
            ))}
          </g>
          <circle cx="24" cy="24" r="10" fill="#F6C945" />
        </g>
      )}

      {condition === "clouds" && (
        <g>
          <circle cx="24" cy="20" r="7" fill="#F6C945" opacity="0.7" />
          <g className="drift" style={{ animationDuration: "10s" }}>
            <ellipse cx="20" cy="27" rx="12" ry="8" fill="#F5EFE2" />
            <ellipse cx="30" cy="25" rx="9" ry="7" fill="#EDE4D0" />
          </g>
        </g>
      )}

      {condition === "mist" && (
        <g stroke="#C9C2B0" strokeWidth="2.5" strokeLinecap="round" opacity="0.85">
          <line
            x1="8"
            y1="18"
            x2="40"
            y2="18"
            className="drift"
            style={{ animationDuration: "8s" }}
          />
          <line
            x1="12"
            y1="24"
            x2="36"
            y2="24"
            className="drift"
            style={{ animationDuration: "9s", animationDelay: "-3s" }}
          />
          <line
            x1="8"
            y1="30"
            x2="40"
            y2="30"
            className="drift"
            style={{ animationDuration: "10s", animationDelay: "-6s" }}
          />
        </g>
      )}

      {condition === "rain" && (
        <g>
          <ellipse cx="24" cy="17" rx="13" ry="8" fill="#B9C7D6" />
          {[14, 22, 30].map((x, i) => (
            <line
              key={x}
              x1={x}
              y1="27"
              x2={x - 2}
              y2="38"
              stroke="#5B9BF2"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ animation: `rain-fall ${0.7 + i * 0.15}s linear ${i * 0.15}s infinite` }}
            />
          ))}
        </g>
      )}

      {condition === "snow" && (
        <g>
          <ellipse cx="24" cy="15" rx="12" ry="7" fill="#D7DEE8" />
          {[14, 24, 33].map((x, i) => (
            <circle
              key={x}
              cx={x}
              cy="26"
              r="2"
              fill="#FFFFFF"
              style={{ animation: `snow-fall ${1.6 + i * 0.3}s linear ${i * 0.25}s infinite` }}
            />
          ))}
        </g>
      )}

      {condition === "windy" && (
        <g stroke="#8FB7CE" strokeWidth="2.5" strokeLinecap="round" fill="none">
          <path
            d="M6 18h22a4 4 0 1 0-4-4"
            className="float-slow"
            style={{ animationDuration: "3s" }}
          />
          <path
            d="M6 26h28a4 4 0 1 1-4 4"
            className="float-slow"
            style={{ animationDuration: "3.4s", animationDelay: "-1s" }}
          />
          <path
            d="M10 34h18"
            className="float-slow"
            style={{ animationDuration: "2.8s", animationDelay: "-2s" }}
          />
        </g>
      )}
    </svg>
  );
}
