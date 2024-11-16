import React from 'react';

interface SpinnerProps {
    variant?: 'pulse' | 'wave' | 'orbit' | 'helix' | 'dots';
    size?: 'sm' | 'md' | 'lg';
    color?: string;
}

const Spinner: React.FC<SpinnerProps> = ({
    variant = 'pulse',
    size = 'md',
    color = 'blue'
}) => {
    // Size mappings
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };

    // Color mappings
    const colorClasses = {
        blue: 'text-blue-500',
        red: 'text-red-500',
        green: 'text-green-500',
        purple: 'text-purple-500',
        pink: 'text-pink-500'
    };

    // Spinner variants
    const spinners = {
        pulse: (
            <div className={`relative ${sizeClasses[size]}`}>
                <div className={`absolute w-full h-full rounded-full ${colorClasses[color as keyof typeof colorClasses]} opacity-75 animate-ping`}></div>
                <div className={`relative rounded-full ${colorClasses[color as keyof typeof colorClasses]} w-full h-full`}></div>
            </div>
        ),

        wave: (
            <div className={`flex space-x-1 ${sizeClasses[size]}`}>
                {[...Array(3)].map((_, i) => (
                    <div
                        key={i}
                        className={`w-2 ${colorClasses[color as keyof typeof colorClasses]} animate-wave`}
                        style={{
                            animationDelay: `${i * 0.15}s`,
                            animation: 'wave 1.2s linear infinite',
                        }}
                    ></div>
                ))}
                <style jsx>{`
          @keyframes wave {
            0%, 40%, 100% { transform: scaleY(0.4) }
            20% { transform: scaleY(1) }
          }
        `}</style>
            </div>
        ),

        orbit: (
            <div className={`relative ${sizeClasses[size]}`}>
                <div className={`absolute inset-0 rounded-full border-2 text-accent-foreground border-t-transparent animate-spin`}></div>
                <div className={`absolute inset-2 rounded-full border-2 text-accent-foreground border-t-transparent animate-spin`} style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
            </div>
        ),

        helix: (
            <div className={`relative ${sizeClasses[size]} animate-spin`}>
                <div className="absolute w-full h-full">
                    <div className={`w-3 h-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]} absolute top-0 left-1/2 transform -translate-x-1/2`}></div>
                    <div className={`w-3 h-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]} absolute bottom-0 left-1/2 transform -translate-x-1/2 opacity-50`}></div>
                </div>
                <div className="absolute w-full h-full rotate-60">
                    <div className={`w-3 h-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]} absolute top-0 left-1/2 transform -translate-x-1/2 opacity-75`}></div>
                    <div className={`w-3 h-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]} absolute bottom-0 left-1/2 transform -translate-x-1/2 opacity-25`}></div>
                </div>
                <div className="absolute w-full h-full rotate-120">
                    <div className={`w-3 h-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]} absolute top-0 left-1/2 transform -translate-x-1/2 opacity-50`}></div>
                    <div className={`w-3 h-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]} absolute bottom-0 left-1/2 transform -translate-x-1/2 opacity-75`}></div>
                </div>
            </div>
        ),

        dots: (
            <div className="flex space-x-2">
                {[...Array(3)].map((_, i) => (
                    <div
                        key={i}
                        className={`${sizeClasses.sm} rounded-full ${colorClasses[color as keyof typeof colorClasses]} animate-bounce`}
                        style={{ animationDelay: `${i * 0.15}s` }}
                    ></div>
                ))}
            </div>
        ),
    };

    return (
        <div className="flex items-center justify-center">
            {spinners[variant]}
        </div>
    );
};

export default Spinner;