import { motion, Variants } from 'framer-motion';

export function AnimatedLogo({ className }: { className?: string }) {
    const container: Variants = {
        hidden: { opacity: 0, rotate: 0 },
        show: {
            opacity: 1,
            rotate: 360,
            transition: {
                rotate: {
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                },
                opacity: {
                    duration: 0.5
                }
            }
        }
    };

    // Keep paths static inside the rotating container
    const item: Variants = {
        hidden: { opacity: 1 },
        show: { opacity: 1 }
    };

    return (
        <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 176 176"
            className={className}
            variants={container}
            initial="hidden"
            animate="show"
        >
            <defs>
                <style>
                    {`.st0{fill:#0e162d}.st1{fill:url(#Gradiente_sem_nome_2)}.st2{fill:url(#Gradiente_sem_nome)}`}
                </style>
                <linearGradient id="Gradiente_sem_nome" data-name="Gradiente sem nome" x1="-4056.4" y1="2848.5" x2="-4164.2" y2="2918.6" gradientTransform="translate(-4869.9 1020.9) rotate(135) scale(1 -1)" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#fff" />
                    <stop offset=".5" stopColor="#3d96ff" />
                    <stop offset="1" stopColor="#0e162d" />
                </linearGradient>
                <linearGradient id="Gradiente_sem_nome_2" data-name="Gradiente sem nome 2" x1="-1000.4" y1="-1723" x2="-1108.2" y2="-1652.9" gradientTransform="translate(-348.3 -1917.5) rotate(-45) scale(1 -1)" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#fff" />
                    <stop offset=".5" stopColor="#3d96ff" />
                    <stop offset="1" stopColor="#0e162d" />
                </linearGradient>
            </defs>
            
            {/* Segment 1: Main Shape */}
            <motion.path 
                variants={item}
                className="st0" 
                d="M123.9-.1h0l51.3,51.3h0,0v72.6l-.3.3-51.1,51-.3.3-.3-.3H51.4L0,123.8V51.2L51.1.2l.3-.3h72.6,0ZM66.7,37.5l-29.2,29.2v41.5l29.4,29.4h41.2l.2.2.2-.2,29.2-29.2v-.2c.1,0,.1-41.5.1-41.5h0s-29.4-29.4-29.4-29.4h-41.5l-.2.2h0Z" 
            />
            
            {/* Segment 2: Bottom Gradient Polygon */}
            <motion.polygon 
                variants={item}
                className="st2" 
                points="66.9 137.6 13.8 137.6 51.3 175.1 123.9 175.1 137.6 161.3 137.7 108.2 108.3 137.6 66.9 137.6" 
            />
            
            {/* Segment 3: Top Gradient Polygon */}
            <motion.polygon 
                variants={item}
                className="st1" 
                points="108.4 37.4 161.5 37.4 123.9 -.2 51.3 -.1 37.6 13.7 37.5 66.7 66.9 37.3 108.4 37.4" 
            />
        </motion.svg>
    );
}
