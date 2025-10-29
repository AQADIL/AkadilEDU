export default function NotFound() {
  return (
    <div className="notfound-container">
      <div className="notfound-rail">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="notfound-stamp" style={{ animationDelay: `${i * -2000 - 300}ms` }}>
            {i % 2 === 0 ? '4' : '0'}
          </div>
        ))}
      </div>

      <div className="notfound-world">
        <div className="notfound-forward">
          <div className="notfound-box">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`notfound-wall wall-${i + 1}`}></div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');

        .notfound-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          overflow: hidden;
          display: flex;
          font-family: 'Anton', sans-serif;
          justify-content: center;
          align-items: center;
          perspective: 1000px;
          z-index: 9999;
        }

        .notfound-container * {
          transform-style: preserve-3d;
        }

        .notfound-rail {
          position: absolute;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          transform: rotateX(-30deg) rotateY(-30deg);
        }

        .notfound-stamp {
          position: absolute;
          width: 200px;
          height: 200px;
          display: flex;
          justify-content: center;
          align-items: center;
          background: rgba(255, 255, 255, 0.95);
          color: #2c3e50;
          font-size: 7rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          animation: stampSlide 40000ms linear infinite;
          border: 3px solid rgba(44, 62, 80, 0.2);
          border-radius: 10px;
        }

        @keyframes stampSlide {
          0% {
            transform: rotateX(90deg) rotateZ(-90deg) translateZ(-200px) translateY(130px);
          }
          100% {
            transform: rotateX(90deg) rotateZ(-90deg) translateZ(-200px) translateY(-3870px);
          }
        }

        .notfound-world {
          transform: rotateX(-30deg) rotateY(-30deg);
        }

        .notfound-forward {
          position: absolute;
          animation: slide 2000ms linear infinite;
        }

        .notfound-box {
          width: 200px;
          height: 200px;
          transform-origin: 100% 100%;
          animation: roll 2000ms cubic-bezier(1, 0.01, 1, 1) infinite;
        }

        .notfound-wall {
          position: absolute;
          width: 200px;
          height: 200px;
          background: rgba(255, 255, 255, 0.98);
          border: 4px solid #2c3e50;
          box-sizing: border-box;
          box-shadow: 0 0 30px rgba(44, 62, 80, 0.3), inset 0 0 20px rgba(44, 62, 80, 0.05);
          border-radius: 5px;
        }

        .notfound-wall::before {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          color: #2c3e50;
          font-size: 7rem;
          font-weight: bold;
        }

        .wall-1 { transform: translateZ(100px); }
        .wall-2 { transform: rotateX(180deg) translateZ(100px); }
        
        .wall-3 { transform: rotateX(90deg) translateZ(100px); }
        .wall-3::before {
          transform: rotateX(180deg) rotateZ(90deg) translateZ(-1px);
          animation: zeroFour 4000ms -2000ms linear infinite;
        }
        
        .wall-4 { transform: rotateX(-90deg) translateZ(100px); }
        .wall-4::before {
          transform: rotateX(180deg) rotateZ(-90deg) translateZ(-1px);
          animation: zeroFour 4000ms -2000ms linear infinite;
        }
        
        .wall-5 { transform: rotateY(90deg) translateZ(100px); }
        .wall-5::before {
          transform: rotateX(180deg) translateZ(-1px);
          animation: zeroFour 4000ms linear infinite;
        }
        
        .wall-6 { transform: rotateY(-90deg) translateZ(100px); }
        .wall-6::before {
          transform: rotateX(180deg) rotateZ(180deg) translateZ(-1px);
          animation: zeroFour 4000ms linear infinite;
        }

        @keyframes zeroFour {
          0%, 49% { content: '4'; }
          50%, 100% { content: '0'; }
        }

        @keyframes roll {
          0% { transform: rotateZ(0deg); }
          85% { transform: rotateZ(90deg); }
          87% { transform: rotateZ(88deg); }
          90%, 100% { transform: rotateZ(90deg); }
        }

        @keyframes slide {
          0% { transform: translateX(0); }
          100% { transform: translateX(-200px); }
        }

        @media screen and (max-width: 768px) {
          .notfound-container { perspective: 800px; }
          .notfound-stamp { width: 140px; height: 140px; font-size: 5rem; }
          .notfound-box, .notfound-wall { width: 140px; height: 140px; }
          .notfound-wall { border-width: 3px; }
          .notfound-wall::before { font-size: 5rem; }
          .wall-1 { transform: translateZ(70px); }
          .wall-2 { transform: rotateX(180deg) translateZ(70px); }
          .wall-3 { transform: rotateX(90deg) translateZ(70px); }
          .wall-4 { transform: rotateX(-90deg) translateZ(70px); }
          .wall-5 { transform: rotateY(90deg) translateZ(70px); }
          .wall-6 { transform: rotateY(-90deg) translateZ(70px); }
          @keyframes stampSlide {
            0% { transform: rotateX(90deg) rotateZ(-90deg) translateZ(-140px) translateY(100px); }
            100% { transform: rotateX(90deg) rotateZ(-90deg) translateZ(-140px) translateY(-2900px); }
          }
          @keyframes slide {
            0% { transform: translateX(0); }
            100% { transform: translateX(-140px); }
          }
        }

        @media screen and (max-width: 480px) {
          .notfound-container { perspective: 600px; }
          .notfound-stamp { width: 100px; height: 100px; font-size: 3.5rem; border-width: 2px; }
          .notfound-box, .notfound-wall { width: 100px; height: 100px; }
          .notfound-wall { border-width: 2px; }
          .notfound-wall::before { font-size: 3.5rem; }
          .wall-1 { transform: translateZ(50px); }
          .wall-2 { transform: rotateX(180deg) translateZ(50px); }
          .wall-3 { transform: rotateX(90deg) translateZ(50px); }
          .wall-4 { transform: rotateX(-90deg) translateZ(50px); }
          .wall-5 { transform: rotateY(90deg) translateZ(50px); }
          .wall-6 { transform: rotateY(-90deg) translateZ(50px); }
          @keyframes stampSlide {
            0% { transform: rotateX(90deg) rotateZ(-90deg) translateZ(-100px) translateY(70px); }
            100% { transform: rotateX(90deg) rotateZ(-90deg) translateZ(-100px) translateY(-2030px); }
          }
          @keyframes slide {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100px); }
          }
        }

        @media screen and (max-height: 600px) and (orientation: landscape) {
          .notfound-container { perspective: 700px; }
          .notfound-stamp, .notfound-box, .notfound-wall { width: 120px; height: 120px; }
        }
      `}</style>
    </div>
  );
}
