import { useMemo } from 'react';

export default function NotFound() {
  // Generate cases array
  const cases = useMemo(() => {
    const casePositions = [
      { top: -85, right: -470 }, { top: -82, right: -463 }, { top: -79, right: -456 },
      { top: -76, right: -449 }, { top: -73, right: -442 }, { top: -70, right: -435 },
      { top: -67, right: -428 }, { top: -63, right: -421 }, { top: -59, right: -414 },
      { top: -56, right: -407 }, { top: -53, right: -400 }, { top: -49, right: -393 },
      { top: -46, right: -386 }, { top: -43, right: -379 }, { top: -39, right: -372 },
      { top: -36, right: -365 }, { top: -33, right: -358 }, { top: -29, right: -351 },
      { top: -26, right: -344 }, { top: -23, right: -337 }, { top: -19, right: -330 },
      { top: -16, right: -323 }, { top: -13, right: -316 }, { top: -9, right: -309 },
      { top: -6, right: -302 }, { top: -3, right: -295 }, { top: 1, right: -288 },
      { top: 4, right: -281 }, { top: 7, right: -274 }, { top: 11, right: -267 },
      { top: 14, right: -260 }, { top: 17, right: -253 }, { top: 20, right: -246 },
      { top: 24, right: -239 }, { top: 27, right: -232 }, { top: 30, right: -225 },
      { top: 33, right: -218 }, { top: 37, right: -211 }, { top: 40, right: -204 },
      { top: 43, right: -197 }, { top: 46, right: -190 }, { top: 49, right: -183 },
      { top: 53, right: -176 }, { top: 56, right: -169 }, { top: 59, right: -162 },
      { top: 62, right: -155 }, { top: 65, right: -148 }
    ];
    
    return casePositions.map((pos, i) => ({
      ...pos,
      labelRight: [0, 2, 5, 14, 16, 18, 21, 23, 25, 26, 30, 32, 33, 34, 35, 37, 39, 41, 43, 45].includes(i)
    }));
  }, []);

  return (
    <div className="notfound-wrapper">
      <div className="notfound-composition">
        <div className="notfound-layer-0 notfound-shelf">
          <div className="notfound-shelf__side_left"></div>
          <div className="notfound-shelf__side_bottom"></div>
          
          {/* Cases */}
          {cases.map((caseItem, i) => (
            <div 
              key={i}
              className="notfound-case"
              style={{ top: `${caseItem.top}px`, right: `${caseItem.right}px` }}
            >
              <div className="notfound-case__front"></div>
              <div className="notfound-case__top"></div>
              <div className={`notfound-case__label ${caseItem.labelRight ? 'notfound-case__label_right' : 'notfound-case__label_left'}`}></div>
              <div className="notfound-case__right"></div>
              <div className="notfound-case__number">№2428506</div>
            </div>
          ))}
          
          {/* Glow */}
          <div className="notfound-glow">
            <div className="notfound-glow__bottom"></div>
            <div className="notfound-glow__top"></div>
            {[...Array(10)].map((_, i) => (
              <div key={i} className={`notfound-glow__ball notfound-glow__ball_${i + 1}`}></div>
            ))}
          </div>
          
          <div className="notfound-shelf__side_front"></div>
          <div className="notfound-shelf__side_right"></div>
          
          <div className="notfound-shelf__handle_top"></div>
          <div className="notfound-shelf__handle_front"></div>
          <div className="notfound-shelf__handle_right"></div>
        </div>
        
        <div className="notfound-layer-1 notfound-shadow"></div>
        
        <div className="notfound-layer-2 notfound-numbers">
          <div className="notfound-numbers__item notfound-numbers__item_1">4</div>
          <div className="notfound-numbers__item notfound-numbers__item_2">0</div>
          <div className="notfound-numbers__item notfound-numbers__item_3">4</div>
        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css?family=Roboto:700');

        .notfound-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(to left, #072e61, #004880);
          overflow: hidden;
          z-index: 9999;
        }

        .notfound-composition {
          position: relative;
          width: 750px;
          height: 400px;
          overflow: hidden;
        }

        .notfound-layer-0 { position: absolute; z-index: 10; }
        .notfound-layer-1 { position: absolute; z-index: 15; }
        .notfound-layer-2 { position: absolute; z-index: 20; }

        .notfound-shelf {
          position: absolute;
          top: 150px;
          left: 250px;
        }

        .notfound-shelf__side_left {
          position: absolute;
          top: 0;
          left: 0;
          width: 500px;
          height: 60px;
          background-color: #cdfffa;
          transform: skewY(-25deg);
        }

        .notfound-shelf__side_front {
          position: absolute;
          top: 137px;
          left: 0;
          width: 70px;
          height: 60px;
          background: linear-gradient(160deg, #84fff2, #2f7fb2);
          border: 1px solid rgba(47, 127, 178, 0.5);
          transform: skewY(30deg);
        }

        .notfound-shelf__side_bottom {
          position: absolute;
          top: 43px;
          left: 36px;
          width: 500px;
          height: 73px;
          background-color: #7adbd5;
          transform: skewY(-25deg) skewX(44deg);
        }

        .notfound-shelf__side_right {
          position: absolute;
          top: 42px;
          left: 70px;
          width: 500px;
          height: 60px;
          background: linear-gradient(0deg, #0b2f6c, #16598b);
          transform: skewY(-25deg);
        }

        .notfound-shelf__handle_top {
          position: absolute;
          top: 144px;
          left: 17px;
          width: 30px;
          height: 7px;
          background-color: #5ac8d3;
          transform: skewY(30deg) skewX(-50deg);
        }

        .notfound-shelf__handle_front {
          position: absolute;
          top: 149px;
          left: 13px;
          width: 30px;
          height: 10px;
          background-color: #71e7e4;
          border: 1px solid rgba(47, 127, 178, 0.5);
          transform: skewY(30deg);
        }

        .notfound-shelf__handle_right {
          position: absolute;
          top: 155px;
          left: 43px;
          width: 6px;
          height: 10px;
          background-color: #287caa;
          transform: skewY(-30deg);
        }

        .notfound-shadow {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: 150px;
          height: 100%;
          background: linear-gradient(to right, rgba(1, 20, 61, 0), rgba(1, 20, 61, 0.8) 65%, rgba(1, 20, 61, 1));
        }

        .notfound-case {
          position: absolute;
          transform: translateY(0);
          transition: .3s transform ease-in;
        }

        .notfound-case:hover {
          transform: translateY(-5px);
        }

        .notfound-case__front {
          position: absolute;
          top: 3px;
          left: 0;
          width: 70px;
          height: 55px;
          background-color: #9d7f63;
          transform: skewY(25deg);
        }

        .notfound-case__label {
          position: absolute;
          width: 10px;
          height: 7px;
          background-color: #9d7f63;
          transform: skewY(25deg);
        }

        .notfound-case__label_left {
          top: -12px;
          left: 5px;
        }

        .notfound-case__label_right {
          top: 12px;
          left: 55px;
        }

        .notfound-case__top {
          position: absolute;
          top: 0;
          left: 2px;
          width: 70px;
          height: 4px;
          background: linear-gradient(to top, #e9eceb, #a3bab4 50%, #e9eceb);
          transform: skewY(25deg) skewX(-45deg);
        }

        .notfound-case__right {
          position: absolute;
          top: 18px;
          left: 69px;
          width: 5px;
          height: 55px;
          background: linear-gradient(to left, #e9eceb, #a3bab4 50%, #e9eceb);
          transform: skewY(-25deg);
        }

        .notfound-case__number {
          position: absolute;
          top: 41px;
          left: 10px;
          color: #7c664e;
          font-size: 8px;
          transform-origin: top left;
          transform: rotate(-66deg) skewY(-25deg);
        }

        .notfound-glow { position: absolute; }

        .notfound-glow__bottom {
          position: absolute;
          top: 60px;
          left: 5px;
          width: 135px;
          height: 120px;
          background: linear-gradient(to top, rgba(132, 255, 242, 1), rgba(132, 255, 242, 1) 30%, rgba(132, 255, 242, 0));
          transform: perspective(120px) rotateX(-20deg);
        }

        .notfound-glow__top {
          position: absolute;
          top: -25px;
          left: 7px;
          width: 130px;
          height: 180px;
          background: linear-gradient(to top, rgba(132, 255, 242, 1), rgba(132, 255, 242, 1) 20%, rgba(132, 255, 242, 0));
          transform: perspective(150px) rotateX(-20deg);
        }

        .notfound-glow__ball {
          position: absolute;
          top: 0;
          left: 0;
          width: 10px;
          height: 10px;
          border-radius: 10px;
          background-color: #83fff2;
          transform: translateY(160px);
        }

        .notfound-glow__ball_1 { animation: 5s fadeUp infinite; animation-delay: .5s; }
        .notfound-glow__ball_2 { left: 10px; width: 5px; height: 5px; animation: 4s fadeUp infinite; animation-delay: .8s; }
        .notfound-glow__ball_3 { left: 24px; width: 15px; height: 15px; animation: 9s fadeUp infinite; animation-delay: .65s; }
        .notfound-glow__ball_4 { left: 34px; width: 8px; height: 8px; animation: 7s fadeUp infinite; animation-delay: .5s; }
        .notfound-glow__ball_5 { left: 57px; width: 14px; height: 14px; animation: 7s fadeUp infinite; animation-delay: .9s; }
        .notfound-glow__ball_6 { left: 78px; width: 11px; height: 11px; animation: 3s fadeUp infinite; animation-delay: .3s; }
        .notfound-glow__ball_7 { left: 91px; width: 13px; height: 13px; animation: 8s fadeUp infinite; animation-delay: .77s; }
        .notfound-glow__ball_8 { left: 105px; width: 7px; height: 7px; animation: 6s fadeUp infinite; animation-delay: .4s; }
        .notfound-glow__ball_9 { left: 113px; width: 8px; height: 8px; animation: 4s fadeUp infinite; animation-delay: .6s; }
        .notfound-glow__ball_10 { left: 120px; width: 4px; height: 4px; animation: 9s fadeUp infinite; animation-delay: .92s; }

        .notfound-numbers {
          position: absolute;
          top: 0;
          left: 122px;
          color: #fff;
          font-family: 'Roboto', sans-serif;
          font-size: 200px;
          display: flex;
        }

        .notfound-numbers__item {
          margin: 0 10px;
          animation: 5s bounceUpDown infinite;
        }

        .notfound-numbers__item_1 { animation-delay: .3s; }
        .notfound-numbers__item_2 { animation: 5.4s bounceUpDown infinite; animation-delay: .5s; }
        .notfound-numbers__item_3 { animation-delay: .3s; }

        @keyframes fadeUp {
          0% { transform: translateY(160px); opacity: 1; }
          60% { opacity: 1; }
          100% { transform: translateY(-10px); opacity: 0; }
        }

        @keyframes bounceUpDown {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(50px); }
        }

        @media screen and (max-width: 1200px) {
          .notfound-composition { transform: scale(0.9); }
        }

        @media screen and (max-width: 1024px) {
          .notfound-composition { transform: scale(0.8); }
        }

        @media screen and (max-width: 900px) {
          .notfound-composition { transform: scale(0.7); }
        }

        @media screen and (max-width: 768px) {
          .notfound-composition { transform: scale(0.65); }
        }

        @media screen and (max-width: 640px) {
          .notfound-composition { transform: scale(0.55); }
        }

        @media screen and (max-width: 480px) {
          .notfound-composition { transform: scale(0.45); }
        }

        @media screen and (max-width: 380px) {
          .notfound-composition { transform: scale(0.38); }
        }

        @media screen and (max-height: 600px) {
          .notfound-composition { transform: scale(0.7); }
        }

        @media screen and (max-height: 500px) {
          .notfound-composition { transform: scale(0.6); }
        }
      `}</style>
    </div>
  );
}
